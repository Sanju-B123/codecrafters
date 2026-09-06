import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  ChevronRight,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Box,
  FileText,
  Bot,
  User,
  Settings,
  Lock,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { activityService } from '@/services/activityService';
import { Badge } from '@/components/ui';

export const ActivityPage = () => {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedLogId, setExpandedLogId] = useState(null);

  const categories = [
    { id: 'ALL', label: 'All Activities', icon: Layers },
    { id: 'COMPLIANCE', label: 'Compliance Audits', icon: CheckCircle2, entityType: 'compliance_report' },
    { id: 'DOCUMENT', label: 'Documents', icon: FileText, entityType: 'document' },
    { id: 'REPORT', label: 'Reports & Export', icon: FileCheck2, entityType: 'report' },
    { id: 'PRODUCT', label: 'Products', icon: Box, entityType: 'product' },
    { id: 'AI', label: 'AI Assistant', icon: Bot, entityType: 'conversation' },
    { id: 'ACCOUNT', label: 'Security & Account', icon: Lock, entityType: 'user' },
  ];

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const activeCat = categories.find((c) => c.id === selectedCategory);
      const params = {
        page,
        limit: 20,
        search: searchQuery.trim() || undefined,
        start_date: startDate ? new Date(startDate).toISOString() : undefined,
        end_date: endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined,
        entity_type: activeCat?.entityType || undefined,
      };

      const res = await activityService.getActivity(params);
      setLogs(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.pages || 1);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, selectedCategory, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  // Group logs by Date (Today, Yesterday, Date string)
  const groupedLogs = useMemo(() => {
    const groups = {};
    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    logs.forEach((log) => {
      const date = new Date(log.created_at);
      const dateStr = date.toDateString();
      let label = date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });

      if (dateStr === todayStr) {
        label = 'Today';
      } else if (dateStr === yesterdayStr) {
        label = 'Yesterday';
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(log);
    });

    return groups;
  }, [logs]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'PRODUCT_CREATED':
      case 'DOCUMENT_PROCESSED':
      case 'COMPLIANCE_COMPLETED':
      case 'REPORT_GENERATED':
        return { variant: 'success', text: action.replace('_', ' ') };
      case 'COMPLIANCE_STARTED':
      case 'DOCUMENT_UPLOADED':
      case 'SERVICE_VIEWED':
      case 'REPORT_DOWNLOADED':
        return { variant: 'primary', text: action.replace('_', ' ') };
      case 'AI_QUERY':
        return { variant: 'neutral', text: 'AI STANDARDS QUERY' };
      case 'PRODUCT_DELETED':
      case 'DOCUMENT_DELETED':
      case 'DOCUMENT_FAILED':
        return { variant: 'danger', text: action.replace('_', ' ') };
      case 'LOGIN':
      case 'LOGOUT':
      case 'REGISTER':
      case 'PASSWORD_CHANGED':
      case 'SETTINGS_UPDATED':
      case 'PROFILE_UPDATED':
        return { variant: 'warning', text: action.replace('_', ' ') };
      default:
        return { variant: 'neutral', text: action.replace('_', ' ') };
    }
  };

  const getActionIcon = (action, entityType) => {
    if (action.includes('COMPLIANCE')) return CheckCircle2;
    if (action.includes('DOCUMENT')) return FileText;
    if (action.includes('REPORT')) return FileCheck2;
    if (action.includes('PRODUCT')) return Box;
    if (action.includes('AI')) return Bot;
    if (action.includes('PASSWORD') || action.includes('LOGIN')) return Lock;
    return History;
  };

  const getEntityRoute = (log) => {
    if (log.entity_type === 'compliance_report' && log.entity_id) {
      return `/compliance/${log.entity_id}`;
    }
    if (log.entity_type === 'report' && log.entity_id) {
      return `/reports/${log.entity_id}`;
    }
    if (log.entity_type === 'document') {
      return '/documents';
    }
    if (log.entity_type === 'product' && log.entity_id && log.action !== 'PRODUCT_DELETED') {
      return `/products/${log.entity_id}`;
    }
    if (log.entity_type === 'service') {
      return '/services';
    }
    return null;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-left">
      {/* Top Banner & Title */}
      <div className="bg-gradient-to-br from-slate-900 via-bharat-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-bharat-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-saffron-500/20 text-saffron-400 border border-saffron-500/30">
                <History className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-widest text-saffron-400">
                Enterprise Audit Trail
              </span>
              <Badge variant="neutral" size="sm" className="bg-slate-800 text-slate-300 border-slate-700">
                Immutable Log
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Activity Timeline & Audit Trail
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Traceable, tamper-resistant record of compliance evaluations, document intelligence processing,
              report generations, and user actions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchLogs}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Log</span>
            </button>
          </div>
        </div>

        {/* Quick Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-3.5 border border-slate-800/60">
            <div className="text-[11px] text-slate-400 font-medium">Total Events Recorded</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">{total}</div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-3.5 border border-slate-800/60">
            <div className="text-[11px] text-slate-400 font-medium">Compliance Assessments</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              {logs.filter((l) => l.action.includes('COMPLIANCE')).length}
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-3.5 border border-slate-800/60">
            <div className="text-[11px] text-slate-400 font-medium">Documents Ingested</div>
            <div className="text-xl sm:text-2xl font-black text-blue-400 mt-1">
              {logs.filter((l) => l.action.includes('DOCUMENT')).length}
            </div>
          </div>
          <div className="bg-slate-900/60 backdrop-blur rounded-2xl p-3.5 border border-slate-800/60">
            <div className="text-[11px] text-slate-400 font-medium">Security & Config</div>
            <div className="text-xl sm:text-2xl font-black text-saffron-400 mt-1">
              {logs.filter((l) => l.action === 'LOGIN' || l.action.includes('SETTINGS') || l.action.includes('PASSWORD')).length}
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const active = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.id);
                setPage(1);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                active
                  ? 'bg-bharat-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Bar: Search + Dates */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity description, filenames, clauses..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-bharat-500"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none text-xs"
              title="Filter from date"
            />
          </div>
          <span className="text-slate-400 text-xs">to</span>
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none text-xs"
              title="Filter to date"
            />
          </div>

          {(searchQuery || startDate || endDate || selectedCategory !== 'ALL') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Timeline Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-bharat-500 animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading audit records...</p>
          </div>
        ) : Object.keys(groupedLogs).length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <History className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No activity records found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              No audit records matched your active criteria. Try adjusting your date range or search query.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-bharat-600 hover:underline"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedLogs).map(([groupLabel, items]) => (
              <div key={groupLabel} className="space-y-4">
                {/* Date Group Header */}
                <div className="sticky top-16 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur py-1.5 flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    {groupLabel}
                  </span>
                  <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
                  <span className="text-[11px] text-slate-400 font-mono">
                    {items.length} {items.length === 1 ? 'event' : 'events'}
                  </span>
                </div>

                {/* Timeline Items */}
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
                  {items.map((log) => {
                    const Icon = getActionIcon(log.action, log.entity_type);
                    const badge = getActionBadge(log.action);
                    const route = getEntityRoute(log);
                    const isExpanded = expandedLogId === log.id;
                    const hasMetadata = log.metadata && Object.keys(log.metadata).length > 0;

                    return (
                      <div key={log.id} className="relative group">
                        {/* Node Marker */}
                        <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-bharat-500 dark:border-bharat-400 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-bharat-600" />
                        </div>

                        {/* Card Content */}
                        <div className="bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 transition-all">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge variant={badge.variant} size="sm">
                                {badge.text}
                              </Badge>
                              {log.entity_type && (
                                <span className="text-[11px] font-mono text-slate-400 uppercase">
                                  #{log.entity_type}
                                  {log.entity_id ? `:${log.entity_id}` : ''}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>
                                {new Date(log.created_at).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white mt-2 leading-relaxed">
                            {log.description}
                          </p>

                          {/* Footer Actions & Metadata inspection */}
                          <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                              {log.ip_address && (
                                <span className="font-mono bg-slate-200/60 dark:bg-slate-700/60 px-2 py-0.5 rounded">
                                  IP: {log.ip_address}
                                </span>
                              )}
                              {hasMetadata && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                  className="text-bharat-600 dark:text-bharat-400 hover:underline flex items-center gap-1 font-semibold"
                                >
                                  <span>{isExpanded ? 'Hide Details' : 'View Audit Details'}</span>
                                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                </button>
                              )}
                            </div>

                            {route && (
                              <Link
                                to={route}
                                className="inline-flex items-center gap-1 text-bharat-600 dark:text-bharat-400 hover:text-bharat-700 font-semibold transition-colors"
                              >
                                <span>Navigate to record</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>

                          {/* Expandable JSON Metadata Inspector */}
                          {isExpanded && hasMetadata && (
                            <div className="mt-3 p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-700">
                              <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Page {page} of {totalPages} ({total} total actions)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityPage;
