import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Box,
  Compass,
  FileCheck2,
  AlertTriangle,
  FileText,
  Bot,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Button, Badge } from '@/components/ui';

const TOUR_STEPS = [
  {
    step: 1,
    badge: 'Step 1 of 6 • Getting Started',
    title: 'Welcome to BharatStandards AI',
    subtitle: 'Autonomous Conformance Intelligence & Decision-Support System for Indian Standards (BIS)',
    icon: Sparkles,
    color: 'text-bharat-600 bg-bharat-50 dark:bg-bharat-950/50 border-bharat-200 dark:border-bharat-800',
    content: (
      <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          BharatStandards AI simplifies technical standard conformance under the Bureau of Indian Standards (BIS) for Indian manufacturers, MSMEs, and startups.
        </p>
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Decision-Support Architecture
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Assesses compliance gaps, estimates financial & regulatory risks, and produces pre-audit submittal dossiers. <em>Note: This is an advisory tool and does not replace official BIS statutory certification.</em>
          </p>
        </div>
      </div>
    ),
  },
  {
    step: 2,
    badge: 'Step 2 of 6 • Product Onboarding',
    title: 'Register & Specify Your Product',
    subtitle: 'Add technical specifications, category, and target operating boundaries',
    icon: Box,
    color: 'text-saffron-600 bg-saffron-50 dark:bg-saffron-950/50 border-saffron-200 dark:border-saffron-800',
    content: (
      <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          Start by cataloging your product with its technical parameters (e.g., operating voltage, pressure capacity, dimensions, intended use).
        </p>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Quick Onboarding</span>
            Enter basic details and let the engine infer relevant regulatory categories.
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-800 dark:text-slate-200 block mb-0.5">Multi-Product Support</span>
            Track distinct SKUs, appliances, or machinery lines within your private organization workspace.
          </div>
        </div>
      </div>
    ),
  },
  {
    step: 3,
    badge: 'Step 3 of 6 • Standards Discovery',
    title: 'Intelligent BIS Standard Matching',
    subtitle: 'AI hybrid retrieval identifies applicable IS codes and mandatory Quality Control Orders (QCOs)',
    icon: Compass,
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800',
    content: (
      <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          The platform scans thousands of Indian Standards to identify primary and secondary standards applicable to your product.
        </p>
        <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
          <span className="font-semibold text-indigo-900 dark:text-indigo-200 block mb-1">Example Match:</span>
          <p className="text-[11px] text-indigo-700 dark:text-indigo-300">
            "Domestic Electric Water Heater" automatically maps to <strong>IS 302-2-21 (Safety of Electric Storage Water Heaters)</strong> and general safety under <strong>IS 302-1</strong>.
          </p>
        </div>
      </div>
    ),
  },
  {
    step: 4,
    badge: 'Step 4 of 6 • Evidence Vault',
    title: 'Upload Test Reports & Documentation',
    subtitle: 'Securely attach NABL lab test results, user manuals, and technical schematics',
    icon: FileText,
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800',
    content: (
      <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          Attach your technical files into the Document Vault. Our parsing engine extracts test parameters, insulation values, and safety test readings.
        </p>
        <ul className="space-y-1 text-[11px] list-disc list-inside text-slate-500 dark:text-slate-400">
          <li>NABL-accredited laboratory test certificates</li>
          <li>User operation and installation manuals</li>
          <li>Schematics, component bills of materials (BOM), and marking labels</li>
        </ul>
      </div>
    ),
  },
  {
    step: 5,
    badge: 'Step 5 of 6 • Gap & Risk Engine',
    title: 'Explainable Conformance & Risk Scoring',
    subtitle: 'Transparent clause-level audit with prioritized remediation guidance',
    icon: AlertTriangle,
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800',
    content: (
      <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          The engine correlates your evidence against all 20+ clauses. Each gap is assigned a clear risk priority (CRITICAL, HIGH, MEDIUM, LOW) based on safety and market recall impact.
        </p>
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Interactive What-If Simulation</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Preview score improvements before performing laboratory tests</div>
          </div>
          <Badge variant="warning" size="sm">SIMULATOR</Badge>
        </div>
      </div>
    ),
  },
  {
    step: 6,
    badge: 'Step 6 of 6 • Pre-Audit Dossier & Copilot',
    title: 'Audit Dossier & AI BIS Copilot',
    subtitle: 'Export comprehensive pre-submittal packages and consult the interactive Copilot',
    icon: Bot,
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800',
    content: (
      <div className="space-y-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
        <p>
          Download official-format PDF audit reports, track required Manak Online submittal documents, and consult the BIS Copilot on testing protocols, scheme guidelines, or fees.
        </p>
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
          Ready to experience the platform? You can view the pre-loaded <strong>Electric Water Heater</strong> demo product or register your own hardware now!
        </div>
      </div>
    ),
  },
];

export const OnboardingModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const current = TOUR_STEPS[currentStep];
  const IconComponent = current.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep((prev) => Math.min(TOUR_STEPS.length - 1, prev + 1));
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleComplete = () => {
    try {
      localStorage.setItem('bharat_tour_seen', 'true');
    } catch (e) {
      // ignore
    }
    onClose();
  };

  const handleViewDemoProduct = () => {
    handleComplete();
    navigate('/products');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden text-left flex flex-col animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Header */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-bharat-600 dark:text-bharat-400 uppercase tracking-wider">
              {current.badge}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Dots */}
        <div className="px-6 pt-3 flex gap-1.5">
          {TOUR_STEPS.map((s, idx) => (
            <button
              key={`dot-${s.step}`}
              type="button"
              onClick={() => setCurrentStep(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStep
                  ? 'w-8 bg-bharat-600 dark:bg-bharat-400'
                  : idx < currentStep
                  ? 'w-3 bg-emerald-500'
                  : 'w-3 bg-slate-200 dark:bg-slate-700'
              }`}
              aria-label={`Go to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4 flex-1">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl border ${current.color} flex-shrink-0`}>
              <IconComponent className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {current.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {current.subtitle}
              </p>
            </div>
          </div>

          <div className="pt-2">{current.content}</div>
        </div>

        {/* Bottom Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {currentStep > 0 ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                startIcon={<ChevronLeft className="w-4 h-4" />}
                className="text-xs"
              >
                Back
              </Button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 underline"
              >
                Skip Tour
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isLast ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewDemoProduct}
                  className="text-xs"
                >
                  View Demo Products
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleComplete}
                  className="text-xs font-bold gap-1.5"
                  endIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Get Started
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={handleNext}
                className="text-xs font-bold gap-1.5"
                endIcon={<ChevronRight className="w-4 h-4" />}
              >
                Next Step
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
