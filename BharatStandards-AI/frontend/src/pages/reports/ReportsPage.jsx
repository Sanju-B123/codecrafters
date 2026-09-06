import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  Download,
  Trash2,
  ExternalLink,
  ChevronRight,
  Calendar,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
} from 'lucide-react';
import { reportService } from '@/services/reportService';
import { useToast } from '@/components/ui/ToastContext';
import { Button, Badge, StatusBadge, Dialog } from '@/components/ui';

export const ReportsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Delete modal state
  const [reportToDelete, setReportToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  const loadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await reportService.getReports();
      setReports(data || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
      setError('Unable to load compliance audit reports. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleDownload = async (report) => {
    try {
      setDownloadingId(report.id);
      addToast({
        type: 'info',
        title: 'Generating PDF Dossier',
        message: `Compiling presentation-ready report for ${report.report_number}...`,
      });
      await reportService.downloadReport(report.id, `${report.report_number}.pdf`);
      addToast({
        type: 'success',
        title: 'Download Started',
        message: `Report ${report.report_number} downloaded successfully.`,
      });
    } catch (err) {
      console.error('Download error:', err);
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: err.message || 'Could not generate PDF dossier.',
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!reportToDelete) return;
    try {
      setIsDeleting(true);
      await reportService.deleteReport(reportToDelete.id);
      addToast({
        type: 'success',
        title: 'Report Deleted',
        message: `Report ${reportToDelete.report_number} deleted successfully.`,
      });
      setReportToDelete(null);
      await loadReports();
    } catch (err) {
      console.error('Delete error:', err);
      addToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete report.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredReports = reports.filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      r.report_number.toLowerCase().includes(q) ||
      r.product_name.toLowerCase().includes(q) ||
      r.standard_number.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 text-left pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-bharat-50 text-bharat-900 border border-bharat-200 uppercase tracking-wide">
              Compliance Dossiers
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Compliance Readiness Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Formal assessment dossiers, clause evidence citations, and presentation-ready PDF exports.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/compliance')}
            className="text-xs font-bold gap-1.5 shadow-sm"
            startIcon={<Plus className="w-3.5 h-3.5" />}
          >
            New Assessment
          </Button>
        </div>
      </div>

      {/* Trust & Non-Affiliation Notice */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-bharat-900 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-slate-800">AI-assisted compliance readiness assessment: </span>
          Dossiers provide technical preparation and gap analysis. They do not constitute official BIS
          certification or legal conformity authorization.
        </div>
      </div>

      {/* Filter / Search bar */}
      {reports.length > 0 && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by report number, product, standard..."
              className="w-full text-xs pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-bharat-800 text-slate-800"
            />
          </div>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-bharat-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Loading compliance dossiers...</p>
        </div>
      ) : error ? (
        <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-600" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      ) : reports.length === 0 ? (
        /* Empty State */
        <div className="p-12 sm:p-16 rounded-3xl bg-white border border-slate-200 text-center space-y-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto border border-slate-200">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">No reports yet</h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Complete a compliance assessment to generate your first compliance readiness report.
            </p>
          </div>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/compliance')}
              className="text-xs font-bold gap-1.5 shadow-sm"
              endIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Run Compliance Assessment
            </Button>
          </div>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
          No reports match your search query "{search}".
        </div>
      ) : (
        /* Reports List Cards */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs divide-y divide-slate-100 overflow-hidden">
          {filteredReports.map((report) => {
            const formattedDate = new Date(report.generated_at).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={report.id}
                className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-5"
              >
                {/* Report Identification & Metadata */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-bharat-50 border border-bharat-100 text-bharat-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="w-6 h-6" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                        {report.report_number}
                      </span>
                      {report.is_demo && (
                        <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                          DEMO DATA
                        </span>
                      )}
                      <StatusBadge status={report.status} size="sm" />
                    </div>

                    <h3 className="text-base font-bold text-slate-900">
                      {report.product_name}
                    </h3>

                    <p className="text-xs text-slate-500">
                      Standard:{' '}
                      <strong className="text-slate-700 font-mono">{report.standard_number}</strong>
                      {' • '}
                      {report.standard_title}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> {formattedDate}
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-emerald-700">
                        {report.passed_count} PASS
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-amber-700">
                        {report.partial_count} PARTIAL
                      </span>
                      <span>•</span>
                      <span className="font-semibold text-rose-700">
                        {report.missing_count} MISSING
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score & Action Buttons */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  <div className="text-left lg:text-right pr-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Readiness Score
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      {report.readiness_score}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/reports/${report.id}`)}
                      className="text-xs font-bold gap-1 shadow-xs"
                      endIcon={<ChevronRight className="w-3.5 h-3.5" />}
                    >
                      View Report
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(report)}
                      disabled={downloadingId === report.id}
                      loading={downloadingId === report.id}
                      className="text-xs font-bold gap-1"
                      startIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      PDF
                    </Button>

                    <button
                      onClick={() => setReportToDelete(report)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Report"
                      aria-label="Delete Report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!reportToDelete}
        onClose={() => !isDeleting && setReportToDelete(null)}
        title="Delete Compliance Report"
        description="Are you sure you want to permanently delete this report dossier?"
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <p>
              Are you sure you want to delete report <strong>{reportToDelete?.report_number}</strong>?
              This action cannot be undone.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setReportToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={isDeleting}
              onClick={handleDelete}
              className="font-bold"
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
