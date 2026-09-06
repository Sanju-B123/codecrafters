import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-bharat-900 rounded-xl mx-auto flex items-center justify-center text-white shadow-md">
            <ShieldCheck className="w-7 h-7 text-saffron-400" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Reset Password
          </h2>
          <p className="text-xs text-slate-500">
            Enter your official registered email address to receive password reset instructions.
          </p>
        </div>

        <form className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                placeholder="you@company.in"
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-bharat-500"
                required
              />
            </div>
          </div>

          <button
            type="button"
            className="w-full py-3 px-4 rounded-xl bg-bharat-900 hover:bg-bharat-800 text-white font-semibold text-sm shadow-md transition-all"
          >
            Send Reset Link
          </button>
        </form>

        <div className="pt-4 border-t border-slate-100 text-center text-xs">
          <Link to="/login" className="font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
