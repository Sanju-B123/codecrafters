import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, LogOut, Home, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const AccessDeniedPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 selection:bg-rose-500 selection:text-white">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-rose-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-lg w-full bg-slate-900/90 border border-rose-500/20 rounded-2xl p-8 backdrop-blur-xl shadow-2xl shadow-rose-950/40 text-center">
        {/* Shield Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-6 shadow-lg shadow-rose-950/60">
          <ShieldX className="w-8 h-8 animate-pulse" />
        </div>

        {/* Status code and title */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/30 mb-3">
          <Lock className="w-3.5 h-3.5" />
          HTTP 403 • FORBIDDEN
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Administrative Clearance Required
        </h1>
        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
          The requested console requires elevated <span className="text-rose-400 font-mono font-semibold">ADMIN</span> privileges. 
          Standard industry and consumer user accounts are restricted from accessing system telemetry, governance tools, and core knowledge indexing.
        </p>

        {/* Security context card */}
        <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 mb-6 text-left font-mono text-xs text-slate-400 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500">Authenticated User:</span>
            <span className="text-slate-200 truncate max-w-[200px]">{user?.email || 'Unknown'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Assigned Role:</span>
            <span className="text-amber-400 font-semibold">{user?.role || 'Unspecified'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Access Policy:</span>
            <span className="text-rose-400">Strict RBAC (Backend Enforced)</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium transition border border-slate-700 hover:border-slate-600"
          >
            <Home className="w-4 h-4" />
            Return to Dashboard
          </Link>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-sm font-medium transition border border-rose-500/40"
          >
            <LogOut className="w-4 h-4" />
            Switch Account
          </button>
        </div>
      </div>
    </div>
  );
};
