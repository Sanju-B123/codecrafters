import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Compass,
  Search,
  Filter,
  ArrowUpDown,
  ExternalLink,
  ChevronRight,
  Info,
  Sparkles,
  Calendar,
  Layers,
  FileCheck2,
  RefreshCw,
  Clock,
  Printer,
  X,
  AlertCircle,
  Bot,
  ArrowRight,
  Download,
  ShieldAlert,
  Sliders,
  Target,
  HelpCircle,
  Flame,
  ArrowUpRight,
  CheckSquare,
  Square,
} from 'lucide-react';
import { complianceService } from '@/services/complianceService';
import { reportService } from '@/services/reportService';
import { bisService } from '@/services/bisService';
import { ServiceCard } from '@/components/services/ServiceCard';
import { useToast } from '@/components/ui/ToastContext';

import {
  Button,
  Badge,
  StatusBadge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Dialog,
  Skeleton,
} from '@/components/ui';

export const ComplianceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter & Search state for requirements
  const [activeStatusFilter, setActiveStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('clause'); // 'clause' | 'status' | 'weight'

  // Selected requirement for detail inspection modal
  const [selectedResult, setSelectedResult] = useState(null);

  // Active view tab: 'REQUIREMENTS' | 'RISK_ANALYSIS' | 'WHAT_IF' | 'GAPS' | 'ACTION_PLAN'
  const [activeTab, setActiveTab] = useState('REQUIREMENTS');

  // Risk Engine & What-If state (Step 18)
  const [riskSummary, setRiskSummary] = useState(null);
  const [isRecalculatingRisk, setIsRecalculatingRisk] = useState(false);
  const [selectedRiskFactorItem, setSelectedRiskFactorItem] = useState(null);
  const [whatIfSelectedIds, setWhatIfSelectedIds] = useState([]);
  const [whatIfResult, setWhatIfResult] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Re-run state
  const [isReRunning, setIsReRunning] = useState(false);
  const [complianceServices, setComplianceServices] = useState(null);

  // Formal Report Dossier state
  const [dossierReport, setDossierReport] = useState(null);
  const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
  const [isDownloadingDossier, setIsDownloadingDossier] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await complianceService.getReport(id);
      setReport(data);

      try {
        const nextSteps = await bisService.getComplianceServices(id);
        setComplianceServices(nextSteps);
      } catch (svcErr) {
        console.warn('Failed to load compliance services:', svcErr);
      }

      // Step 18: Fetch explainable risk assessment summary
      try {
        const rSummary = await complianceService.getRiskSummary(id);
        setRiskSummary(rSummary);
      } catch (riskErr) {
        console.warn('Failed to load risk summary:', riskErr);
      }

      // Check if a formal report dossier already exists for this compliance check
      try {
        const repList = await reportService.getReports();
        const found = repList.find((r) => Number(r.compliance_report_id) === Number(id));
        if (found) {
          setDossierReport(found);
        }
      } catch (repErr) {
        console.warn('Failed to check existing dossier report:', repErr);
      }
    } catch (err) {
      console.error('Failed to load compliance report:', err);
      setError(err.message || 'Report not found or access denied.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleRecalculateRisk = async () => {
    try {
      setIsRecalculatingRisk(true);
      const res = await complianceService.recalculateRisk(id);
      setRiskSummary(res.risk_summary);
      addToast({
        type: 'success',
        title: 'Risk Engine Recalculated',
        message: `Updated risk score: ${res.risk_summary.overall_risk_score}/100 (${res.risk_summary.risk_level})`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Recalculation Failed',
        message: err.message || 'Could not recalculate risk.',
      });
    } finally {
      setIsRecalculatingRisk(false);
    }
  };

  const handleToggleWhatIfReq = (reqId) => {
    setWhatIfSelectedIds((prev) =>
      prev.includes(reqId) ? prev.filter((i) => i !== reqId) : [...prev, reqId]
    );
  };

  const handleSimulateWhatIf = async () => {
    if (whatIfSelectedIds.length === 0) {
      addToast({
        type: 'warning',
        title: 'Selection Required',
        message: 'Please select at least one requirement clause to simulate.',
      });
      return;
    }
    try {
      setIsSimulating(true);
      const sim = await complianceService.runWhatIf(id, whatIfSelectedIds);
      setWhatIfResult(sim);
      addToast({
        type: 'success',
        title: 'What-If Simulation Complete',
        message: `Projected readiness: ${sim.projected_score}% (+${sim.projected_score_delta}%), Risk: ${sim.projected_risk_score} (-${sim.projected_risk_delta})`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Simulation Failed',
        message: err.message || 'What-If analysis could not be calculated.',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!report) return;
    try {
      setIsGeneratingDossier(true);
      addToast({
        type: 'info',
        title: 'Generating Compliance Dossier',
        message: 'Compiling structured report with clauses, gaps, and action plan...',
      });
      const dossier = await reportService.generateReport(report.id);
      setDossierReport(dossier);
      addToast({
        type: 'success',
        title: 'Dossier Generated',
        message: `Report ${dossier.report_number} is ready for review and export.`,
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Generation Failed',
        message: err.message || 'Unable to generate compliance report dossier.',
      });
    } finally {
      setIsGeneratingDossier(false);
    }
  };

  const handleDownloadDossier = async () => {
    const rep = dossierReport;
    if (!rep) return;
    try {
      setIsDownloadingDossier(true);
      addToast({
        type: 'info',
        title: 'Preparing PDF Export',
        message: `Building vector PDF for ${rep.report_number}...`,
      });
      await reportService.downloadReport(rep.id, `${rep.report_number}.pdf`);
      addToast({
        type: 'success',
        title: 'Download Started',
        message: 'PDF Compliance Readiness Dossier downloaded successfully.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Download Failed',
        message: err.message || 'Could not download PDF report.',
      });
    } finally {
      setIsDownloadingDossier(false);
    }
  };


  const handleReRun = async () => {
    if (!report) return;
    try {
      setIsReRunning(true);
      addToast({
        type: 'info',
        title: 'Re-evaluating Compliance',
        message: 'Checking updated document vault evidence against standard requirements...',
      });

      const newReport = await complianceService.runCheck(report.product_id, report.standard_id);
      addToast({
        type: 'success',
        title: 'Assessment Updated',
        message: `New assessment generated with score ${newReport.score}%.`,
      });

      navigate(`/compliance/${newReport.id}`);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Re-run Failed',
        message: err.message || 'Unable to re-evaluate compliance.',
      });
    } finally {
      setIsReRunning(false);
    }
  };

  const parseEvidence = (evidenceStr) => {
    if (!evidenceStr) return null;
    try {
      return JSON.parse(evidenceStr);
    } catch (e) {
      return { snippet: evidenceStr };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Assessment Report Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The requested compliance report does not exist or you do not have permission to view it.
        </p>
        <Link to="/compliance">
          <Button variant="primary" size="sm" startIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Compliance Engine
          </Button>
        </Link>
      </div>
    );
  }

  const results = report.results || [];
  const gaps = report.gaps || [];

  // Filter and sort results
  const filteredResults = results
    .filter((r) => {
      if (activeStatusFilter !== 'ALL' && r.status !== activeStatusFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const reqTitle = r.requirement?.title?.toLowerCase() || '';
        const clause = r.requirement?.clause?.toLowerCase() || '';
        const reason = r.reason?.toLowerCase() || '';
        return reqTitle.includes(query) || clause.includes(query) || reason.includes(query);
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'status') {
        const order = { MISSING: 0, PARTIAL: 1, PASS: 2 };
        return order[a.status] - order[b.status];
      }
      if (sortBy === 'weight') {
        return (b.weight || 0) - (a.weight || 0);
      }
      // Natural clause sort
      const numA = parseFloat(a.requirement?.clause || '0');
      const numB = parseFloat(b.requirement?.clause || '0');
      return numA - numB;
    });

  // Gaps grouped by priority
  const criticalGaps = gaps.filter((g) => g.priority === 'CRITICAL');
  const highGaps = gaps.filter((g) => g.priority === 'HIGH');
  const mediumGaps = gaps.filter((g) => g.priority === 'MEDIUM');
  const lowGaps = gaps.filter((g) => g.priority === 'LOW');

  const parsedSelectedEvidence = selectedResult ? parseEvidence(selectedResult.evidence) : null;

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto pb-16">
      {/* 1. Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/compliance"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Compliance Engine</span>
        </Link>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Report Actions */}
          {dossierReport ? (
            <>
              <Link to={`/compliance/${report.id}/report`}>
                <Button
                  variant="primary"
                  size="sm"
                  className="gap-1.5 text-xs font-bold shadow-sm"
                  startIcon={<FileText className="w-3.5 h-3.5" />}
                >
                  View Report
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadDossier}
                loading={isDownloadingDossier}
                className="gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200"
                startIcon={<Download className="w-3.5 h-3.5 text-bharat-600" />}
              >
                Download PDF
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerateReport}
              loading={isGeneratingDossier}
              className="gap-1.5 text-xs font-bold shadow-sm"
              startIcon={<FileText className="w-3.5 h-3.5" />}
            >
              Generate Report
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleReRun}
            loading={isReRunning}
            className="gap-1.5 text-xs font-semibold"
            startIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Re-run Assessment
          </Button>

          {report && (
            <Link to={`/assistant/product/${report.product_id}`}>
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5 text-xs font-bold shadow-sm text-bharat-900 bg-bharat-50 hover:bg-bharat-100 border border-bharat-300 dark:bg-slate-800 dark:text-bharat-300 dark:border-slate-700"
                startIcon={<Bot className="w-3.5 h-3.5 text-bharat-700 dark:text-bharat-400" />}
              >
                Ask AI About This Report
              </Button>
            </Link>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
            startIcon={<Printer className="w-3.5 h-3.5" />}
          >
            Print Dossier
          </Button>
        </div>
      </div>

      {/* 2. Premium Report Header Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-extrabold uppercase tracking-wider text-bharat-800 dark:text-bharat-300">
                Compliance Readiness Assessment
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 uppercase">
                DEMO / SYNTHETIC DATA
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-900 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 uppercase font-mono">
                AI-ASSISTED READINESS ASSESSMENT
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {report.product_name || `Product #${report.product_id}`}
            </h1>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-bharat-700 dark:text-bharat-400" />
                <strong className="text-slate-700 dark:text-slate-300 font-mono">
                  {report.standard_number || `Standard #${report.standard_id}`}
                </strong>
                <span>({report.standard_title || 'Benchmark Standard'})</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Audited on {new Date(report.created_at).toLocaleDateString()}</span>
              </span>
            </div>
          </div>

          {/* Dual Readiness Score & Overall Risk Score Visualization */}
          <div className="flex flex-wrap items-center gap-4 self-start lg:self-center">
            {/* Readiness Score */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="text-right">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {report.score}%
                </div>
                <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Readiness Score
                </div>
              </div>

              <div className="relative w-14 h-14 rounded-full border-4 border-slate-200 dark:border-slate-700 flex items-center justify-center">
                <div
                  className="absolute inset-0 rounded-full border-4 border-emerald-500"
                  style={{
                    clipPath: `polygon(0 0, 100% 0, 100% ${report.score}%, 0 ${report.score}%)`,
                  }}
                />
                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 z-10 font-mono">
                  {report.score}%
                </span>
              </div>
            </div>

            {/* Overall Risk Score */}
            {riskSummary && (
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="text-right">
                  <div
                    className="text-2xl sm:text-3xl font-extrabold font-mono flex items-center justify-end gap-1"
                    style={{
                      color:
                        riskSummary.risk_level === 'CRITICAL'
                          ? '#e11d48'
                          : riskSummary.risk_level === 'HIGH'
                          ? '#ea580c'
                          : riskSummary.risk_level === 'MEDIUM'
                          ? '#d97706'
                          : '#059669',
                    }}
                  >
                    <span>{riskSummary.overall_risk_score}</span>
                    <span className="text-xs text-slate-400 font-normal">/100</span>
                  </div>
                  <div
                    className="text-[11px] font-bold flex items-center justify-end gap-1 uppercase tracking-wide"
                    style={{
                      color:
                        riskSummary.risk_level === 'CRITICAL'
                          ? '#e11d48'
                          : riskSummary.risk_level === 'HIGH'
                          ? '#ea580c'
                          : riskSummary.risk_level === 'MEDIUM'
                          ? '#d97706'
                          : '#059669',
                    }}
                  >
                    <Flame className="w-3 h-3" />
                    <span>{riskSummary.risk_level} RISK</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRecalculateRisk}
                  disabled={isRecalculatingRisk}
                  title="Recalculate Risk Assessment"
                  className="p-2 h-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRecalculatingRisk ? 'animate-spin text-bharat-700' : ''}`} />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Breakdown Badges (15 PASS, 3 PARTIAL, 2 MISSING) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-between">
            <div>
              <div className="font-bold text-emerald-900 dark:text-emerald-200 text-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{report.passed_count} PASS</span>
              </div>
              <p className="text-emerald-700 dark:text-emerald-400 text-[11px] mt-0.5">
                Substantiated by uploaded laboratory reports
              </p>
            </div>
            <span className="font-bold text-emerald-800 dark:text-emerald-300 text-lg font-mono">
              {Math.round((report.passed_count / report.total_requirements) * 100)}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between">
            <div>
              <div className="font-bold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{report.partial_count} PARTIAL</span>
              </div>
              <p className="text-amber-700 dark:text-amber-400 text-[11px] mt-0.5">
                Missing sub-clause verification or calibration
              </p>
            </div>
            <span className="font-bold text-amber-800 dark:text-amber-300 text-lg font-mono">
              {Math.round((report.partial_count / report.total_requirements) * 100)}%
            </span>
          </div>

          <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-center justify-between">
            <div>
              <div className="font-bold text-rose-900 dark:text-rose-200 text-sm flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>{report.missing_count} MISSING</span>
              </div>
              <p className="text-rose-700 dark:text-rose-400 text-[11px] mt-0.5">
                No matching test records detected
              </p>
            </div>
            <span className="font-bold text-rose-800 dark:text-rose-300 text-lg font-mono">
              {Math.round((report.missing_count / report.total_requirements) * 100)}%
            </span>
          </div>
        </div>

        {/* Scoring Methodology & Disclaimer Box */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 text-xs">
          <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
            <Info className="w-4 h-4 text-bharat-700 dark:text-bharat-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Scoring Methodology:</strong> {report.scoring_methodology}
            </div>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 pl-6 leading-relaxed">
            <strong>Statutory Notice:</strong> This is an AI-assisted compliance readiness assessment based on available product information, standards data and uploaded evidence. It does not constitute official BIS certification, legal advice, or an official conformity assessment.
          </div>
        </div>

        {/* Understand Your Assessment AI Card */}
        <div className="p-5 rounded-xl bg-gradient-to-r from-bharat-900 to-bharat-800 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[9px] font-extrabold uppercase bg-saffron-500/20 text-saffron-300 border border-saffron-500/30 tracking-wider">
                Explainable Audit AI
              </span>
              <span className="text-xs text-slate-300">• Grounded Gap Analysis</span>
            </div>
            <h4 className="text-base font-bold text-white tracking-tight">
              Understand Your Assessment
            </h4>
            <p className="text-xs text-slate-200/90 leading-relaxed">
              Ask BharatStandards AI to explain your {report.missing_count} missing requirements, recommend NABL test schedules, or clarify technical clause limits.
            </p>
          </div>

          <Link to={`/assistant/product/${report.product_id}`} className="flex-shrink-0">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white text-bharat-900 hover:bg-slate-100 font-bold text-xs gap-1.5 shadow-sm"
              startIcon={<Bot className="w-3.5 h-3.5 text-bharat-900" />}
              endIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Ask AI About This Report
            </Button>
          </Link>
        </div>
      </div>

      {/* 3. Interactive Section Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('REQUIREMENTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'REQUIREMENTS'
              ? 'bg-bharat-900 text-white dark:bg-bharat-700'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>Requirement Assessment ({results.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('RISK_ANALYSIS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'RISK_ANALYSIS'
              ? 'bg-bharat-900 text-white dark:bg-bharat-700'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Risk Prioritization</span>
          {riskSummary && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white"
              style={{
                backgroundColor:
                  riskSummary.risk_level === 'CRITICAL'
                    ? '#e11d48'
                    : riskSummary.risk_level === 'HIGH'
                    ? '#ea580c'
                    : riskSummary.risk_level === 'MEDIUM'
                    ? '#d97706'
                    : '#059669',
              }}
            >
              {riskSummary.overall_risk_score}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('WHAT_IF')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'WHAT_IF'
              ? 'bg-bharat-900 text-white dark:bg-bharat-700'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>What-If Simulator</span>
        </button>

        <button
          onClick={() => setActiveTab('GAPS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'GAPS'
              ? 'bg-bharat-900 text-white dark:bg-bharat-700'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Compliance Gaps ({gaps.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ACTION_PLAN')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'ACTION_PLAN'
              ? 'bg-bharat-900 text-white dark:bg-bharat-700'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Action Plan & Roadmap</span>
        </button>
      </div>

      {/* 4. Tab Content */}
      {activeTab === 'REQUIREMENTS' && (
        <div className="space-y-4">
          {/* Search, Filter Pills & Sort Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setActiveStatusFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeStatusFilter === 'ALL'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                All ({results.length})
              </button>
              <button
                onClick={() => setActiveStatusFilter('PASS')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeStatusFilter === 'PASS'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                PASS ({report.passed_count})
              </button>
              <button
                onClick={() => setActiveStatusFilter('PARTIAL')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeStatusFilter === 'PARTIAL'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                PARTIAL ({report.partial_count})
              </button>
              <button
                onClick={() => setActiveStatusFilter('MISSING')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeStatusFilter === 'MISSING'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300'
                }`}
              >
                MISSING ({report.missing_count})
              </button>
            </div>

            {/* Search & Sort Controls */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search clause or title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-bharat-500"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs bg-transparent border-none text-slate-700 dark:text-slate-300 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="clause">Sort: Clause Number</option>
                  <option value="status">Sort: Criticality (Missing first)</option>
                  <option value="weight">Sort: Weight Impact</option>
                </select>
              </div>
            </div>
          </div>

          {/* Requirements List Cards */}
          <div className="space-y-3">
            {filteredResults.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                No requirement clauses match the current filter.
              </div>
            ) : (
              filteredResults.map((r) => {
                const isPass = r.status === 'PASS';
                const isPartial = r.status === 'PARTIAL';
                const isMissing = r.status === 'MISSING';
                const evidenceObj = parseEvidence(r.evidence);

                return (
                  <div
                    key={r.id}
                    onClick={() => setSelectedResult(r)}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-bharat-300 dark:hover:border-bharat-700 transition-all cursor-pointer shadow-sm space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-bharat-900 dark:text-bharat-300">
                          Clause {r.requirement?.clause}
                        </span>

                        {isPass && <Badge variant="success" size="sm">PASS</Badge>}
                        {isPartial && <Badge variant="warning" size="sm">PARTIAL</Badge>}
                        {isMissing && <Badge variant="danger" size="sm">MISSING</Badge>}

                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                          {r.requirement?.category}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">
                          Weight: <strong>{r.weight}</strong>
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 text-bharat-700 dark:text-bharat-400">
                          <span>Inspect Evidence</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {r.requirement?.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {r.reason}
                    </p>

                    {evidenceObj && evidenceObj.document_name && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg">
                        <FileText className="w-3.5 h-3.5 text-bharat-700 flex-shrink-0" />
                        <span className="truncate">
                          Source: <strong>{evidenceObj.document_name}</strong>
                          {evidenceObj.page && ` (Page ${evidenceObj.page})`}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 5. Gaps Tab */}
      {activeTab === 'GAPS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800">
              <span className="text-[10px] font-bold uppercase text-rose-800 dark:text-rose-300 tracking-wider">Critical</span>
              <div className="text-2xl font-black text-rose-700 dark:text-rose-400 mt-0.5">{criticalGaps.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
              <span className="text-[10px] font-bold uppercase text-amber-800 dark:text-amber-300 tracking-wider">High</span>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400 mt-0.5">{highGaps.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
              <span className="text-[10px] font-bold uppercase text-indigo-800 dark:text-indigo-300 tracking-wider">Medium</span>
              <div className="text-2xl font-black text-indigo-700 dark:text-indigo-400 mt-0.5">{mediumGaps.length}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-700 dark:text-slate-300 tracking-wider">Low</span>
              <div className="text-2xl font-black text-slate-700 dark:text-slate-300 mt-0.5">{lowGaps.length}</div>
            </div>
          </div>

          <div className="space-y-3">
            {gaps.length === 0 ? (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                Congratulations! Zero non-conformance gaps detected.
              </div>
            ) : (
              gaps.map((gap) => {
                const isCrit = gap.priority === 'CRITICAL';
                const isHigh = gap.priority === 'HIGH';

                return (
                  <div
                    key={gap.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            isCrit
                              ? 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300'
                              : isHigh
                              ? 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-300 dark:bg-indigo-950 dark:text-indigo-300'
                          }`}
                        >
                          {gap.priority} PRIORITY GAP
                        </span>
                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                          Clause {gap.requirement?.clause}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {gap.requirement?.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {gap.description}
                    </p>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs space-y-1 border border-slate-100 dark:border-slate-800">
                      <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px] uppercase tracking-wider block">
                        Recommended Remediation
                      </span>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {gap.recommended_action}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 6. Action Plan Tab */}
      {activeTab === 'ACTION_PLAN' && (
        <div className="space-y-6">
          {/* Section: What Should I Do Next? */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  What Should I Do Next?
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Prioritized sequence of operational actions to resolve compliance deficiencies.
                </p>
              </div>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-saffron-50 text-saffron-700 border border-saffron-200">
                Action Plan
              </span>
            </div>

            <div className="space-y-3">
              {complianceServices?.prioritized_actions && complianceServices.prioritized_actions.length > 0 ? (
                complianceServices.prioritized_actions.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-bharat-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {act.label}
                          </h4>
                          {act.priority && (
                            <Badge
                              variant={act.priority === 'CRITICAL' ? 'danger' : act.priority === 'HIGH' ? 'warning' : 'outline'}
                              size="sm"
                            >
                              {act.priority}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {act.description}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(act.target)}
                      className="self-end sm:self-center inline-flex items-center gap-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-bharat-900 text-xs font-bold rounded-lg shadow-2xs transition-colors flex-shrink-0"
                    >
                      <span>Take Action</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-bharat-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">1</div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">1. Resolve missing evidence</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Acquire missing test proof from an accredited NABL testing facility.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-bharat-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">2</div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">2. Review partial requirements</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Collect component manufacturer certificates and calibration charts.</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-bharat-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">3</div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">3. Consult relevant official guidance</h4>
                      <p className="text-xs text-slate-600 mt-0.5">Review Scheme-I ISI mark procedural requirements.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Relevant Services & Guidance */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Relevant Services & Guidance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Statutory schemes and laboratory testing roadmaps matched to your assessment deficiencies.
                </p>
              </div>

              <Link to="/services">
                <Button variant="outline" size="sm" className="text-xs font-bold gap-1">
                  View All Services
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {complianceServices?.recommended_services && complianceServices.recommended_services.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {complianceServices.recommended_services.map((rec, idx) => (
                  <ServiceCard
                    key={idx}
                    service={rec.service}
                    matchReason={rec.match_reason}
                    priority={rec.priority}
                    suggestedActions={rec.suggested_actions}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 text-xs text-slate-500">
                Loading relevant guidance roadmaps...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5b. Risk Prioritization Tab */}
      {activeTab === 'RISK_ANALYSIS' && (
        <div className="space-y-6">
          {/* Statutory Risk Disclaimer Callout */}
          <div className="p-4 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong>BharatStandards AI Risk Classification - Not an official BIS risk rating.</strong>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                This is a compliance-readiness and decision-support system. It calculates an explainable 0–100 risk score
                combining requirement priority, compliance status, evidence availability, and confidence to help manufacturers
                prioritize testing and corrective actions before formal BIS laboratory audits.
              </p>
            </div>
          </div>

          {/* Risk Overview KPI Tiles */}
          {riskSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Overall Risk</span>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-white">
                    {riskSummary.overall_risk_score}
                  </span>
                  <Badge
                    variant={
                      riskSummary.risk_level === 'CRITICAL'
                        ? 'danger'
                        : riskSummary.risk_level === 'HIGH'
                        ? 'warning'
                        : 'outline'
                    }
                    size="sm"
                  >
                    {riskSummary.risk_level}
                  </Badge>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-1">
                <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 uppercase tracking-wider block">Critical Gaps</span>
                <div className="text-2xl font-extrabold font-mono text-rose-800 dark:text-rose-200">
                  {riskSummary.critical_count}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
                <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 uppercase tracking-wider block">High Priority</span>
                <div className="text-2xl font-extrabold font-mono text-amber-800 dark:text-amber-200">
                  {riskSummary.high_count}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Medium & Low</span>
                <div className="text-2xl font-extrabold font-mono text-slate-800 dark:text-slate-200">
                  {riskSummary.medium_count + riskSummary.low_count}
                </div>
              </div>
            </div>
          )}

          {/* Top 5 Compliance Risks */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-600" />
                  <span>Top Priority Compliance Risks</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Ranked by severity and potential impact on certification success.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalculateRisk}
                disabled={isRecalculatingRisk}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRecalculatingRisk ? 'animate-spin text-bharat-700' : ''}`} />
                <span>Recalculate Risk</span>
              </Button>
            </div>

            {riskSummary && riskSummary.top_risks && riskSummary.top_risks.length > 0 ? (
              <div className="space-y-3">
                {riskSummary.top_risks.map((tr, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          Clause {tr.clause}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                          {tr.title}
                        </h4>
                        <Badge
                          variant={
                            tr.risk_level === 'CRITICAL'
                              ? 'danger'
                              : tr.risk_level === 'HIGH'
                              ? 'warning'
                              : 'outline'
                          }
                          size="sm"
                        >
                          {tr.risk_level} RISK ({tr.risk_score})
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        <strong className="text-slate-700 dark:text-slate-200">Why this is serious:</strong> {tr.reason}
                      </p>
                      <p className="text-xs text-bharat-700 dark:text-bharat-400">
                        <strong>Recommended Action:</strong> {tr.recommended_action}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedRiskFactorItem(tr)}
                        className="text-xs gap-1"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-bharat-700" />
                        <span>Why this score?</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 text-xs">
                No high-priority risks detected. All assessed requirements meet passing thresholds.
              </div>
            )}
          </div>

          {/* Assessment Priority Matrix (Action Plan) */}
          {riskSummary && riskSummary.recommended_actions && riskSummary.recommended_actions.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  <span>Assessment Priority Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Remediation actions sorted by projected risk reduction points.
                </p>
              </div>

              <div className="space-y-3">
                {riskSummary.recommended_actions.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-bharat-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5 font-mono">
                        {idx + 1}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {act.action}
                          </h4>
                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            Clause {act.clause}
                          </span>
                          <Badge
                            variant={
                              act.priority === 'CRITICAL'
                                ? 'danger'
                                : act.priority === 'HIGH'
                                ? 'warning'
                                : 'outline'
                            }
                            size="sm"
                          >
                            {act.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                          {act.reason}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 self-end sm:self-center">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Risk Reduction</span>
                      <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                        -{act.risk_reduction_potential} pts
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5c. What-If Scenario Simulator Tab */}
      {activeTab === 'WHAT_IF' && (
        <div className="space-y-6">
          {/* Header Explanation Banner */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <div className="flex items-center gap-2">
              <Sliders className="w-5 h-5 text-bharat-700 dark:text-bharat-400" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Interactive What-If Simulation Engine
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Select one or more open requirements below to simulate achieving full compliance (PASS).
              The simulator uses the identical formula as the core engine to project score uplift and risk reduction
              <strong> without mutating database records</strong>.
            </p>
          </div>

          {/* Simulation Outcome KPI Cards */}
          {whatIfResult && (
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">Projected Assessment Outcome</h4>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                  Simulation Active
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Readiness Uplift */}
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Projected Readiness</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-emerald-400">
                      {whatIfResult.projected_score}%
                    </span>
                    <span className="text-xs text-emerald-300 font-bold">
                      (+{whatIfResult.projected_score_delta}%)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Current: {whatIfResult.original_score}%
                  </span>
                </div>

                {/* Risk Reduction */}
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Projected Risk Score</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-white">
                      {whatIfResult.projected_risk_score}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold">
                      (-{whatIfResult.projected_risk_delta} pts)
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Current: {whatIfResult.original_risk_score} ({whatIfResult.original_risk_level})
                  </span>
                </div>

                {/* New Risk Level */}
                <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700 space-y-1">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Projected Risk Tier</span>
                  <div className="text-2xl font-extrabold font-mono text-emerald-300">
                    {whatIfResult.projected_risk_level} RISK
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    {whatIfResult.remaining_gaps.length} remaining open gap(s)
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Requirements Selector Checklist */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Select Requirements to Simulate Resolving (to PASS)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {whatIfSelectedIds.length} requirement(s) selected
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const nonPass = results.filter((r) => r.status !== 'PASS').map((r) => r.requirement_id);
                    setWhatIfSelectedIds(nonPass);
                  }}
                  className="text-xs"
                >
                  Select All Open Gaps
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWhatIfSelectedIds([])}
                  className="text-xs"
                >
                  Clear
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSimulateWhatIf}
                  disabled={isSimulating || whatIfSelectedIds.length === 0}
                  className="text-xs font-bold gap-1.5"
                >
                  <Sliders className={`w-3.5 h-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                  <span>{isSimulating ? 'Simulating...' : 'Simulate Resolution'}</span>
                </Button>
              </div>
            </div>

            <div className="space-y-2.5">
              {results.filter((r) => r.status !== 'PASS').map((res) => {
                const isSelected = whatIfSelectedIds.includes(res.requirement_id);
                return (
                  <div
                    key={res.id}
                    onClick={() => handleToggleWhatIfReq(res.requirement_id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                        : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 text-emerald-600 dark:text-emerald-400">
                        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-extrabold px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                            Clause {res.requirement?.clause || 'N/A'}
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {res.requirement?.title}
                          </span>
                          <StatusBadge status={res.status} size="sm" />
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Weight: {res.weight} pts • {res.reason}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Status</span>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {res.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Remaining Gaps Register (if simulated) */}
          {whatIfResult && whatIfResult.remaining_gaps && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Projected Remaining Deficiencies ({whatIfResult.remaining_gaps.length})
              </h4>
              {whatIfResult.remaining_gaps.length === 0 ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                  All identified compliance gaps would be resolved under this scenario! Projected readiness is 100%.
                </div>
              ) : (
                <div className="space-y-2">
                  {whatIfResult.remaining_gaps.map((rg, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                            Clause {rg.clause}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {rg.title}
                          </span>
                          <Badge variant={rg.priority === 'CRITICAL' ? 'danger' : 'warning'} size="sm">
                            {rg.priority}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-500">{rg.problem}</p>
                      </div>
                      <span className="text-rose-600 font-mono font-bold text-xs">
                        Risk: {rg.risk_score}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}


      {/* 7. Requirement Detail Modal / Inspection Drawer */}
      <Dialog
        open={!!selectedResult}
        onClose={() => setSelectedResult(null)}
        title={selectedResult ? `Clause ${selectedResult.requirement?.clause}: ${selectedResult.requirement?.title}` : ''}
        description="Comprehensive evaluation details, empirical evidence citation, and remediation guidance."
        maxWidth="max-w-2xl"
      >
        {selectedResult && (
          <div className="space-y-4 text-xs">
            {/* Status Header */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Evaluation Status</span>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedResult.status} size="md" />
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600 dark:text-slate-300 font-semibold">
                    Confidence: <strong>{selectedResult.confidence}</strong>
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clause Weight</span>
                <div className="font-mono text-sm font-bold text-slate-800 dark:text-slate-200">
                  {selectedResult.weight} pts
                </div>
              </div>
            </div>

            {/* Requirement Description */}
            <div className="space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                Standard Clause Specification
              </span>
              <p className="text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800 leading-relaxed">
                {selectedResult.requirement?.description}
              </p>
            </div>

            {/* Empirical Evidence Citation */}
            <div className="space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                Evidence & Source Citation
              </span>
              <div className="bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                {parsedSelectedEvidence ? (
                  <>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-semibold">
                      <FileText className="w-3.5 h-3.5 text-bharat-700" />
                      <span>{parsedSelectedEvidence.document_name || 'Source unavailable'}</span>
                      {parsedSelectedEvidence.page && (
                        <span className="text-slate-400 font-normal">
                          • Page {parsedSelectedEvidence.page}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 leading-relaxed whitespace-pre-wrap">
                      {parsedSelectedEvidence.snippet || 'No excerpt available.'}
                    </p>
                  </>
                ) : (
                  <p className="text-slate-400 italic">Source unavailable.</p>
                )}
              </div>
            </div>

            {/* Evaluation Reason */}
            <div className="space-y-1">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider">
                Auditor Rationale
              </span>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedResult.reason}
              </p>
            </div>

            {/* Recommended Action */}
            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl space-y-1">
              <span className="font-bold text-amber-900 dark:text-amber-300 uppercase text-[10px] tracking-wider block">
                Recommended Action
              </span>
              <p className="text-amber-800 dark:text-amber-200 leading-relaxed">
                {selectedResult.recommended_action}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedResult(null)}>
                Close Details
              </Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* 8. Risk Factor Decomposition Modal ("Why this score?") */}
      <Dialog
        open={!!selectedRiskFactorItem}
        onClose={() => setSelectedRiskFactorItem(null)}
        title={selectedRiskFactorItem ? `Risk Factor Analysis: Clause ${selectedRiskFactorItem.clause}` : ''}
        description="Transparent mathematical breakdown of factor contributions calculating this 0–100 risk score."
        maxWidth="max-w-2xl"
      >
        {selectedRiskFactorItem && (
          <div className="space-y-5 text-xs">
            {/* Header Score Banner */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Clause Title</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedRiskFactorItem.title}
                </h4>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Risk Score</span>
                <div className="text-xl font-extrabold font-mono text-rose-600 flex items-center justify-end gap-1">
                  <span>{selectedRiskFactorItem.risk_score}</span>
                  <span className="text-xs font-normal text-slate-400">/100</span>
                </div>
              </div>
            </div>

            {/* Factor Decomposition Breakdown Table */}
            <div className="space-y-2">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider block">
                Factor Contribution Breakdown
              </span>
              <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] uppercase tracking-wider font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Factor Type</th>
                      <th className="py-2.5 px-3">Evaluated State</th>
                      <th className="py-2.5 px-3 text-right">Weight</th>
                      <th className="py-2.5 px-3 text-right">Contribution</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                    {selectedRiskFactorItem.factors && selectedRiskFactorItem.factors.map((fac, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {fac.factor_type.replace(/_/g, ' ')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {fac.factor_value}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                          {Math.round(fac.weight * 100)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                          +{fac.contribution} pts
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Evaluation Reasons */}
            <div className="space-y-1.5">
              <span className="font-bold text-slate-700 dark:text-slate-300 uppercase text-[10px] tracking-wider block">
                Deficiency Reasons
              </span>
              <ul className="space-y-1 bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                {selectedRiskFactorItem.reasons && selectedRiskFactorItem.reasons.map((r, i) => (
                  <li key={i} className="text-slate-700 dark:text-slate-300 flex items-start gap-2">
                    <span className="text-rose-500 font-bold">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommended Remediation Action */}
            <div className="p-3.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-1">
              <span className="font-bold text-emerald-900 dark:text-emerald-300 uppercase text-[10px] tracking-wider block">
                Mitigation Recommendation
              </span>
              <p className="text-emerald-800 dark:text-emerald-200 leading-relaxed">
                {selectedRiskFactorItem.recommended_action}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedRiskFactorItem(null)}>
                Close Breakdown
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
