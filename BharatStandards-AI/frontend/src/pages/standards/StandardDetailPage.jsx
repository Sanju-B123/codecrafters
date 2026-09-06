import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileCheck2,
  ShieldCheck,
  Tag,
  Calendar,
  Layers,
  FileText,
  AlertTriangle,
  Info,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Search,
  BookOpen,
  Eye,
  X,
} from 'lucide-react';
import { standardService } from '@/services/standardService';
import {
  Button,
  Badge,
  StatusBadge,
  Dialog,
  Skeleton,
} from '@/components/ui';

export const StandardDetailPage = () => {
  const { id } = useParams();

  const [standard, setStandard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Requirements filter & interactive modal
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedRequirement, setSelectedRequirement] = useState(null);
  const [requirementModalOpen, setRequirementModalOpen] = useState(false);

  const fetchStandard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await standardService.getStandard(id);
      setStandard(data);
    } catch (err) {
      console.error('Failed to load standard details:', err);
      setError(err.message || 'Standard not found in knowledge base.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStandard();
  }, [fetchStandard]);

  const openRequirementDetail = (req) => {
    setSelectedRequirement(req);
    setRequirementModalOpen(true);
  };

  if (loading) {
    return (
      <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 lg:col-span-2 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !standard) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 mx-auto flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Standard Not Found</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error}</p>
        <Link to="/standards">
          <Button variant="primary" size="sm" startIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Standards Directory
          </Button>
        </Link>
      </div>
    );
  }

  const allReqs = standard.requirements || [];
  const categoriesInUse = ['ALL', ...new Set(allReqs.map((r) => r.category))];

  const filteredReqs =
    selectedCategory === 'ALL'
      ? allReqs
      : allReqs.filter((r) => r.category === selectedCategory);

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
      {/* Top Back Navigation */}
      <Link
        to="/standards"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Standards Directory</span>
      </Link>

      {/* Main Standard Header Card */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-7 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-base text-bharat-900 dark:text-bharat-300 bg-bharat-50 dark:bg-bharat-950/70 px-3 py-1 rounded-lg border border-bharat-200 dark:border-bharat-800">
                {standard.standard_number}
              </span>

              {standard.is_demo && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                  DEMO / SYNTHETIC DATA
                </span>
              )}

              <StatusBadge status={standard.status} size="md" />

              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Version: {standard.version}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {standard.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Sector: <strong className="text-slate-700 dark:text-slate-300 font-medium">{standard.category}</strong></span>
              </span>

              <span className="flex items-center gap-1.5 font-semibold text-bharat-800 dark:text-bharat-300">
                <Layers className="w-3.5 h-3.5" />
                <span>{allReqs.length} Clause Requirements</span>
              </span>

              <span className="flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                <span>Source: <strong className="text-slate-700 dark:text-slate-300 font-medium">{standard.source}</strong></span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-center">
            <Link to="/assistant">
              <Button
                variant="primary"
                size="sm"
                className="gap-1.5 text-xs font-bold shadow-sm"
                startIcon={<MessageSquare className="w-3.5 h-3.5" />}
              >
                Ask AI Copilot
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Left Column (Scope, Description, Source) + Right Column (Requirements) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Scope, Description, Source Metadata */}
        <div className="space-y-6 lg:col-span-1">
          {/* Scope Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Info className="w-4 h-4 text-bharat-700" />
              <span>Standard Scope</span>
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {standard.scope || 'No detailed scope text available.'}
            </p>
          </div>

          {/* Description Card */}
          {standard.description && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-bharat-700" />
                <span>Technical Context</span>
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {standard.description}
              </p>
            </div>
          )}

          {/* Source Metadata & Traceability */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Source & Evidence Trace</span>
            </h3>

            <div className="text-xs space-y-2 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Repository:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{standard.source}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Document Type:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Synthetic BIS Spec</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Edition:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{standard.version}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Classification:</span>
                <span className="font-bold text-amber-600 uppercase">DEMO DATA</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              <strong>Trust Indicator:</strong> This record is populated by the BharatStandards AI synthetic knowledge base engine for hackathon testing and clause extraction validation.
            </div>
          </div>
        </div>

        {/* Right Column: Clause-by-Clause Requirements */}
        <div className="space-y-4 lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            {/* Header & Category Filters */}
            <div className="space-y-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <FileCheck2 className="w-5 h-5 text-bharat-800 dark:text-bharat-400" />
                    <span>Clause Requirements & Verification Criteria</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Click any requirement to inspect technical criteria, evidence requirements, and verification protocols.
                  </p>
                </div>

                <Badge variant="outline" size="sm" className="font-mono self-start sm:self-auto">
                  {filteredReqs.length} of {allReqs.length} Clauses
                </Badge>
              </div>

              {/* Category Filter Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {categoriesInUse.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all select-none ${
                      selectedCategory === cat
                        ? 'bg-bharat-900 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Requirements Cards */}
            <div className="space-y-3">
              {filteredReqs.map((req) => {
                const isSafety = req.category === 'SAFETY';
                const isTesting = req.category === 'TESTING';
                const isPerf = req.category === 'PERFORMANCE';
                const isMarking = req.category === 'MARKING';

                return (
                  <div
                    key={req.id}
                    onClick={() => openRequirementDetail(req)}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:border-bharat-400 dark:hover:border-bharat-600 hover:shadow-sm transition-all cursor-pointer space-y-2 group"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-bharat-900 dark:text-bharat-300 bg-bharat-50 dark:bg-bharat-950/70 px-2 py-0.5 rounded border border-bharat-200 dark:border-bharat-800">
                          Clause {req.clause}
                        </span>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            isSafety
                              ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/70 dark:text-red-300 dark:border-red-800'
                              : isTesting
                              ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800'
                              : isPerf
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                              : isMarking
                              ? 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800'
                              : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300'
                          }`}
                        >
                          {req.category}
                        </span>

                        {req.page && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Page {req.page}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-semibold text-bharat-700 group-hover:text-bharat-900 dark:text-bharat-400 flex items-center gap-1">
                        <span>Inspect Evidence</span>
                        <Eye className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-bharat-800 dark:group-hover:text-bharat-300 transition-colors">
                      {req.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {req.description}
                    </p>

                    {req.evidence_required && (
                      <div className="pt-1.5 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
                        <strong className="text-[11px] text-slate-700 dark:text-slate-300 uppercase tracking-wider flex-shrink-0">
                          Evidence Required:
                        </strong>
                        <span className="line-clamp-1">{req.evidence_required}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Requirement Detail Dialog */}
      <Dialog
        open={requirementModalOpen}
        onClose={() => setRequirementModalOpen(false)}
        title={selectedRequirement ? `Clause ${selectedRequirement.clause}: ${selectedRequirement.title}` : 'Requirement Details'}
        description="Detailed verification criteria and evidentiary audit requirements."
        maxWidth="max-w-2xl"
      >
        {selectedRequirement && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs bg-bharat-50 dark:bg-bharat-950/70 text-bharat-800 dark:text-bharat-300 px-2.5 py-1 rounded border border-bharat-200 dark:border-bharat-800">
                Clause {selectedRequirement.clause}
              </span>
              <span className="px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                {selectedRequirement.category}
              </span>
              {selectedRequirement.page && (
                <span className="text-slate-400 font-mono">
                  Document Page: {selectedRequirement.page}
                </span>
              )}
            </div>

            <div className="space-y-1.5">
              <h5 className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-wider text-slate-400">
                Clause Specification
              </h5>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                {selectedRequirement.description}
              </p>
            </div>

            <div className="space-y-1.5">
              <h5 className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-wider text-slate-400">
                Mandatory Evidence Required
              </h5>
              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-950 dark:text-blue-200 leading-relaxed">
                {selectedRequirement.evidence_required || 'Standard compliance declaration required.'}
              </div>
            </div>

            {selectedRequirement.verification_method && (
              <div className="space-y-1.5">
                <h5 className="font-bold text-slate-900 dark:text-slate-100 uppercase text-[10px] tracking-wider text-slate-400">
                  Laboratory Verification Method
                </h5>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  {selectedRequirement.verification_method}
                </p>
              </div>
            )}

            <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-300 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Future AI/RAG Integration:</strong> In Step 10, laboratory reports uploaded to the Document Vault will be parsed and evaluated against this clause automatically using Retrieval-Augmented Generation.
              </span>
            </div>

            <div className="flex items-center justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRequirementModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
