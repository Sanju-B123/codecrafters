import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Sparkles,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  X,
  FileCheck,
} from 'lucide-react';
import { adminService } from '@/services/adminService';

export const AdminStandardDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [standard, setStandard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [clauseModalOpen, setClauseModalOpen] = useState(false);
  const [editingClause, setEditingClause] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Clause form state
  const [clauseForm, setClauseForm] = useState({
    clause: '',
    title: '',
    description: '',
    category: 'SAFETY',
    priority: 'HIGH',
    evidence_types: ['test_report'],
    verification_method: '',
    weight: 2.0,
  });

  const loadStandardDetail = async () => {
    try {
      setLoading(true);
      const data = await adminService.getStandardDetail(Number(id));
      setStandard(data);
    } catch (err) {
      console.error('Failed to load standard details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStandardDetail();
  }, [id]);

  const handleSyncIndex = async () => {
    try {
      setSyncing(true);
      await adminService.syncStandardIndex(Number(id));
      setFeedback({ type: 'success', message: 'Standard synchronized with RAG vector index.' });
      loadStandardDetail();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to sync index.' });
    } finally {
      setSyncing(false);
    }
  };

  const handleOpenClauseModal = (clause = null) => {
    if (clause) {
      setEditingClause(clause);
      setClauseForm({
        clause: clause.clause,
        title: clause.title,
        description: clause.description,
        category: clause.category || 'SAFETY',
        priority: clause.priority || 'HIGH',
        evidence_types: clause.evidence_types || ['test_report'],
        verification_method: clause.verification_method || '',
        weight: clause.weight || 2.0,
      });
    } else {
      setEditingClause(null);
      setClauseForm({
        clause: '',
        title: '',
        description: '',
        category: 'SAFETY',
        priority: 'HIGH',
        evidence_types: ['test_report'],
        verification_method: '',
        weight: 2.0,
      });
    }
    setClauseModalOpen(true);
  };

  const handleSaveClause = async (e) => {
    e.preventDefault();
    try {
      if (editingClause) {
        await adminService.updateRequirement(editingClause.id, clauseForm);
        setFeedback({ type: 'success', message: `Clause ${clauseForm.clause} updated.` });
      } else {
        await adminService.createRequirement(Number(id), clauseForm);
        setFeedback({ type: 'success', message: `Clause ${clauseForm.clause} added.` });
      }
      setClauseModalOpen(false);
      loadStandardDetail();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to save clause.' });
    }
  };

  const handleDeleteClause = async (clauseId, clauseCode) => {
    if (!window.confirm(`Permanently delete clause '${clauseCode}'?`)) return;
    try {
      await adminService.deleteRequirement(clauseId);
      setFeedback({ type: 'success', message: `Clause ${clauseCode} deleted.` });
      loadStandardDetail();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete clause.' });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <span className="text-sm font-medium">Loading standard specification...</span>
      </div>
    );
  }

  if (!standard) {
    return (
      <div className="p-6 text-center text-slate-400">
        <p>Standard not found.</p>
        <Link to="/admin/standards" className="text-indigo-400 hover:underline text-xs mt-2 inline-block">
          Return to Standards Registry
        </Link>
      </div>
    );
  }

  const breakdown = standard.quality_breakdown || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top back navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/admin/standards"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Standards Registry</span>
        </Link>

        <button
          onClick={handleSyncIndex}
          disabled={syncing}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
          <span>Sync RAG Vector Index</span>
        </button>
      </div>

      {/* Feedback Banner */}
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

      {/* Standard Header Card */}
      <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="text-xl sm:text-2xl font-mono font-bold text-white">
                {standard.standard_number}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                {standard.status}
              </span>
              {standard.is_demo && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  DEMO / SYNTHETIC DATA
                </span>
              )}
            </div>
            <h1 className="text-lg font-semibold text-slate-200">{standard.title}</h1>
            <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
              {standard.description || 'No detailed technical scope defined.'}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2">
              <span>Category: <strong className="text-slate-300">{standard.category}</strong></span>
              <span>Version: <strong className="text-slate-300">{standard.version}</strong></span>
              <span>Source: <strong className="text-slate-300">{standard.source}</strong></span>
            </div>
          </div>

          {/* Quality Completeness Score Gauge */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center min-w-[200px]">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold mb-1">
              Quality Completeness
            </div>
            <div className="text-3xl font-bold font-mono text-emerald-400">
              {standard.quality_score || 0}%
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Tier: {standard.quality_tier || 'LOW'}
            </div>
          </div>
        </div>

        {/* Completeness Breakdown Pills */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          {Object.entries(breakdown).map(([key, val]) => (
            <div key={key} className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60">
              <div className="text-slate-400 capitalize text-[11px] font-medium">{key.replace(/_/g, ' ')}</div>
              <div className="font-mono font-bold text-slate-200 mt-1">
                {val.points} / {val.max} pts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clauses Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Clauses & Compliance Criteria</h2>
            <p className="text-xs text-slate-400">
              {standard.requirements?.length || 0} clauses registered for this standard.
            </p>
          </div>

          <button
            onClick={() => handleOpenClauseModal()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Clause</span>
          </button>
        </div>

        {/* Clauses Table */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Clause</th>
                  <th className="px-4 py-3">Requirement Title & Details</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-center">Priority</th>
                  <th className="px-4 py-3 text-center">Weight</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {!standard.requirements || standard.requirements.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-10 text-center text-slate-400">
                      No clauses defined yet. Click "Add Clause" to begin populating criteria.
                    </td>
                  </tr>
                ) : (
                  standard.requirements.map((req) => (
                    <tr key={req.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-300 whitespace-nowrap">
                        {req.clause}
                      </td>
                      <td className="px-4 py-3 max-w-md">
                        <div className="font-semibold text-slate-200">{req.title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{req.description}</div>
                        {req.verification_method && (
                          <div className="text-[10px] text-slate-400 font-mono mt-1">
                            Method: {req.verification_method}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-300 whitespace-nowrap">
                        {req.category}
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap font-mono text-[10px]">
                        <span
                          className={`px-2 py-0.5 rounded font-bold ${
                            req.priority === 'CRITICAL'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : req.priority === 'HIGH'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {req.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-300">
                        {req.weight}x
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenClauseModal(req)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteClause(req.id, req.clause)}
                            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Clause Modal */}
      {clauseModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">
                {editingClause ? `Edit Clause ${editingClause.clause}` : 'Add New Clause'}
              </h2>
              <button onClick={() => setClauseModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClause} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Clause No. *</label>
                  <input
                    type="text"
                    required
                    value={clauseForm.clause}
                    onChange={(e) => setClauseForm({ ...clauseForm, clause: e.target.value })}
                    placeholder="e.g. 4.1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Title *</label>
                  <input
                    type="text"
                    required
                    value={clauseForm.title}
                    onChange={(e) => setClauseForm({ ...clauseForm, title: e.target.value })}
                    placeholder="Clause summary title"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description & Criteria *</label>
                <textarea
                  rows="3"
                  required
                  value={clauseForm.description}
                  onChange={(e) => setClauseForm({ ...clauseForm, description: e.target.value })}
                  placeholder="Detailed pass/fail compliance requirement text..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={clauseForm.category}
                    onChange={(e) => setClauseForm({ ...clauseForm, category: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="SAFETY">SAFETY</option>
                    <option value="PERFORMANCE">PERFORMANCE</option>
                    <option value="TESTING">TESTING</option>
                    <option value="MARKING">MARKING</option>
                    <option value="DOCUMENTATION">DOCUMENTATION</option>
                    <option value="MATERIAL">MATERIAL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Priority</label>
                  <select
                    value={clauseForm.priority}
                    onChange={(e) => setClauseForm({ ...clauseForm, priority: e.target.value })}
                    className="w-full px-2.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Weight</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="10"
                    value={clauseForm.weight}
                    onChange={(e) => setClauseForm({ ...clauseForm, weight: parseFloat(e.target.value) || 2.0 })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Verification Method</label>
                <input
                  type="text"
                  value={clauseForm.verification_method}
                  onChange={(e) => setClauseForm({ ...clauseForm, verification_method: e.target.value })}
                  placeholder="e.g. Dielectric withstand test 1500V for 60s"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setClauseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg shadow-indigo-600/30"
                >
                  {editingClause ? 'Update Clause' : 'Create Clause'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
