import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckSquare,
  Search,
  Filter,
  ExternalLink,
  BookOpen,
  RefreshCw,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { adminService } from '@/services/adminService';

export const AdminRequirementsPage = () => {
  const [standards, setStandards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  useEffect(() => {
    const fetchAllClauses = async () => {
      try {
        setLoading(true);
        // Load standards and their clauses
        const data = await adminService.getStandards();
        setStandards(data || []);
      } catch (err) {
        console.error('Failed to load standards for clauses:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllClauses();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Requirements & Clauses Explorer</h1>
        <p className="text-slate-400 text-sm mt-1">
          Explore technical criteria, verification testing procedures, and priority ranking across Indian Standards.
        </p>
      </div>

      {/* Standards Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
            <span>Loading requirements inventory...</span>
          </div>
        ) : standards.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400">
            No standards or clauses found in knowledge base.
          </div>
        ) : (
          standards.map((std) => (
            <div
              key={std.id}
              className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-indigo-300 text-sm">{std.standard_number}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300">
                    {std.requirements_count} clauses
                  </span>
                </div>
                <h3 className="font-semibold text-slate-200 text-xs line-clamp-1">{std.title}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {std.description || 'Standard criteria and testing parameters.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">
                  Score: {std.quality_score || 0}%
                </span>
                <Link
                  to={`/admin/standards/${std.id}`}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium inline-flex items-center gap-1"
                >
                  Manage Clauses <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
