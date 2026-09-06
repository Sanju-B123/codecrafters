import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trash2,
  Eye,
  RefreshCw,
  Search,
  Box,
  Layers,
  FileCheck2,
  Calendar,
  X,
  Loader2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { documentService } from '@/services/documentService';
import { productService } from '@/services/productService';
import { useToast } from '@/components/ui/ToastContext';
import {
  Button,
  Badge,
  StatusBadge,
  Dialog,
  EmptyState,
  Skeleton,
} from '@/components/ui';

export const DocumentsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [userProducts, setUserProducts] = useState([]);

  // Upload state
  const [dragActive, setDragActive] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(null);
  const [uploadStep, setUploadStep] = useState(0); // 0=idle, 1=validating, 2=uploading, 3=processing, 4=done
  const [uploadError, setUploadError] = useState(null);
  const [targetProduct, setTargetProduct] = useState('');

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load products for dropdown
  useEffect(() => {
    productService
      .getProducts()
      .then((res) => setUserProducts(res.items || []))
      .catch(() => setUserProducts([]));
  }, []);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await documentService.getDocuments({
        product_id: selectedProductId || undefined,
        status: activeTab !== 'ALL' ? activeTab : undefined,
        search: searchQuery || undefined,
      });
      setDocuments(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError(err.message || 'Unable to load documents.');
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedProductId, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchDocuments]);

  // Periodic status polling if any document is in PROCESSING or QUEUED state
  useEffect(() => {
    const hasInFlight = documents.some(
      (d) => d.status === 'QUEUED' || d.status === 'PROCESSING'
    );
    if (!hasInFlight) return;

    const interval = setInterval(() => {
      fetchDocuments();
    }, 3000);
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  // Drag and Drop handlers
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = async (file) => {
    setUploadError(null);
    setUploadingFile(file);

    // 1. Validating
    setUploadStep(1);
    await new Promise((r) => setTimeout(r, 400));

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF documents are supported for compliance evidence ingestion.');
      setUploadStep(0);
      setUploadingFile(null);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10 MB limit.');
      setUploadStep(0);
      setUploadingFile(null);
      return;
    }

    // 2. Uploading
    setUploadStep(2);
    try {
      const pId = targetProduct ? parseInt(targetProduct, 10) : null;
      const uploadedDoc = await documentService.uploadDocument(file, pId);

      // 3. Processing
      setUploadStep(3);
      await new Promise((r) => setTimeout(r, 1200));

      // 4. Processed / Queued
      setUploadStep(4);
      addToast({
        type: 'success',
        title: 'Document Uploaded',
        message: `"${file.name}" ingested and queued for text extraction.`,
      });

      setTimeout(() => {
        setUploadStep(0);
        setUploadingFile(null);
        fetchDocuments();
      }, 1500);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Document upload failed.');
      setUploadStep(0);
      setUploadingFile(null);
    }
  };

  const confirmDelete = (doc, e) => {
    e.stopPropagation();
    setDocumentToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;
    try {
      setIsDeleting(true);
      await documentService.deleteDocument(documentToDelete.id);
      addToast({
        type: 'success',
        title: 'Document Deleted',
        message: `Document "${documentToDelete.original_filename}" has been permanently removed.`,
      });
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
      fetchDocuments();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err.message || 'Unable to delete document.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReprocess = async (doc, e) => {
    e.stopPropagation();
    try {
      await documentService.processDocument(doc.id);
      addToast({
        type: 'info',
        title: 'Re-processing Dispatched',
        message: `Extraction pipeline re-queued for "${doc.original_filename}".`,
      });
      fetchDocuments();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Re-processing Failed',
        message: err.message || 'Could not trigger document processing.',
      });
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const tabs = [
    { label: 'All', value: 'ALL' },
    { label: 'Processed', value: 'PROCESSED' },
    { label: 'Processing', value: 'PROCESSING' },
    { label: 'Needs OCR', value: 'NEEDS_OCR' },
    { label: 'Failed', value: 'FAILED' },
  ];

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Document Intelligence Vault
            </h1>
            <Badge variant="outline" size="sm" className="font-mono">
              {total} {total === 1 ? 'Document' : 'Documents'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Upload product documents and prepare evidence for compliance analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchDocuments}
            title="Refresh Vault"
            aria-label="Refresh Vault"
            className="p-2"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`bg-white dark:bg-slate-900 p-8 rounded-2xl border-2 border-dashed transition-all text-center shadow-sm relative ${
          dragActive
            ? 'border-bharat-800 bg-bharat-50/40 dark:bg-bharat-950/30 ring-2 ring-bharat-800/20'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="hidden"
          id="document-upload-input"
        />

        {uploadStep === 0 ? (
          <div className="space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-bharat-50 dark:bg-bharat-950/70 border border-bharat-200 dark:border-bharat-800 text-bharat-800 dark:text-bharat-300 flex items-center justify-center mx-auto shadow-xs">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Drag & drop test certificates or click to browse
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Supported format: <strong className="text-slate-700 dark:text-slate-300">PDF</strong> (DOCX/XLSX/Images coming soon) • Max file size: <strong>10 MB</strong>
              </p>
            </div>

            {/* Optional product linkage selector */}
            {userProducts.length > 0 && (
              <div className="pt-2 flex items-center justify-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">Attach to Product:</span>
                <select
                  value={targetProduct}
                  onChange={(e) => setTargetProduct(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-bharat-500"
                >
                  <option value="">None (General Evidence)</option>
                  {userProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <Button
                variant="primary"
                size="md"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 font-semibold shadow-sm text-xs"
                startIcon={<UploadCloud className="w-4 h-4" />}
              >
                Select PDF File
              </Button>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        ) : (
          /* Multi-step upload progress sequence */
          <div className="space-y-4 max-w-sm mx-auto py-2">
            <div className="w-12 h-12 rounded-2xl bg-bharat-900 text-white flex items-center justify-center mx-auto">
              <Loader2 className="w-6 h-6 animate-spin text-saffron-400" />
            </div>

            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {uploadStep === 1 && '1. Validating document format & signatures...'}
                {uploadStep === 2 && '2. Storing securely in isolated repository...'}
                {uploadStep === 3 && '3. Extracting pages & generating chunk evidence...'}
                {uploadStep === 4 && '4. Document successfully ingested!'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate">
                {uploadingFile?.name}
              </p>
            </div>

            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-bharat-800 h-full transition-all duration-300"
                style={{ width: `${(uploadStep / 4) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setActiveTab(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
                  activeTab === tab.value
                    ? 'bg-bharat-900 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Product and Search Filters */}
          <div className="flex items-center gap-2.5">
            {userProducts.length > 0 && (
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-bharat-500"
              >
                <option value="">All Products</option>
                {userProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by filename..."
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-bharat-500 w-48 sm:w-60"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Document List: Loading, Error, Empty, or Cards */}
      {loading && documents.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="space-y-1 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 p-6 rounded-xl border border-rose-200 dark:border-rose-800 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">Unable to load documents</h3>
          <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchDocuments}>
            Retry
          </Button>
        </div>
      ) : documents.length === 0 ? (
        <EmptyState
          icon={<FileText className="w-8 h-8 text-slate-400" />}
          title="No documents ingested yet"
          description="Upload laboratory test certificates, factory QMS records, or component datasheets to prepare evidentiary clauses."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5 text-xs font-semibold"
              startIcon={<UploadCloud className="w-4 h-4" />}
            >
              Upload First Document
            </Button>
          }
          className="my-8"
        />
      ) : (
        /* Document Cards */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          {documents.map((doc) => {
            const isProcessing = doc.status === 'PROCESSING' || doc.status === 'QUEUED';
            const isNeedsOcr = doc.status === 'NEEDS_OCR';

            return (
              <div
                key={doc.id}
                onClick={() => navigate(`/documents/${doc.id}`)}
                className="p-5 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-bharat-800 dark:group-hover:text-bharat-300 transition-colors">
                        {doc.original_filename}
                      </h3>

                      <StatusBadge status={doc.status} size="sm" />

                      {doc.product_name && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-bharat-50 dark:bg-bharat-950/60 text-bharat-800 dark:text-bharat-300 border border-bharat-200 dark:border-bharat-800 flex items-center gap-1">
                          <Box className="w-3 h-3 text-bharat-600" />
                          <span>{doc.product_name}</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>Size: <strong>{formatFileSize(doc.file_size)}</strong></span>
                      <span>Pages: <strong>{doc.page_count}</strong></span>
                      {doc.chunks_count > 0 && (
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                          <Layers className="w-3 h-3" />
                          <span>{doc.chunks_count} Extracted Chunks</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                      </span>
                    </div>

                    {isNeedsOcr && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 pt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Scanned image detected. Text density is low; optical character recognition recommended.
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div
                  className="flex items-center gap-2 self-end md:self-center flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Link to={`/documents/${doc.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs font-semibold gap-1 py-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect</span>
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => handleReprocess(doc, e)}
                    disabled={isProcessing}
                    title="Re-run text extraction & chunking"
                    aria-label="Re-run text extraction & chunking"
                    className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => confirmDelete(doc, e)}
                    title="Delete Document"
                    aria-label="Delete Document"
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !isDeleting && setDeleteDialogOpen(false)}
        title="Delete Document"
        description="Are you sure you want to delete this document?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Permanent Evidence Deletion</p>
              <p className="text-[11px] text-rose-800 dark:text-rose-300">
                Deleting <strong>"{documentToDelete?.original_filename}"</strong> will remove the physical storage file and all associated text chunks.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={isDeleting}
              onClick={handleDelete}
              className="gap-1.5 font-bold"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
