import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Box,
  ArrowRight,
  Sparkles,
  Edit,
  Trash2,
  Calendar,
  Building2,
  Tag,
  ShieldCheck,
  FileText,
  AlertTriangle,
  FileCheck2,
  Compass,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  UploadCloud,
  Loader2,
  Info,
  Layers,
  FileSearch,
  RefreshCw,
  Search,
  Bot,
  Download,
  Flame,
  ChevronRight,
} from 'lucide-react';
import { productService } from '@/services/productService';
import { documentService } from '@/services/documentService';
import { complianceService } from '@/services/complianceService';
import { reportService } from '@/services/reportService';
import { bisService } from '@/services/bisService';
import { ServiceCard } from '@/components/services/ServiceCard';
import { useToast } from '@/components/ui/ToastContext';

import {
  Button,
  Badge,
  StatusBadge,
  Dialog,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
} from '@/components/ui';

export const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [product, setProduct] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [docsLoading, setDocsLoading] = useState(true);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [uploadStep, setUploadStep] = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [docToDelete, setDocToDelete] = useState(null);
  const [deleteDocDialogOpen, setDeleteDocDialogOpen] = useState(false);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  // Compliance state
  const [latestCompliance, setLatestCompliance] = useState(null);
  const [latestReport, setLatestReport] = useState(null);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [isRunningCompliance, setIsRunningCompliance] = useState(false);

  // Analysis simulation state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProductAndAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const prod = await productService.getProduct(id);
      setProduct(prod);

      if (prod.analysis_data) {
        try {
          setAnalysis(JSON.parse(prod.analysis_data));
        } catch (e) {
          console.error('Error parsing stored analysis:', e);
        }
      }
    } catch (err) {
      console.error('Failed to load product:', err);
      setError(err.message || 'Product not found or access denied.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchProductDocuments = useCallback(async () => {
    try {
      setDocsLoading(true);
      const docs = await documentService.getDocuments({ product_id: id });
      setDocuments(docs.items || []);
    } catch (err) {
      console.error('Failed to load product documents:', err);
    } finally {
      setDocsLoading(false);
    }
  }, [id]);

  const [productServices, setProductServices] = useState([]);

  const fetchCompliance = useCallback(async () => {
    try {
      const rep = await complianceService.getLatestForProduct(id);
      setLatestCompliance(rep);

      try {
        const reps = await reportService.getReports({ product_id: id });
        if (reps && reps.length > 0) {
          setLatestReport(reps[0]);
        }
      } catch (repErr) {
        console.warn('Failed to load product reports:', repErr);
      }
    } catch (err) {
      console.warn('Failed to load latest compliance report for product:', err);
    }
  }, [id]);

  const handleDownloadProductReport = async () => {
    try {
      setDownloadingReport(true);
      let repId = latestReport?.id;
      let repNumber = latestReport?.report_number;

      if (!repId && latestCompliance) {
        const dossier = await reportService.getReportForCompliance(latestCompliance.id);
        repId = dossier.id;
        repNumber = dossier.report_number;
        setLatestReport(dossier);
      }

      if (!repId) return;

      addToast({
        type: 'info',
        title: 'Downloading Compliance Dossier',
        message: `Exporting PDF for ${repNumber || 'report'}...`,
      });

      await reportService.downloadReport(repId, `${repNumber || 'Compliance-Report'}.pdf`);

      addToast({
        type: 'success',
        title: 'Download Complete',
        message: 'PDF Compliance Readiness Dossier saved.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Export Failed',
        message: err.message || 'Failed to download compliance report.',
      });
    } finally {
      setDownloadingReport(false);
    }
  };

  const fetchProductServices = useCallback(async () => {
    try {
      const recs = await bisService.getProductServices(id);
      setProductServices(recs || []);
    } catch (err) {
      console.warn('Failed to load recommended guidance for product:', err);
    }
  }, [id]);

  useEffect(() => {
    fetchProductAndAnalysis();
    fetchProductDocuments();
    fetchCompliance();
    fetchProductServices();
  }, [fetchProductAndAnalysis, fetchProductDocuments, fetchCompliance, fetchProductServices]);


  // Periodic polling for processing documents
  useEffect(() => {
    const hasInFlight = documents.some(
      (d) => d.status === 'QUEUED' || d.status === 'PROCESSING'
    );
    if (!hasInFlight) return;

    const interval = setInterval(() => {
      fetchProductDocuments();
    }, 3000);
    return () => clearInterval(interval);
  }, [documents, fetchProductDocuments]);

  const handleFileUpload = async (file) => {
    setUploadError(null);
    setUploadingDoc(true);
    setUploadStep(1);

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF documents are supported for compliance evidence ingestion.');
      setUploadingDoc(false);
      setUploadStep(0);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size exceeds the 10 MB limit.');
      setUploadingDoc(false);
      setUploadStep(0);
      return;
    }

    setUploadStep(2);
    try {
      await documentService.uploadDocument(file, parseInt(id, 10));
      setUploadStep(3);
      await new Promise((r) => setTimeout(r, 600));
      setUploadStep(4);
      addToast({
        type: 'success',
        title: 'Document Uploaded',
        message: `"${file.name}" linked to ${product?.name || 'product'} and processed.`,
      });
      setTimeout(() => {
        setUploadModalOpen(false);
        setUploadingDoc(false);
        setUploadStep(0);
        fetchProductDocuments();
      }, 1000);
    } catch (err) {
      console.error('Upload failed:', err);
      setUploadError(err.message || 'Document upload failed.');
      setUploadingDoc(false);
      setUploadStep(0);
    }
  };

  const handleDeleteDocument = async () => {
    if (!docToDelete) return;
    try {
      setIsDeletingDoc(true);
      await documentService.deleteDocument(docToDelete.id);
      addToast({
        type: 'success',
        title: 'Document Deleted',
        message: `"${docToDelete.original_filename}" has been deleted.`,
      });
      setDeleteDocDialogOpen(false);
      setDocToDelete(null);
      fetchProductDocuments();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Unable to delete document.',
      });
    } finally {
      setIsDeletingDoc(false);
    }
  };

  const handleRunComplianceCheck = async () => {
    try {
      setIsRunningCompliance(true);
      const stdId = analysis?.standards?.[0]?.id || 1;
      const rep = await complianceService.runCheck(id, stdId);
      setLatestCompliance(rep);
      addToast({
        type: 'success',
        title: 'Compliance Assessment Complete',
        message: `Readiness score computed at ${rep.score}% (${rep.passed_count} PASS, ${rep.partial_count} PARTIAL, ${rep.missing_count} MISSING).`,
      });
      navigate(`/compliance/${rep.id}`);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Compliance Check Failed',
        message: err.message || 'Unable to execute compliance check.',
      });
    } finally {
      setIsRunningCompliance(false);
    }
  };

  const handleRunAnalysis = async () => {
    try {
      setIsAnalyzing(true);
      setAnalysisStep(1);

      await new Promise((r) => setTimeout(r, 600));
      setAnalysisStep(2);

      await new Promise((r) => setTimeout(r, 600));
      setAnalysisStep(3);

      const res = await productService.analyzeProduct(id);
      await new Promise((r) => setTimeout(r, 600));
      setAnalysisStep(4);

      await new Promise((r) => setTimeout(r, 400));
      setAnalysis(res);
      setProduct((prev) => ({ ...prev, status: 'READY' }));

      addToast({
        type: 'success',
        title: 'Standards Analysis Complete',
        message: `Identified ${res.standards?.length || 0} potentially applicable standards.`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Analysis Failed',
        message: err.message || 'Could not complete standards analysis.',
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep(0);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await productService.deleteProduct(id);
      addToast({
        type: 'success',
        title: 'Product Deleted',
        message: `Product "${product.name}" has been permanently removed.`,
      });
      setDeleteDialogOpen(false);
      navigate('/products');
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err.message || 'Unable to delete product.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Product Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The requested product does not exist or you do not have permission to view it.
        </p>
        <Link to="/products">
          <Button variant="primary" size="sm" startIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to My Products
          </Button>
        </Link>
      </div>
    );
  }

  const standardsList = analysis?.standards || [];

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
      {/* Back Link */}
      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Products</span>
      </Link>

      {/* Main Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-bharat-50 dark:bg-bharat-950/70 border border-bharat-200 dark:border-bharat-800 text-bharat-800 dark:text-bharat-300 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Box className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {product.name}
              </h1>
              <StatusBadge status={product.status} size="md" />
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 uppercase">
                DEMO / SYNTHETIC DATA
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Category: <strong className="text-slate-700 dark:text-slate-300 font-medium">{product.category}</strong></span>
              </span>

              {product.manufacturer && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Mfr: <strong className="text-slate-700 dark:text-slate-300 font-medium">{product.manufacturer}</strong></span>
                </span>
              )}

              {product.model_number && (
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  Model: <strong>{product.model_number}</strong>
                </span>
              )}

              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Created {new Date(product.created_at).toLocaleDateString()}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
            className="gap-1.5 text-xs font-bold shadow-sm"
            startIcon={<Sparkles className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />}
          >
            {isAnalyzing
              ? 'Analyzing...'
              : product.status === 'READY'
              ? 'Re-run Analysis'
              : 'Find Applicable Standards'}
          </Button>

          <Link to={`/products/${product.id}/edit`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-semibold"
              startIcon={<Edit className="w-3.5 h-3.5" />}
            >
              Edit
            </Button>
          </Link>

          <Link to={`/assistant/product/${product.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs font-bold shadow-sm text-bharat-800 dark:text-bharat-300 border-bharat-300 dark:border-slate-700 hover:bg-bharat-50 dark:hover:bg-slate-800"
              startIcon={<Bot className="w-3.5 h-3.5 text-bharat-700 dark:text-bharat-400" />}
            >
              Ask AI About This Product
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteDialogOpen(true)}
            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-2"
            title="Delete Product"
            aria-label="Delete Product"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Analysis Progress Banner if in-flight */}
      {isAnalyzing && (
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-600 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-bold">
              {analysisStep === 1 && 'Step 1/4: Understanding product specifications...'}
              {analysisStep === 2 && 'Step 2/4: Searching standards knowledge base...'}
              {analysisStep === 3 && 'Step 3/4: Ranking potential matches...'}
              {analysisStep === 4 && 'Step 4/4: Preparing results...'}
            </span>
            <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
              Evaluating technical parameters against synthetic BIS repository.
            </p>
          </div>
        </div>
      )}

      {/* Executive Workspace Intelligence Strip */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800">
          {/* Readiness Score */}
          <div className="px-2 sm:px-3 py-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Readiness Score</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className={`text-2xl font-black ${
                (latestCompliance?.score ?? 0) >= 75
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : (latestCompliance?.score ?? 0) >= 50
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                {latestCompliance?.score !== undefined && latestCompliance?.score !== null ? `${latestCompliance.score}%` : 'N/A'}
              </span>
              <Badge variant={(latestCompliance?.score ?? 0) >= 70 ? 'success' : 'warning'} size="sm">
                {latestCompliance?.score !== undefined ? (latestCompliance.score >= 70 ? 'READY' : 'GAPS') : 'UNAUDITED'}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {latestCompliance?.total_evaluated ? `${latestCompliance.total_evaluated} clauses evaluated` : 'Awaiting evaluation'}
            </p>
          </div>

          {/* Risk Level */}
          <div className="px-2 sm:px-3 py-1 pt-3 sm:pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Risk Severity</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {latestCompliance?.overall_risk_score !== undefined && latestCompliance?.overall_risk_score !== null
                  ? `${latestCompliance.overall_risk_score}/100`
                  : 'N/A'}
              </span>
              <Badge
                variant={
                  latestCompliance?.risk_level === 'CRITICAL'
                    ? 'danger'
                    : latestCompliance?.risk_level === 'HIGH'
                    ? 'warning'
                    : 'primary'
                }
                size="sm"
              >
                {latestCompliance?.risk_level || 'LOW'} RISK
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Explainable gap score
            </p>
          </div>

          {/* Critical / High Gaps */}
          <div className="px-2 sm:px-3 py-1 pt-3 sm:pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Gaps to Resolve</span>
            <div className="mt-1 flex items-center gap-1.5 font-bold text-base text-slate-900 dark:text-white">
              <span className="text-rose-600 dark:text-rose-400">
                {latestCompliance?.missing_count ?? 0} Missing
              </span>
              <span className="text-slate-300 dark:text-slate-600">•</span>
              <span className="text-amber-600 dark:text-amber-400">
                {latestCompliance?.partial_count ?? 0} Partial
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {latestCompliance?.passed_count ?? 0} compliant clauses
            </p>
          </div>

          {/* Governing Standard */}
          <div className="px-2 sm:px-3 py-1 pt-3 sm:pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Governing Standard</span>
            <div className="mt-1 font-mono font-bold text-xs sm:text-sm text-bharat-900 dark:text-bharat-300 truncate">
              {standardsList[0]?.standard_number || 'DEMO-IS-001'}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
              {standardsList[0]?.title || 'Electric Water Heaters'}
            </p>
          </div>

          {/* Evidence Vault */}
          <div className="px-2 sm:px-3 py-1 pt-3 sm:pt-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Evidence Vault</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                {documents.length} {documents.length === 1 ? 'Doc' : 'Docs'}
              </span>
              <Badge variant="outline" size="sm">NABL</Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Lab tests & manuals attached
            </p>
          </div>
        </div>

        {/* Workspace Sub-system Anchor Navigation Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs pb-1">
          <a
            href="#workspace-overview"
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap transition-colors"
          >
            Overview
          </a>
          <a
            href="#workspace-standards"
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap transition-colors"
          >
            Standards ({standardsList.length})
          </a>
          <a
            href="#workspace-documents"
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap transition-colors"
          >
            Evidence Vault ({documents.length})
          </a>
          <a
            href="#workspace-compliance"
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-700 whitespace-nowrap transition-colors"
          >
            Compliance Audit
          </a>
          {latestCompliance && (
            <Link
              to={`/compliance/${latestCompliance.id}`}
              className="px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-medium hover:bg-rose-100 dark:hover:bg-rose-900/50 whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <span>Risk & Priority</span>
              <Flame className="w-3 h-3 text-rose-500" />
            </Link>
          )}
          {latestReport && (
            <Link
              to={`/reports/${latestReport.id}`}
              className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/50 whitespace-nowrap transition-colors flex items-center gap-1"
            >
              <span>Audit Dossier</span>
              <FileCheck2 className="w-3 h-3 text-emerald-600" />
            </Link>
          )}
          <Link
            to={`/assistant/product/${product.id}`}
            className="px-3 py-1.5 rounded-lg bg-bharat-50 dark:bg-bharat-950/40 text-bharat-700 dark:text-bharat-300 font-medium hover:bg-bharat-100 dark:hover:bg-bharat-900/50 whitespace-nowrap transition-colors flex items-center gap-1"
          >
            <span>Ask BIS Copilot</span>
            <Bot className="w-3 h-3 text-bharat-600" />
          </Link>
        </div>
      </div>

      {/* Grid: 2 Columns (Product Info + Standards Discovery) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (1 col): Product Overview & Technical Specs */}
        <div className="space-y-6 lg:col-span-1">
          {/* Overview */}
          <div id="workspace-overview" className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Info className="w-4 h-4 text-bharat-700" />
              <span>Product Overview</span>
            </h2>

            <div className="text-xs space-y-3">
              <div>
                <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold block">Description</span>
                <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                  {product.description || 'No detailed commercial description provided.'}
                </p>
              </div>

              {product.intended_use && (
                <div>
                  <span className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold block">Intended Use</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed">
                    {product.intended_use}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Tag className="w-4 h-4 text-bharat-700" />
              <span>Technical Information</span>
            </h2>

            {product.technical_details ? (
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                {product.technical_details}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No technical ratings or engineering parameters recorded yet.
              </p>
            )}

            <Link to={`/products/${product.id}/edit`}>
              <span className="text-[11px] font-semibold text-bharat-700 hover:text-bharat-900 dark:text-bharat-400 inline-flex items-center gap-1 mt-1 cursor-pointer">
                <span>Update technical specifications</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          </div>

          {/* Dedicated AI Standards Assistant Card */}
          <div className="bg-gradient-to-br from-bharat-900 to-bharat-800 text-white p-5 rounded-2xl border border-bharat-700 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-saffron-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Standards Assistant
                </h3>
                <span className="text-[10px] text-slate-300">Evidence-Grounded RAG</span>
              </div>
            </div>
            <p className="text-xs text-slate-200/90 leading-relaxed">
              Have questions regarding mandatory clauses, required test equipment, or open gaps for {product.name}?
            </p>
            <Link to={`/assistant/product/${product.id}`} className="block pt-1">
              <Button
                variant="secondary"
                size="sm"
                className="w-full bg-white text-bharat-900 hover:bg-slate-100 font-bold text-xs gap-1.5 shadow-sm justify-center"
                startIcon={<Bot className="w-3.5 h-3.5 text-bharat-900" />}
                endIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Ask AI About This Product
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Column (2 cols): Standards Discovery, Documents & Compliance */}
        <div className="space-y-6 lg:col-span-2">
          {/* Standards Discovery Section */}
          <div id="workspace-standards" className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Potentially Applicable Indian Standards
                  </h2>
                  {analysis && (
                    <Badge variant="success" size="sm" className="font-mono">
                      Analysis Complete
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Automated regulatory classification based on product specifications.
                </p>
              </div>

              {!analysis && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="gap-1.5 text-xs font-bold"
                  startIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Find Applicable Standards
                </Button>
              )}
            </div>

            {/* Standards Content */}
            {!analysis || standardsList.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-50/70 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <Compass className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No standards analysis recorded yet
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Run the standards discovery analysis to discover potentially applicable Indian Standards and Quality Control Orders.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunAnalysis}
                  loading={isAnalyzing}
                  className="gap-1.5 text-xs font-bold"
                  startIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  Find Applicable Standards
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Summary banner */}
                <div className="p-3.5 rounded-xl bg-bharat-50/70 dark:bg-bharat-950/40 border border-bharat-200 dark:border-bharat-800 text-xs text-bharat-900 dark:text-bharat-200 flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-bharat-700 dark:text-bharat-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">{analysis.summary}</span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Evaluated on {new Date(analysis.analyzed_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Standards Match Cards */}
                <div className="space-y-3">
                  {standardsList.map((std, idx) => {
                    const isHigh = std.relevance === 'HIGH';
                    const isMed = std.relevance === 'MEDIUM';

                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-bharat-300 dark:hover:border-bharat-700 transition-all space-y-2.5"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-bharat-900 dark:text-bharat-300">
                              {std.standard_number}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                                isHigh
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
                                  : isMed
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {std.relevance} RELEVANCE
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                              DEMO
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Link to={`/standards/${std.standard_number}`}>
                              <Button variant="outline" size="sm" className="text-xs gap-1 py-1 px-2.5">
                                <span>View Standard</span>
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            </Link>
                            <Link to="/assistant">
                              <Button variant="ghost" size="sm" className="text-xs gap-1 py-1 px-2 text-bharat-700 dark:text-bharat-300">
                                <MessageSquare className="w-3 h-3" />
                                <span>Ask AI</span>
                              </Button>
                            </Link>
                          </div>
                        </div>

                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {std.title}
                        </h4>

                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                          {std.why_it_applies}
                        </p>

                        <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                          <span>Source: {std.source}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Mandatory Disclaimer */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  <strong>Regulatory Disclaimer:</strong> {analysis.disclaimer}
                </div>
              </div>
            )}
          </div>

          {/* Documents Section */}
          <div id="workspace-documents" className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-bharat-700" />
                    <span>Document Vault & Evidence</span>
                  </h2>
                  <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                    {documents.length} {documents.length === 1 ? 'FILE' : 'FILES'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Uploaded test reports, drawings, and NABL certificates linked to this product.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setUploadModalOpen(true)}
                  className="gap-1.5 text-xs font-semibold"
                  startIcon={<UploadCloud className="w-3.5 h-3.5" />}
                >
                  Upload Document
                </Button>
                <Link to="/documents">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-xs font-semibold"
                  >
                    All Documents
                  </Button>
                </Link>
              </div>
            </div>

            {/* Documents List */}
            {docsLoading ? (
              <div className="space-y-2.5">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : documents.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 space-y-2">
                <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No documents linked to this product yet.</p>
                <p className="text-[11px] max-w-sm mx-auto">
                  Upload PDF test reports or technical dossiers to extract clauses and prepare evidence for compliance.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadModalOpen(true)}
                  className="mt-1 text-xs gap-1.5"
                  startIcon={<UploadCloud className="w-3.5 h-3.5" />}
                >
                  Upload PDF Report
                </Button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {documents.map((doc) => {
                  const isProcessed = doc.status === 'PROCESSED';
                  const isProcessing = doc.status === 'PROCESSING' || doc.status === 'QUEUED';
                  const isFailed = doc.status === 'FAILED';
                  const isOcr = doc.status === 'NEEDS_OCR';

                  return (
                    <div
                      key={doc.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 hover:border-bharat-200 dark:hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-600 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-xs text-slate-900 dark:text-slate-100 truncate max-w-xs sm:max-w-md">
                              {doc.original_filename}
                            </span>
                            {isProcessed && <Badge variant="success" size="sm">PROCESSED</Badge>}
                            {isProcessing && <Badge variant="warning" size="sm">PROCESSING</Badge>}
                            {isOcr && <Badge variant="warning" size="sm">NEEDS OCR</Badge>}
                            {isFailed && <Badge variant="danger" size="sm">FAILED</Badge>}
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                            <span>{(doc.file_size / 1024).toFixed(1)} KB</span>
                            <span>•</span>
                            <span>{doc.page_count ? `${doc.page_count} pages` : 'Pending pages'}</span>
                            <span>•</span>
                            <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                        <Link to={`/documents/${doc.id}`}>
                          <Button variant="outline" size="sm" className="text-xs py-1 px-2.5 gap-1 font-semibold">
                            <span>View Evidence</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDocToDelete(doc);
                            setDeleteDocDialogOpen(true);
                          }}
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 p-1.5"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-1 text-[11px] text-slate-400 dark:text-slate-500 italic">
                  Document processed — Evidence prepared for future compliance analysis.
                </div>
              </div>
            )}
          </div>

          {/* Compliance Audit Section */}
          <div id="workspace-compliance" className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-bharat-700" />
                    <span>Compliance Readiness Audit</span>
                  </h2>
                  {latestCompliance && (
                    <Badge variant={latestCompliance.score >= 70 ? 'success' : 'warning'} size="sm" className="font-mono">
                      {latestCompliance.score}% READY
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Algorithmic evaluation of product specifications and uploaded laboratory evidence against BIS standards.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunComplianceCheck}
                  loading={isRunningCompliance}
                  className="gap-1.5 text-xs font-semibold"
                  startIcon={<ShieldCheck className="w-3.5 h-3.5" />}
                >
                  {latestCompliance ? 'Re-run Audit' : 'Run Compliance Check'}
                </Button>
                {latestCompliance && (
                  <Link to={`/compliance/${latestCompliance.id}`}>
                    <Button variant="outline" size="sm" className="text-xs font-semibold gap-1">
                      <span>View Report</span>
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {latestCompliance ? (
              <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-black text-sm flex items-center justify-center">
                      {latestCompliance.score}%
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Latest Compliance Report: {latestReport?.report_number || `Assessment #${latestCompliance.id}`}
                        </h4>
                        <Badge variant={latestCompliance.score >= 70 ? 'success' : 'warning'} size="sm" className="font-mono text-[10px]">
                          {latestCompliance.score}% READINESS
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-medium">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          Assessment Date: {new Date(latestCompliance.evaluated_at || latestCompliance.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{latestCompliance.passed_count} PASS</span>
                        <span>•</span>
                        <span className="text-amber-700 dark:text-amber-400 font-semibold">{latestCompliance.partial_count} PARTIAL</span>
                        <span>•</span>
                        <span className="text-rose-700 dark:text-rose-400 font-semibold">{latestCompliance.missing_count} MISSING</span>
                      </div>

                      {latestCompliance.overall_risk_score !== null && latestCompliance.overall_risk_score !== undefined && (
                        <div className="flex items-center gap-2 pt-2 mt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                            <Flame className="w-3.5 h-3.5 text-rose-500" />
                            Risk Assessment:
                          </span>
                          <Badge
                            variant={
                              latestCompliance.risk_level === 'CRITICAL'
                                ? 'danger'
                                : latestCompliance.risk_level === 'HIGH'
                                ? 'warning'
                                : 'outline'
                            }
                            size="sm"
                            className="font-mono text-[10px]"
                          >
                            {latestCompliance.overall_risk_score}/100 • {latestCompliance.risk_level} RISK
                          </Badge>
                          <span className="text-[10px] text-slate-400">
                            (BharatStandards AI Risk Classification - Not an official BIS rating)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/compliance/${latestCompliance.id}/report`}>
                      <Button variant="primary" size="sm" className="text-xs font-semibold gap-1.5 shadow-sm">
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Report</span>
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadProductReport}
                      loading={downloadingReport}
                      className="text-xs font-semibold gap-1.5 text-slate-700 dark:text-slate-200"
                    >
                      <Download className="w-3.5 h-3.5 text-bharat-600" />
                      <span>Download Report</span>
                    </Button>
                    <Link to={`/compliance/${latestCompliance.id}`}>
                      <Button variant="ghost" size="sm" className="text-xs font-semibold gap-1 text-slate-600 dark:text-slate-400">
                        <span>Detailed Gaps</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 italic">
                  AI-assisted readiness analysis based on uploaded evidence. Not official BIS certification.
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    No compliance audit generated for this product yet.
                  </span>
                  <p className="text-[11px]">
                    Click <strong>Run Compliance Check</strong> to match product documents against Indian Standards.
                  </p>
                </div>
                <Badge variant="outline" size="sm" className="font-mono text-[10px]">
                  NOT AUDITED
                </Badge>
              </div>
            )}
          </div>

          {/* Recommended Guidance Section */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Recommended Guidance
                  </h2>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-saffron-50 text-saffron-700 border border-saffron-200">
                    BIS Services & Guidance
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Based on your product and assessment, review the following guidance.
                </p>
              </div>

              <Link to={`/products/${product.id}/services`}>
                <Button variant="outline" size="sm" className="text-xs font-bold gap-1">
                  View All Services
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {productServices.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                No specific guidance records generated yet. Complete standard analysis and compliance checks to receive tailored roadmaps.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {productServices.slice(0, 2).map((rec, idx) => (
                  <ServiceCard
                    key={idx}
                    service={rec.service}
                    matchReason={rec.match_reason}
                    priority={rec.priority}
                    suggestedActions={rec.suggested_actions}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>


      {/* Delete Product Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !isDeleting && setDeleteDialogOpen(false)}
        title="Delete Product"
        description="Are you sure you want to delete this product?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Permanent Deletion Warning</p>
              <p className="text-[11px] text-rose-800 dark:text-rose-300">
                Deleting <strong>"{product.name}"</strong> will remove all registered specifications, synthetic standards linkages, and compliance records. Associated data in future modules will also be affected.
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

      {/* Delete Document Confirmation Dialog */}
      <Dialog
        open={deleteDocDialogOpen}
        onClose={() => !isDeletingDoc && setDeleteDocDialogOpen(false)}
        title="Delete Document"
        description="Are you sure you want to delete this document?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Permanent Document Deletion</p>
              <p className="text-[11px] text-rose-800 dark:text-rose-300">
                Are you sure you want to delete <strong>"{docToDelete?.original_filename}"</strong>? All extracted text pages, chunk embeddings, and compliance audit evidence will be irreversibly removed.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeletingDoc}
              onClick={() => setDeleteDocDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={isDeletingDoc}
              onClick={handleDeleteDocument}
              className="gap-1.5 font-bold"
            >
              Delete Document
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Upload Document Modal */}
      <Dialog
        open={uploadModalOpen}
        onClose={() => !uploadingDoc && setUploadModalOpen(false)}
        title={`Upload Evidence for ${product.name}`}
        description="Upload laboratory test reports, drawings, or technical dossiers in PDF format."
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {uploadError && (
            <div className="p-3 bg-rose-50 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadingDoc ? (
            <div className="p-6 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-bharat-700 dark:text-bharat-300 mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {uploadStep === 1 && '1/4: Validating PDF file structure...'}
                  {uploadStep === 2 && '2/4: Ingesting into secure document vault...'}
                  {uploadStep === 3 && '3/4: Extracting text & normalizing clauses...'}
                  {uploadStep === 4 && '4/4: Structuring chunks for compliance evidence...'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Structuring document paragraphs with page numbers and metadata lineage.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-bharat-500 transition-colors">
                <UploadCloud className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Select a PDF test report or specification dossier
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Supported format: PDF up to 10 MB
                </p>
                <input
                  type="file"
                  id="product-doc-file-input"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => document.getElementById('product-doc-file-input')?.click()}
                  className="mt-3 text-xs gap-1.5 font-bold"
                  startIcon={<UploadCloud className="w-3.5 h-3.5" />}
                >
                  Browse PDF File
                </Button>
              </div>

              <div className="p-3 bg-bharat-50/70 dark:bg-bharat-950/30 border border-bharat-200 dark:border-bharat-800 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                <strong className="text-bharat-900 dark:text-bharat-200">Notice:</strong> Uploaded evidence is securely isolated to your account and linked to{' '}
                <strong className="text-bharat-900 dark:text-bharat-200">{product.name}</strong>.
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={uploadingDoc}
              onClick={() => setUploadModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
