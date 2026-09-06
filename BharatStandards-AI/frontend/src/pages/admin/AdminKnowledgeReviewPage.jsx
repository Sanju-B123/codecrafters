import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  Archive,
  RefreshCw,
  Search,
  Layers,
  BookOpen,
  CheckSquare,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Sparkles,
  Info,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { knowledgeService } from '@/services/knowledgeService';

export const AdminKnowledgeReviewPage = () => {
  const [activeTab, setActiveTab] = useState('standards'); // 'standards' | 'requirements'
  const [drafts, setDrafts] = useState({ total_drafts: 0, standards: [], requirements: [] });
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
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
      const [draftsRes, healthRes] = await Promise.all([
        knowledgeService.getDraftsInbox(),
        knowledgeService.getHealth(),
      ]);
      setDrafts(draftsRes);
      setHealth(healthRes);
    } catch (err) {
      console.error('Failed to load draft review inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (entityType, id, identifier) => {
    try {
      setActionLoadingId(`${entityType}_${id}`);
      const res = await knowledgeService.approveEntity(entityType, id);
      setToastMessage({
        type: 'success',
        text: res.message || `${identifier} approved and queued for RAG indexing!`,
      });
      await loadData();
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err?.message || 'Approval failed.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenReject = (entityType, id, identifier) => {
    setRejectModal({
      isOpen: true,
      entityType,
      entityId: id,
      identifier,
      reason: '',
    });
  };

  const handleConfirmReject = async () => {
    const { entityType, entityId, identifier, reason } = rejectModal;
    try {
      setActionLoadingId(`${entityType}_${entityId}`);
      setRejectModal({ ...rejectModal, isOpen: false });
      const res = await knowledgeService.rejectEntity(entityType, entityId, reason);
      setToastMessage({
        type: 'info',
        text: res.message || `${identifier} marked as REJECTED.`,
      });
      await loadData();
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err?.message || 'Rejection failed.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleArchive = async (entityType, id, identifier) => {
    try {
      setActionLoadingId(`${entityType}_${id}`);
      const res = await knowledgeService.archiveEntity(entityType, id);
      setToastMessage({
        type: 'info',
        text: res.message || `${identifier} archived and excluded from active search.`,
      });
      await loadData();
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err?.message || 'Archival failed.',
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredStandards = (drafts.standards || []).filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.standard_number?.toLowerCase().includes(q) ||
      s.title?.toLowerCase().includes(q) ||
      s.category?.toLowerCase().includes(q)
    );
  });

  const filteredRequirements = (drafts.requirements || []).filter((r) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.clause?.toLowerCase().includes(q) ||
      r.title?.toLowerCase().includes(q) ||
      r.standard_number?.toLowerCase().includes(q) ||
      r.description?.toLowerCase().includes(q)
    );
  });

  const getProvenanceBadge = (type) => {
    const norm = (type || 'DEMO').toUpperCase();
    if (norm === 'OFFICIAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3" /> OFFICIAL
        </span>
      );
    }
    if (norm === 'USER_PROVIDED') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          USER PROVIDED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
        DEMO / SYNTHETIC
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Knowledge Review & Draft Staging Inbox
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Human Review Required
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Authoritative human-in-the-loop review of newly ingested standards and requirements before activation and RAG indexing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-750 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/admin/knowledge/import"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-sm border border-slate-700 transition"
          >
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Ingestion Pipeline</span>
          </Link>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : toastMessage.type === 'error'
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Health & Data Quality Telemetry Cards */}
      {health && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Data Quality Score</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {health.quality_score}%
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Weighted completeness metric
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Standards Overview</span>
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {health.active_standards}{' '}
              <span className="text-xs font-normal text-slate-400">/ {health.total_standards}</span>
            </div>
            <div className="text-[11px] text-amber-400 mt-1 font-medium">
              {health.draft_standards} draft awaiting review
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Clause Requirements</span>
              <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {health.active_requirements}{' '}
              <span className="text-xs font-normal text-slate-400">/ {health.total_requirements}</span>
            </div>
            <div className="text-[11px] text-amber-400 mt-1 font-medium">
              {health.draft_requirements} draft awaiting review
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Verified Sources</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-white mt-1">
              {health.verified_sources}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {health.demo_sources} demo, {health.user_provided_sources} user
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 col-span-2 lg:col-span-1">
            <div className="text-xs text-slate-400 flex items-center justify-between">
              <span>Pending Review</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
              {health.pending_review_count}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Threshold: &gt;{health.last_review_threshold_days} days
            </div>
          </div>
        </div>
      )}

      {/* Review Tabs & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 sm:pb-0 sm:border-0">
            <button
              onClick={() => setActiveTab('standards')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'standards'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Draft Standards ({drafts.standards?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('requirements')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition ${
                activeTab === 'requirements'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Draft Requirements ({drafts.requirements?.length || 0})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={`Search draft ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition"
            />
          </div>
        </div>

        {/* Tab 1: Draft Standards */}
        {activeTab === 'standards' && (
          <div>
            {loading ? (
              <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-xs">Loading draft standards...</span>
              </div>
            ) : filteredStandards.length === 0 ? (
              <div className="p-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
                <FileCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">No draft standards awaiting review</p>
                <p className="text-xs text-slate-400 mt-1">
                  All ingested standards are active or have been reviewed.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-400 font-mono text-[11px]">
                    <tr>
                      <th className="px-4 py-3">IS Number</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Version</th>
                      <th className="px-4 py-3">Provenance</th>
                      <th className="px-4 py-3">Staged At</th>
                      <th className="px-4 py-3 text-right">Review Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredStandards.map((std) => (
                      <tr key={std.id} className="hover:bg-slate-850">
                        <td className="px-4 py-3 font-mono font-bold text-indigo-300">
                          {std.standard_number}
                        </td>
                        <td className="px-4 py-3 font-medium text-white max-w-xs truncate">
                          {std.title}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{std.category}</td>
                        <td className="px-4 py-3 font-mono">{std.version || '2026'}</td>
                        <td className="px-4 py-3">{getProvenanceBadge(std.provenance_type)}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(std.created_at).toLocaleDateString('en-IN')}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleApprove('standard', std.id, std.standard_number)}
                              disabled={actionLoadingId === `standard_${std.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-medium text-xs transition disabled:opacity-50"
                              title="Approve and activate standard into active search and RAG"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approve</span>
                            </button>

                            <button
                              onClick={() => handleOpenReject('standard', std.id, std.standard_number)}
                              disabled={actionLoadingId === `standard_${std.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 font-medium text-xs transition disabled:opacity-50"
                              title="Reject draft standard"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Reject</span>
                            </button>

                            <button
                              onClick={() => handleArchive('standard', std.id, std.standard_number)}
                              disabled={actionLoadingId === `standard_${std.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 font-medium text-xs transition disabled:opacity-50"
                              title="Archive standard"
                            >
                              <Archive className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Draft Requirements */}
        {activeTab === 'requirements' && (
          <div>
            {loading ? (
              <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                <span className="text-xs">Loading draft requirements...</span>
              </div>
            ) : filteredRequirements.length === 0 ? (
              <div className="p-12 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
                <FileCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">No draft requirements awaiting review</p>
                <p className="text-xs text-slate-400 mt-1">
                  All ingested clauses are active or have been reviewed.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-800/80 text-slate-400 font-mono text-[11px]">
                    <tr>
                      <th className="px-4 py-3">Standard</th>
                      <th className="px-4 py-3">Clause</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Priority</th>
                      <th className="px-4 py-3">Testing Method / Verification</th>
                      <th className="px-4 py-3 text-right">Review Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredRequirements.map((req) => (
                      <tr key={req.id} className="hover:bg-slate-850">
                        <td className="px-4 py-3 font-mono font-semibold text-indigo-400">
                          {req.standard_number || `Std #${req.standard_id}`}
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-200">
                          Cl. {req.clause}
                        </td>
                        <td className="px-4 py-3 text-white max-w-xs">
                          <div className="font-medium truncate">{req.title}</div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {req.description}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                              req.priority === 'CRITICAL' || req.priority === 'MANDATORY'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            }`}
                          >
                            {req.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                          {req.verification_method || req.testing_method || 'Laboratory test records'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() =>
                                handleApprove('requirement', req.id, `Clause ${req.clause}`)
                              }
                              disabled={actionLoadingId === `requirement_${req.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 font-medium text-xs transition disabled:opacity-50"
                              title="Approve and activate requirement clause"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Approve</span>
                            </button>

                            <button
                              onClick={() =>
                                handleOpenReject('requirement', req.id, `Clause ${req.clause}`)
                              }
                              disabled={actionLoadingId === `requirement_${req.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 border border-rose-500/30 font-medium text-xs transition disabled:opacity-50"
                              title="Reject draft clause"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Reject</span>
                            </button>

                            <button
                              onClick={() =>
                                handleArchive('requirement', req.id, `Clause ${req.clause}`)
                              }
                              disabled={actionLoadingId === `requirement_${req.id}`}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 font-medium text-xs transition disabled:opacity-50"
                              title="Archive clause"
                            >
                              <Archive className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-rose-400 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <span>Reject Draft: {rejectModal.identifier}</span>
              </h3>
              <button
                onClick={() => setRejectModal({ ...rejectModal, isOpen: false })}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Please specify the audit rationale for rejecting this staged draft entity. The rejection will be logged in the immutable Knowledge Change Log.
            </p>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                Rejection Reason
              </label>
              <textarea
                rows={3}
                placeholder="e.g., Incomplete testing specifications, superseded clause notation, or unverifiable source provenance."
                value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModal({ ...rejectModal, isOpen: false })}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30"
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
