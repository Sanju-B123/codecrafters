import React from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Bot,
  Compass,
  Building2,
  Users,
  ChevronRight,
  Shield,
  ArrowRight,
  FileCheck2,
  XCircle,
  Sparkles,
  FileCode,
  BookOpen,
  Scale,
  Zap,
  Info,
} from 'lucide-react';
import {
  Button,
  Badge,
  StatusBadge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Progress,
} from '@/components/ui';
import { DEMO_WATER_HEATER_STATS, DISCLAIMER_TEXT } from '@/constants';

export const LandingPage = () => {
  return (
    <div className="space-y-24 pb-20 text-slate-900 dark:text-slate-100 selection:bg-bharat-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-white via-slate-50/70 to-bharat-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Subtle decorative grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0B254508_1px,transparent_1px),linear-gradient(to_bottom,#0B254508_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Narrative */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Hero Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-bharat-50 dark:bg-bharat-950/80 border border-bharat-200 dark:border-bharat-800 text-bharat-800 dark:text-bharat-300 text-xs font-bold tracking-wide uppercase">
                <span className="w-2 h-2 rounded-full bg-saffron-500 animate-pulse" />
                <span>AI-POWERED • STANDARDS • COMPLIANCE</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.12]">
                Understand Indian Standards.{' '}
                <span className="block mt-1 text-bharat-900 dark:text-bharat-400">
                  Navigate BIS with confidence.
                </span>
              </h1>

              {/* Description */}
              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal max-w-2xl">
                An intelligent assistant for industries and consumers to discover applicable standards, understand requirements, assess document readiness and navigate BIS-related services.
              </p>

              {/* Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                <Link to="/products" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="primary"
                    className="w-full sm:w-auto min-h-12 shadow-md hover:shadow-lg gap-2 text-sm bg-bharat-900 hover:bg-bharat-800 dark:bg-bharat-600 dark:hover:bg-bharat-500 justify-center"
                    endIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Check My Product
                  </Button>
                </Link>
                <Link to="/standards" className="w-full sm:w-auto">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto min-h-12 gap-2 text-sm border-slate-300 dark:border-slate-700 bg-white/80 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 justify-center"
                    startIcon={<Search className="w-4 h-4 text-slate-500" />}
                  >
                    Explore Standards
                  </Button>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-3 sm:gap-6 text-xs font-semibold text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <span>Evidence-backed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span>Explainable AI</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-700 dark:text-amber-400">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <span>Built for India</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Card (Real Product UI Visualization) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl p-4 sm:p-7 overflow-hidden text-left">
                {/* Synthetic Demo Label */}
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      Product Analysis
                    </span>
                  </div>
                  <Badge variant="warning" size="sm">
                    DEMO DATA
                  </Badge>
                </div>

                {/* Target Product Info */}
                <div className="mt-4 space-y-1">
                  <div className="flex items-center justify-between flex-wrap gap-1">
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      {DEMO_WATER_HEATER_STATS.productName}
                    </h3>
                    <StatusBadge status="HIGH" size="sm" label="HIGH RELEVANCE" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Potentially Applicable Standard:{' '}
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                      {DEMO_WATER_HEATER_STATS.standardNumber}
                    </span>{' '}
                    (Stationary Storage Type)
                  </p>
                </div>

                {/* Compliance Readiness Gauge / Widget */}
                <div className="mt-4 p-3.5 sm:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Compliance Readiness
                      </span>
                      <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        {DEMO_WATER_HEATER_STATS.readinessScore}%
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] sm:text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                        Evaluation Status
                      </span>
                      <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                        Action Required
                      </span>
                    </div>
                  </div>

                  {/* Multi-segment readiness bar */}
                  <Progress
                    value={DEMO_WATER_HEATER_STATS.readinessScore}
                    max={100}
                    size="md"
                    segments={[
                      { value: 75, className: 'bg-emerald-500', title: '15 Passed Clauses' },
                      { value: 15, className: 'bg-amber-400', title: '3 Partial Clauses' },
                      { value: 10, className: 'bg-rose-500', title: '2 Missing Clauses' },
                    ]}
                  />
                </div>

                {/* 3 Metrics: PASS, PARTIAL, MISSING */}
                <div className="mt-3.5 grid grid-cols-3 gap-2 sm:gap-2.5 text-center">
                  <div className="p-2.5 sm:p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                    <div className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-400">
                      {DEMO_WATER_HEATER_STATS.passCount}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> PASS
                    </div>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="text-base sm:text-lg font-black text-amber-700 dark:text-amber-400">
                      {DEMO_WATER_HEATER_STATS.partialCount}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase flex items-center justify-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> PARTIAL
                    </div>
                  </div>
                  <div className="p-2.5 sm:p-3 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg">
                    <div className="text-base sm:text-lg font-black text-rose-700 dark:text-rose-400">
                      {DEMO_WATER_HEATER_STATS.missingCount}
                    </div>
                    <div className="text-[10px] sm:text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase flex items-center justify-center gap-1">
                      <XCircle className="w-3 h-3" /> MISSING
                    </div>
                  </div>
                </div>

                {/* Footer preview link */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    2 Critical Gaps to Remediate
                  </span>
                  <Link
                    to="/compliance"
                    className="font-bold text-bharat-800 dark:text-bharat-400 hover:text-bharat-900 dark:hover:text-bharat-300 flex items-center gap-1 group"
                  >
                    <span>Inspect Gap Analysis</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. PROBLEM SECTION (Triad of Friction) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" size="sm" className="mb-3">
            THE PROBLEM
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Standards shouldn't be difficult to navigate.
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
            Thousands of Indian Standards exist across industrial and consumer sectors. Yet businesses and citizens face three recurring barriers when attempting to achieve regulatory clarity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Problem 1: FIND */}
          <Card hover className="text-left border-t-4 border-t-rose-500">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4 border border-rose-200 dark:border-rose-800">
                <Search className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                01 • Discovery Challenge
              </div>
              <CardTitle className="text-xl mt-1">FIND</CardTitle>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Which standard applies to my specific product?
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                With complex product variants, hybrid electronic components, and frequent gazette amendments, determining the exact applicable IS standard requires manual catalog searches and costly regulatory consultants.
              </p>
            </CardContent>
          </Card>

          {/* Problem 2: UNDERSTAND */}
          <Card hover className="text-left border-t-4 border-t-amber-500">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 border border-amber-200 dark:border-amber-800">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                02 • Comprehension Challenge
              </div>
              <CardTitle className="text-xl mt-1">UNDERSTAND</CardTitle>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                What do these complex technical clauses actually mean?
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Official specifications are dense 100+ page technical documents filled with complex formulas, cross-standard references, and ambiguous test protocols that leave engineering and quality teams uncertain.
              </p>
            </CardContent>
          </Card>

          {/* Problem 3: ACT */}
          <Card hover className="text-left border-t-4 border-t-bharat-600">
            <CardHeader className="pb-3">
              <div className="w-12 h-12 rounded-xl bg-bharat-50 dark:bg-bharat-950/60 text-bharat-800 dark:text-bharat-300 flex items-center justify-center mb-4 border border-bharat-200 dark:border-bharat-800">
                <Compass className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-bharat-800 dark:text-bharat-400">
                03 • Execution Challenge
              </div>
              <CardTitle className="text-xl mt-1">ACT</CardTitle>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                How do I become compliant and successfully get certified?
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Manufacturers struggle to identify required NABL test reports, audit evidence checklists, and navigate official BIS schemes (ISI Mark, CRS, Hallmarking) without risking costly rejection.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SOLUTION SECTION */}
      {/* ========================================================================= */}
      <section className="bg-slate-50 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="saffron" size="sm" className="mb-3">
              THE SOLUTION
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              BharatStandards AI brings the journey together.
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-base leading-relaxed">
              We replace regulatory ambiguity with an end-to-end, deterministic compliance copilot that transforms weeks of manual research into seconds of structured, verifiable insight.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-5xl mx-auto">
            {/* The Old Way */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/60 shadow-sm text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-400 text-xs font-bold uppercase mb-4">
                <XCircle className="w-4 h-4" /> Before: Friction & Rejection
              </div>
              <ul className="space-y-3.5 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>Manual reading of 150+ page PDFs with dense engineering jargon</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>No clear way to check whether test reports fulfill BIS requirements</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>Applications rejected due to missing marking proofs or calibration logs</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span>Months of delay before product market launch in India</span>
                </li>
              </ul>
            </div>

            {/* The BharatStandards AI Way */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 shadow-md text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase mb-4">
                <CheckCircle2 className="w-4 h-4" /> With BharatStandards AI
              </div>
              <ul className="space-y-3.5 text-xs text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>AI Semantic Discovery:</strong> Matches product specs to exact IS codes in seconds</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Document Intelligence:</strong> Auto-parses test reports and maps findings to clauses</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Readiness Scoring:</strong> Instant 0–100% compliance breakdown with prioritized fixes</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <span><strong>Deterministic Guidance:</strong> Step-by-step roadmap from lab test to BIS certification</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. HOW IT WORKS (5 STEPS) */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="primary" size="sm" className="mb-3">
            METHODOLOGY
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            How It Works
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-base">
            A 5-step guided journey designed for speed, transparency, and zero guesswork.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          {[
            {
              step: '01',
              title: 'Discover',
              subtitle: 'Identify Standards',
              desc: 'Identify applicable Indian Standards for your product using intelligent semantic matching.',
              icon: Search,
            },
            {
              step: '02',
              title: 'Understand',
              subtitle: 'Clause Breakdown',
              desc: 'Break down complex technical clauses into plain language with rationale and thresholds.',
              icon: BookOpen,
            },
            {
              step: '03',
              title: 'Verify',
              subtitle: 'Evidence Audit',
              desc: 'Assess your existing laboratory test reports, datasheets, and factory certifications.',
              icon: FileCheck2,
            },
            {
              step: '04',
              title: 'Fix',
              subtitle: 'Gap Remediation',
              desc: 'Get clear, prioritized steps to resolve compliance gaps and missing evidence.',
              icon: AlertTriangle,
            },
            {
              step: '05',
              title: 'Guide',
              subtitle: 'BIS Certification',
              desc: 'Navigate BIS processes, Scheme-I ISI marks, CRS, lab testing, and pre-grant inspection.',
              icon: Compass,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black text-bharat-900 dark:text-bharat-400">
                      {item.step}
                    </span>
                    <div className="w-8 h-8 rounded-lg bg-bharat-50 dark:bg-slate-800 text-bharat-700 dark:text-bharat-300 flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {item.title}
                  </h4>
                  <div className="text-[11px] font-semibold text-saffron-600 dark:text-saffron-400 uppercase tracking-wide mb-2">
                    {item.subtitle}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. CORE CAPABILITIES / FEATURES (6 CARDS) */}
      {/* ========================================================================= */}
      <section className="bg-slate-50 dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800 py-18">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="navy" size="sm" className="mb-3">
              PLATFORM CAPABILITIES
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Engineered for Precision & Compliance
            </h2>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-base">
              Six dedicated intelligence modules powering the BharatStandards AI copilot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: AI Standards Assistant */}
            <Card hover className="text-left">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-xl bg-bharat-900 text-white flex items-center justify-center mb-3">
                  <Bot className="w-5 h-5 text-saffron-400" />
                </div>
                <CardTitle className="text-base">1. AI Standards Assistant</CardTitle>
                <CardDescription>
                  Plain-language answers backed by standard citations
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Query standards in natural language (English, Hindi, or vernacular) and receive deterministic answers strictly cross-referenced to standard numbers, clauses, and official gazette notifications.
              </CardContent>
            </Card>

            {/* Card 2: Standards Discovery Engine */}
            <Card hover className="text-left">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-xl bg-bharat-900 text-white flex items-center justify-center mb-3">
                  <Search className="w-5 h-5 text-saffron-400" />
                </div>
                <CardTitle className="text-base">2. Standards Discovery Engine</CardTitle>
                <CardDescription>
                  Find applicable standards for products, components, & materials
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Enter your product name, technical parameters, or upload an engineering datasheet. Our semantic vector engine identifies candidate IS standards with transparent relevance scores.
              </CardContent>
            </Card>

            {/* Card 3: Document Intelligence */}
            <Card hover className="text-left">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-xl bg-bharat-900 text-white flex items-center justify-center mb-3">
                  <FileCode className="w-5 h-5 text-saffron-400" />
                </div>
                <CardTitle className="text-base">3. Document Intelligence</CardTitle>
                <CardDescription>
                  Parse test reports, datasheets, and certificates
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Automatically ingest PDFs of NABL lab test results, factory quality management manuals, and component certificates. The engine extracts test parameters and checks them against standard tolerances.
              </CardContent>
            </Card>

            {/* Card 4: Compliance Readiness Engine */}
            <Card hover className="text-left">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-xl bg-bharat-900 text-white flex items-center justify-center mb-3">
                  <Scale className="w-5 h-5 text-saffron-400" />
                </div>
                <CardTitle className="text-base">4. Compliance Readiness Engine</CardTitle>
                <CardDescription>
                  Calculate readiness scores and clause-level status
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Instantly compute your product's compliance readiness percentage. Categorize every mandatory clause into PASS, PARTIAL, or MISSING with dual-encoded indicators and clear audit trails.
              </CardContent>
            </Card>

            {/* Card 5: Gap Analysis & Remediation */}
            <Card hover className="text-left">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-xl bg-bharat-900 text-white flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5 text-saffron-400" />
                </div>
                <CardTitle className="text-base">5. Gap Analysis & Remediation</CardTitle>
                <CardDescription>
                  Actionable recommendations to fix non-compliance
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Receive prioritized, step-by-step guidance on resolving missing evidence, updating test reports, fixing bilingual nameplate markings, or re-testing specific electrical parameters before BIS inspection.
              </CardContent>
            </Card>

            {/* Card 6: BIS Services Navigator */}
            <Card hover className="text-left">
              <CardHeader className="pb-2">
                <div className="w-10 h-10 rounded-xl bg-bharat-900 text-white flex items-center justify-center mb-3">
                  <Compass className="w-5 h-5 text-saffron-400" />
                </div>
                <CardTitle className="text-base">6. BIS Services Navigator</CardTitle>
                <CardDescription>
                  Step-by-step guidance for certification and testing
                </CardDescription>
              </CardHeader>
              <CardContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Clear navigation for BIS schemes including Scheme-I (ISI Mark), Scheme-II (Compulsory Registration Scheme - CRS), Hallmarking, lab recognition, and Manak Online application submissions.
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. INTERACTIVE / DEMO PREVIEW (MOCK COPILOT QUERY) */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <Badge variant="saffron" size="sm" className="mb-2">
            INTERACTIVE PREVIEW
          </Badge>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            See the AI Standards Copilot in Action
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
            Realistic example showing evidence extraction, clause citations, and explainable confidence scoring.
          </p>
        </div>

        {/* Mock Chat Window */}
        <div className="rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden text-left">
          {/* Window Header */}
          <div className="p-4 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                copilot-session :: Electric Water Heater Query
              </span>
            </div>
            <Badge variant="neutral" size="sm">
              EXPLAINABLE RAG
            </Badge>
          </div>

          <div className="p-6 space-y-6">
            {/* User Message */}
            <div className="flex items-start gap-3.5 max-w-2xl">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 flex-shrink-0 font-bold text-xs">
                U
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-slate-100 dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                <span className="font-semibold block text-slate-900 dark:text-white mb-1">
                  Manufacturer Query:
                </span>
                "Which standard may apply to my electric storage water heater, and what are the key safety requirements?"
              </div>
            </div>

            {/* AI Assistant Response */}
            <div className="flex items-start gap-3.5 max-w-3xl ml-auto flex-row-reverse">
              <div className="w-8 h-8 rounded-full bg-bharat-900 dark:bg-bharat-700 text-white flex items-center justify-center flex-shrink-0">
                <Bot className="w-4 h-4 text-saffron-400" />
              </div>
              <div className="p-5 rounded-2xl rounded-tr-none bg-bharat-50/50 dark:bg-slate-800/90 border border-bharat-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 space-y-4">
                {/* Result Pill */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-bharat-100 dark:border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      Identified Standard:
                    </span>
                    <span className="font-mono font-bold px-2 py-0.5 rounded bg-bharat-100 dark:bg-bharat-950 text-bharat-900 dark:text-bharat-300 border border-bharat-300 dark:border-bharat-700">
                      DEMO-IS-001
                    </span>
                    <span className="text-slate-500 text-[11px]">(Stationary Storage Type Electric Water Heaters)</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confidence: 99.4% (Explainable)</span>
                  </div>
                </div>

                {/* Key Clause Summary */}
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block mb-1.5">
                    Key Clause Requirements Summary:
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                    <li>
                      <strong>Clause 4.2 (General Safety):</strong> Prevention of electric shock, IPX4 ingress protection against moisture.
                    </li>
                    <li>
                      <strong>Clause 7.1 (Insulation Resistance):</strong> ≥ 5 MΩ tested at 1000V DC under humidity conditioning.
                    </li>
                    <li>
                      <strong>Clause 8.1 (Earthing Continuity):</strong> Protective earthing resistance not exceeding 0.1 Ω.
                    </li>
                    <li>
                      <strong>Clause 11.4 (Thermal Cut-Out):</strong> Non-self-resetting thermal cut-out required to prevent dry boiling.
                    </li>
                    <li>
                      <strong>Clause 19.1 (Rating Plate & Marking):</strong> Bilingual (English/Hindi) marking with BIS ISI symbol and CM/L license number.
                    </li>
                  </ul>
                </div>

                {/* Supporting Evidence Citation */}
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-start gap-2.5 text-[11px]">
                  <FileText className="w-4 h-4 text-bharat-700 dark:text-bharat-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Authoritative Evidence Citation:</span>
                    <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                      Extracted from DEMO-IS-001 Section 4, Clause 4.2 & Clause 7.1 (Page 14–18). Verified against BIS Gazette Notification S.O. 1284(E).
                    </p>
                  </div>
                </div>

                {/* Recommended Next Step */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Recommended Action:</span> Upload factory test reports to verify compliance readiness.
                  </div>
                  <Link to="/products">
                    <Button size="xs" variant="primary" endIcon={<ArrowRight className="w-3 h-3" />}>
                      Run Readiness Audit
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. COMPLIANCE READINESS VISUALIZATION (DETAILED BREAKDOWN) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="primary" size="sm" className="mb-2">
            AUDIT INTELLIGENCE
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Comprehensive Clause-Level Breakdown
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm">
            How BharatStandards AI transforms ambiguous test reports into unambiguous pass/fail readiness matrices.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: 3 Pillar Progress Cards */}
          <div className="lg:col-span-4 space-y-4 text-left">
            {/* Pillar 1 */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Safety & Construction
                </span>
                <StatusBadge status="PASS" size="sm" />
              </div>
              <Progress value={92} max={100} size="sm" className="mb-1" />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>92% Conformance</span>
                <span>11 of 12 Clauses Met</span>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Performance & Rating
                </span>
                <StatusBadge status="PARTIAL" size="sm" />
              </div>
              <Progress value={65} max={100} size="sm" className="mb-1" />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>65% Conformance</span>
                <span>3 Gaps Identified</span>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Marking & Documentation
                </span>
                <StatusBadge status="MISSING" size="sm" />
              </div>
              <Progress value={40} max={100} size="sm" className="mb-1" />
              <div className="flex justify-between text-[11px] text-slate-500">
                <span>40% Conformance</span>
                <span>Action Required</span>
              </div>
            </div>

            {/* Total Overall Score Summary */}
            <div className="p-4 rounded-xl bg-slate-900 text-white text-center">
              <div className="text-xs uppercase font-bold text-slate-400 mb-1">Overall Readiness Score</div>
              <div className="text-3xl font-extrabold text-saffron-400">78% READY</div>
              <div className="text-[11px] text-slate-300 mt-1">
                Estimated audit time saved: <strong>14 business days</strong>
              </div>
            </div>
          </div>

          {/* Right Column: Detailed Clause Verification Checklist */}
          <div className="lg:col-span-8">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden text-left">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-bharat-700 dark:text-bharat-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Demonstration Audit Checklist • DEMO-IS-001
                  </span>
                </div>
                <Badge variant="neutral" size="sm">
                  4 OF 20 CLAUSES PREVIEWED
                </Badge>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {/* Checklist Item 1: PASS */}
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Clause 7.2 — Insulation Resistance Test
                      </span>
                      <StatusBadge status="PASS" size="sm" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      1000V DC Megger test confirmed insulation resistance &gt; 5.2 MΩ after 48-hour humidity chamber pre-conditioning.
                    </p>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Evidence Source: NABL Test Report #TR-2026-0882 • Clause 7.2 Page 6
                    </div>
                  </div>
                </div>

                {/* Checklist Item 2: PASS */}
                <div className="p-4 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Clause 8.1 — Earthing Connection Continuity
                      </span>
                      <StatusBadge status="PASS" size="sm" />
                    </div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Earth resistance measured at 0.04 Ω from accessible metal parts to earthing terminal (Standard limit: &lt; 0.10 Ω).
                    </p>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Evidence Source: Electrical Safety Inspection Log • Clause 8.1 Page 9
                    </div>
                  </div>
                </div>

                {/* Checklist Item 3: PARTIAL */}
                <div className="p-4 flex items-start justify-between gap-4 bg-amber-50/30 dark:bg-amber-950/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Clause 11.4 — Thermal Cut-out Calibration Data
                      </span>
                      <StatusBadge status="PARTIAL" size="sm" />
                    </div>
                    <p className="text-amber-900 dark:text-amber-300 font-medium">
                      Thermal cut-out test report attached, but laboratory calibration certificate for thermocouple sensor expired on 2026-01-15.
                    </p>
                    <div className="text-[11px] text-amber-700 dark:text-amber-400 font-mono">
                      Remediation Action: Attach updated NABL calibration certificate for sensor #TC-402
                    </div>
                  </div>
                </div>

                {/* Checklist Item 4: MISSING */}
                <div className="p-4 flex items-start justify-between gap-4 bg-rose-50/30 dark:bg-rose-950/20">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        Clause 19.1 — BIS Bilingual Rating Plate Marking Proof
                      </span>
                      <StatusBadge status="MISSING" size="sm" />
                    </div>
                    <p className="text-rose-900 dark:text-rose-300 font-medium">
                      No photographic proof or technical drawing of the mandatory bilingual rating plate (Hindi & English) containing ISI monogram provided.
                    </p>
                    <div className="text-[11px] text-rose-700 dark:text-rose-400 font-mono">
                      Remediation Action: Upload vector drawing or photo of product label conforming to Clause 19.1
                    </div>
                  </div>
                </div>
              </div>

              {/* Disclaimer Alert */}
              <div className="p-4 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 italic">
                  <Info className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>AI-assisted compliance readiness assessment. Does not replace official BIS certification.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. DUAL AUDIENCE (INDUSTRY vs. CONSUMER) */}
      {/* ========================================================================= */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="navy" size="sm" className="mb-2">
            WHO IT'S FOR
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Tailored for Both Sides of the Standards Ecosystem
          </h2>
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-sm">
            Empowering enterprise manufacturers to achieve compliance while helping citizens make informed, safety-first purchases.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Persona 1: Industry */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-left flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-bharat-900 text-white flex items-center justify-center mb-5">
                <Building2 className="w-6 h-6 text-saffron-400" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-bharat-800 dark:text-bharat-400">
                Enterprise & MSME Track
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 mb-3">
                For Industry & Manufacturers
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Streamline pre-submission audits, verify NABL test reports, eliminate application rejection risks, and accelerate product market launch.
              </p>

              <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300 mb-8">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>Reduce time-to-market:</strong> Cut standard discovery and gap analysis from weeks to hours</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>Avoid rejected BIS applications:</strong> Catch missing documents before official filing</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>Pre-audit test reports:</strong> Ensure test parameters match IS limits prior to lab submission</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>Export & Import compliance:</strong> Cross-reference mandatory Quality Control Orders (QCOs)</span>
                </li>
              </ul>
            </div>

            <div>
              <Link to="/products/new">
                <Button variant="primary" className="w-full sm:w-auto" endIcon={<ArrowRight className="w-4 h-4" />}>
                  Start Industry Analysis
                </Button>
              </Link>
            </div>
          </div>

          {/* Persona 2: Consumer */}
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-left flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-saffron-600 text-white flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-saffron-700 dark:text-saffron-400">
                Citizen & Consumer Track
              </div>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 mb-3">
                For Consumers & Citizens
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
                Demystify technical standards, verify ISI marks, understand what safety ratings protect, and access grievance redressal procedures.
              </p>

              <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-300 mb-8">
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>Verify ISI & CRS marks:</strong> Learn how to validate genuine standard marks on everyday items</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>Understand product safety:</strong> Plain-language summaries of electrical and chemical protections</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>Know what standards guarantee:</strong> Benchmark product durability and efficiency ratings</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span><strong>File informed grievances:</strong> Clear pathways for reporting sub-standard or counterfeit goods</span>
                </li>
              </ul>
            </div>

            <div>
              <Link to="/assistant">
                <Button variant="outline" className="w-full sm:w-auto" endIcon={<ArrowRight className="w-4 h-4" />}>
                  Ask Consumer Copilot
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. FINAL CALL TO ACTION */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="rounded-3xl bg-gradient-to-br from-bharat-950 via-bharat-900 to-slate-950 text-white p-8 sm:p-14 shadow-2xl relative overflow-hidden">
          {/* Subtle decoration */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-bharat-700/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-saffron-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative space-y-6 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur border border-white/20 text-saffron-400 text-xs font-bold uppercase tracking-wider">
              Smart India Hackathon Prototype • Open Source Architecture
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Ready to simplify your standards journey?
            </h2>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Start with our interactive demo or analyze your product against Indian Standards in under two minutes.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
              <Link to="/products">
                <Button
                  size="lg"
                  className="bg-saffron-500 hover:bg-saffron-600 text-slate-950 font-bold shadow-lg gap-2 text-sm"
                  endIcon={<ArrowRight className="w-4 h-4 text-slate-950" />}
                >
                  Start Free Analysis
                </Button>
              </Link>
              <Link to="/standards">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-white border-white/30 hover:bg-white/10 gap-2 text-sm"
                  startIcon={<Search className="w-4 h-4 text-slate-300" />}
                >
                  Explore Standards Catalog
                </Button>
              </Link>
            </div>

            <p className="pt-4 text-xs text-slate-400 italic">
              {DISCLAIMER_TEXT}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
