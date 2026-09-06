"""
BharatStandards AI - Document Intelligence API Router
Handles secure multipart upload, ownership validation, text extraction pipeline, and in-document search.
"""
import math
import os
from typing import Optional, List
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form,
    Query,
    BackgroundTasks,
    status,
)
from sqlalchemy.orm import Session
from app.core.database import get_db, get_session_factory
from app.core.logging import logger
from app.api.deps import get_current_user
from app.models.user import User
from app.models.product import Product
from app.models.document import Document, DocumentChunk, DocumentStatus
from app.schemas.document import (
    DocumentResponse,
    DocumentDetailResponse,
    DocumentStatusResponse,
    DocumentListResponse,
    DocumentSearchResult,
)
from app.services.storage_service import storage_service
from app.services.document_processing_service import document_processing_service
from app.services.audit_service import audit_service

router = APIRouter(prefix="/documents", tags=["Document Intelligence"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB limit


def _process_in_background(document_id: int):
    """Worker task executing PDF extraction outside the main HTTP request loop."""
    factory = get_session_factory()
    if factory:
        with factory() as db:
            document_processing_service.process_document(db, document_id)


def _serialize_document(doc: Document) -> DocumentResponse:
    chunks_count = len(doc.chunks) if doc.chunks else 0
    product_name = doc.product.name if doc.product else None
    return DocumentResponse(
        id=doc.id,
        user_id=doc.user_id,
        product_id=doc.product_id,
        product_name=product_name,
        filename=doc.filename,
        original_filename=doc.original_filename,
        file_type=doc.file_type,
        mime_type=doc.mime_type,
        file_size=doc.file_size,
        status=doc.status,
        processing_error=doc.processing_error,
        page_count=doc.page_count,
        chunks_count=chunks_count,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


@router.get("", response_model=DocumentListResponse)
def list_documents(
    product_id: Optional[int] = Query(None, description="Filter documents linked to a product"),
    status_filter: Optional[str] = Query(None, alias="status", description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by original filename"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List documents owned by the authenticated user with optional filtering and pagination.
    Strict tenant isolation: only queries current_user's documents.
    """
    query = db.query(Document).filter(Document.user_id == current_user.id)

    if product_id:
        query = query.filter(Document.product_id == product_id)
    if status_filter and status_filter.upper() != "ALL":
        query = query.filter(Document.status == status_filter.strip().upper())
    if search and search.strip():
        query = query.filter(Document.original_filename.ilike(f"%{search.strip()}%"))

    total = query.count()
    skip = (page - 1) * page_size
    docs = query.order_by(Document.created_at.desc()).offset(skip).limit(page_size).all()
    total_pages = math.ceil(total / page_size) if total > 0 else 1

    items = [_serialize_document(d) for d in docs]
    return DocumentListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    product_id: Optional[int] = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ingest a PDF test report or certificate.
    Enforces format validation (PDF only), max 10MB limit, product ownership validation,
    and dispatches asynchronous extraction.
    """
    # 1. Validate file extension and MIME type
    orig_name = file.filename or "document.pdf"
    ext = os.path.splitext(orig_name)[1].lower()
    if ext != ".pdf":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF documents are supported for compliance evidence ingestion.",
        )

    # 2. Read and validate file size
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    # 3. Validate product ownership if product_id is supplied
    if product_id is not None:
        product = (
            db.query(Product)
            .filter(Product.id == product_id, Product.user_id == current_user.id)
            .first()
        )
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Specified product not found or access denied.",
            )

    # 4. Save file to storage
    unique_filename, storage_path = storage_service.save(file_bytes, orig_name)

    # 5. Create Document database record
    document = Document(
        user_id=current_user.id,
        product_id=product_id,
        filename=unique_filename,
        original_filename=orig_name,
        file_type="PDF",
        mime_type=file.content_type or "application/pdf",
        file_size=len(file_bytes),
        storage_path=storage_path,
        status=DocumentStatus.QUEUED.value,
        page_count=0,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="DOCUMENT_UPLOADED",
        entity_type="document",
        entity_id=document.id,
        description=f"Document '{orig_name}' uploaded",
        metadata={"filename": orig_name, "file_size": len(file_bytes), "product_id": product_id},
    )

    # 6. Dispatch background text extraction & chunking
    background_tasks.add_task(_process_in_background, document.id)

    logger.info(f"User {current_user.id} uploaded document {document.id} ('{orig_name}')")
    return _serialize_document(document)


@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve document metadata and extracted text chunks.
    Strict ownership isolation: returns 404 if not owned by user.
    """
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )

    base = _serialize_document(document)
    chunks = document.chunks or []
    return DocumentDetailResponse(
        **base.model_dump(),
        chunks=chunks,
    )


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Permanently delete document record, associated chunks, and stored disk file.
    Strict ownership isolation: returns 404 if not owned by user.
    """
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )

    doc_name = document.original_filename
    # Delete disk file
    storage_service.delete(document.storage_path)

    # Delete database record (cascade deletes chunks)
    db.delete(document)
    db.commit()
    logger.info(f"User {current_user.id} deleted document {document_id}")
    audit_service.log_event(
        db=db,
        user_id=current_user.id,
        action="DOCUMENT_DELETED",
        entity_type="document",
        entity_id=document_id,
        description=f"Document '{doc_name}' deleted",
    )
    return {"message": "Document successfully deleted."}


@router.post("/{document_id}/process", response_model=DocumentResponse)
def reprocess_document(
    document_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Manually re-trigger text extraction and chunking pipeline.
    """
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )

    document.status = DocumentStatus.QUEUED.value
    db.commit()
    db.refresh(document)

    background_tasks.add_task(_process_in_background, document.id)
    return _serialize_document(document)


@router.get("/{document_id}/status", response_model=DocumentStatusResponse)
def get_document_status(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Lightweight status query endpoint for upload progress and processing polling.
    """
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )
    return DocumentStatusResponse(
        id=document.id,
        status=document.status,
        page_count=document.page_count,
        processing_error=document.processing_error,
    )


@router.get("/{document_id}/search", response_model=List[DocumentSearchResult])
def search_document_text(
    document_id: int,
    q: str = Query(..., min_length=1, description="Keyword search query"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Case-insensitive keyword search within extracted chunks of a processed document.
    """
    document = (
        db.query(Document)
        .filter(Document.id == document_id, Document.user_id == current_user.id)
        .first()
    )
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or access denied.",
        )

    search_term = q.strip().lower()
    results = []
    for chunk in document.chunks:
        content_lower = chunk.content.lower()
        if search_term in content_lower:
            # Create snippet around match
            pos = content_lower.find(search_term)
            start = max(0, pos - 60)
            end = min(len(chunk.content), pos + len(search_term) + 60)
            snippet = ("..." if start > 0 else "") + chunk.content[start:end].strip() + ("..." if end < len(chunk.content) else "")
            results.append(
                DocumentSearchResult(
                    chunk_id=chunk.id,
                    page=chunk.page,
                    section=chunk.section,
                    snippet=snippet,
                    full_content=chunk.content,
                )
            )

    return results


# Additional convenience endpoint: /api/products/{product_id}/documents
@router.get("/product/{product_id}", response_model=DocumentListResponse)
def get_product_documents(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve all documents linked to a specific product owned by the user.
    """
    product = (
        db.query(Product)
        .filter(Product.id == product_id, Product.user_id == current_user.id)
        .first()
    )
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or access denied.",
        )

    docs = (
        db.query(Document)
        .filter(Document.product_id == product_id, Document.user_id == current_user.id)
        .order_by(Document.created_at.desc())
        .all()
    )

    items = [_serialize_document(d) for d in docs]
    return DocumentListResponse(
        items=items,
        total=len(items),
        page=1,
        page_size=max(1, len(items)),
        total_pages=1,
    )
