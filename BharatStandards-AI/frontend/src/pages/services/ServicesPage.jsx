import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  Workflow,
  Sparkles,
  Building2,
  Users,
  AlertCircle,
  RotateCcw,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { bisService } from '@/services/bisService';
import { productService } from '@/services/productService';
import { ServiceCard } from '@/components/services/ServiceCard';
import { ServiceJourney } from '@/components/services/ServiceJourney';

export const ServicesPage = () => {
  const { productId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Filter states
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || 'ALL');
  const [userType, setUserType] = useState(searchParams.get('user_type') || 'ALL');
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  // Data states
  const [servicesData, setServicesData] = useState({ items: [], total: 0, pages: 1, page: 1 });
  const [product, setProduct] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = [
    { value: 'ALL', label: 'All Categories' },
    { value: 'CERTIFICATION', label: 'Certification (ISI)' },
    { value: 'REGISTRATION', label: 'Registration (CRS)' },
    { value: 'TESTING', label: 'Testing & Labs' },
    { value: 'LICENSING', label: 'Licensing' },
    { value: 'MARKING', label: 'Marking' },
    { value: 'PRODUCT_COMPLIANCE', label: 'Compliance' },
    { value: 'CONSUMER_GUIDANCE', label: 'Consumer Guidance' },
    { value: 'OTHER', label: 'Other' },
  ];

  const userTypes = [
    { value: 'ALL', label: 'All Audiences' },
    { value: 'INDUSTRY', label: 'Industry' },
    { value: 'CONSUMER', label: 'Consumer' },
    { value: 'BOTH', label: 'Both' },
  ];

  const statuses = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INFORMATIONAL', label: 'Informational' },
    { value: 'DEMO', label: 'Demo' },
    { value: 'ARCHIVED', label: 'Archived' },
  ];

  // If productId route param exists, fetch product context & recommendations
  useEffect(() => {
    async function loadProductContext() {
      if (!productId) {
        setProduct(null);
        setRecommendations([]);
        return;
      }
      try {
        const prod = await productService.getProduct(productId);
        setProduct(prod);
        const recs = await bisService.getProductServices(productId);
        setRecommendations(recs || []);
      } catch (err) {
        console.error('Failed to load product services:', err);
      }
    }
    loadProductContext();
  }, [productId]);

  // Fetch paginated services catalogue
  useEffect(() => {
    async function fetchServices() {
      try {
        setLoading(true);
        setError(null);
        const res = await bisService.getServices({
          search,
          category,
          user_type: userType,
          status,
          page,
          page_size: 9,
        });
        setServicesData(res);
      } catch (err) {
        console.error('Error fetching services:', err);
        setError('Unable to load BIS services catalogue. Please verify backend service.');
      } finally {
        setLoading(false);
      }
    }
    fetchServices();
  }, [search, category, userType, status, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setCategory('ALL');
    setUserType('ALL');
    setStatus('ALL');
    setPage(1);
  };

  return (
    <div className="space-y-8 text-left pb-12">
      {/* Product-Aware Context Banner */}
      {product && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-bharat-900 to-slate-900 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-white/10 text-saffron-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-saffron-500/20 text-saffron-300 border border-saffron-400/30 uppercase">
                  Product Guidance
                </span>
                <span className="text-xs text-slate-300">{product.category}</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1">
                Showing tailored guidance for: {product.name}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Deterministic recommendations correlated with your product parameters and compliance gap analysis.
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate(`/products/${productId}`)}
            className="self-start md:self-auto px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold rounded-xl shadow-xs transition-colors flex-shrink-0"
          >
            Back to Product
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-bharat-50 text-bharat-900 border border-bharat-200 uppercase tracking-wide">
              Statutory Services & Guidance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            BIS Services & Guidance
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Find guidance relevant to your standards and compliance journey.
          </p>
        </div>
      </div>

      {/* Guided Journey Stepper */}
      <ServiceJourney
        currentStep={product ? 5 : 6}
        gapCount={recommendations.length > 0 ? 2 : 0}
        productId={productId}
      />

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-bharat-800 bg-slate-50/50 focus:bg-white text-slate-800"
              aria-label="Search services"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-bharat-900 hover:bg-bharat-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
          >
            Search
          </button>

          {(search || category !== 'ALL' || userType !== 'ALL' || status !== 'ALL') && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          )}
        </form>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-slate-100 text-xs">
          {/* Category Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-bharat-800"
              aria-label="Filter by Category"
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* User Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              User Type
            </label>
            <select
              value={userType}
              onChange={(e) => {
                setUserType(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-bharat-800"
              aria-label="Filter by User Type"
            >
              {userTypes.map((u) => (
                <option key={u.value} value={u.value}>
                  {u.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full p-2 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-bharat-800"
              aria-label="Filter by Status"
            >
              {statuses.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SECTION: Recommended Services (if product context is active) */}
      {product && recommendations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-saffron-600" />
            <h2 className="text-lg font-bold text-slate-900">
              Recommended for {product.name}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((rec, idx) => (
              <ServiceCard
                key={idx}
                service={rec.service}
                matchReason={rec.match_reason}
                priority={rec.priority}
                suggestedActions={rec.suggested_actions}
              />
            ))}
          </div>
        </div>
      )}

      {/* SECTION: Main Catalogue Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            {product ? 'All BIS Services & Schemes' : 'Available Services & Guidance'}
          </h2>
          <span className="text-xs text-slate-500">
            {servicesData.total} {servicesData.total === 1 ? 'service' : 'services'} available
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-bharat-900 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-medium">Loading services catalogue...</p>
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center">
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-rose-600" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        ) : servicesData.items.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white border border-slate-200 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No Services Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No BIS service records match your current search terms or filter criteria.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {servicesData.items.map((svc) => (
              <ServiceCard key={svc.id} service={svc} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {servicesData.pages > 1 && (
          <div className="pt-4 flex items-center justify-between border-t border-slate-200 text-xs">
            <span className="text-slate-500">
              Page {servicesData.page} of {servicesData.pages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={servicesData.page <= 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(servicesData.pages, p + 1))}
                disabled={servicesData.page >= servicesData.pages}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
