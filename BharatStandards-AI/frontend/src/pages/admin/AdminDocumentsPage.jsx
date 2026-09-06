import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  HardDrive,
  FileCheck,
  AlertCircle,
  Clock,
  User,
  Package,
} from 'lucide-react';
import { adminService } from '@/services/adminService';

export const AdminDocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDocuments({
        search: search || undefined,
        status: statusFilter || undefined,
        document_type: typeFilter || undefined,
      });
      setDocuments(data || []);
    } catch (err) {
      console.error('Failed to load admin documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [statusFilter, typeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadDocuments();
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Document Inventory</h1>
        <p className="text-slate-400 text-sm mt-1">
          Oversight of user-submitted technical test reports, manuals, datasheets, and schematics.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by filename..."
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
            <option value="PROCESSED">PROCESSED</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED</option>
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Filename</th>
                <th className="px-5 py-3.5">Associated Product</th>
                <th className="px-5 py-3.5">Account / Owner</th>
                <th className="px-5 py-3.5">Type & Size</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-right">Uploaded At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                    <span>Loading platform documents...</span>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400">
                    No documents matching criteria found.
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4 font-medium text-slate-200">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                        <span className="truncate max-w-[220px]">{doc.filename}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-300">
                      <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                        <Package className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{doc.product_name || `Product #${doc.product_id}`}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{doc.user_email || `User #${doc.user_id}`}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-slate-400 text-[11px]">
                      <span className="uppercase font-mono font-semibold text-slate-300">{doc.document_type}</span>{' '}
                      • {formatBytes(doc.file_size_bytes)}
                    </td>
                    <td className="px-5 py-4 text-center whitespace-nowrap font-mono text-[10px]">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          doc.status === 'PROCESSED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : doc.status === 'FAILED'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(doc.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
