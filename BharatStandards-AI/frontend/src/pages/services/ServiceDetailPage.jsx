import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  AlertTriangle,
  Building2,
  Users,
  CheckSquare,
  Square,
  ExternalLink,
  ShieldCheck,
  FileText,
  Workflow,
  HelpCircle,
  Clock,
  ChevronRight,
  Info,
} from 'lucide-react';
import { bisService } from '@/services/bisService';

export const ServiceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkedDocs, setCheckedDocs] = useState({});

  useEffect(() => {
    async function loadService() {
      try {
        setLoading(true);
        setError(null);
        const data = await bisService.getService(id);
        setService(data);
      } catch (err) {
        console.error('Failed to load service detail:', err);
        setError('Failed to load BIS service guidance details. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadService();
    }
  }, [id]);

  const toggleDoc = (idx) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Loading procedural guidance...</p>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Service Not Found</h2>
        <p className="text-xs text-slate-600">{error || 'The requested guidance record does not exist.'}</p>
        <button
          onClick={() => navigate('/services')}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Services
        </button>
      </div>
    );
  }

  const userTypeLabel =
    service.user_type === 'INDUSTRY'
      ? 'Industry & Manufacturers'
      : service.user_type === 'CONSUMER'
      ? 'Consumers & Buyers'
      : 'Industry, Manufacturers & Consumers';

  const docs = Array.isArray(service.required_documents) ? service.required_documents : [];
  const steps = Array.isArray(service.steps) ? service.steps : [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-left pb-12">
      {/* Back button and breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-xs text-slate-400">
          <Link to="/services" className="hover:text-slate-600">
            Services
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-700 font-semibold">{service.service_code}</span>
        </nav>
      </div>

      {/* Trust & Synthetic Data Alert */}
      {service.is_demo && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs leading-relaxed">
            <div className="font-extrabold uppercase tracking-wide">DEMO / SYNTHETIC DATA</div>
            <p className="mt-0.5 text-amber-800">
              This record is for demonstration and workflow modeling only. BharatStandards AI provides
              preparatory compliance guidance and gap analysis, but does <strong>NOT</strong> perform official BIS
              certification, issue statutory licenses, or process government transactions.
            </p>
          </div>
        </div>
      )}

      {/* SECTION: Overview */}
      <section aria-labelledby="overview-heading" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-bharat-50 text-bharat-900 border border-bharat-200">
              {service.category.replace('_', ' ')}
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
              {service.status}
            </span>
          </div>

          <span className="text-xs font-mono text-slate-400 font-bold">
            Code: {service.service_code}
          </span>
        </div>

        <h1 id="overview-heading" className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          {service.name}
        </h1>

        <p className="text-sm text-slate-600 mt-4 leading-relaxed max-w-3xl">
          {service.description}
        </p>

        <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="flex items-start gap-2.5">
            <Users className="w-4 h-4 text-saffron-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Who it may be relevant for:</span>
              <p className="text-slate-600 mt-0.5">{userTypeLabel}</p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Eligibility Criteria:</span>
              <p className="text-slate-600 mt-0.5 leading-relaxed">{service.eligibility}</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: When This May Be Relevant */}
      <section className="bg-gradient-to-br from-slate-50 to-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2.5 mb-3">
          <HelpCircle className="w-5 h-5 text-saffron-600" />
          <h2 className="text-lg font-bold text-slate-900">When This May Be Relevant</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-relaxed max-w-3xl">
          {service.category === 'TESTING'
            ? 'This guidance applies when an automated compliance readiness check uncovers critical gaps, missing test evidence (such as hydrostatic pressure vessel proof or dielectric withstand tests), or when preparing representative production batches for third-party laboratory verification.'
            : service.category === 'CERTIFICATION'
            ? 'This roadmap becomes relevant once your product specifications match an active Indian Standard (e.g. DEMO-IS-001) subject to a Quality Control Order (QCO), requiring in-house routine testing capabilities and factory inspection before product distribution in the Indian market.'
            : service.category === 'CONSUMER_GUIDANCE'
            ? 'This guide is relevant whenever you purchase domestic electrical appliances, safety equipment, or packaged goods, enabling you to confirm that the ISI Mark and CM/L license number displayed on the nameplate are active and legitimate.'
            : 'This guidance applies when navigating technical regulations, documentation compilation, or standard conformity schemes for notified products.'}
        </p>
      </section>

      {/* SECTION: Documents / Information You May Need */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-bharat-900" />
            <h2 className="text-lg font-bold text-slate-900">Documents & Information You May Need</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Interactive Checklist ({Object.values(checkedDocs).filter(Boolean).length}/{docs.length})
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Keep these files prepared in your Document Vault before proceeding to formal application or lab testing.
        </p>

        <div className="space-y-2.5 pt-2">
          {docs.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No specific prerequisite documents recorded.</p>
          ) : (
            docs.map((docItem, idx) => {
              const docName = typeof docItem === 'string' ? docItem : docItem.name || JSON.stringify(docItem);
              const isChecked = !!checkedDocs[idx];

              return (
                <div
                  key={idx}
                  onClick={() => toggleDoc(idx)}
                  className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                    isChecked
                      ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100 text-slate-800'
                  }`}
                  role="checkbox"
                  aria-checked={isChecked}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') toggleDoc(idx);
                  }}
                >
                  <div className="mt-0.5 flex-shrink-0 text-slate-400">
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </div>
                  <div className="text-xs font-semibold leading-relaxed flex-1">{docName}</div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 flex justify-end">
          <button
            onClick={() => navigate('/documents')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold"
          >
            Go to Document Vault
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </section>

      {/* SECTION: Typical Steps */}
      <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5">
          <Workflow className="w-5 h-5 text-saffron-600" />
          <h2 className="text-lg font-bold text-slate-900">Typical Steps</h2>
        </div>

        <div className="space-y-4">
          {steps.length === 0 ? (
            <p className="text-xs text-slate-400 italic">No specific steps defined for this record.</p>
          ) : (
            steps.map((stepItem) => {
              const stepNumber = stepItem.step_number;
              const title = stepItem.title;
              const description = stepItem.description;
              const target = stepItem.action_target;

              return (
                <div
                  key={stepNumber}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5 flex-1">
                    <div className="w-8 h-8 rounded-full bg-bharat-900 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {stepNumber}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{title}</h3>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">{description}</p>
                    </div>
                  </div>

                  {target && (
                    <button
                      onClick={() => navigate(target)}
                      className="self-end sm:self-center inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 hover:border-bharat-800 text-slate-800 hover:text-bharat-900 text-xs font-bold rounded-lg shadow-2xs transition-colors flex-shrink-0"
                    >
                      Take Action
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* SECTION: Official Source */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider font-bold">
          <Info className="w-4 h-4 text-saffron-400" />
          Official Statutory Source
        </div>

        <div>
          <h2 className="text-lg font-bold text-white">
            {service.official_source_name || 'Bureau of Indian Standards'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Always verify all legal regulations, gazette notifications, and official fee schedules directly
            with statutory authorities.
          </p>
        </div>

        <div className="pt-2">
          {service.official_source_url ? (
            <a
              href={service.official_source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-saffron-500 hover:bg-saffron-600 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Open Official Source
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Official source link not available in this demo record.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};
