import React, { useState, useEffect } from 'react';
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Clock,
  Terminal,
  User,
} from 'lucide-react';
import { activityService } from '@/services/activityService';

export const AdminAuditPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [search, setSearch] = useState('');

  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await activityService.getActivity({
        action: actionFilter || undefined,
        entity_type: entityFilter || undefined,
        search: search || undefined,
        limit: 100,
      });
      setLogs(data?.items || []);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [actionFilter, entityFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadAuditLogs();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Security & Administrative Audit Stream</h1>
        <p className="text-slate-400 text-sm mt-1">
          Cryptographically referenced immutable system audit log capturing administrative actions, document mutations, and compliance evaluations.
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
            placeholder="Search audit descriptions or IP addresses..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:border-indigo-500 font-mono"
          >
            <option value="">All Actions</option>
            <option value="ADMIN_STANDARD_CREATED">ADMIN_STANDARD_CREATED</option>
            <option value="ADMIN_STANDARD_UPDATED">ADMIN_STANDARD_UPDATED</option>
            <option value="ADMIN_STANDARD_ARCHIVED">ADMIN_STANDARD_ARCHIVED</option>
            <option value="ADMIN_STANDARD_INDEXED">ADMIN_STANDARD_INDEXED</option>
            <option value="ADMIN_REQUIREMENT_CREATED">ADMIN_REQUIREMENT_CREATED</option>
            <option value="ADMIN_USER_UPDATED">ADMIN_USER_UPDATED</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="REGISTER">REGISTER</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-mono text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-5 py-3.5">Action Event</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Entity</th>
                <th className="px-5 py-3.5 text-right">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 font-sans">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                    <span>Loading audit records...</span>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-slate-400 font-sans">
                    No matching audit records in log buffer.
                  </td>
                </tr>
              ) : (
                logs.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleString('en-IN', {
                        hour12: false,
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          item.action.startsWith('ADMIN_')
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                            : item.action === 'LOGIN' || item.action === 'REGISTER'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {item.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-200 font-sans text-xs max-w-md">
                      {item.description}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap">
                      {item.entity_type} #{item.entity_id}
                    </td>
                    <td className="px-5 py-3.5 text-right text-slate-400 whitespace-nowrap">
                      {item.ip_address || '127.0.0.1'}
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
