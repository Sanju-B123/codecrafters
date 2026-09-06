import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Printer,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Calendar,
  Building2,
  Box,
  Layers,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  History,
  Sparkles,
} from 'lucide-react';
import { reportService } from '@/services/reportService';
import { useToast } from '@/components/ui/ToastContext';
import { Button, Badge, StatusBadge } from '@/components/ui';

export const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);
        setError(null);
        let data;
        // Check if route is /compliance/:id/report vs /reports/:id
        if (window.location.pathname.includes('/compliance/')) {
          data = await reportService.getReportForCompliance(id);
        } else {
          data = await reportService.getReport(id);
        }
        setReport(data);
      } catch (err) {
        console.error('Failed to load report:', err);
        setError('Compliance readiness dossier not found or access denied.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadReport();
    }
  }, [id]);

  const handleDownload = async () => {
    if (!report) return;
    try {
      setDownloading(true);
      addToast({
        type: 'info',
        title: 'Preparing PDF Dossier',
        message: `Rendering vector PDF for ${report.report_number}...`,
      });
      await reportService.downloadReport(report.id, `${report.report_number}.pdf`);
      addToast({
        type: 'success',
        title: 'Download Complete',
        message: `Dossier ${report.report_number}.pdf is ready.`,
      });
    } catch (err) {
      console.error('PDF download error:', err);
      addToast({
        type: 'error',
        title: 'Download Error',
        message: err.message || 'Failed to download PDF.',
      });
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="w-10 h-10 border-4 border-bharat-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Assembling compliance dossier preview...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Dossier Unavailable</h2>
        <p className="text-xs text-slate-600">{error || 'The requested compliance report could not be found.'}</p>
        <button
          onClick={() => navigate('/reports')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </button>
      </div>
    );
  }

  const formattedDate = new Date(report.generated_at).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left pb-16">
      {/* Top Bar Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <button
          onClick={() => navigate('/reports')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Reports
        </button>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-bold gap-1.5"
            startIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Dossier
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleDownload}
            disabled={downloading}
            loading={downloading}
            className="text-xs font-bold gap-1.5 shadow-sm"
            startIcon={<Download className="w-3.5 h-3.5" />}
          >
            Download PDF
          </Button>
        </div>
      </div>

      {/* Main Report Document Sheet */}
      <article
        aria-label="Compliance Readiness Assessment Dossier"
        className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8 print:p-0 print:border-none print:shadow-none"
      >
        {/* ========================================================================= */}
        {/* 1. COVER / HEADER SECTION */}
        {/* ========================================================================= */}
        <header className="border-b border-slate-200 pb-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-wider text-bharat-900 uppercase">
                BharatStandards AI
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-xs font-semibold text-slate-500">
                Regulatory Assessment Dossier
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-slate-100 text-slate-800 border border-slate-200">
                {report.report_number}
              </span>
              {report.is_demo && (
                <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 uppercase">
                  DEMO / SYNTHETIC DATA
                </span>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Compliance Readiness Assessment
            </h1>
            <p className="text-xs sm:text-sm font-semibold text-saffron-600 mt-1">
              AI-assisted compliance readiness assessment
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs text-slate-600">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Product</span>
              <strong className="text-slate-900">{report.product.name}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Standard</span>
              <strong className="text-slate-900">{report.standard.standard_number}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Assessment Date</span>
              <strong className="text-slate-900">{formattedDate}</strong>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Dossier Status</span>
              <strong className="text-emerald-700">{report.status}</strong>
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. EXECUTIVE SUMMARY */}
        {/* ========================================================================= */}
        <section aria-labelledby="exec-summary-heading" className="space-y-4">
          <h2 id="exec-summary-heading" className="text-sm font-extrabold text-bharat-900 uppercase tracking-wider">
            1. Executive Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
            {/* Score Box */}
            <div className="md:col-span-4 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/80 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  Readiness Score
                </span>
                <div className="text-4xl sm:text-5xl font-black text-emerald-600 tracking-tight mt-1">
                  {report.readiness_score}%
                </div>
              </div>
              <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                Represents empirical evidence satisfaction across <strong>{report.total_requirements} mandatory clauses</strong>.
              </p>
            </div>

            {/* Metrics Breakdown */}
            <div className="md:col-span-8 p-5 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs uppercase font-bold text-emerald-800 block">Passed</span>
                  <span className="text-2xl font-black text-emerald-700">{report.passed_count}</span>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">Verified Clauses</span>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <span className="text-xs uppercase font-bold text-amber-800 block">Partial</span>
                  <span className="text-2xl font-black text-amber-700">{report.partial_count}</span>
                  <span className="text-[10px] text-amber-600 block mt-0.5">Incomplete Proof</span>
                </div>

                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                  <span className="text-xs uppercase font-bold text-rose-800 block">Missing</span>
                  <span className="text-2xl font-black text-rose-700">{report.missing_count}</span>
                  <span className="text-[10px] text-rose-600 block mt-0.5">Critical Gaps</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
                <strong>Audit Finding:</strong> {report.summary}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. PRODUCT & STANDARD INFORMATION */}
        {/* ========================================================================= */}
        <section aria-labelledby="specs-heading" className="space-y-4">
          <h2 id="specs-heading" className="text-sm font-extrabold text-bharat-900 uppercase tracking-wider">
            2. Product & Standard Specifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Product Card */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-800">
                <Box className="w-4 h-4 text-bharat-800" />
                Product Under Assessment
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Name</span>
                  <strong className="text-slate-900">{report.product.name}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Category</span>
                  <strong className="text-slate-900">{report.product.category}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Manufacturer</span>
                  <span className="text-slate-800">{report.product.manufacturer || 'Bharat Appliances Ltd'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Model</span>
                  <span className="text-slate-800 font-mono">{report.product.model_number || 'EWH-25L-2026'}</span>
                </div>
              </div>
              {report.product.technical_details && (
                <div className="pt-2 text-xs border-t border-slate-200 text-slate-600">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Technical Parameters</span>
                  {report.product.technical_details}
                </div>
              )}
            </div>

            {/* Standard Card */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/40 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-saffron-600" />
                Applicable Indian Standard
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Standard Number</span>
                  <strong className="text-slate-900 font-mono">{report.standard.standard_number}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Version / Edition</span>
                  <span className="text-slate-800">{report.standard.version || '2026'}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">Title</span>
                  <strong className="text-slate-900">{report.standard.title}</strong>
                </div>
              </div>
              {report.standard.scope && (
                <div className="pt-2 text-xs border-t border-slate-200 text-slate-600 line-clamp-2">
                  <span className="text-[10px] text-slate-400 block font-semibold uppercase">Scope</span>
                  {report.standard.scope}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. CLAUSE REQUIREMENT ASSESSMENTS TABLE */}
        {/* ========================================================================= */}
        <section aria-labelledby="assessments-heading" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 id="assessments-heading" className="text-sm font-extrabold text-bharat-900 uppercase tracking-wider">
              3. Clause-by-Clause Requirement Assessment ({report.assessments.length} Clauses)
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Weight Contribution Trace
            </span>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5 pl-4 w-20">Clause</th>
                    <th className="p-3.5 min-w-[180px]">Requirement Specification</th>
                    <th className="p-3.5 w-24 text-center">Status</th>
                    <th className="p-3.5 w-24 text-center">Confidence</th>
                    <th className="p-3.5 pr-4">Evidence Citation / Evaluation Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {report.assessments.map((item, idx) => {
                    const isPass = item.status === 'PASS';
                    const isPartial = item.status === 'PARTIAL';
                    const isMissing = item.status === 'MISSING';

                    return (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3.5 pl-4 font-mono font-bold text-slate-900 align-top">
                          {item.clause}
                        </td>
                        <td className="p-3.5 align-top">
                          <strong className="text-slate-900">{item.title}</strong>
                          <span className="block text-[11px] text-slate-400 mt-0.5">{item.category}</span>
                        </td>
                        <td className="p-3.5 text-center align-top">
                          {isPass && <Badge variant="success" size="sm">PASS</Badge>}
                          {isPartial && <Badge variant="warning" size="sm">PARTIAL</Badge>}
                          {isMissing && <Badge variant="danger" size="sm">MISSING</Badge>}
                        </td>
                        <td className="p-3.5 text-center align-top font-semibold text-slate-600">
                          {item.confidence}
                        </td>
                        <td className="p-3.5 pr-4 align-top text-slate-600 leading-relaxed">
                          {item.document_name ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-900 text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                                <FileText className="w-3 h-3 text-slate-500" />
                                {item.document_name} {item.page && `(Page ${item.page})`}
                              </span>
                              {item.snippet && (
                                <p className="text-[11px] italic text-slate-600">
                                  "{item.snippet}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <span>{item.reason || (isMissing ? 'No supporting evidence found.' : 'Verified conformity')}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5. COMPLIANCE GAPS REGISTER */}
        {/* ========================================================================= */}
        {report.gaps.length > 0 && (
          <section aria-labelledby="gaps-heading" className="space-y-4">
            <h2 id="gaps-heading" className="text-sm font-extrabold text-bharat-900 uppercase tracking-wider">
              4. Compliance Gaps & Non-Conformances ({report.gaps.length} Gaps)
            </h2>

            <div className="space-y-3">
              {report.gaps.map((gap, idx) => {
                const isCrit = gap.priority === 'CRITICAL';
                return (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border ${
                      isCrit
                        ? 'bg-rose-50/40 border-rose-200'
                        : 'bg-amber-50/40 border-amber-200'
                    } space-y-2 text-xs`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900">
                          Clause {gap.clause}
                        </span>
                        <span className="font-semibold text-slate-800">
                          {gap.requirement_title}
                        </span>
                      </div>
                      <Badge variant={isCrit ? 'danger' : 'warning'} size="sm">
                        {gap.priority}
                      </Badge>
                    </div>

                    <p className="text-slate-700 leading-relaxed">
                      <strong>Deficiency:</strong> {gap.problem}
                    </p>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 text-[11px]">
                      <strong className="text-slate-900">Recommended Action: </strong>
                      <span className="text-slate-700">{gap.recommended_action}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 6. ACTION PLAN */}
        {/* ========================================================================= */}
        {report.action_plan.length > 0 && (
          <section aria-labelledby="action-plan-heading" className="space-y-4">
            <h2 id="action-plan-heading" className="text-sm font-extrabold text-bharat-900 uppercase tracking-wider">
              5. Recommended Next Steps (Action Plan)
            </h2>

            <div className="space-y-3">
              {report.action_plan.map((act, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-start gap-3.5 text-xs"
                >
                  <div className="w-7 h-7 rounded-full bg-bharat-900 text-white font-bold flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900">{act.action}</h3>
                      <Badge variant={act.priority === 'CRITICAL' ? 'danger' : act.priority === 'HIGH' ? 'warning' : 'outline'} size="sm">
                        {act.priority}
                      </Badge>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{act.reason}</p>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      Target: {act.related_requirement}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 7. SOURCES & LINEAGE REFERENCES */}
        {/* ========================================================================= */}
        <section aria-labelledby="sources-heading" className="space-y-4">
          <h2 id="sources-heading" className="text-sm font-extrabold text-bharat-900 uppercase tracking-wider">
            6. Sources & Verification References
          </h2>

          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="p-3 pl-4 w-44">Source Type</th>
                  <th className="p-3">Reference Name</th>
                  <th className="p-3 pr-4">Details & Verification Lineage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {report.sources.map((s, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 pl-4 font-bold text-slate-800">
                      {s.source_type === 'OFFICIAL_STANDARD'
                        ? 'Official Standard'
                        : s.source_type === 'USER_DOCUMENT'
                        ? 'User Uploaded Document'
                        : 'Demo / Synthetic Data'}
                    </td>
                    <td className="p-3 font-semibold text-slate-900">{s.name}</td>
                    <td className="p-3 pr-4 text-slate-600">{s.details || s.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 8. ASSESSMENT VERSION HISTORY */}
        {/* ========================================================================= */}
        {report.history.length > 0 && (
          <section aria-labelledby="history-heading" className="space-y-3">
            <h2 id="history-heading" className="text-sm font-extrabold text-bharat-900 uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              Assessment History ({report.history.length} Versions)
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {report.history.map((h) => {
                const isCurrent = h.compliance_report_id === report.compliance_report_id;
                return (
                  <div
                    key={h.version}
                    className={`p-3.5 rounded-xl border ${
                      isCurrent
                        ? 'bg-bharat-50/60 border-bharat-300 ring-1 ring-bharat-300'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-800">Version {h.version}</span>
                      <span className="text-sm font-black text-slate-900">{h.readiness_score}%</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">
                      {new Date(h.generated_at).toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {h.passed_count} Pass • {h.missing_count} Missing
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ========================================================================= */}
        {/* 9. STATUTORY DISCLAIMER */}
        {/* ========================================================================= */}
        <footer className="pt-4 border-t border-slate-200">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px] text-slate-500">
              <strong className="text-slate-800">Important: </strong>
              {report.disclaimer}
            </p>
          </div>
        </footer>
      </article>
    </div>
  );
};
