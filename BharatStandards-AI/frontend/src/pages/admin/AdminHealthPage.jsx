import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Server,
  Database,
  Cpu,
  FileText,
  Sparkles,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { adminService } from '@/services/adminService';
import { mongoStorageService } from '@/services/mongoStorageService';

export const AdminHealthPage = () => {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [probing, setProbing] = useState(false);
  const [syncingMongo, setSyncingMongo] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const runHealthProbe = async () => {
    try {
      setProbing(true);
      const data = await adminService.getHealth();
      setHealth(data);
    } catch (err) {
      console.error('Failed to probe health diagnostics:', err);
    } finally {
      setLoading(false);
      setProbing(false);
    }
  };

  const handleSyncMongo = async () => {
    try {
      setSyncingMongo(true);
      setSyncResult(null);
      const res = await mongoStorageService.triggerSync();
      setSyncResult(`Successfully synced ${res.total_records} records across ${res.synced_tables} collections into MongoDB.`);
      await runHealthProbe();
    } catch (err) {
      setSyncResult(`MongoDB sync error: ${err.message}`);
    } finally {
      setSyncingMongo(false);
    }
  };

  useEffect(() => {
    runHealthProbe();
  }, []);

  const getSubsystemIcon = (key) => {
    switch (key) {
      case 'database':
      case 'mongodb':
        return Database;
      case 'api_gateway':
        return Server;
      case 'document_processing':
        return FileText;
      case 'ai_reasoning_engine':
        return Cpu;
      case 'vector_embedding_service':
        return Sparkles;
      default:
        return Server;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
        <span className="text-sm font-medium">Running real subsystem health probes...</span>
      </div>
    );
  }

  const overall = health?.overall_status || 'UNKNOWN';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Health & Telemetry Diagnostics</h1>
          <p className="text-slate-400 text-sm mt-1">
            Real-time latency testing and availability probes across core platform infrastructure.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSyncMongo}
            disabled={syncingMongo || probing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
          >
            <Database className={`w-3.5 h-3.5 ${syncingMongo ? 'animate-pulse' : ''}`} />
            <span>{syncingMongo ? 'Syncing to MongoDB...' : 'Sync SQL to MongoDB'}</span>
          </button>

          <button
            onClick={runHealthProbe}
            disabled={probing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${probing ? 'animate-spin' : ''}`} />
            <span>Re-run Probes</span>
          </button>
        </div>
      </div>

      {/* Sync Notification Banner */}
      {syncResult && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{syncResult}</span>
          </div>
          <button
            onClick={() => setSyncResult(null)}
            className="text-slate-400 hover:text-white"
          >
            &times;
          </button>
        </div>
      )}

      {/* Overall Health Status Banner */}
      <div
        className={`p-6 rounded-2xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
          overall === 'HEALTHY'
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
            : overall === 'DEGRADED'
            ? 'bg-amber-950/20 border-amber-500/30 text-amber-300'
            : 'bg-rose-950/20 border-rose-500/30 text-rose-300'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
              overall === 'HEALTHY'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            }`}
          >
            <HeartPulse className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-mono uppercase tracking-wider font-semibold">
              Platform Status
            </div>
            <div className="text-xl font-bold text-white mt-0.5">
              {overall === 'HEALTHY'
                ? 'All Subsystems Operational'
                : overall === 'DEGRADED'
                ? 'Subsystems Operating with Degraded Fallbacks'
                : 'Service Unavailable'}
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>Last Probe: {new Date(health?.timestamp).toLocaleTimeString('en-IN')}</span>
        </div>
      </div>

      {/* Subsystem Probes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {health?.subsystems &&
          Object.entries(health.subsystems).map(([key, sub]) => {
            const Icon = getSubsystemIcon(key);
            const isHealthy = sub.status === 'HEALTHY';

            return (
              <div
                key={key}
                className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-indigo-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white capitalize">
                        {key.replace(/_/g, ' ')}
                      </h3>
                      <span className="text-[10px] font-mono text-slate-400">Subsystem Probe</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-bold ${
                      isHealthy
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {sub.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 mb-3">
                  {sub.details}
                </p>

                {sub.latency_ms !== undefined && sub.latency_ms > 0 && (
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1">
                    <span>Query Latency:</span>
                    <span className="text-emerald-400 font-bold">{sub.latency_ms} ms</span>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};
