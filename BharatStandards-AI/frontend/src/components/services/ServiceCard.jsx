import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Building2, Users, FileText, CheckCircle2, AlertTriangle, Shield, ExternalLink } from 'lucide-react';

export const ServiceCard = ({
  service,
  matchReason = null,
  priority = null,
  suggestedActions = [],
  className = '',
}) => {
  const navigate = useNavigate();

  if (!service) return null;

  const getCategoryBadgeColor = (category = '') => {
    switch (category) {
      case 'CERTIFICATION':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'REGISTRATION':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'TESTING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CONSUMER_GUIDANCE':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'LICENSING':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getUserTypeBadge = (userType = 'BOTH') => {
    switch (userType) {
      case 'INDUSTRY':
        return { label: 'Industry & Manufacturers', icon: Building2 };
      case 'CONSUMER':
        return { label: 'Consumers & Buyers', icon: Users };
      default:
        return { label: 'Industry & Consumers', icon: Users };
    }
  };

  const userTypeInfo = getUserTypeBadge(service?.user_type);
  const UserTypeIcon = userTypeInfo.icon;

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between p-5 sm:p-6 ${
        priority === 'CRITICAL' ? 'ring-2 ring-rose-400/40 border-rose-300' : ''
      } ${className}`}
    >
      <div>
        {/* Top Badges & Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${getCategoryBadgeColor(
                service?.category
              )}`}
            >
              {(service?.category || 'GENERAL').replace('_', ' ')}
            </span>

            {service.is_demo && (
              <span className="text-[10px] font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" />
                DEMO / SYNTHETIC DATA
              </span>
            )}
          </div>

          <span className="text-[10px] font-mono text-slate-400 font-semibold">
            {service.service_code}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug group-hover:text-bharat-900">
          {service.name}
        </h3>

        {/* Match reason callout (if recommended) */}
        {matchReason && (
          <div className="mt-2 p-2.5 rounded-xl bg-saffron-50/70 border border-saffron-200 text-xs text-saffron-900 leading-relaxed font-medium">
            <span className="font-bold">Why this guidance:</span> {matchReason}
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-slate-600 mt-2.5 leading-relaxed line-clamp-3">
          {service.description}
        </p>

        {/* Target Audience / Relevance */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
          <UserTypeIcon className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span className="truncate">
            <strong className="text-slate-700">Relevant for:</strong> {userTypeInfo.label}
          </span>
        </div>

        {/* Checklists preview if available */}
        {service.required_documents && service.required_documents.length > 0 && (
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>{service.required_documents.length} prerequisite documents cataloged</span>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="text-[10px] text-slate-400 font-medium">
          {service.steps && service.steps.length > 0 ? `${service.steps.length} guided steps` : 'Direct guidance'}
        </div>

        <button
          onClick={() => navigate(`/services/${service.id}`)}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-bharat-900 hover:bg-bharat-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-bharat-800 focus:ring-offset-2"
          aria-label={`View Guidance for ${service.name}`}
        >
          View Guidance
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
