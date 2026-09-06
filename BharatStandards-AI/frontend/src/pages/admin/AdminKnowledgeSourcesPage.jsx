import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Globe,
  ShieldCheck,
  ExternalLink,
  RefreshCw,
  Clock,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Lock,
  Building2,
  FileCheck2,
} from 'lucide-react';
import { knowledgeService } from '@/services/knowledgeService';

export const AdminKnowledgeSourcesPage = () => {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadSources = async () => {
    try {
      setLoading(true);
      const data = await knowledgeService.getSources();
      setSources(data || []);
    } catch (err) {
      console.error('Failed to load knowledge sources:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSources();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 text-left">
      {/* Back Link */}
      <Link
        to="/admin/knowledge"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to Knowledge Governance</span>
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Authoritative & Verified Knowledge Sources
            </h1>
            <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-800 text-blue-300 text-[10px] font-mono">
              Provenance Registry
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Registered upstream portals and gazette repositories providing authoritative standards, quality control orders (QCOs), and test protocols.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSources}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors self-start md:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Sources</span>
        </button>
      </div>

      {/* Provenance Guidelines Alert */}
      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-800/80 text-xs text-indigo-200 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-bold text-white">Provenance Classification Standard</h4>
          <p className="text-indigo-300/90 leading-relaxed text-[11px]">
            To ensure zero fabricated government procedures or regulatory outcomes, each standard and clause in BharatStandards AI is permanently linked to an authoritative knowledge source. Synthetic demonstration data is strictly demarcated with the <span className="font-mono font-bold text-amber-300">DEMO / SYNTHETIC</span> tag and excluded from official conformity claims.
          </p>
        </div>
      </div>

      {/* Sources Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 space-y-2">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-400 mx-auto" />
          <p>Loading registered knowledge sources...</p>
        </div>
      ) : sources.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-slate-900 border border-slate-800 rounded-2xl">
          <Globe className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p>No external knowledge sources registered.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((src) => {
            const isDemo = src.source_type === 'DEMO' || !src.is_verified;
            return (
              <div
                key={src.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                          Source #{src.id} • {src.source_type}
                        </span>
                        <h3 className="text-sm font-bold text-white leading-tight">
                          {src.name}
                        </h3>
                      </div>
                    </div>

                    <div>
                      {isDemo ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/60 text-amber-300 border border-amber-800">
                          DEMO / SYNTHETIC
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                          OFFICIAL / VERIFIED
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {src.description || 'No detailed source description provided.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span>
                      Authority: <strong className="text-slate-300 font-medium">{src.authority_level}</strong>
                    </span>
                    {src.last_checked_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>Verified {new Date(src.last_checked_at).toLocaleDateString()}</span>
                      </span>
                    )}
                  </div>

                  {src.url && (
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-semibold"
                    >
                      <span>Visit Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default AdminKnowledgeSourcesPage;
