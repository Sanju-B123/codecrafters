import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  ArrowRight,
  RefreshCw,
  Layers,
  Database,
  ShieldCheck,
  Search,
  Filter,
  Info,
  X,
  FileCheck,
} from 'lucide-react';
import { knowledgeService } from '@/services/knowledgeService';

export const AdminKnowledgeImportPage = () => {
  // State for file upload & preview
  const [selectedFile, setSelectedFile] = useState(null);
  const [provenanceType, setProvenanceType] = useState('DEMO');
  const [sourceName, setSourceName] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('UNVERIFIED');
  const [dragActive, setDragActive] = useState(false);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // State for jobs list & record inspector modal
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobRecords, setJobRecords] = useState([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordStatusFilter, setRecordStatusFilter] = useState('');

  const fileInputRef = useRef(null);

  const loadJobs = async () => {
    try {
      setJobsLoading(true);
      const data = await knowledgeService.getImportJobs();
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch import jobs:', err);
    } finally {
      setJobsLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file) => {
    setSelectedFile(file);
    setPreviewData(null);
    if (!sourceName) {
      setSourceName(`Import: ${file.name}`);
    }
  };

  const handlePreview = async () => {
    if (!selectedFile) return;
    try {
      setPreviewLoading(true);
      const res = await knowledgeService.previewImport(selectedFile, provenanceType);
      setPreviewData(res);
      setToastMessage({
        type: 'info',
        text: `Validation parsed ${res.total_records} records: ${res.valid_records} valid, ${res.invalid_records} invalid, ${res.duplicates_found} duplicates.`,
      });
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err?.message || 'Failed to parse and validate file.',
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleExecuteImport = async () => {
    if (!selectedFile) return;
    try {
      setImportLoading(true);
      const job = await knowledgeService.executeImport(selectedFile, {
        provenanceType,
        sourceName: sourceName || selectedFile.name,
        verificationStatus,
      });

      setToastMessage({
        type: 'success',
        text: `Import job #${job.id} staged successfully! ${job.successful_records} entities staged as DRAFT.`,
      });

      setSelectedFile(null);
      setPreviewData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadJobs();
    } catch (err) {
      setToastMessage({
        type: 'error',
        text: err?.message || 'Ingestion failed.',
      });
    } finally {
      setImportLoading(false);
    }
  };

  const handleViewRecords = async (job) => {
    setSelectedJob(job);
    try {
      setRecordsLoading(true);
      const records = await knowledgeService.getImportJobRecords(job.id, {
        status: recordStatusFilter || undefined,
      });
      setJobRecords(records);
    } catch (err) {
      console.error('Failed to load job records:', err);
    } finally {
      setRecordsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedJob) {
      knowledgeService
        .getImportJobRecords(selectedJob.id, {
          status: recordStatusFilter || undefined,
        })
        .then(setJobRecords)
        .catch(console.error);
    }
  }, [recordStatusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'IMPORTED':
      case 'VALID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> {status}
          </span>
        );
      case 'PARTIAL':
      case 'SKIPPED':
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3" /> {status}
          </span>
        );
      case 'FAILED':
      case 'INVALID':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" /> {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
            <Clock className="w-3 h-3" /> {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Knowledge Ingestion & Data Quality Pipeline
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-mono font-semibold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Authorized Sources Only
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Import and validate standards source data packages (JSON, CSV, Markdown) into staged DRAFT knowledge entities.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/admin/knowledge/review"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition shadow-lg shadow-indigo-600/20"
          >
            <FileCheck className="w-4 h-4" />
            <span>Draft Review Inbox</span>
          </Link>
        </div>
      </div>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`p-4 rounded-xl text-sm flex items-center justify-between border ${
            toastMessage.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : toastMessage.type === 'error'
              ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload & Staging Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upload Form & Options */}
        <div className="lg:col-span-1 space-y-5 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            <span>1. Select Source Package</span>
          </h2>

          {/* Drag & Drop Area */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[160px] ${
              dragActive
                ? 'border-indigo-500 bg-indigo-500/10'
                : selectedFile
                ? 'border-emerald-500/50 bg-emerald-500/5'
                : 'border-slate-700 bg-slate-950/50 hover:border-slate-600'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.md,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <FileText className={`w-8 h-8 mb-2 ${selectedFile ? 'text-emerald-400' : 'text-slate-400'}`} />
            {selectedFile ? (
              <div>
                <p className="text-sm font-semibold text-white truncate max-w-[200px]">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-200">
                  Click to browse or drop file here
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Supported formats: .json, .csv, .md, .txt
                </p>
              </div>
            )}
          </div>

          {/* Provenance Tier Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Data Provenance Tier
            </label>
            <div className="grid grid-cols-1 gap-2">
              <label
                className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                  provenanceType === 'DEMO'
                    ? 'border-amber-500/50 bg-amber-500/10 text-amber-200'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="provenance"
                  value="DEMO"
                  checked={provenanceType === 'DEMO'}
                  onChange={(e) => setProvenanceType(e.target.value)}
                  className="mt-0.5 text-amber-500 focus:ring-amber-500"
                />
                <div>
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    DEMO / SYNTHETIC DATA
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-amber-500/20 text-amber-300 font-mono">
                      Safe Test
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Isolated test benchmarks clearly tagged to prevent misrepresentation as official BIS data.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                  provenanceType === 'USER_PROVIDED'
                    ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-200'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="provenance"
                  value="USER_PROVIDED"
                  checked={provenanceType === 'USER_PROVIDED'}
                  onChange={(e) => setProvenanceType(e.target.value)}
                  className="mt-0.5 text-indigo-500 focus:ring-indigo-500"
                />
                <div>
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    USER / INDUSTRY PROVIDED
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Technical specifications supplied by registered enterprise manufacturers.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                  provenanceType === 'OFFICIAL'
                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="provenance"
                  value="OFFICIAL"
                  checked={provenanceType === 'OFFICIAL'}
                  onChange={(e) => {
                    setProvenanceType(e.target.value);
                    setVerificationStatus('VERIFIED');
                  }}
                  className="mt-0.5 text-emerald-500 focus:ring-emerald-500"
                />
                <div>
                  <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                    OFFICIAL / VERIFIED
                    <span className="px-1.5 py-0.2 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                      Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Authoritative Gazette notifications verified via official BIS archives.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={handlePreview}
              disabled={!selectedFile || previewLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
            >
              {previewLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
              ) : (
                <Eye className="w-4 h-4 text-indigo-400" />
              )}
              <span>Preview & Validate</span>
            </button>

            <button
              onClick={handleExecuteImport}
              disabled={!selectedFile || importLoading || (previewData && !previewData.is_valid)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {importLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Layers className="w-4 h-4 text-white" />
              )}
              <span>Stage as Draft Knowledge</span>
            </button>
          </div>
        </div>

        {/* Right Column: Ingestion Preview & Validation Diagnostics */}
        <div className="lg:col-span-2 space-y-5 bg-slate-900 border border-slate-800 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>2. Validation & Deduplication Preview</span>
            </h2>
            {previewData && (
              <span
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  previewData.is_valid
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                {previewData.is_valid ? 'Validation Passed' : 'Errors Detected'}
              </span>
            )}
          </div>

          {previewData ? (
            <div className="space-y-5">
              {/* Telemetry Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400">Total Records</div>
                  <div className="text-lg font-bold text-white font-mono mt-0.5">
                    {previewData.total_records}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400">Standards / Clauses</div>
                  <div className="text-sm font-semibold text-slate-200 mt-0.5">
                    {previewData.standards_count} std / {previewData.requirements_count} req
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400">Valid Records</div>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-0.5">
                    {previewData.valid_records}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-xs text-slate-400">Duplicates Skipped</div>
                  <div className="text-lg font-bold text-amber-400 font-mono mt-0.5">
                    {previewData.duplicates_found}
                  </div>
                </div>
              </div>

              {/* Validation Errors Notice */}
              {previewData.errors && previewData.errors.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Row Validation Diagnostics ({previewData.errors.length})</span>
                  </h3>
                  <div className="max-h-48 overflow-y-auto border border-rose-500/20 rounded-xl bg-rose-500/5">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-rose-500/10 text-rose-300 font-mono text-[11px] sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Row / Item</th>
                          <th className="px-3 py-2">Entity</th>
                          <th className="px-3 py-2">Field</th>
                          <th className="px-3 py-2">Error Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-500/10 text-slate-300">
                        {previewData.errors.map((err, idx) => (
                          <tr key={idx} className="hover:bg-rose-500/10">
                            <td className="px-3 py-1.5 font-mono text-slate-400">{err.index_or_row}</td>
                            <td className="px-3 py-1.5 uppercase font-mono text-[11px]">{err.record_type}</td>
                            <td className="px-3 py-1.5 font-mono text-rose-300">{err.field}</td>
                            <td className="px-3 py-1.5 text-rose-200">{err.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Duplicate Matches Notice */}
              {previewData.duplicate_matches && previewData.duplicate_matches.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Existing Duplicate Matches ({previewData.duplicate_matches.length})</span>
                  </h3>
                  <div className="max-h-36 overflow-y-auto border border-amber-500/20 rounded-xl bg-amber-500/5">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-amber-500/10 text-amber-300 font-mono text-[11px] sticky top-0">
                        <tr>
                          <th className="px-3 py-2">Identifier</th>
                          <th className="px-3 py-2">Existing DB Title</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Policy Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-500/10 text-slate-300">
                        {previewData.duplicate_matches.map((m, idx) => (
                          <tr key={idx} className="hover:bg-amber-500/10">
                            <td className="px-3 py-1.5 font-mono font-medium text-white">{m.identifier}</td>
                            <td className="px-3 py-1.5 text-slate-300 truncate max-w-[200px]">{m.existing_title}</td>
                            <td className="px-3 py-1.5">{getStatusBadge(m.existing_status)}</td>
                            <td className="px-3 py-1.5 font-mono text-amber-300">{m.action_allowed}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sample Standards Preview */}
              {previewData.standards_preview && previewData.standards_preview.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Parsed Standards Sample
                  </h3>
                  <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-800/80 text-slate-400 font-mono text-[11px]">
                        <tr>
                          <th className="px-3 py-2">IS Code</th>
                          <th className="px-3 py-2">Standard Title</th>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2">Version</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-300">
                        {previewData.standards_preview.slice(0, 5).map((s, idx) => (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-mono font-semibold text-indigo-300">
                              {s.standard_number}
                            </td>
                            <td className="px-3 py-2 text-white">{s.title}</td>
                            <td className="px-3 py-2 text-slate-400">{s.category}</td>
                            <td className="px-3 py-2 font-mono">{s.version}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl text-slate-400">
              <FileText className="w-10 h-10 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-300">No active preview loaded</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Select or drop a standards data package on the left and click "Preview & Validate" to inspect schema validity and duplicates.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Ingestion Batch Jobs History */}
      <div className="space-y-4 bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Batch Ingestion Jobs History</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Chronological pipeline execution records, staging metrics, and error diagnostics.
            </p>
          </div>
          <button
            onClick={loadJobs}
            disabled={jobsLoading}
            className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${jobsLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {jobsLoading ? (
          <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
            <span className="text-xs">Loading ingestion history...</span>
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
            No ingestion jobs recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950/40">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-800/80 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="px-4 py-2.5">Job ID</th>
                  <th className="px-4 py-2.5">Source Filename</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5">Total Records</th>
                  <th className="px-4 py-2.5">Staged Successfully</th>
                  <th className="px-4 py-2.5">Failed Records</th>
                  <th className="px-4 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-850">
                    <td className="px-4 py-3 font-mono text-indigo-400 font-semibold">#{job.id}</td>
                    <td className="px-4 py-3 font-medium text-white">{job.filename}</td>
                    <td className="px-4 py-3">{getStatusBadge(job.status)}</td>
                    <td className="px-4 py-3 font-mono">{job.total_records}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-medium">
                      {job.successful_records}
                    </td>
                    <td className="px-4 py-3 font-mono text-rose-400 font-medium">
                      {job.failed_records}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(job.created_at).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleViewRecords(job)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                      >
                        <Eye className="w-3 h-3 text-indigo-400" />
                        <span>Inspect Records</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Inspector Drawer / Modal */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <span>Job #{selectedJob.id} Records: {selectedJob.filename}</span>
                  {getStatusBadge(selectedJob.status)}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Granular row-level records staged in the database for human review.
                </p>
              </div>
              <button
                onClick={() => setSelectedJob(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center gap-3">
              <span className="text-xs text-slate-400">Filter Status:</span>
              <div className="flex gap-1.5">
                {['', 'VALID', 'INVALID', 'SKIPPED', 'IMPORTED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setRecordStatusFilter(st)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                      recordStatusFilter === st
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st || 'All'}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Content Table */}
            <div className="flex-1 overflow-y-auto p-6">
              {recordsLoading ? (
                <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
                  <span className="text-xs">Loading records...</span>
                </div>
              ) : jobRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-dashed border-slate-800 rounded-xl">
                  No records matching the selected status filter.
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-800/80 text-slate-400 font-mono text-[11px] sticky top-0">
                      <tr>
                        <th className="px-3 py-2">ID</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Identifier</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Diagnostics / Errors</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      {jobRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-850">
                          <td className="px-3 py-2 font-mono text-slate-400">#{rec.id}</td>
                          <td className="px-3 py-2 font-mono uppercase text-[11px]">{rec.record_type}</td>
                          <td className="px-3 py-2 font-mono font-medium text-white">{rec.external_id || '-'}</td>
                          <td className="px-3 py-2">{getStatusBadge(rec.status)}</td>
                          <td className="px-3 py-2 text-slate-400">
                            {rec.error_message ? (
                              <span className="text-rose-400">{rec.error_message}</span>
                            ) : rec.created_entity_id ? (
                              <span className="text-emerald-400">
                                Created {rec.created_entity_type} #{rec.created_entity_id} (DRAFT)
                              </span>
                            ) : (
                              'Ready for review'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Total {jobRecords.length} records displayed
              </span>
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
