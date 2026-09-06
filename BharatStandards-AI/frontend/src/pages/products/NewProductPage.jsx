import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Cpu,
  Wrench,
  Building,
  Utensils,
  FlaskConical,
  Scissors,
  Car,
  HeartPulse,
  HelpCircle,
  Check,
  AlertCircle,
  Loader2,
  Box,
} from 'lucide-react';
import { productService } from '@/services/productService';
import { useToast } from '@/components/ui/ToastContext';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
} from '@/components/ui';

const CATEGORIES = [
  {
    id: 'Electrical Appliances',
    title: 'Electrical Appliances',
    desc: 'Geysers, heaters, kitchen appliances, pumps & mains equipment',
    icon: Zap,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800',
  },
  {
    id: 'Electronics',
    title: 'Electronics',
    desc: 'IT hardware, telecommunications, audio/video & digital instruments',
    icon: Cpu,
    color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800',
  },
  {
    id: 'Mechanical Equipment',
    title: 'Mechanical Equipment',
    desc: 'Pressure vessels, boilers, piping, valves, industrial machines',
    icon: Wrench,
    color: 'text-slate-700 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
  },
  {
    id: 'Construction Materials',
    title: 'Construction Materials',
    desc: 'Cement, reinforcement steel, structural glass, tiles & adhesives',
    icon: Building,
    color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800',
  },
  {
    id: 'Food Products',
    title: 'Food Products',
    desc: 'Packaged drinking water, dairy, oil, packaging migration safety',
    icon: Utensils,
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800',
  },
  {
    id: 'Chemicals',
    title: 'Chemicals',
    desc: 'Industrial solvents, reagents, fertilizers & specialty compounds',
    icon: FlaskConical,
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800',
  },
  {
    id: 'Textiles',
    title: 'Textiles',
    desc: 'Protective gear, flame retardant fabrics, industrial yarn',
    icon: Scissors,
    color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800',
  },
  {
    id: 'Automotive',
    title: 'Automotive',
    desc: 'Vehicle components, lighting, safety glass, braking systems',
    icon: Car,
    color: 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800',
  },
  {
    id: 'Medical Devices',
    title: 'Medical Devices',
    desc: 'Clinical diagnostic devices, hospital electronics & sterile supplies',
    icon: HeartPulse,
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800',
  },
  {
    id: 'Other',
    title: 'Other / Custom Sector',
    desc: 'General consumer articles, toys, stationery or unlisted domains',
    icon: HelpCircle,
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800',
  },
];

export const NewProductPage = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [createdProduct, setCreatedProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    model_number: '',
    category: 'Electrical Appliances',
    otherCategory: '',
    description: '',
    intended_use: '',
    technical_details: '',
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Analysis Sequence State
  const [analysisStep, setAnalysisStep] = useState(0); // 0=idle, 1=understanding, 2=searching, 3=ranking, 4=done
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (currentStep) => {
    const errors = {};
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        errors.name = 'Product name is required.';
      } else if (formData.name.trim().length < 2) {
        errors.name = 'Product name must be at least 2 characters.';
      }
    }
    if (currentStep === 2) {
      if (!formData.category) {
        errors.category = 'Please select an industrial sector or category.';
      }
      if (formData.category === 'Other' && !formData.otherCategory.trim()) {
        errors.otherCategory = 'Please specify your sector or product category.';
      }
    }
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Step 4 -> Create Product in Backend
  const handleCreateProduct = async () => {
    try {
      setLoading(true);
      const effectiveCategory =
        formData.category === 'Other' && formData.otherCategory.trim()
          ? formData.otherCategory.trim()
          : formData.category;

      const payload = {
        name: formData.name.trim(),
        category: effectiveCategory,
        description: formData.description.trim() || undefined,
        intended_use: formData.intended_use.trim() || undefined,
        manufacturer: formData.manufacturer.trim() || undefined,
        model_number: formData.model_number.trim() || undefined,
        technical_details: formData.technical_details.trim() || undefined,
      };

      const product = await productService.createProduct(payload);
      setCreatedProduct(product);
      addToast({
        type: 'success',
        title: 'Product Created',
        message: `Product "${product.name}" registered successfully.`,
      });
      setStep(5);
    } catch (err) {
      console.error('Error creating product:', err);
      addToast({
        type: 'error',
        title: 'Registration Error',
        message: err.message || 'Failed to create product.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 5 -> Trigger Mock Analysis
  const handleRunAnalysis = async () => {
    if (!createdProduct) return;
    setIsAnalyzing(true);
    setAnalysisStep(1); // Understanding product

    try {
      await new Promise((r) => setTimeout(r, 600));
      setAnalysisStep(2); // Searching standards repository

      await new Promise((r) => setTimeout(r, 700));
      setAnalysisStep(3); // Ranking potential matches

      const analysisPromise = productService.analyzeProduct(createdProduct.id);
      await Promise.all([analysisPromise, new Promise((r) => setTimeout(r, 800))]);

      setAnalysisStep(4); // Preparing results
      await new Promise((r) => setTimeout(r, 500));

      addToast({
        type: 'success',
        title: 'Analysis Complete',
        message: 'Potentially applicable Indian Standards identified.',
      });

      navigate(`/products/${createdProduct.id}`);
    } catch (err) {
      console.error('Analysis error:', err);
      setIsAnalyzing(false);
      setAnalysisStep(0);
      addToast({
        type: 'error',
        title: 'Analysis Failed',
        message: err.message || 'Could not complete standards analysis.',
      });
    }
  };

  const stepsList = [
    { num: '01', title: 'Product' },
    { num: '02', title: 'Category' },
    { num: '03', title: 'Details' },
    { num: '04', title: 'Review' },
    { num: '05', title: 'Analyze' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left pb-12">
      {/* Top back navigation */}
      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Products</span>
      </Link>

      {/* Wizard Progress Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Product Registration & Standards Wizard
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Register technical parameters to automatically identify potentially applicable Indian Standards.
            </p>
          </div>
          <span className="text-xs font-bold text-bharat-800 dark:text-bharat-300 bg-bharat-50 dark:bg-bharat-950/60 px-2.5 py-1 rounded-full border border-bharat-200 dark:border-bharat-800 self-start sm:self-auto">
            Step {step} of 5
          </span>
        </div>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-5 gap-2 pt-2">
          {stepsList.map((s, idx) => {
            const stepNum = idx + 1;
            const isCompleted = stepNum < step;
            const isCurrent = stepNum === step;

            return (
              <div key={s.num} className="text-center">
                <div
                  className={`h-2 rounded-full mb-2 transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600'
                      : isCurrent
                      ? 'bg-bharat-900 dark:bg-bharat-500'
                      : 'bg-slate-200 dark:bg-slate-800'
                  }`}
                />
                <div className="flex items-center justify-center gap-1">
                  {isCompleted ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : null}
                  <span
                    className={`text-[11px] font-bold ${
                      isCurrent
                        ? 'text-slate-900 dark:text-slate-100'
                        : isCompleted
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {s.num} {s.title}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Wizard Step Container */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* STEP 1: PRODUCT */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Step 1: Basic Product Information
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Provide the product's primary commercial name and manufacturing details.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Product Commercial Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g. Electric Water Heater (Storage Type)"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                    validationErrors.name
                      ? 'border-rose-300 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-bharat-500'
                  } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2`}
                />
                {validationErrors.name ? (
                  <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {validationErrors.name}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 mt-1">
                    The general commercial trade name as marketed to consumers or enterprise purchasers.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Manufacturer / OEM
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => updateField('manufacturer', e.target.value)}
                    placeholder="e.g. Demo Industries Ltd"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bharat-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Company or entity producing the item.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Model Number / Variant
                  </label>
                  <input
                    type="text"
                    value={formData.model_number}
                    onChange={(e) => updateField('model_number', e.target.value)}
                    placeholder="e.g. EH-2000"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bharat-500 font-mono"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Catalog SKU, type number, or serial family.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CATEGORY */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Step 2: Sector & Category Classification
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Select the primary industrial sector to align standards knowledge base retrieval.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = formData.category === cat.id;

                return (
                  <div
                    key={cat.id}
                    onClick={() => updateField('category', cat.id)}
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-bharat-800 dark:border-bharat-500 bg-bharat-50/50 dark:bg-bharat-950/40 shadow-sm ring-1 ring-bharat-800/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/40'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${cat.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {cat.title}
                        </h4>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-bharat-800 text-white flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {cat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Category Input if "Other" */}
            {formData.category === 'Other' && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Specify Other Sector / Category <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.otherCategory}
                  onChange={(e) => updateField('otherCategory', e.target.value)}
                  placeholder="e.g. Specialized Laboratory Glassware or Solar Thermal Components"
                  className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                    validationErrors.otherCategory
                      ? 'border-rose-300 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-bharat-500'
                  } bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2`}
                />
                {validationErrors.otherCategory && (
                  <p className="text-xs text-rose-600 mt-1">{validationErrors.otherCategory}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: DETAILS */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Step 3: Technical Details & Intended Use
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Provide operational characteristics to help BharatStandards AI match specific clauses.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Provide a general summary of the product, design philosophy, and construction..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bharat-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Intended Application / Use Case
                </label>
                <textarea
                  rows={2}
                  value={formData.intended_use}
                  onChange={(e) => updateField('intended_use', e.target.value)}
                  placeholder="e.g. Domestic indoor bathroom and kitchen hot water supply under single-phase 230V AC mains."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bharat-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Technical Details & Characteristics
                </label>
                <textarea
                  rows={4}
                  value={formData.technical_details}
                  onChange={(e) => updateField('technical_details', e.target.value)}
                  placeholder="Describe important technical characteristics, operating conditions, materials, power rating, dimensions, etc. (e.g. 230V AC, 50Hz, 2000W, 25 Litres, 0.8 MPa pressure rating, Class I insulation)"
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-bharat-500 font-mono text-xs"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Optional but recommended. Exact ratings enable high-confidence clause matching in later stages.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Step 4: Review Product Information
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verify the specifications below before creating your product record.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700 divide-y divide-slate-200 dark:divide-slate-700 text-xs">
              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Product Name:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formData.name}</span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Category:</span>
                <Badge variant="outline" size="sm" className="font-semibold">
                  {formData.category === 'Other' ? formData.otherCategory : formData.category}
                </Badge>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Manufacturer:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {formData.manufacturer || 'Not specified'}
                </span>
              </div>

              <div className="py-2.5 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Model / SKU:</span>
                <span className="font-mono text-slate-800 dark:text-slate-200">
                  {formData.model_number || 'Not specified'}
                </span>
              </div>

              {formData.description && (
                <div className="py-2.5 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Description:</span>
                  <p className="text-slate-700 dark:text-slate-300">{formData.description}</p>
                </div>
              )}

              {formData.intended_use && (
                <div className="py-2.5 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Intended Use:</span>
                  <p className="text-slate-700 dark:text-slate-300">{formData.intended_use}</p>
                </div>
              )}

              {formData.technical_details && (
                <div className="py-2.5 space-y-1">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Technical Details:</span>
                  <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
                    {formData.technical_details}
                  </p>
                </div>
              )}
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Next Step:</strong> Upon creating this product, you will be able to initiate a mock standards discovery analysis against synthetic Indian Standards.
              </span>
            </div>
          </div>
        )}

        {/* STEP 5: ANALYSIS CTA & PROGRESS */}
        {step === 5 && (
          <div className="text-center py-6 space-y-6 max-w-xl mx-auto">
            {!isAnalyzing && analysisStep === 0 ? (
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-300 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Product created successfully
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    <strong>"{createdProduct?.name}"</strong> has been registered in your compliance catalog.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-bharat-50 dark:bg-bharat-950/50 border border-bharat-200 dark:border-bharat-800 text-xs text-bharat-900 dark:text-bharat-200 text-left space-y-1">
                  <p className="font-bold">Ready to discover potentially applicable standards.</p>
                  <p className="text-[11px] text-bharat-700 dark:text-bharat-300">
                    Click the button below to initiate simulated standards matching against the National Standards Repository (Synthetic Demo).
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleRunAnalysis}
                    className="w-full sm:w-auto gap-2 font-bold shadow-md text-sm px-6 py-3"
                    startIcon={<Sparkles className="w-4 h-4" />}
                  >
                    Find Applicable Standards
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => navigate(`/products/${createdProduct?.id}`)}
                    className="w-full sm:w-auto text-xs"
                  >
                    View Product Details
                  </Button>
                </div>
              </div>
            ) : (
              /* Simulated Discovery Sequence */
              <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-6">
                <div className="w-12 h-12 rounded-xl bg-bharat-900 text-white mx-auto flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-saffron-400" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Discovering Applicable Standards...
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Evaluating product parameters against synthetic BIS repository.
                  </p>
                </div>

                {/* Progress Steps */}
                <div className="space-y-3 text-left max-w-sm mx-auto">
                  <div className="flex items-center gap-3 text-xs">
                    {analysisStep > 1 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Loader2 className="w-4 h-4 animate-spin text-bharat-700 flex-shrink-0" />
                    )}
                    <span className={analysisStep >= 1 ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-400'}>
                      1. Understanding product specifications
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {analysisStep > 2 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : analysisStep === 2 ? (
                      <Loader2 className="w-4 h-4 animate-spin text-bharat-700 flex-shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                    )}
                    <span className={analysisStep >= 2 ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-400'}>
                      2. Searching standards knowledge base
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {analysisStep > 3 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : analysisStep === 3 ? (
                      <Loader2 className="w-4 h-4 animate-spin text-bharat-700 flex-shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                    )}
                    <span className={analysisStep >= 3 ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-400'}>
                      3. Ranking potential matches
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs">
                    {analysisStep >= 4 ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                    )}
                    <span className={analysisStep >= 4 ? 'font-bold text-slate-900 dark:text-slate-100' : 'text-slate-400'}>
                      4. Preparing results
                    </span>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 italic">
                  Simulated demonstration pipeline • Synthetic BIS catalog
                </p>
              </div>
            )}
          </div>
        )}

        {/* Wizard Footer Navigation Buttons (Steps 1-4) */}
        {step <= 4 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {step > 1 ? (
              <Button
                variant="outline"
                size="md"
                onClick={handleBack}
                disabled={loading}
                className="gap-1.5 text-xs font-semibold"
                startIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button
                variant="primary"
                size="md"
                onClick={handleNext}
                className="gap-1.5 text-xs font-semibold shadow-sm"
                endIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Continue
              </Button>
            ) : (
              <Button
                variant="primary"
                size="md"
                onClick={handleCreateProduct}
                loading={loading}
                className="gap-1.5 text-xs font-bold shadow-sm px-5"
                startIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Create Product
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
