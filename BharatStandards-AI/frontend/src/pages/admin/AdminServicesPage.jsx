import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Edit2,
  Trash2,
  ExternalLink,
  Shield,
  X,
} from 'lucide-react';
import { adminService } from '@/services/adminService';

export const AdminServicesPage = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const [formData, setFormData] = useState({
    service_code: '',
    title: '',
    description: '',
    category: 'CERTIFICATION',
    user_type: 'INDUSTRY',
    status: 'ACTIVE',
    portal_name: 'Manakonline BIS Portal',
    portal_url: 'https://www.manakonline.in',
    help_text: 'Requirements for Indian domestic manufacturers under Scheme 1.',
  });

  const loadServices = async () => {
    try {
      setLoading(true);
      const data = await adminService.getBISServices({
        category: categoryFilter || undefined,
        status: statusFilter || undefined,
      });
      setServices(data || []);
    } catch (err) {
      console.error('Failed to load BIS services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [categoryFilter, statusFilter]);

  const handleOpenModal = (svc = null) => {
    if (svc) {
      setEditingService(svc);
      setFormData({
        service_code: svc.service_code,
        title: svc.title,
        description: svc.description,
        category: svc.category,
        user_type: svc.user_type,
        status: svc.status,
        portal_name: svc.portal_name || '',
        portal_url: svc.portal_url || '',
        help_text: svc.help_text || '',
      });
    } else {
      setEditingService(null);
      setFormData({
        service_code: '',
        title: '',
        description: '',
        category: 'CERTIFICATION',
        user_type: 'INDUSTRY',
        status: 'ACTIVE',
        portal_name: 'Manakonline BIS Portal',
        portal_url: 'https://www.manakonline.in',
        help_text: 'Eligibility guidance for applicants.',
      });
    }
    setModalOpen(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await adminService.updateBISService(editingService.id, formData);
        setFeedback({ type: 'success', message: `Service ${formData.service_code} updated.` });
      } else {
        await adminService.createBISService(formData);
        setFeedback({ type: 'success', message: `Service ${formData.service_code} created.` });
      }
      setModalOpen(false);
      loadServices();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to save BIS service.' });
    }
  };

  const handleDelete = async (id, code) => {
    if (!window.confirm(`Permanently delete BIS Service '${code}'?`)) return;
    try {
      await adminService.deleteBISService(id);
      setFeedback({ type: 'success', message: `Service ${code} deleted.` });
      loadServices();
    } catch (err) {
      setFeedback({ type: 'error', message: err?.message || 'Failed to delete service.' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">BIS Services & Schemes Governance</h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure procedural guidance, conformity assessment schemes, and official BIS portal links.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Service</span>
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

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
            <span>Loading BIS services catalog...</span>
          </div>
        ) : services.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No BIS services registered in catalog.
          </div>
        ) : (
          services.map((svc) => (
            <div
              key={svc.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-indigo-300 text-xs px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                    {svc.service_code}
                  </span>
                  <span className="text-[10px] font-mono uppercase font-semibold text-slate-400">
                    {svc.category}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-100 text-sm">{svc.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-3 mt-1.5 leading-relaxed">
                  {svc.description}
                </p>
                {svc.portal_url && (
                  <div className="mt-3 text-[11px] text-slate-400">
                    Portal: <a href={svc.portal_url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">{svc.portal_name || 'Official Link'}</a>
                  </div>
                )}
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    svc.status === 'ACTIVE'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {svc.status}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenModal(svc)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(svc.id, svc.service_code)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Service Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">
                {editingService ? `Edit ${editingService.service_code}` : 'Register New BIS Service'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Service Code *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingService}
                    value={formData.service_code}
                    onChange={(e) => setFormData({ ...formData, service_code: e.target.value })}
                    placeholder="e.g. ISI_SCHEME_1"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500 font-mono disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="CERTIFICATION">CERTIFICATION</option>
                    <option value="REGISTRATION">REGISTRATION</option>
                    <option value="TESTING">TESTING</option>
                    <option value="LICENSING">LICENSING</option>
                    <option value="CONSUMER_GUIDANCE">CONSUMER_GUIDANCE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Scheme Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Mandatory ISI Product Certification Scheme-I"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description *</label>
                <textarea
                  rows="3"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed regulatory guidelines..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Portal Name</label>
                  <input
                    type="text"
                    value={formData.portal_name}
                    onChange={(e) => setFormData({ ...formData, portal_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Portal URL</label>
                  <input
                    type="url"
                    value={formData.portal_url}
                    onChange={(e) => setFormData({ ...formData, portal_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
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
                  {editingService ? 'Update Service' : 'Save Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
