import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Plus,
  Search,
  ChevronRight,
  Calendar,
  Tag,
  Building2,
  Trash2,
  Edit,
  Sparkles,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { productService } from '@/services/productService';
import { useToast } from '@/components/ui/ToastContext';
import {
  Button,
  StatusBadge,
  Badge,
  Dialog,
  EmptyState,
  Skeleton,
} from '@/components/ui';

export const ProductsPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Analysis quick-run state
  const [analyzingId, setAnalyzingId] = useState(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productService.getProducts({
        search: searchQuery,
        category: selectedCategory,
        status: selectedStatus,
      });
      setProducts(res.items || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchProducts]);

  const confirmDelete = (product, e) => {
    e.stopPropagation();
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      setIsDeleting(true);
      await productService.deleteProduct(productToDelete.id);
      addToast({
        type: 'success',
        title: 'Product Deleted',
        message: `Product "${productToDelete.name}" has been permanently removed.`,
      });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Deletion Failed',
        message: err.message || 'Unable to delete product.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleQuickAnalyze = async (product, e) => {
    e.stopPropagation();
    try {
      setAnalyzingId(product.id);
      await productService.analyzeProduct(product.id);
      addToast({
        type: 'success',
        title: 'Analysis Complete',
        message: `Standards discovery completed for "${product.name}".`,
      });
      navigate(`/products/${product.id}`);
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Analysis Failed',
        message: err.message || 'Could not initiate standards analysis.',
      });
    } finally {
      setAnalyzingId(null);
    }
  };

  const categories = [
    'All Categories',
    'Electrical Appliances',
    'Electronics',
    'Mechanical Equipment',
    'Construction Materials',
    'Food Products',
    'Chemicals',
    'Textiles',
    'Automotive',
    'Medical Devices',
    'Other',
  ];

  return (
    <div className="space-y-6 text-left pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              My Products
            </h2>
            <Badge variant="outline" size="sm" className="font-mono">
              {products.length} {products.length === 1 ? 'Product' : 'Products'}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your products and start a standards analysis.
          </p>
        </div>

        <Link to="/products/new">
          <Button
            variant="primary"
            size="md"
            className="w-full sm:w-auto gap-2 font-semibold shadow-sm"
            startIcon={<Plus className="w-4 h-4" />}
          >
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by commercial name, model, or manufacturer..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-bharat-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value === 'All Categories' ? '' : e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-bharat-500"
          >
            {categories.map((c) => (
              <option key={c} value={c === 'All Categories' ? '' : c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-bharat-500"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">DRAFT</option>
            <option value="ANALYZING">ANALYZING</option>
            <option value="READY">READY</option>
            <option value="ARCHIVED">ARCHIVED</option>
          </select>

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchProducts}
            title="Refresh product list"
            aria-label="Refresh product list"
            className="p-2"
          >
            <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content Area: Loading, Error, Empty, or List */}
      {loading && products.length === 0 ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 p-6 rounded-xl border border-rose-200 dark:border-rose-800 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-rose-600 dark:text-rose-400 mx-auto" />
          <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">Unable to load products</h3>
          <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchProducts}>
            Retry
          </Button>
        </div>
      ) : products.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={<Box className="w-8 h-8 text-bharat-700 dark:text-bharat-400" />}
          title="No products yet"
          description="Add your first product to discover potentially applicable Indian Standards."
          action={
            <Link to="/products/new">
              <Button
                variant="primary"
                size="md"
                className="gap-2 font-semibold shadow-sm"
                startIcon={<Plus className="w-4 h-4" />}
              >
                Add Your First Product
              </Button>
            </Link>
          }
          className="my-8"
        />
      ) : (
        /* Product List Cards */
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
          {products.map((product) => {
            const isReady = product.status === 'READY';
            const isAnalyzingThis = analyzingId === product.id;

            return (
              <div
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                className="p-5 sm:p-6 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-5 cursor-pointer group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-bharat-50 dark:bg-bharat-950/60 border border-bharat-200 dark:border-bharat-800 text-bharat-700 dark:text-bharat-300 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <Box className="w-6 h-6" />
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-bharat-800 dark:group-hover:text-bharat-300 transition-colors">
                        {product.name}
                      </h3>
                      <StatusBadge status={product.status} size="sm" />
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 uppercase">
                        DEMO DATA
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 max-w-2xl leading-relaxed">
                      {product.description || product.intended_use || 'No detailed description provided.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5 text-slate-400" />
                        <span>Category: <strong className="text-slate-700 dark:text-slate-300 font-medium">{product.category}</strong></span>
                      </span>

                      {product.manufacturer && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>Mfr: <strong className="text-slate-700 dark:text-slate-300 font-medium">{product.manufacturer}</strong></span>
                        </span>
                      )}

                      {product.model_number && (
                        <span className="font-mono text-slate-600 dark:text-slate-300">
                          Model: <strong>{product.model_number}</strong>
                        </span>
                      )}

                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(product.created_at).toLocaleDateString()}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div
                  className="flex items-center gap-2 self-end md:self-center flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  {!isReady ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => handleQuickAnalyze(product, e)}
                      disabled={isAnalyzingThis}
                      className="gap-1.5 text-xs font-semibold"
                      startIcon={<Sparkles className={`w-3.5 h-3.5 ${isAnalyzingThis ? 'animate-spin' : ''}`} />}
                    >
                      {isAnalyzingThis ? 'Analyzing...' : 'Analyze'}
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/products/${product.id}`)}
                      className="gap-1.5 text-xs font-semibold"
                      startIcon={<FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />}
                    >
                      View Standards
                    </Button>
                  )}

                  <Link to={`/products/${product.id}/edit`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                      title="Edit Product"
                      aria-label="Edit Product"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => confirmDelete(product, e)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Delete Product"
                    aria-label="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  <Link
                    to={`/products/${product.id}`}
                    className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-400 group-hover:text-bharat-700 dark:group-hover:text-bharat-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
                    title="View Details"
                    aria-label="View Details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !isDeleting && setDeleteDialogOpen(false)}
        title="Delete Product"
        description="This action is permanent and cannot be undone."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Are you sure you want to delete this product?</p>
              <p className="text-[11px] text-rose-800 dark:text-rose-300">
                Deleting <strong>"{productToDelete?.name}"</strong> will also remove its associated mock standards discoveries, document links, and compliance checklists.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={isDeleting}
              onClick={handleDelete}
              className="gap-1.5 font-bold"
            >
              Delete Product
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
