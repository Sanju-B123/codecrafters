import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  BookOpen,
  FileText,
  CheckSquare,
  Layers,
  Activity,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  Clock,
  Sparkles,
  Server,
  Zap,
  UploadCloud,
  FileCheck,
  Flame,
} from 'lucide-react';
import { adminService } from '@/services/adminService';

export const AdminDashboardPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      const [m, h] = await Promise.all([adminService.getMetrics(), adminService.getHealth()]);
      setMetrics(m);
      setHealth(h);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      setError(err?.message || 'Failed to load administrative telemetry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <span className="text-sm font-medium">Aggregating platform telemetry...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
        <div className="flex items-center gap-2 font-bold mb-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Error loading administrative metrics</span>
        </div>
        <p className="text-sm mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-medium border border-rose-500/40"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const totals = metrics?.totals || {};
  const recent = metrics?.recent_7d || {};
  const daily = metrics?.daily_velocity || [];
  const topStandards = metrics?.top_standards || [];
  const topGaps = metrics?.top_gaps || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            OPERATIONAL CLEARANCE: ACTIVE
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            System Administration & Telemetry
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time platform overview, knowledge index integrity, and system health status.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-medium border border-slate-800 hover:border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Platform Accounts</span>
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totals.users || 0}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-indigo-400 font-semibold font-mono">{totals.admins || 0}</span> admins •{' '}
            <span className={totals.suspended_users > 0 ? 'text-amber-400' : 'text-slate-400'}>
              {totals.suspended_users || 0} suspended
            </span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Standards Knowledge Base</span>
            <BookOpen className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totals.standards || 0}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold font-mono">{totals.requirements || 0}</span> clauses •{' '}
            <span>{totals.archived_standards || 0} archived</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Compliance Reports</span>
            <CheckSquare className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totals.reports || 0}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>+{recent.new_reports || 0} generated this week</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-medium">Audit Trail Stream</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totals.audit_events || 0}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1.5">
            <span className="text-cyan-400 font-semibold font-mono">+{recent.audit_events || 0}</span> past 7 days
          </div>
        </div>
      </div>

      {/* AI Assistant Grounded RAG Telemetry Panel */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-saffron-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">AI Assistant & Grounded RAG Telemetry</h3>
              <p className="text-xs text-slate-400">Real-time retrieval audit, citation monitoring, and confidence distribution</p>
            </div>
          </div>
          <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            PROVENANCE: STRICT GROUNDING
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Requests Today</span>
            <div className="text-xl font-bold text-white font-mono">{metrics?.ai_analytics?.requests_today || 0}</div>
            <span className="text-[10px] text-slate-500 mt-1 block">Total: {metrics?.ai_analytics?.total_queries || 0} queries</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Avg Response Time</span>
            <div className="text-xl font-bold text-emerald-400 font-mono">
              {metrics?.ai_analytics?.avg_response_time_ms ? `${metrics.ai_analytics.avg_response_time_ms}ms` : '< 50ms'}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Hybrid search & reranking</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Low Confidence</span>
            <div className="text-xl font-bold text-amber-400 font-mono">{metrics?.ai_analytics?.low_confidence_responses || 0}</div>
            <span className="text-[10px] text-slate-500 mt-1 block">Grounded evidence warnings</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Retrieval Failures</span>
            <div className="text-xl font-bold text-indigo-400 font-mono">{metrics?.ai_analytics?.retrieval_failures || 0}</div>
            <span className="text-[10px] text-slate-500 mt-1 block">Zero candidate fallbacks</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">AI Service Errors</span>
            <div className="text-xl font-bold text-rose-400 font-mono">{metrics?.ai_analytics?.ai_errors || 0}</div>
            <span className="text-[10px] text-slate-500 mt-1 block">Safe defensive fallback</span>
          </div>
        </div>
      </div>

      {/* Compliance & Risk Intelligence Telemetry (Step 18) */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-500" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Compliance Intelligence & Product Risk Telemetry
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/10 text-rose-300 border border-rose-500/30">
              STEP 18
            </span>
          </div>
          <span className="text-xs text-slate-400">
            Total Audits Evaluated: <strong className="text-white font-mono">{metrics?.compliance_analytics?.total_evaluations || 0}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Avg Readiness Score</span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              {metrics?.compliance_analytics?.average_readiness_score || 0}%
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Cross-product average</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Avg Product Risk Score</span>
            <div className="text-2xl font-bold text-amber-400 font-mono">
              {metrics?.compliance_analytics?.average_risk_score || 0}/100
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">0-100 Risk scale</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Critical Gaps</span>
            <div className="text-2xl font-bold text-rose-400 font-mono">
              {metrics?.compliance_analytics?.critical_gaps_count || 0}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Requiring test proof</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">High Priority Gaps</span>
            <div className="text-2xl font-bold text-orange-400 font-mono">
              {metrics?.compliance_analytics?.high_gaps_count || 0}
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Deficient sub-clauses</span>
          </div>
        </div>

        {/* Most Common Failing Categories */}
        {metrics?.compliance_analytics?.common_failing_categories && metrics.compliance_analytics.common_failing_categories.length > 0 && (
          <div className="pt-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              Most Frequent Failing Requirement Categories
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {metrics.compliance_analytics.common_failing_categories.map((cat, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{cat.category}</span>
                  <span className="font-mono text-rose-400 font-bold">{cat.failure_count} gap(s)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* RAG Knowledge Index & Subsystem Diagnostic Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Knowledge Index Status */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
                RAG Vector Index Integrity
              </span>
              <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold text-white font-mono">{totals.indexed_items || 0}</span>
              <span className="text-xs text-slate-400">entities synchronized</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Standards and clauses mapped to the semantic embedding catalog for compliance retrieval and AI copilot queries.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-400">Pending Indexing: {totals.unindexed_items || 0}</span>
            <Link
              to="/admin/standards"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
            >
              Manage Registry <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Subsystem Health Snapshot */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-semibold">
              Live Subsystem Health
            </span>
            <Link
              to="/admin/health"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
            >
              Full Diagnostics <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {health?.subsystems &&
              Object.entries(health.subsystems).slice(0, 3).map(([name, sub]) => (
                <div key={name} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-slate-200 capitalize">
                      {name.replace(/_/g, ' ')}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        sub.status === 'HEALTHY' ? 'bg-emerald-400' : 'bg-amber-400'
                      }`}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {sub.details}
                  </div>
                  {sub.latency_ms !== undefined && sub.latency_ms > 0 && (
                    <div className="text-[10px] font-mono text-slate-400 mt-2">
                      Latency: {sub.latency_ms}ms
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* BIS Ingestion Pipeline & Quality Governance Quick Access */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/30 to-slate-900/80 border border-indigo-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-mono uppercase tracking-wider font-semibold">
                <UploadCloud className="w-4 h-4" />
                Knowledge Ingestion Pipeline
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                MULTI-FORMAT
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Ingest Standards & Clauses</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Load authorized BIS specifications (JSON, CSV, Markdown/Text) with strict schema validation, provenance tagging, deduplication, and zero-loss draft staging.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">Supported: JSON • CSV • Markdown</span>
            <Link
              to="/admin/knowledge/import"
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-lg shadow-indigo-600/20"
            >
              Open Ingestion <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-950/20 to-slate-900/80 border border-amber-500/20 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="inline-flex items-center gap-2 text-amber-400 text-xs font-mono uppercase tracking-wider font-semibold">
                <FileCheck className="w-4 h-4" />
                Human Review Inbox
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                GOVERNANCE GATE
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Draft Approval & Activation</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Review staged standards and clauses before publishing. Verification enforces verbatim text integrity and triggers atomic RAG vector index synchronization upon approval.
            </p>
          </div>
          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">Quality Assurance Workflow</span>
            <Link
              to="/admin/knowledge/review"
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-lg shadow-amber-600/20"
            >
              Review Drafts <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Daily Velocity Chart & Top Active Standards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Velocity */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">7-Day Activity Velocity</h2>
              <p className="text-xs text-slate-400">Events and compliance runs processed per day</p>
            </div>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {daily.map((item) => (
              <div key={item.date} className="flex items-center gap-4 text-xs">
                <span className="w-16 text-slate-400 font-mono">{item.label}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 bg-slate-800 rounded-full h-2.5 overflow-hidden flex">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, (item.events / 20) * 100)}%` }}
                    />
                  </div>
                  <span className="font-mono text-slate-300 w-12 text-right">
                    {item.events} ev
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Evaluated Standards */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">Most Evaluated Standards</h2>
              <p className="text-xs text-slate-400">Highest frequency compliance assessment targets</p>
            </div>
            <BookOpen className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-2.5">
            {topStandards.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No standard evaluations logged yet.</p>
            ) : (
              topStandards.map((std) => (
                <div
                  key={std.code}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition"
                >
                  <div className="min-w-0 pr-3">
                    <div className="text-xs font-mono font-bold text-indigo-300">{std.code}</div>
                    <div className="text-xs text-slate-400 truncate">{std.title}</div>
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-200 bg-slate-800/80 px-2.5 py-1 rounded-lg">
                    {std.evaluations} checks
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
