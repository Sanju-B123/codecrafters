import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  CheckCircle2,
  XCircle,
  Archive,
  RefreshCw,
  Search,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  Upload,
  CheckSquare,
  Globe,
  Database,
  Tag,
} from 'lucide-react';
import { knowledgeService } from '@/services/knowledgeService';

export const AdminKnowledgePage = () => {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [provenanceFilter, setProvenanceFilter] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    entityType: null,
    entityId: null,
    identifier: '',
    reason: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [recRes, healthRes] = await Promise.all([
        knowledgeService.getRecords({
          status: statusFilter || undefined,
          source_type: provenanceFilter || undefined,
          entity_type: entityTypeFilter || undefined,
          search: searchQuery || undefined,
          limit: 100,
        }),
        knowledgeService.getHealth(),
      ]);
      setRecords(recRes.items || []);
      setTotal(recRes.total || 0);
      setHealth(healthRes);
    } catch (err) {
      console.error('Failed to load knowledge records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, provenanceFilter, entityTypeFilter]);

  const showToast = (msg, isError = false) => {
    setToastMessage({ text: msg, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleApprove = async (entityType, id, identifier) => {
    try {
      setActionLoadingId(`${entityType}-${id}`);
      const res = await knowledgeService.approveEntity(entityType.toLowerCase(), id);
      showToast(res.message || `Approved ${identifier}`);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to approve record', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleArchive = async (entityType, id, identifier) => {
    if (!window.confirm(`Archive ${identifier}? This removes it from active RAG retrieval.`)) return;
    try {
      setActionLoadingId(`${entityType}-${id}`);
      const res = await knowledgeService.archiveEntity(entityType.toLowerCase(), id);
      showToast(res.message || `Archived ${identifier}`);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to archive record', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReindex = async (entityType, id, identifier) => {
    try {
      setActionLoadingId(`${entityType}-${id}`);
      const res = await knowledgeService.reindexEntity(entityType.toLowerCase(), id);
      showToast(res.message || `Reindexed ${identifier}`);
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to reindex record', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReindexAll = async () => {
    if (!window.confirm('Trigger full re-indexing of all active standards & requirements into vector store?')) return;
    try {
      setActionLoadingId('reindex-all');
      const res = await knowledgeService.reindexAll();
      showToast(res.message || 'Full re-indexing completed successfully');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Full re-indexing failed', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const confirmReject = async () => {
    const { entityType, entityId, identifier, reason } = rejectModal;
    try {
      setActionLoadingId(`${entityType}-${entityId}`);
      const res = await knowledgeService.rejectEntity(entityType.toLowerCase(), entityId, reason);
      showToast(res.message || `Rejected ${identifier}`);
      setRejectModal({ isOpen: false, entityType: null, entityId: null, identifier: '', reason: '' });
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to reject record', true);
    } finally {
      setActionLoadingId(null);
    }
  };

  const getProvenanceBadge = (type) => {
    const t = String(type || '').toUpperCase();
    if (t.includes('DEMO') || t.includes('SYNTHETIC')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800 uppercase">
          DEMO / SYNTHETIC
        </span>
      );
    }
    if (t.includes('USER')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/60 text-purple-300 border border-purple-800 uppercase">
          USER PROVIDED
        </span>
      );
    }
    if (t.includes('AI')) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950/60 text-cyan-300 border border-cyan-800 uppercase">
          AI GENERATED
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800 uppercase">
        VERIFIED
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    switch (s) {
      case 'ACTIVE':
      case 'APPROVED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-900/60 text-emerald-300 border border-emerald-700">APPROVED</span>;
      case 'DRAFT':
      case 'PENDING_REVIEW':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/60 text-amber-300 border border-amber-700">PENDING REVIEW</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-900/60 text-rose-300 border border-rose-700">REJECTED</span>;
      case 'ARCHIVED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">ARCHIVED</span>;
      case 'DEMO':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-900/60 text-indigo-300 border border-indigo-700">DEMO BENCHMARK</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">{s}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-left">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-xl text-xs font-semibold flex items-center gap-2 ${
            toastMessage.isError
              ? 'bg-rose-950/90 text-rose-200 border-rose-800'
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
          }`}
        >
          {toastMessage.isError ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header with Nav Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Knowledge Base Governance & Provenance
            </h1>
            <span className="px-2 py-0.5 rounded bg-indigo-950/80 border border-indigo-800 text-indigo-300 text-[10px] font-mono">
              Admin Portal
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Curate Indian Standards records, inspect authority & provenance, manage lifecycle reviews, and synchronize vector search indices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/admin/knowledge/import"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Knowledge</span>
          </Link>
          <Link
            to="/admin/knowledge/review"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5 text-amber-400" />
            <span>Drafts Review ({health?.pending_review_count || 0})</span>
          </Link>
          <Link
            to="/admin/knowledge/sources"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Authoritative Sources</span>
          </Link>
          <button
            type="button"
            onClick={handleReindexAll}
            disabled={actionLoadingId === 'reindex-all'}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
            title="Synchronize all records to vector store"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${actionLoadingId === 'reindex-all' ? 'animate-spin' : ''}`} />
            <span>Re-index All</span>
          </button>
        </div>
      </div>

      {/* Telemetry Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Knowledge Items</span>
            <Database className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">{total}</p>
          <span className="text-[11px] text-slate-500">
            {health?.active_standards || 0} Standards • {health?.active_requirements || 0} Clauses
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Verified Sources</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400 mt-1.5">{health?.verified_sources || 0}</p>
          <span className="text-[11px] text-slate-500">
            Authoritative BIS & Gazette Portals
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-1.5">{health?.pending_review_count || 0}</p>
          <span className="text-[11px] text-slate-500">
            Staged Drafts & Stale Entries
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Data Quality Score</span>
            <Sparkles className="w-4 h-4 text-saffron-400" />
          </div>
          <p className="text-2xl font-bold text-white mt-1.5">{health?.quality_score || 0}%</p>
          <span className="text-[11px] text-slate-500">
            Metadata Richness & Completeness
          </span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            placeholder="Search code, title, or clause..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE / APPROVED</option>
            <option value="PENDING_REVIEW">PENDING REVIEW</option>
            <option value="DRAFT">DRAFT</option>
            <option value="REJECTED">REJECTED</option>
            <option value="ARCHIVED">ARCHIVED</option>
            <option value="DEMO">DEMO BENCHMARK</option>
          </select>

          {/* Provenance Filter */}
          <select
            value={provenanceFilter}
            onChange={(e) => setProvenanceFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Provenance</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="DEMO/SYNTHETIC">DEMO / SYNTHETIC</option>
            <option value="USER PROVIDED">USER PROVIDED</option>
            <option value="AI GENERATED">AI GENERATED</option>
          </select>

          {/* Entity Type Filter */}
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Entity Types</option>
            <option value="STANDARD">Standards</option>
            <option value="REQUIREMENT">Requirements / Clauses</option>
          </select>

          <button
            type="button"
            onClick={loadData}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
            <p>Loading curated knowledge records...</p>
          </div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-3">
            <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="font-semibold text-slate-300">No knowledge records match the current filter criteria.</p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('');
                setProvenanceFilter('');
                setEntityTypeFilter('');
                setSearchQuery('');
              }}
              className="text-xs text-indigo-400 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Entity & Code</th>
                  <th className="px-4 py-3">Title & Authority</th>
                  <th className="px-4 py-3">Lifecycle Status</th>
                  <th className="px-4 py-3">Provenance</th>
                  <th className="px-4 py-3">Version / Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {records.map((rec) => {
                  const actionKey = `${rec.entity_type}-${rec.id}`;
                  const isBusy = actionLoadingId === actionKey;
                  return (
                    <tr key={`${rec.entity_type}-${rec.id}`} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold ${
                              rec.entity_type === 'STANDARD'
                                ? 'bg-blue-950 text-blue-300 border border-blue-800'
                                : 'bg-purple-950 text-purple-300 border border-purple-800'
                            }`}
                          >
                            {rec.entity_type}
                          </span>
                          <span className="font-mono font-bold text-white">{rec.code}</span>
                        </div>
                        {rec.category && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            Category: {rec.category}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-medium text-slate-200 truncate" title={rec.title}>
                          {rec.title}
                        </p>
                        <span className="text-[10px] text-slate-400 block truncate" title={rec.source}>
                          Source: {rec.source || 'BIS Specification'}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        {getStatusBadge(rec.status)}
                      </td>

                      <td className="px-4 py-3">
                        {getProvenanceBadge(rec.source_type)}
                      </td>

                      <td className="px-4 py-3 font-mono text-[11px] text-slate-400">
                        <div>v{rec.version || '1.0'}</div>
                        {rec.last_verified_date && (
                          <div className="text-[10px] text-slate-500">
                            {new Date(rec.last_verified_date).toLocaleDateString()}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Approve Action */}
                          {rec.status !== 'ACTIVE' && rec.status !== 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => handleApprove(rec.entity_type, rec.id, rec.code)}
                              disabled={isBusy}
                              className="px-2 py-1 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 text-emerald-300 text-[10px] font-semibold transition-colors disabled:opacity-50"
                              title="Approve and activate for RAG"
                            >
                              Approve
                            </button>
                          )}

                          {/* Reject Action */}
                          {rec.status !== 'REJECTED' && rec.status !== 'ARCHIVED' && (
                            <button
                              type="button"
                              onClick={() =>
                                setRejectModal({
                                  isOpen: true,
                                  entityType: rec.entity_type,
                                  entityId: rec.id,
                                  identifier: rec.code,
                                  reason: '',
                                })
                              }
                              disabled={isBusy}
                              className="px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 text-[10px] font-semibold transition-colors disabled:opacity-50"
                              title="Reject record"
                            >
                              Reject
                            </button>
                          )}

                          {/* Archive Action */}
                          {rec.status !== 'ARCHIVED' && (
                            <button
                              type="button"
                              onClick={() => handleArchive(rec.entity_type, rec.id, rec.code)}
                              disabled={isBusy}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-[10px] font-semibold transition-colors disabled:opacity-50"
                              title="Archive and exclude from search"
                            >
                              Archive
                            </button>
                          )}

                          {/* Re-index Action */}
                          <button
                            type="button"
                            onClick={() => handleReindex(rec.entity_type, rec.id, rec.code)}
                            disabled={isBusy}
                            className="p-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors disabled:opacity-50"
                            title="Re-index embedding in vector store"
                          >
                            <RefreshCw className={`w-3 h-3 ${isBusy ? 'animate-spin text-indigo-400' : ''}`} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Reject Knowledge Record</span>
              </h3>
              <button
                type="button"
                onClick={() => setRejectModal({ isOpen: false, entityType: null, entityId: null, identifier: '', reason: '' })}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Please provide a clear governance audit reason for rejecting record{' '}
              <strong className="text-white font-mono">{rejectModal.identifier}</strong>:
            </p>

            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal((prev) => ({ ...prev, reason: e.target.value }))}
              placeholder="E.g., Outdated gazette revision, unverified test values, non-standard clause formatting..."
              rows={3}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500 resize-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModal({ isOpen: false, entityType: null, entityId: null, identifier: '', reason: '' })}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmReject}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs text-white font-semibold shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminKnowledgePage;
