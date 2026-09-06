import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Users,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { Button, Alert } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'industry', // 'industry' or 'consumer'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validate = () => {
    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      nextErrors.name = 'Full name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      nextErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      nextErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      nextErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = 'Password confirmation is required';
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (authError) {
      clearError();
    }
  };

  const handleRoleSelect = (selectedRole) => {
    setFormData((prev) => ({ ...prev, role: selectedRole }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const newUser = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirm_password: formData.confirmPassword,
        role: formData.role,
      });

      setSuccessMessage('Account registered successfully! Redirecting to workspace...');

      setTimeout(() => {
        if (newUser.role === 'consumer') {
          navigate('/consumer-dashboard', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      }, 700);
    } catch (err) {
      // Handled via AuthContext error
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0B254508_1px,transparent_1px),linear-gradient(to_bottom,#0B254508_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      <div className="relative max-w-lg w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 space-y-6 text-left">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-block">
            <div className="w-12 h-12 bg-bharat-900 rounded-xl mx-auto flex items-center justify-center text-white shadow-md hover:scale-105 transition-transform">
              <ShieldCheck className="w-7 h-7 text-saffron-400" />
            </div>
          </Link>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Create BharatStandards Account
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select your account type to configure your standards compliance workspace
          </p>
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

        {/* User Type (Role) Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            Select Account Persona
          </label>
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => handleRoleSelect('industry')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                formData.role === 'industry'
                  ? 'bg-white dark:bg-slate-900 text-bharat-900 dark:text-bharat-300 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4 text-bharat-600 dark:text-bharat-400" />
              <span>Industry / Manufacturer</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('consumer')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                formData.role === 'consumer'
                  ? 'bg-white dark:bg-slate-900 text-saffron-700 dark:text-saffron-400 shadow-sm border border-slate-200 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users className="w-4 h-4 text-saffron-600 dark:text-saffron-400" />
              <span>Consumer / Citizen</span>
            </button>
          </div>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Rajesh Kumar"
                disabled={isSubmitting}
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 dark:text-white transition-colors focus:outline-none focus:ring-2 ${
                  errors.name
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-slate-300 dark:border-slate-700 focus:ring-bharat-500'
                }`}
                required
              />
            </div>
            {errors.name && (
              <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.name}</p>
            )}
          </div>

          {/* Email Address */}
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
                placeholder={
                  formData.role === 'industry'
                    ? 'rajesh@company.in'
                    : 'rajesh.consumer@gmail.com'
                }
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

          {/* Password and Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Min 8 characters"
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  disabled={isSubmitting}
                  className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-white dark:bg-slate-800 dark:text-white transition-colors focus:outline-none focus:ring-2 ${
                    errors.confirmPassword
                      ? 'border-rose-300 focus:ring-rose-500'
                      : 'border-slate-300 dark:border-slate-700 focus:ring-bharat-500'
                  }`}
                  required
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-[11px] text-rose-600 font-medium">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400">
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span>Passphrase will be salted & hashed using bcrypt. Never stored in plaintext.</span>
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
            {isSubmitting ? 'Creating Account...' : 'Complete Registration'}
          </Button>
        </form>

        {/* Footer Links */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          Already registered?{' '}
          <Link
            to="/login"
            className="font-bold text-bharat-800 dark:text-bharat-400 hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
