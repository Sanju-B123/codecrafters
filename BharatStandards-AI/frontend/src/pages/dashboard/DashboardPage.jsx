import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Compass,
  FileText,
  ArrowRight,
  TrendingUp,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Bot,
  Layers,
  ChevronRight,
  Sparkles,
  Zap,
  Calendar,
  Download,
  Flame,
} from 'lucide-react';
import { DEMO_WATER_HEATER_STATS } from '@/constants';
import { useAuth } from '@/context/AuthContext';
import { productService } from '@/services/productService';
import { complianceService } from '@/services/complianceService';
import { reportService } from '@/services/reportService';
import { activityService } from '@/services/activityService';
import {
  Button,
  Badge,
  StatusBadge,
  StatCard,
  Progress,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui';
import { OnboardingModal } from '@/components/onboarding/OnboardingModal';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [productCount, setProductCount] = useState(null);
  const [complianceStats, setComplianceStats] = useState({
    reportsCount: null,
    latestScore: null,
    totalGaps: null,
    latestRiskScore: null,
    latestRiskLevel: null,
    criticalRisksCount: 0,
  });

  const [recentReports, setRecentReports] = useState([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [downloadingReportId, setDownloadingReportId] = useState(null);
  const [liveActivities, setLiveActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    let isMounted = true;
    productService
      .getProducts()
      .then((res) => {
        if (isMounted) {
          setProductCount(res?.total ?? (res?.items ? res.items.length : 0));
        }
      })
      .catch((err) => {
        console.warn('Could not load user product count for dashboard:', err);
        if (isMounted) setProductCount(0);
      });

    complianceService
      .getReports()
      .then((reps) => {
        if (isMounted && Array.isArray(reps)) {
          const totalGaps = reps.reduce((acc, r) => acc + (r.partial_count || 0) + (r.missing_count || 0), 0);
          const latestScore = reps.length > 0 ? reps[0].score : null;
          const latestRiskScore = reps.length > 0 ? (reps[0].overall_risk_score ?? null) : null;
          const latestRiskLevel = reps.length > 0 ? (reps[0].risk_level ?? 'LOW') : null;
          const criticalRisksCount = reps.filter((r) => r.risk_level === 'CRITICAL').length;
          setComplianceStats({
            reportsCount: reps.length,
            latestScore,
            totalGaps,
            latestRiskScore,
            latestRiskLevel,
            criticalRisksCount,
          });
        }
      })
      .catch((err) => {
        console.warn('Could not load compliance stats for dashboard:', err);
      });

    reportService
      .getReports()
      .then((data) => {
        if (isMounted && Array.isArray(data)) {
          setRecentReports(data.slice(0, 3));
        }
      })
      .catch((err) => {
        console.warn('Could not load reports for dashboard:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingReports(false);
      });

    activityService
      .getActivity({ limit: 5 })
      .then((res) => {
        if (isMounted && res && res.items && res.items.length > 0) {
          setLiveActivities(res.items);
        }
      })
      .catch((err) => {
        console.warn('Could not load live activities:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingActivities(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleDownloadPdf = async (e, report) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      setDownloadingReportId(report.id);
      await reportService.downloadReport(report.id, `${report.report_number}.pdf`);
    } catch (err) {
      console.error('Failed to download PDF report:', err);
    } finally {
      setDownloadingReportId(null);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const recentActivities = [
    {
      id: 1,
      title: 'Product analyzed',
      description: 'Electric Water Heater evaluated against Indian Standard DEMO-IS-001.',
      timestamp: '2 hours ago',
      badgeStatus: 'COMPLETED',
      badgeLabel: 'ANALYZED',
      icon: Box,
      target: '/products',
    },
    {
      id: 2,
      title: 'Document processed',
      description: 'NABL Lab Test Report #TR-2026-0882 parsed with 12 technical parameters.',
      timestamp: '4 hours ago',
      badgeStatus: 'PASS',
      badgeLabel: 'PARSED',
      icon: FileText,
      target: '/documents',
    },
    {
      id: 3,
      title: 'Compliance report generated',
      description: 'Clause-by-clause audit dossier compiled with 78% readiness score.',
      timestamp: 'Yesterday at 5:30 PM',
      badgeStatus: 'PROCESSING',
      badgeLabel: 'GENERATED',
      icon: FileCheck2,
      target: '/compliance',
    },
    {
      id: 4,
      title: 'Standards mapped',
      description: 'Quality Control Order (QCO) cross-referenced with Scheme-I requirements.',
      timestamp: '2 days ago',
      badgeStatus: 'COMPLETED',
      badgeLabel: 'INDEXED',
      icon: Compass,
      target: '/standards',
    },
  ];

  const recommendedActions = [
    {
      id: 1,
      title: 'Review 2 missing requirements',
      description: 'Clause 19.1 bilingual rating plate proof and Clause 11.4 sensor calibration data require attention before submittal.',
      priority: 'HIGH',
      buttonText: 'Review Gaps',
      target: '/compliance',
    },
    {
      id: 2,
      title: 'Upload NABL Test Evidence',
      description: 'Upload laboratory test reports to the Document Vault for automated clause extraction and compliance auditing.',
      priority: 'MEDIUM',
      buttonText: 'Open Vault',
      target: '/documents',
    },
    {
      id: 3,
      title: 'Prepare Manak Online Submittal Pack',
      description: 'Assemble Scheme-I (ISI Mark) application documents once critical gap resolution reaches 90% conformance.',
      priority: 'LOW',
      buttonText: 'View Checklist',
      target: '/services',
    },
  ];

  return (
    <div className="space-y-8 text-left">
      {/* 1. Header Section: Time-aware greeting & subtext */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {getGreeting()}
            {user?.name ? `, ${user.name}` : ''}!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Your standards & compliance workspace • Real-time BIS readiness pipeline
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsTourOpen(true)}
            className="gap-1.5 text-xs font-semibold"
            startIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
          >
            Guided Tour
          </Button>
          <Link to="/products/new">
            <Button
              variant="primary"
              size="md"
              className="gap-2 shadow-sm text-xs font-bold"
              endIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Analyze New Product
            </Button>
          </Link>
        </div>
      </section>

      {/* 2. Key Stats (5 StatCards including Compliance Risk) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Products"
          value={productCount !== null ? String(productCount) : '—'}
          subtitle="Under active evaluation"
          icon={<Box className="w-5 h-5 text-bharat-700 dark:text-bharat-300" />}
        />
        <StatCard
          title="Standards Found"
          value="3"
          subtitle="1 Primary, 2 Secondary"
          icon={<Compass className="w-5 h-5 text-saffron-600 dark:text-saffron-400" />}
        />
        <StatCard
          title="Compliance Reports"
          value={complianceStats.reportsCount !== null ? String(complianceStats.reportsCount) : '1'}
          subtitle={complianceStats.latestScore !== null ? `Latest: ${complianceStats.latestScore}% Ready` : 'Audit Dossier Ready'}
          icon={<FileCheck2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
        />
        <StatCard
          title="Compliance Risk"
          value={complianceStats.latestRiskScore !== null ? `${complianceStats.latestRiskScore}/100` : '—'}
          subtitle={complianceStats.latestRiskLevel ? `${complianceStats.latestRiskLevel} Tier` : '0-100 Risk Score'}
          icon={<Flame className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
          trend={complianceStats.criticalRisksCount > 0 ? 'down' : 'up'}
          trendLabel={complianceStats.criticalRisksCount > 0 ? `${complianceStats.criticalRisksCount} CRITICAL` : 'LOW RISK'}
        />
        <StatCard
          title="Open Gaps"
          value={complianceStats.totalGaps !== null ? String(complianceStats.totalGaps) : '2'}
          subtitle="Requires evidence"
          icon={<AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
          trend="down"
          trendLabel={complianceStats.totalGaps !== null ? `${complianceStats.totalGaps} IDENTIFIED` : '2 GAPS'}
        />
      </section>

      {/* 3. MAIN FEATURE: Continue your compliance journey */}
      <section className="relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-bharat-50/50 dark:bg-bharat-950/20 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10">
          {/* Header Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-bharat-700 dark:text-bharat-400 uppercase tracking-wider">
                  Active Compliance Journey
                </span>
                <Badge variant="warning" size="sm">
                  DEMO DATA
                </Badge>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Continue your compliance journey.
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                Target Product:{' '}
                <strong className="text-slate-900 dark:text-white">
                  {DEMO_WATER_HEATER_STATS.productName}
                </strong>{' '}
                • Applicable Standard:{' '}
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {DEMO_WATER_HEATER_STATS.standardNumber}
                </span>{' '}
                (Stationary Storage Type Electric Water Heaters)
              </p>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              <Link to="/compliance">
                <Button
                  size="md"
                  variant="primary"
                  className="shadow-sm gap-2 text-xs font-bold"
                  endIcon={<ArrowRight className="w-4 h-4" />}
                >
                  View Compliance Report
                </Button>
              </Link>
            </div>
          </div>

          {/* Readiness Gauge & Segmented Metrics */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Overall Score widget */}
            <div className="lg:col-span-4 p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Compliance Readiness
                  </span>
                  <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                    {DEMO_WATER_HEATER_STATS.readinessScore}%
                  </div>
                </div>
                <div className="w-14 h-14 rounded-full border-4 border-emerald-500/30 border-t-emerald-600 flex items-center justify-center font-bold text-emerald-700 dark:text-emerald-400 text-sm shadow-sm">
                  {DEMO_WATER_HEATER_STATS.readinessScore}%
                </div>
              </div>

              {/* Multi-segment progress bar */}
              <Progress
                value={DEMO_WATER_HEATER_STATS.readinessScore}
                max={100}
                size="md"
                segments={[
                  { value: 75, className: 'bg-emerald-500', title: '15 Passed Requirements' },
                  { value: 15, className: 'bg-amber-400', title: '3 Partial Requirements' },
                  { value: 10, className: 'bg-rose-500', title: '2 Missing Requirements' },
                ]}
              />
              <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex justify-between font-medium">
                <span>15 of 20 Clauses Met</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">Action Required</span>
              </div>
            </div>

            {/* 3 Metric Cards: PASS, PARTIAL, MISSING */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* PASS */}
              <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                    Conforming
                  </span>
                  <StatusBadge status="PASS" size="sm" showIcon={false} />
                </div>
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                  {DEMO_WATER_HEATER_STATS.passCount} PASS
                </div>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-1 leading-snug">
                  Validated against laboratory test report evidence.
                </p>
              </div>

              {/* PARTIAL */}
              <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                    Review Needed
                  </span>
                  <StatusBadge status="PARTIAL" size="sm" showIcon={false} />
                </div>
                <div className="text-2xl font-black text-amber-700 dark:text-amber-400">
                  {DEMO_WATER_HEATER_STATS.partialCount} PARTIAL
                </div>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-1 leading-snug">
                  Requires calibration certificate or updated parameter.
                </p>
              </div>

              {/* MISSING */}
              <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                    Critical Gap
                  </span>
                  <StatusBadge status="MISSING" size="sm" showIcon={false} />
                </div>
                <div className="text-2xl font-black text-rose-700 dark:text-rose-400">
                  {DEMO_WATER_HEATER_STATS.missingCount} MISSING
                </div>
                <p className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mt-1 leading-snug">
                  Bilingual rating plate & sensor logs absent.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ask BharatStandards AI Featured Banner */}
      <section className="rounded-2xl bg-gradient-to-r from-bharat-900 to-bharat-800 text-white p-6 sm:p-7 shadow-md relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 text-left">
        <div className="space-y-2 max-w-2xl relative z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-saffron-500/20 text-saffron-300 border border-saffron-500/30 tracking-wider">
              AI Standards Copilot
            </span>
            <span className="text-xs text-slate-300">• Evidence-Grounded</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Ask BharatStandards AI
          </h3>
          <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed">
            Have a question about your standards, testing parameters, or compliance gaps? Our AI assistant provides evidence-grounded answers cited directly from Indian Standards and your uploaded lab reports.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10 flex-shrink-0">
          <Link to="/assistant">
            <Button
              variant="secondary"
              size="md"
              className="bg-white text-bharat-900 hover:bg-slate-100 font-bold text-xs gap-2 shadow-sm"
              startIcon={<Bot className="w-4 h-4 text-bharat-900" />}
              endIcon={<ArrowRight className="w-4 h-4" />}
            >
              Ask AI
            </Button>
          </Link>
        </div>
      </section>

      {/* 3.5 BIS Services & Guided Journey Banners */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Continue Your Journey Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-saffron-500 animate-pulse"></span>
              <span className="text-[11px] font-bold text-saffron-600 dark:text-saffron-400 uppercase tracking-wider">
                Guided Action Plan
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Continue Your Journey
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              2 compliance gaps need attention. Address hydrostatic pressure test and thermal cut-off evidence to progress toward Scheme-I licensing conformance.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/compliance">
              <Button
                variant="primary"
                size="sm"
                className="gap-2 text-xs font-bold"
                endIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View Action Plan
              </Button>
            </Link>
          </div>
        </div>

        {/* Explore BIS Guidance Card */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-bharat-700"></span>
              <span className="text-[11px] font-bold text-bharat-700 dark:text-bharat-300 uppercase tracking-wider">
                Statutory Roadmap
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Explore BIS Guidance
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Browse structured roadmaps for Scheme-I ISI Mark Certification, Electronics Compulsory Registration (CRS), and NABL laboratory testing.
            </p>
          </div>
          <div className="pt-2">
            <Link to="/services">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs font-bold"
                endIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                View Services
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3.8 Recent Compliance Reports Section */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-bharat-700 dark:text-bharat-400" />
              <span>Recent Compliance Reports</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Audit summaries and verified readiness dossiers generated from evidence extraction.
            </p>
          </div>
          <Link to="/reports">
            <Button variant="ghost" size="sm" className="text-xs font-semibold gap-1 text-bharat-700 dark:text-bharat-300">
              <span>View All Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {loadingReports ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-36 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="h-36 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="h-36 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        ) : recentReports.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentReports.map((rep) => (
              <div
                key={rep.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-bharat-300 dark:hover:border-slate-700 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      {rep.report_number}
                    </span>
                    <Badge
                      variant={rep.readiness_score >= 70 ? 'success' : 'warning'}
                      size="sm"
                      className="font-mono font-bold"
                    >
                      {rep.readiness_score}% READY
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-bharat-700 dark:group-hover:text-bharat-300 transition-colors line-clamp-1">
                      {rep.product_name || 'Product Assessment'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 font-medium">
                      {rep.standard_number} • {rep.standard_title}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(rep.generated_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                      {rep.passed_count} PASS
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Link to={`/reports/${rep.id}`} className="flex-1">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full text-xs font-bold gap-1.5 shadow-xs"
                      startIcon={<FileText className="w-3.5 h-3.5" />}
                    >
                      View Report
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleDownloadPdf(e, rep)}
                    loading={downloadingReportId === rep.id}
                    className="text-xs font-semibold px-2.5 text-slate-700 dark:text-slate-200"
                    title="Download Vector PDF Dossier"
                  >
                    <Download className="w-3.5 h-3.5 text-bharat-600" />
                    <span>PDF</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
            <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Reports Compiled Yet</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Run compliance readiness audits from the Compliance Engine to generate formal PDF dossiers.
              </p>
            </div>
            <Link to="/compliance">
              <Button variant="outline" size="sm" className="text-xs font-semibold mt-2">
                Open Compliance Engine
              </Button>
            </Link>
          </div>
        )}
      </section>

      {/* 4. Two-Column Grid: Recent Activity & Recommended Actions */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Activity (7 cols) */}
        <div className="lg:col-span-7 space-y-4">

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Recent Activity
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Audit trail updated in real time
              </span>
            </div>
            <Link
              to="/activity"
              className="text-xs font-semibold text-bharat-600 dark:text-bharat-400 hover:text-bharat-700 dark:hover:text-bharat-300 flex items-center gap-1 transition-colors"
            >
              <span>View All Activity</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <Card>
            <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
              {liveActivities.length > 0 ? (
                liveActivities.map((act) => {
                  let Icon = History;
                  let badgeStatus = 'NEUTRAL';
                  let target = '/activity';

                  if (act.action.includes('COMPLIANCE')) {
                    Icon = CheckCircle2;
                    badgeStatus = act.action.includes('COMPLETED') ? 'COMPLETED' : 'PROCESSING';
                    if (act.entity_id) target = `/compliance/${act.entity_id}`;
                  } else if (act.action.includes('DOCUMENT')) {
                    Icon = FileText;
                    badgeStatus = act.action.includes('PROCESSED') ? 'PASS' : 'PROCESSING';
                    target = '/documents';
                  } else if (act.action.includes('REPORT')) {
                    Icon = FileCheck2;
                    badgeStatus = 'COMPLETED';
                    if (act.entity_id) target = `/reports/${act.entity_id}`;
                  } else if (act.action.includes('PRODUCT')) {
                    Icon = Box;
                    badgeStatus = 'COMPLETED';
                    if (act.entity_id && act.action !== 'PRODUCT_DELETED') target = `/products/${act.entity_id}`;
                  } else if (act.action.includes('AI')) {
                    Icon = Bot;
                    badgeStatus = 'NEUTRAL';
                    target = '/assistant';
                  }

                  const timeStr = new Date(act.created_at).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <Link key={act.id} to={target} className="block">
                      <div className="p-4 sm:p-5 flex items-start gap-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-bharat-700 dark:text-bharat-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-4 h-4" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                              {act.action.replace('_', ' ')}
                            </h4>
                            <StatusBadge
                              status={badgeStatus}
                              label={act.entity_type || 'SYSTEM'}
                              size="sm"
                              showIcon={false}
                            />
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                            {act.description}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5 font-medium">
                            <Clock className="w-3 h-3" />
                            <span>{timeStr} • {new Date(act.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })
              ) : (
                recentActivities.map((act) => {
                  const Icon = act.icon;
                  const content = (
                    <div
                      key={act.id}
                      className="p-4 sm:p-5 flex items-start gap-3.5 hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                    >
                      <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-bharat-700 dark:text-bharat-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                            {act.title}
                          </h4>
                          <StatusBadge
                            status={act.badgeStatus}
                            label={act.badgeLabel}
                            size="sm"
                            showIcon={false}
                          />
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                          {act.description}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1.5 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{act.timestamp}</span>
                        </div>
                      </div>
                    </div>
                  );

                  return act.target ? (
                    <Link key={act.id} to={act.target} className="block">
                      {content}
                    </Link>
                  ) : (
                    content
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Recommended Actions (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Recommended Actions
            </h3>
            <Badge variant="primary" size="sm">
              3 PENDING
            </Badge>
          </div>

          <div className="space-y-3">
            {recommendedActions.map((action) => (
              <Card key={action.id} hover className="border-l-4 border-l-bharat-600">
                <CardContent className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {action.title}
                    </h4>
                    <StatusBadge status={action.priority} size="sm" />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {action.description}
                  </p>
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 font-medium">
                      Estimated: 15 mins
                    </span>
                    <Link to={action.target}>
                      <Button
                        size="xs"
                        variant="secondary"
                        className="gap-1 font-semibold text-xs text-bharat-800 dark:text-bharat-300"
                        endIcon={<ChevronRight className="w-3.5 h-3.5" />}
                      >
                        {action.buttonText}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <OnboardingModal isOpen={isTourOpen} onClose={() => setIsTourOpen(false)} />
    </div>
  );
};
