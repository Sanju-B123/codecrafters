import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronRight,
  Compass,
  Tag,
  Calendar,
  Layers,
  FileCheck2,
  RefreshCw,
  AlertTriangle,
  ArrowRight,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { standardService } from '@/services/standardService';
import {
  Button,
  Badge,
  StatusBadge,
  EmptyState,
  Skeleton,
} from '@/components/ui';

export const StandardsPage = () => {
  const navigate = useNavigate();

  const [standards, setStandards] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(6);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [sortBy, setSortBy] = useState('relevance');

  const fetchStandards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await standardService.getStandards({
        q: searchQuery,
        category: selectedCategory,
        status: selectedStatus,
        page: page,
        page_size: pageSize,
        sort_by: sortBy,
      });
      setStandards(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      console.error('Error loading standards:', err);
      setError(err.message || 'Unable to connect to standards knowledge base.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedStatus, page, pageSize, sortBy]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStandards();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchStandards]);

  // Reset page to 1 when filters change
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPage(1);
  };

  const handleStatusChange = (e) => {
    setSelectedStatus(e.target.value);
    setPage(1);
  };

  const categories = [
    { label: 'All Categories', value: '' },
    { label: 'Electrical Appliances', value: 'Electrical Appliances' },
    { label: 'Electronics', value: 'Electronics' },
    { label: 'Mechanical Equipment', value: 'Mechanical Equipment' },
    { label: 'Construction Materials', value: 'Construction Materials' },
    { label: 'Food Products', value: 'Food Products' },
    { label: 'Chemicals', value: 'Chemicals' },
    { label: 'Textiles', value: 'Textiles' },
    { label: 'Automotive', value: 'Automotive' },
    { label: 'Medical Devices', value: 'Medical Devices' },
  ];

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Indian Standards Knowledge Base
            </h1>
            <Badge variant="outline" size="sm" className="font-mono">
              {total} Standards
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Explore standards and requirements relevant to your products.
          </p>
        </div>

        {/* Demo banner indicator */}
        <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-200 font-medium flex items-center gap-2 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Synthetic Demonstration Dataset (DEMO-IS)</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Search standards by IS number, title, clause or keyword (e.g. water heater)..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bharat-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedCategory}
            onChange={handleCategoryChange}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-bharat-500"
          >
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={handleStatusChange}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-bharat-500"
          >
            <option value="">All Statuses</option>
            <option value="DEMO">DEMO</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DRAFT">DRAFT</option>
            <option value="WITHDRAWN">WITHDRAWN</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-bharat-500"
          >
            <option value="relevance">Relevance</option>
            <option value="name">Name (A-Z)</option>
            <option value="latest">Latest</option>
          </select>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchStandards}
            title="Refresh Knowledge Base"
            aria-label="Refresh Knowledge Base"
            className="p-2"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content: Loading, Error, Empty, or List */}
      {loading && standards.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-28 rounded-lg" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 p-6 rounded-xl border border-rose-200 dark:border-rose-800 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">Unable to Load Standards</h3>
          <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchStandards}>
            Retry
          </Button>
        </div>
      ) : standards.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-8 h-8 text-slate-400" />}
          title="No standards found"
          description="No Indian Standards matched your keyword search or category filter. Try clearing query filters."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setSelectedStatus('');
                setPage(1);
              }}
            >
              Clear Filters
            </Button>
          }
          className="my-8"
        />
      ) : (
        /* Standards Cards Grid */
        <div className="grid grid-cols-1 gap-4">
          {standards.map((standard) => (
            <div
              key={standard.id}
              onClick={() => navigate(`/standards/${standard.standard_number}`)}
              className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-bharat-300 dark:hover:border-bharat-700 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer group"
            >
              <div className="space-y-2.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-sm text-bharat-900 dark:text-bharat-300 bg-bharat-50 dark:bg-bharat-950/70 px-2.5 py-1 rounded-md border border-bharat-200 dark:border-bharat-800">
                    {standard.standard_number}
                  </span>

                  {standard.is_demo && (
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                      DEMO / SYNTHETIC DATA
                    </span>
                  )}

                  <StatusBadge status={standard.status} size="sm" />

                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    v{standard.version}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-bharat-800 dark:group-hover:text-bharat-300 transition-colors">
                  {standard.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed line-clamp-2">
                  {standard.scope || standard.description || 'No detailed scope available.'}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400" />
                    <span>Category: <strong className="text-slate-700 dark:text-slate-300 font-medium">{standard.category}</strong></span>
                  </span>

                  <span className="flex items-center gap-1 font-semibold text-bharat-800 dark:text-bharat-300">
                    <Layers className="w-3.5 h-3.5" />
                    <span>{standard.requirements_count} Clauses & Verification Evidence</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                <Link to={`/standards/${standard.standard_number}`} onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs font-semibold gap-1.5"
                    endIcon={<ChevronRight className="w-3.5 h-3.5" />}
                  >
                    View Requirements
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <span className="text-slate-500 dark:text-slate-400">
            Showing page <strong className="text-slate-800 dark:text-slate-200">{page}</strong> of{' '}
            <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong> ({total} total standards)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Button
                key={p}
                variant={p === page ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setPage(p)}
                className="w-8 h-8 p-0"
              >
                {p}
              </Button>
            ))}

            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
