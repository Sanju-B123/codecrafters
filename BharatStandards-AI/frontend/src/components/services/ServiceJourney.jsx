import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Sparkles, AlertCircle, FileCheck2, BookOpen, Layers, ShieldCheck } from 'lucide-react';

export const ServiceJourney = ({
  currentStep = 5,
  gapCount = 2,
  productId = null,
  complianceId = null,
  className = '',
}) => {
  const navigate = useNavigate();

  const steps = [
    {
      id: 1,
      number: '01',
      title: 'Understand your product',
      desc: 'Define technical specs, ratings & classification',
      route: productId ? `/products/${productId}` : '/products',
      icon: Layers,
    },
    {
      id: 2,
      number: '02',
      title: 'Identify applicable standards',
      desc: 'Discover mandatory Quality Control Orders (QCO)',
      route: '/standards',
      icon: BookOpen,
    },
    {
      id: 3,
      number: '03',
      title: 'Review requirements',
      desc: 'Audit technical clauses & testing criteria',
      route: '/standards',
      icon: ShieldCheck,
    },
    {
      id: 4,
      number: '04',
      title: 'Check available evidence',
      desc: 'Upload test reports & laboratory dossiers',
      route: productId ? `/products/${productId}/documents` : '/documents',
      icon: FileCheck2,
    },
    {
      id: 5,
      number: '05',
      title: 'Address compliance gaps',
      desc: gapCount > 0 ? `${gapCount} critical gaps need test proof` : 'Resolve non-conformances',
      route: complianceId ? `/compliance/${complianceId}` : '/compliance',
      icon: AlertCircle,
    },
    {
      id: 6,
      number: '06',
      title: 'Follow official guidance',
      desc: 'Follow BIS scheme roadmap & licensing milestones',
      route: '/services',
      icon: Sparkles,
    },
  ];

  return (
    <section
      aria-label="BIS Compliance Guided Journey"
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-7 ${className}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-saffron-50 text-saffron-700 border border-saffron-200">
              Guided Roadmap
            </span>
            <span className="text-xs font-semibold text-slate-500">
              Phase {currentStep} of 6
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            End-to-End Compliance Journey
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Follow the systematic pathway from product classification to statutory conformity marks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {currentStep === 5 && (
            <button
              onClick={() => navigate(complianceId ? `/compliance/${complianceId}` : '/compliance')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-saffron-500 focus:ring-offset-2"
              aria-label="Resolve open compliance gaps"
            >
              Resolve Gaps Now
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          {currentStep === 6 && (
            <button
              onClick={() => navigate('/services')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-bharat-900 hover:bg-bharat-800 text-white text-xs font-bold rounded-xl shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-bharat-700 focus:ring-offset-2"
              aria-label="Explore BIS Services & Guidance"
            >
              Explore Services
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Stepper Track */}
      <ol
        role="list"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 relative"
      >
        {steps.map((step) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isUpcoming = step.id > currentStep;
          const StepIcon = step.icon;

          return (
            <li
              key={step.id}
              className={`group relative rounded-xl p-3.5 transition-all cursor-pointer border ${
                isCurrent
                  ? 'bg-saffron-50/50 border-saffron-300 ring-2 ring-saffron-400/30 shadow-sm'
                  : isCompleted
                  ? 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70'
                  : 'bg-white border-slate-200/70 hover:border-slate-300'
              }`}
              onClick={() => navigate(step.route)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  navigate(step.route);
                }
              }}
              aria-current={isCurrent ? 'step' : undefined}
              aria-label={`Step ${step.number}: ${step.title}. Status: ${
                isCompleted ? 'Completed' : isCurrent ? 'Active' : 'Upcoming'
              }`}
            >
              {/* Header inside card */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span
                  className={`text-[10px] font-mono font-bold tracking-wider px-1.5 py-0.5 rounded ${
                    isCurrent
                      ? 'bg-saffron-600 text-white'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {step.number}
                </span>

                <div className="flex items-center justify-center">
                  {isCompleted ? (
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  ) : isCurrent ? (
                    <span className="relative flex h-5 w-5 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-saffron-600 text-white items-center justify-center">
                        <ArrowRight className="w-2.5 h-2.5 stroke-[2.5]" />
                      </span>
                    </span>
                  ) : (
                    <span className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">
                      •
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <h3
                className={`text-xs font-bold line-clamp-2 leading-snug ${
                  isCurrent ? 'text-saffron-950' : 'text-slate-800'
                }`}
              >
                {step.title}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-tight">
                {step.desc}
              </p>

              {/* Status pill footer */}
              <div className="mt-2.5 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[10px]">
                <span
                  className={`font-semibold ${
                    isCompleted
                      ? 'text-emerald-700'
                      : isCurrent
                      ? 'text-saffron-700 font-bold'
                      : 'text-slate-400'
                  }`}
                >
                  {isCompleted ? '✓ Completed' : isCurrent ? 'Current Action' : 'Upcoming'}
                </span>
                <StepIcon
                  className={`w-3 h-3 ${
                    isCurrent ? 'text-saffron-600' : isCompleted ? 'text-emerald-600' : 'text-slate-300'
                  }`}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
