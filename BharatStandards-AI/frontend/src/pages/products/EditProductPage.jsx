import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, AlertCircle, Box, Tag, Building2, CheckCircle2 } from 'lucide-react';
import { productService } from '@/services/productService';
import { useToast } from '@/components/ui/ToastContext';
import { Button, Skeleton } from '@/components/ui';

const CATEGORIES = [
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

export const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Electrical Appliances',
    otherCategory: '',
    manufacturer: '',
    model_number: '',
    description: '',
    intended_use: '',
    technical_details: '',
    status: 'DRAFT',
  });

  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const prod = await productService.getProduct(id);

        const isStandardCat = CATEGORIES.includes(prod.category);
        setFormData({
          name: prod.name || '',
          category: isStandardCat ? prod.category : 'Other',
          otherCategory: isStandardCat ? '' : prod.category,
          manufacturer: prod.manufacturer || '',
          model_number: prod.model_number || '',
          description: prod.description || '',
          intended_use: prod.intended_use || '',
          technical_details: prod.technical_details || '',
          status: prod.status || 'DRAFT',
        });
      } catch (err) {
        console.error('Error fetching product for edit:', err);
        setError(err.message || 'Unable to load product specifications.');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Product name is required.';
    }
    if (formData.category === 'Other' && !formData.otherCategory.trim()) {
      errors.otherCategory = 'Please specify custom category.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setSaving(true);
      const effectiveCategory =
        formData.category === 'Other' ? formData.otherCategory.trim() : formData.category;

      const payload = {
        name: formData.name.trim(),
        category: effectiveCategory,
        manufacturer: formData.manufacturer.trim() || undefined,
        model_number: formData.model_number.trim() || undefined,
        description: formData.description.trim() || undefined,
        intended_use: formData.intended_use.trim() || undefined,
        technical_details: formData.technical_details.trim() || undefined,
        status: formData.status,
      };

      await productService.updateProduct(id, payload);

      addToast({
        type: 'success',
        title: 'Specifications Updated',
        message: 'Product parameters successfully saved.',
      });

      navigate(`/products/${id}`);
    } catch (err) {
      console.error('Failed to update product:', err);
      addToast({
        type: 'error',
        title: 'Update Error',
        message: err.message || 'Could not save product changes.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 text-left pb-12">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Unable to Load Product</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
        <Link to="/products">
          <Button variant="primary" size="sm">
            Back to Products
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-left pb-12">
      {/* Back Link */}
      <Link
        to={`/products/${id}`}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Product Details</span>
      </Link>

      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Edit Product Specifications
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Modify product parameters, category classification, and operational characteristics.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Product Commercial Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bharat-500"
            />
            {validationErrors.name && (
              <p className="text-xs text-rose-600 mt-1">{validationErrors.name}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Sector / Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => updateField('category', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bharat-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Lifecycle Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bharat-500 font-bold"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="ANALYZING">ANALYZING</option>
                <option value="READY">READY</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </div>
          </div>

          {formData.category === 'Other' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Custom Sector / Category <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.otherCategory}
                onChange={(e) => updateField('otherCategory', e.target.value)}
                placeholder="Enter specific category name"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bharat-500"
              />
              {validationErrors.otherCategory && (
                <p className="text-xs text-rose-600 mt-1">{validationErrors.otherCategory}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Manufacturer / OEM
              </label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => updateField('manufacturer', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bharat-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Model Number / SKU
              </label>
              <input
                type="text"
                value={formData.model_number}
                onChange={(e) => updateField('model_number', e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bharat-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bharat-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Intended Use
            </label>
            <textarea
              rows={2}
              value={formData.intended_use}
              onChange={(e) => updateField('intended_use', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bharat-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Technical Details & Ratings
            </label>
            <textarea
              rows={4}
              value={formData.technical_details}
              onChange={(e) => updateField('technical_details', e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bharat-500 font-mono text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link to={`/products/${id}`}>
              <Button variant="outline" size="md" type="button" disabled={saving}>
                Cancel
              </Button>
            </Link>
            <Button
              variant="primary"
              size="md"
              type="submit"
              loading={saving}
              className="gap-1.5 font-bold shadow-sm"
              startIcon={<Save className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
