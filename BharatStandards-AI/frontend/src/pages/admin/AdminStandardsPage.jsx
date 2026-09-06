import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Sparkles,
  Archive,
  Trash2,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  X,
} from 'lucide-react';
import { adminService } from '@/services/adminService';

export const AdminStandardsPage = () => {
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [syncingId, setSyncingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // New standard form state
  const [formData, setFormData] = useState({
    standard_number: '',
    title: '',
    category: 'Electronics & IT Goods',
    scope: '',
    description: '',
    version: '2026',
    status: 'ACTIVE',
    source: 'Bureau of Indian Standards (BIS)',
    source_url: '',
    is_demo: false,
  });

  const loadStandards = async () => {
    try {
      setLoading(true);
      const data = await adminService.getStandards({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setStandards(data || []);
    } catch (err) {
      console.error('Failed to load standards:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStandards();
  }, [statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadStandards();
  };

  const handleSyncIndex = async (id, e) => {
    e.stopPropagation();
    try {
      setSyncingId(id);
      await adminService.syncStandardIndex(id);
      setFeedback({ type: 'success', message: 'Standard successfully synchronized with RAG vector index.' });
      loadStandards();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to sync index.' });
    } finally {
      setSyncingId(null);
    }
  };

  const handleArchive = async (id, code, e) => {
    e.stopPropagation();
    if (!window.confirm(`Archive standard '${code}'? This will mark it non-destructively as ARCHIVED.`)) return;
    try {
      await adminService.deleteStandard(id, false);
      setFeedback({ type: 'success', message: `Standard ${code} archived.` });
      loadStandards();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to archive standard.' });
    }
  };

  const handleCreateStandard = async (e) => {
    e.preventDefault();
    try {
      await adminService.createStandard(formData);
      setModalOpen(false);
      setFeedback({ type: 'success', message: `Standard ${formData.standard_number} created successfully.` });
      setFormData({
        standard_number: '',
        title: '',
        category: 'Electronics & IT Goods',
        scope: '',
        description: '',
        version: '2026',
        status: 'ACTIVE',
        source: 'Bureau of Indian Standards (BIS)',
        source_url: '',
        is_demo: false,
      });
      loadStandards();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to create standard.' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Standards Knowledge Base</h1>
          <p className="text-slate-400 text-sm mt-1">
            Maintain authoritative Indian Standards, Technical Regulations, and RAG retrieval freshness.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Standard</span>
        </button>
      </div>

      {/* Feedback Alert */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl flex items-center justify-between text-xs font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{feedback.message}</span>
          <button onClick={() => setFeedback(null)} className="p-1 hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by IS code, title, or category..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="DEMO">DEMO</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>
        </div>
      </div>

      {/* Standards Registry Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Standard Code</th>
                <th className="px-5 py-3.5">Title & Category</th>
                <th className="px-5 py-3.5 text-center">Quality Score</th>
                <th className="px-5 py-3.5 text-center">RAG Index</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                    <span>Loading standards registry...</span>
                  </td>
                </tr>
              ) : standards.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No standards matching the criteria.
                  </td>
                </tr>
              ) : (
                standards.map((std) => (
                  <tr
                    key={std.id}
                    className="hover:bg-slate-800/40 transition group cursor-pointer"
                    onClick={() => (window.location.href = `/admin/standards/${std.id}`)}
                  >
                    <td className="px-5 py-4 font-mono font-bold text-white whitespace-nowrap">
                      {std.standard_number}
                    </td>
                    <td className="px-5 py-4 max-w-md">
                      <div className="font-medium text-slate-200 line-clamp-1">{std.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {std.category} • {std.requirements_count} clauses
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold ${
                          (std.quality_score || 0) >= 80
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : (std.quality_score || 0) >= 50
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {std.quality_score || 0}% ({std.quality_tier || 'LOW'})
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap font-mono text-[10px]">
                      <span
                        className={`px-2 py-0.5 rounded ${
                          std.index_status === 'INDEXED'
                            ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {std.index_status || 'NOT_INDEXED'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                          std.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : std.status === 'ARCHIVED'
                            ? 'bg-slate-800 text-slate-400'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {std.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleSyncIndex(std.id, e)}
                          title="Re-index into RAG Vector Store"
                          disabled={syncingId === std.id}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${syncingId === std.id ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={(e) => handleArchive(std.id, std.standard_number, e)}
                          title="Archive standard"
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <Link
                          to={`/admin/standards/${std.id}`}
                          className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Standard Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Create New Standard</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStandard} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Standard Number / IS Code <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.standard_number}
                  onChange={(e) => setFormData({ ...formData, standard_number: e.target.value })}
                  placeholder="e.g. IS 13252 (Part 1):2010"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Official standard title"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="DRAFT">DRAFT</option>
                    <option value="DEMO">DEMO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed technical summary..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Authoritative Source</label>
                <input
                  type="text"
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30"
                >
                  Create Standard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
