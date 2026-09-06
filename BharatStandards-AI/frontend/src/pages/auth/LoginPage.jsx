import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button, Input, Checkbox, Alert } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Destination from previous navigation state
  const fromLocation = location.state?.from?.pathname;

  const validate = () => {
    const nextErrors = {};
    if (!formData.email.trim()) {
      nextErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (authError) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSuccessMessage('');
    try {
      const authenticatedUser = await login(
        formData.email.trim(),
        formData.password,
        formData.rememberMe
      );

      setSuccessMessage('Signed in successfully! Redirecting...');

      // Determine redirect destination based on role or original request
      setTimeout(() => {
        if (fromLocation) {
          navigate(fromLocation, { replace: true });
        } else if (authenticatedUser.role === 'consumer') {
          navigate('/consumer-dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 600);
    } catch (err) {
      // Error is set in AuthContext and handled below
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = async (email, password) => {
    setFormData({ email, password, rememberMe: false });
    setIsSubmitting(true);
    setSuccessMessage('');
    try {
      const authenticatedUser = await login(email, password, false);
      setSuccessMessage('Signed in successfully! Redirecting...');
      setTimeout(() => {
        if (fromLocation) {
          navigate(fromLocation, { replace: true });
        } else if (authenticatedUser.role === 'ADMIN' || authenticatedUser.role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (authenticatedUser.role === 'consumer') {
          navigate('/consumer-dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 500);
    } catch (err) {
      // Handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0B254508_1px,transparent_1px),linear-gradient(to_bottom,#0B254508_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 space-y-6 text-left">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <div className="w-12 h-12 bg-bharat-900 rounded-xl mx-auto flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform">
              <ShieldCheck className="w-7 h-7 text-saffron-400" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Sign In to BharatStandards AI
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Access your intelligent compliance workspace and standards copilot
          </p>
        </div>

        {/* Quick Demo Access Bar for SIH Evaluation */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
              1-Click Demo Evaluation Login
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              DEMO DATA
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('demo@bharatstandards.ai', 'DemoUser123!')}
              disabled={isSubmitting}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-bharat-900 hover:bg-bharat-800 text-white shadow-sm text-center transition-colors disabled:opacity-50"
            >
              🏢 Industry Officer
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('admin@bharatstandards.ai', 'Admin@123456')}
              disabled={isSubmitting}
              className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-700 hover:bg-indigo-600 text-white shadow-sm text-center transition-colors disabled:opacity-50"
            >
              ⚖️ BIS Admin
            </button>
          </div>
        </div>

        {/* API Error Alert */}
        {authError && (
          <Alert variant="destructive" className="text-xs">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{authError}</span>
            </div>
          </Alert>
        )}

        {/* Success Alert */}
        {successMessage && (
          <Alert variant="success" className="text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          </Alert>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email Field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@company.in or citizen@gmail.com"
                disabled={isSubmitting}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 dark:text-white transition-colors focus:outline-none focus:ring-2 ${
                  errors.email
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-bharat-500'
                }`}
                required
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-bharat-800 dark:text-bharat-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={isSubmitting}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 dark:text-white transition-colors focus:outline-none focus:ring-2 ${
                  errors.password
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-bharat-500'
                }`}
                required
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.password}</p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between text-xs">
            <label className="flex items-center gap-2 text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isSubmitting}
                className="rounded border-slate-300 dark:border-slate-700 text-bharat-900 focus:ring-bharat-500 cursor-pointer"
              />
              <span>Remember this session</span>
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            variant="primary"
            loading={isSubmitting}
            disabled={isSubmitting}
            className="w-full text-sm font-semibold shadow-md"
            endIcon={!isSubmitting && <ArrowRight className="w-4 h-4" />}
          >
            {isSubmitting ? 'Verifying Credentials...' : 'Sign In'}
          </Button>
        </form>

        {/* Footer Links */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-bold text-bharat-800 dark:text-bharat-400 hover:underline"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
};
