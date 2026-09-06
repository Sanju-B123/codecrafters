import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Search,
  Layers,
  Calendar,
  Box,
  RefreshCw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  ExternalLink,
  Clock,
  Sparkles,
  Info,
} from 'lucide-react';
import { documentService } from '@/services/documentService';
import { useToast } from '@/components/ui/ToastContext';
import {
  Button,
  Badge,
  StatusBadge,
  Dialog,
  Skeleton,
} from '@/components/ui';

export const DocumentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // In-document search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // Reprocess & Delete
  const [reprocessing, setReprocessing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDocument = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await documentService.getDocument(id);
      setDocument(data);
    } catch (err) {
      console.error('Failed to load document:', err);
      setError(err.message || 'Document not found or access denied.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    try {
      setSearching(true);
      const res = await documentService.searchDocument(id, searchQuery.trim());
      setSearchResults(res || []);
    } catch (err) {
      console.error('Search failed:', err);
      addToast({
        type: 'error',
        title: 'Search Error',
        message: err.message || 'Could not search document chunks.',
      });
    } finally {
      setSearching(false);
    }
  };

  const handleReprocess = async () => {
    try {
      setReprocessing(true);
      await documentService.processDocument(id);
      addToast({
        type: 'info',
        title: 'Re-processing Triggered',
        message: 'Extraction pipeline has been queued.',
      });
      fetchDocument();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Re-process Error',
        message: err.message || 'Could not trigger processing.',
      });
    } finally {
      setReprocessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      setDeleting(true);
      await documentService.deleteDocument(id);
      addToast({
        type: 'success',
        title: 'Document Deleted',
        message: `"${document.original_filename}" has been permanently removed.`,
      });
      setDeleteDialogOpen(false);
      navigate('/documents');
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err.message || 'Unable to delete document.',
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Document Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
        <Link to="/documents">
          <Button variant="primary" size="sm" startIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Document Vault
          </Button>
        </Link>
      </div>
    );
  }

  const chunks = document.chunks || [];

  // Group chunks by page
  const chunksByPage = chunks.reduce((acc, chunk) => {
    const p = chunk.page || 1;
    if (!acc[p]) acc[p] = [];
    acc[p].push(chunk);
    return acc;
  }, {});

  const sortedPages = Object.keys(chunksByPage)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
      {/* Top Back Navigation */}
      <Link
        to="/documents"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Document Vault</span>
      </Link>

      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center flex-shrink-0 shadow-xs">
            <FileText className="w-7 h-7" />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">
                {document.original_filename}
              </h1>
              <StatusBadge status={document.status} size="md" />
              <Badge variant="outline" size="sm" className="font-mono uppercase">
                {document.file_type}
              </Badge>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span>Size: <strong>{formatFileSize(document.file_size)}</strong></span>
              <span>Pages: <strong>{document.page_count}</strong></span>
              <span>Chunks: <strong>{chunks.length}</strong></span>

              {document.product_id && (
                <Link to={`/products/${document.product_id}`}>
                  <span className="flex items-center gap-1 text-bharat-700 dark:text-bharat-300 font-semibold hover:underline">
                    <Box className="w-3.5 h-3.5" />
                    <span>Product: {document.product_name || `ID #${document.product_id}`}</span>
                  </span>
                </Link>
              )}

              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Uploaded {new Date(document.created_at).toLocaleString()}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-center">
          <Button
            variant="outline"
            size="sm"
            onClick={handleReprocess}
            disabled={reprocessing || document.status === 'PROCESSING'}
            className="gap-1.5 text-xs font-semibold"
            startIcon={<RefreshCw className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin' : ''}`} />}
          >
            Re-process
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            title="Delete Document"
            aria-label="Delete Document"
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* In-Document Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <form onSubmit={handleSearch} className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search extracted text chunks (e.g., pressure, dielectric, 1500V, temperature)..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bharat-500"
            />
          </div>

          <Button
            variant="primary"
            size="md"
            type="submit"
            loading={searching}
            className="text-xs font-semibold px-4"
          >
            Search Text
          </Button>

          {searchResults !== null && (
            <Button
              variant="outline"
              size="md"
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSearchResults(null);
              }}
              className="text-xs"
            >
              Reset
            </Button>
          )}
        </form>

        {/* Search Results Summary */}
        {searchResults !== null && (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-900 dark:text-slate-100">
              Found {searchResults.length} matching {searchResults.length === 1 ? 'passage' : 'passages'}:
            </span>
            <div className="mt-2 space-y-2">
              {searchResults.length === 0 ? (
                <p className="text-slate-500 italic">No matches found for "{searchQuery}".</p>
              ) : (
                searchResults.map((res, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800 space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] font-semibold text-blue-900 dark:text-blue-300">
                      <span>Page {res.page} {res.section ? `• ${res.section}` : ''}</span>
                      <span className="font-mono text-[10px]">Chunk #{res.chunk_id}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-mono leading-relaxed">
                      "{res.snippet}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Extracted Text Preview: Page-by-Page */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Extracted Document Text Preview
            </h2>
            <Badge variant="outline" size="sm">
              {document.page_count} {document.page_count === 1 ? 'Page' : 'Pages'}
            </Badge>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Evidence prepared for future compliance analysis
          </span>
        </div>

        {chunks.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <Clock className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {document.status === 'NEEDS_OCR'
                  ? 'Optical Character Recognition Required'
                  : 'Document Awaiting Processing'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                {document.status === 'NEEDS_OCR'
                  ? 'This PDF appears to be a scanned image with minimal embedded text. OCR processing will be supported in future releases.'
                  : 'Extracted text chunks will appear here once background ingestion is complete.'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={handleReprocess}>
              Re-run Processing
            </Button>
          </div>
        ) : (
          /* Render Pages */
          <div className="space-y-6">
            {sortedPages.map((pageNum) => {
              const pageChunks = chunksByPage[pageNum] || [];

              return (
                <div
                  key={pageNum}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
                >
                  {/* Page Header */}
                  <div className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-bharat-700" />
                      <span>Page {pageNum} of {document.page_count}</span>
                    </span>
                    <span className="text-[11px] font-normal text-slate-400">
                      {pageChunks.length} {pageChunks.length === 1 ? 'Chunk' : 'Chunks'}
                    </span>
                  </div>

                  {/* Page Chunks */}
                  <div className="p-6 space-y-4 divide-y divide-slate-100 dark:divide-slate-800">
                    {pageChunks.map((chunk, idx) => (
                      <div key={chunk.id} className={idx > 0 ? 'pt-4 space-y-2' : 'space-y-2'}>
                        <div className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                              Chunk #{chunk.chunk_index}
                            </span>
                            {chunk.section && (
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                {chunk.section}
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {chunk.char_count} chars
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap leading-relaxed bg-slate-50/70 dark:bg-slate-800/30 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80">
                          {chunk.content}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
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
                Deleting <strong>"{document.original_filename}"</strong> will remove the physical storage file and all associated text chunks.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={deleting}
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleting}
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
