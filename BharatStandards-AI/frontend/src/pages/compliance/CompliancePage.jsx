import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Clock,
  Sparkles,
  Box,
  Compass,
  FileText,
  Loader2,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  Info,
  Calendar,
} from 'lucide-react';
import { productService } from '@/services/productService';
import { standardService } from '@/services/standardService';
import { complianceService } from '@/services/complianceService';
import { useToast } from '@/components/ui/ToastContext';
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Skeleton,
} from '@/components/ui';

export const CompliancePage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [products, setProducts] = useState([]);
  const [standards, setStandards] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedStandardId, setSelectedStandardId] = useState('');
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [checkStep, setCheckStep] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [prodRes, stdRes, repRes] = await Promise.all([
        productService.getProducts().catch(() => ({ items: [] })),
        standardService.getStandards().catch(() => ({ items: [] })),
        complianceService.getReports().catch(() => []),
      ]);

      const prodItems = prodRes.items || [];
      const stdItems = stdRes.items || [];
      const repItems = Array.isArray(repRes) ? repRes : [];

      setProducts(prodItems);
      setStandards(stdItems);
      setReports(repItems);

      // Auto-select first product if available and not selected
      if (prodItems.length > 0 && !selectedProductId) {
        setSelectedProductId(String(prodItems[0].id));
      }

      // Auto-select DEMO-IS-001 or first standard
      if (stdItems.length > 0 && !selectedStandardId) {
        const demoStd = stdItems.find((s) => s.standard_number === 'DEMO-IS-001') || stdItems[0];
        setSelectedStandardId(String(demoStd.id));
      }
    } catch (err) {
      console.error('Error loading compliance workspace data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedProductId, selectedStandardId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRunCheck = async (e) => {
    e.preventDefault();
    if (!selectedProductId || !selectedStandardId) {
      addToast({
        type: 'warning',
        title: 'Selection Required',
        message: 'Please select both a Product and an Indian Standard to evaluate.',
      });
      return;
    }

    try {
      setIsRunningCheck(true);
      setCheckStep(1);

      await new Promise((r) => setTimeout(r, 500));
      setCheckStep(2);

      await new Promise((r) => setTimeout(r, 600));
      setCheckStep(3);

      const report = await complianceService.runCheck(selectedProductId, selectedStandardId);

      setCheckStep(4);
      await new Promise((r) => setTimeout(r, 400));

      addToast({
        type: 'success',
        title: 'Compliance Assessment Complete',
        message: `Readiness score computed at ${report.score}% with ${report.passed_count} PASS, ${report.partial_count} PARTIAL, and ${report.missing_count} MISSING clauses.`,
      });

      navigate(`/compliance/${report.id}`);
    } catch (err) {
      console.error('Compliance assessment failed:', err);
      addToast({
        type: 'error',
        title: 'Assessment Failed',
        message: err.message || 'Unable to execute compliance evaluation.',
      });
    } finally {
      setIsRunningCheck(false);
      setCheckStep(0);
    }
  };

  const selectedProduct = products.find((p) => String(p.id) === String(selectedProductId));
  const selectedStandard = standards.find((s) => String(s.id) === String(selectedStandardId));

  const totalReports = reports.length;
  const avgScore = totalReports > 0
    ? (reports.reduce((acc, r) => acc + (r.score || 0), 0) / totalReports).toFixed(1)
    : '—';
  const totalOpenGaps = reports.reduce((acc, r) => acc + (r.partial_count || 0) + (r.missing_count || 0), 0);

  return (
    <div className="space-y-8 text-left max-w-6xl mx-auto pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Compliance Readiness Engine
            </h1>
            <Badge variant="warning" size="sm" className="font-mono">
              DEMO / SYNTHETIC DATA
            </Badge>
            <Badge variant="outline" size="sm" className="font-mono text-[10px]">
              DETERMINISTIC CLAUSE EVALUATION
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Algorithmic, evidence-backed evaluation of product specifications and test reports against BIS Indian Standards requirements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="gap-1.5 text-xs font-semibold"
            startIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh Data
          </Button>
        </div>
      </div>

      {/* 2. Audit Initiation Hub (Product + Standard Selector & Run Trigger) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-bharat-700 dark:text-bharat-300" />
              <span>Initiate Compliance Audit</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Select a registered product and target standard to evaluate laboratory evidence.
            </p>
          </div>

          <div className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-bharat-600" />
            <span>AI-assisted readiness analysis • Not official BIS certification</span>
          </div>
        </div>

        <form onSubmit={handleRunCheck} className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
          {/* Product Dropdown (5 cols) */}
          <div className="md:col-span-5 space-y-1.5">
            <label htmlFor="comp-product-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Target Product
            </label>
            <select
              id="comp-product-select"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              disabled={isRunningCheck || products.length === 0}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-bharat-500 focus:outline-none"
            >
              {products.length === 0 ? (
                <option value="">No products available (Create one first)</option>
              ) : (
                products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.category})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Standard Dropdown (4 cols) */}
          <div className="md:col-span-4 space-y-1.5">
            <label htmlFor="comp-standard-select" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Indian Standard
            </label>
            <select
              id="comp-standard-select"
              value={selectedStandardId}
              onChange={(e) => setSelectedStandardId(e.target.value)}
              disabled={isRunningCheck || standards.length === 0}
              className="w-full text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-bharat-500 focus:outline-none"
            >
              {standards.length === 0 ? (
                <option value="">No standards loaded</option>
              ) : (
                standards.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.standard_number} — {s.title.substring(0, 32)}...
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Run Button (3 cols) */}
          <div className="md:col-span-3">
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isRunningCheck || products.length === 0}
              className="w-full gap-2 text-xs font-bold py-2.5 shadow-sm"
              startIcon={<ShieldCheck className={`w-4 h-4 ${isRunningCheck ? 'animate-spin' : ''}`} />}
            >
              {isRunningCheck ? 'Evaluating...' : 'Run Compliance Check'}
            </Button>
          </div>
        </form>

        {/* Progress Banner if In-Flight */}
        {isRunningCheck && (
          <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-900 dark:text-indigo-200 flex items-center gap-3">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-bold">
                {checkStep === 1 && '1/4: Retrieving product specifications and applicable standard requirements...'}
                {checkStep === 2 && '2/4: Loading technical dossiers and indexing document chunks...'}
                {checkStep === 3 && '3/4: Matching empirical evidence against clause limits (PASS / PARTIAL / MISSING)...'}
                {checkStep === 4 && '4/4: Calculating weighted readiness score and prioritizing gap action plan...'}
              </span>
              <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                Evaluating against {selectedStandard?.standard_number || 'Standard'} for {selectedProduct?.name || 'Product'}.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 3. Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Completed Assessments</span>
            <div className="text-2xl font-black text-slate-900 dark:text-white">{totalReports}</div>
            <p className="text-[11px] text-slate-400">Archived audit runs</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-bharat-50 dark:bg-bharat-950 border border-bharat-200 dark:border-bharat-800 text-bharat-700 dark:text-bharat-300 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Latest Readiness Score</span>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
              {reports.length > 0 ? `${reports[0].score}%` : '—'}
            </div>
            <p className="text-[11px] text-slate-400">Transparent clause weighting</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Open Gaps</span>
            <div className="text-2xl font-black text-rose-700 dark:text-rose-400">{totalOpenGaps}</div>
            <p className="text-[11px] text-slate-400">Action items requiring evidence</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. Assessment History / Previous Audits */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Assessment History & Audit Dossiers
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Review previously generated compliance assessments and trace empirical evidence.
            </p>
          </div>

          <span className="text-xs font-semibold text-slate-400">
            {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        ) : reports.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3">
            <ShieldCheck className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                No compliance assessments generated yet
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Select your product and applicable Indian Standard above, then click <strong>Run Compliance Check</strong> to compile your first audit readiness report.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((rep) => {
              const isHigh = rep.score >= 70;
              const isMedium = rep.score >= 40 && rep.score < 70;

              return (
                <div
                  key={rep.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-bharat-300 dark:hover:border-bharat-700 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-extrabold text-sm border ${
                        isHigh
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : isMedium
                          ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
                      }`}
                    >
                      {rep.score}%
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {rep.product_name || `Product #${rep.product_id}`}
                        </span>
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {rep.standard_number || `Standard #${rep.standard_id}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{rep.passed_count} PASS</span>
                        </span>
                        <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>{rep.partial_count} PARTIAL</span>
                        </span>
                        <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400 font-semibold">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>{rep.missing_count} MISSING</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(rep.created_at).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                    <Link to={`/compliance/${rep.id}`}>
                      <Button variant="outline" size="sm" className="text-xs font-semibold gap-1.5 py-1.5 px-3">
                        <span>View Audit Report</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
