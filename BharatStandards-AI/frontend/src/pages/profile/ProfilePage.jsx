import React, { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  ShieldCheck,
  CheckCircle2,
  Save,
  Loader2,
  AlertCircle,
  Tag,
  Camera,
  Calendar,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/ToastContext';
import { userService } from '@/services/userService';
import {
  Button,
  Badge,
  StatusBadge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Skeleton,
  Alert,
} from '@/components/ui';

export const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const { addToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [apiError, setApiError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'industry',
    phone: '',
    organization: '',
    industry: '',
    designation: '',
    location: '',
    interests: '',
    avatarUrl: '',
    createdAt: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      setLoading(true);
      setApiError(null);
      try {
        const userData = await userService.getCurrentUser();
        if (isMounted && userData) {
          const profile = userData.profile || {};
          setFormData({
            name: userData.name || '',
            email: userData.email || '',
            role: userData.role || 'industry',
            phone: profile.phone || '',
            organization: profile.organization || '',
            industry: profile.industry || '',
            designation: profile.designation || '',
            location: profile.location || '',
            interests: profile.interests || '',
            avatarUrl: profile.avatar_url || '',
            createdAt: userData.created_at || '',
          });
        }
      } catch (err) {
        if (isMounted) {
          setApiError(err.message || 'Failed to load user profile information.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (apiError) setApiError(null);
  };

  const validate = () => {
    const nextErrors = {};
    if (!formData.name.trim()) {
      nextErrors.name = 'Full name is required';
    } else if (formData.name.trim().length < 2) {
      nextErrors.name = 'Full name must be at least 2 characters';
    }

    if (formData.phone && !/^[+0-9\s-]{7,20}$/.test(formData.phone.trim())) {
      nextErrors.phone = 'Please enter a valid phone number';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    setApiError(null);

    try {
      const updatedUser = await userService.updateProfile({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        organization: formData.organization.trim(),
        industry: formData.industry.trim(),
        designation: formData.designation.trim(),
        location: formData.location.trim(),
        interests: formData.interests.trim(),
      });

      addToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Profile updated successfully.',
      });
    } catch (err) {
      setApiError(err.message || 'Failed to update profile.');
      addToast({
        type: 'error',
        title: 'Update Error',
        message: err.message || 'Unable to update profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const formattedJoinDate = formData.createdAt
    ? new Date(formData.createdAt).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'September 2026';

  if (loading) {
    return (
      <div className="space-y-6 text-left max-w-6xl mx-auto">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <Skeleton className="h-80 w-full rounded-2xl" />
          </div>
          <div className="lg:col-span-8 space-y-6">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  const isIndustry = formData.role === 'industry';

  return (
    <div className="space-y-6 text-left max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          User & Organization Profile
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your verified credentials, contact details, and role parameters.
        </p>
      </div>

      {apiError && (
        <Alert variant="destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{apiError}</span>
          </div>
        </Alert>
      )}

      {/* Main Responsive Grid */}
      <form onSubmit={handleSaveProfile}>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column (4 cols): User Card & Avatar Summary */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="text-center p-6 sm:p-7">
              {/* Avatar Photo with status badge */}
              <div className="relative inline-block mx-auto mb-4">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-bharat-900 to-bharat-700 text-white flex items-center justify-center font-extrabold text-3xl shadow-lg border-2 border-white dark:border-slate-800">
                  {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white" title="Active Verified Account">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {formData.name || 'Anonymous User'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate font-mono">
                {formData.email}
              </p>

              <div className="mt-3 flex items-center justify-center gap-2">
                <Badge
                  variant={isIndustry ? 'primary' : 'saffron'}
                  size="sm"
                >
                  {isIndustry ? 'INDUSTRY / MANUFACTURER' : 'CONSUMER / CITIZEN'}
                </Badge>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2.5 text-left">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Account Status</span>
                  </span>
                  <StatusBadge status="COMPLETED" label="ACTIVE" size="sm" />
                </div>

                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Member Since</span>
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formattedJoinDate}
                  </span>
                </div>
              </div>
            </Card>

            {/* Quick Context Card */}
            <Card className="p-5 text-xs text-slate-600 dark:text-slate-400 space-y-2">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
                Security Policy
              </span>
              <p className="leading-relaxed">
                Primary email addresses are cryptographically bonded to your tenant workspace. Contact security administration to request official email transfers.
              </p>
            </Card>
          </div>

          {/* Right Column (8 cols): Personal Info & Role-Aware Details */}
          <div className="lg:col-span-8 space-y-6">
            {/* 1. Personal Information */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="w-5 h-5 text-bharat-700 dark:text-bharat-400" />
                  <span>Personal Information</span>
                </CardTitle>
                <CardDescription>
                  Update your primary contact identity and phone communication details.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Full Name (Editable) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Rajesh Kumar Verma"
                      disabled={saving}
                      className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 dark:text-white transition-colors focus:outline-none focus:ring-2 ${
                        errors.name
                          ? 'border-rose-300 focus:ring-rose-500'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-bharat-500'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.name}</p>
                    )}
                  </div>

                  {/* Phone Number (Editable) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Contact Phone
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 98765 43210"
                        disabled={saving}
                        className={`w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 dark:text-white transition-colors focus:outline-none focus:ring-2 ${
                          errors.phone
                            ? 'border-rose-300 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-bharat-500'
                        }`}
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-[11px] text-rose-600 font-medium">{errors.phone}</p>
                    )}
                  </div>
                </div>

                {/* Email (Readonly) */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Email Address
                    </label>
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      VERIFIED PRIMARY
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      value={formData.email}
                      disabled
                      className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    Email address is tied to your cryptographic security token and cannot be freely modified.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 2. Organization Information (Role-Aware) */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base flex items-center gap-2">
                  {isIndustry ? (
                    <Building2 className="w-5 h-5 text-bharat-700 dark:text-bharat-400" />
                  ) : (
                    <Tag className="w-5 h-5 text-saffron-600 dark:text-saffron-400" />
                  )}
                  <span>
                    {isIndustry
                      ? 'Enterprise & Manufacturing Information'
                      : 'Consumer Location & Product Interests'}
                  </span>
                </CardTitle>
                <CardDescription>
                  {isIndustry
                    ? 'Configure factory plant details for pre-submission BIS audits and lab mapping.'
                    : 'Personalize the standards directory for products you frequently verify.'}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {isIndustry ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Organization Name */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          Organization / Company Name
                        </label>
                        <div className="relative">
                          <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            name="organization"
                            value={formData.organization}
                            onChange={handleChange}
                            placeholder="e.g. Bharat Appliances Ltd."
                            disabled={saving}
                            className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-bharat-500"
                          />
                        </div>
                      </div>

                      {/* Industry Sector */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          Industry Sector
                        </label>
                        <div className="relative">
                          <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            name="industry"
                            value={formData.industry}
                            onChange={handleChange}
                            placeholder="e.g. Electrical Appliances & Electronics"
                            disabled={saving}
                            className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-bharat-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Designation */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          Professional Designation
                        </label>
                        <input
                          type="text"
                          name="designation"
                          value={formData.designation}
                          onChange={handleChange}
                          placeholder="e.g. Quality Assurance Manager"
                          disabled={saving}
                          className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-bharat-500"
                        />
                      </div>

                      {/* Manufacturing Location */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                          Manufacturing Plant Location
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="e.g. Faridabad Industrial Area, Haryana"
                            disabled={saving}
                            className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-bharat-500"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Consumer Location */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        City / State Location
                      </label>
                      <div className="relative">
                        <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          name="location"
                          value={formData.location}
                          onChange={handleChange}
                          placeholder="e.g. Pune, Maharashtra"
                          disabled={saving}
                          className="w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-bharat-500"
                        />
                      </div>
                    </div>

                    {/* Consumer Product Interests */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                        Product Categories of Interest
                      </label>
                      <input
                        type="text"
                        name="interests"
                        value={formData.interests}
                        onChange={handleChange}
                        placeholder="e.g. Water Heaters, Solar Inverters, Gold Hallmarking, Food Safety"
                        disabled={saving}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-bharat-500"
                      />
                      <p className="mt-1 text-[11px] text-slate-400">
                        Enter comma-separated product sectors to receive tailored safety and standards alerts.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>

              <CardFooter className="flex justify-end gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  loading={saving}
                  disabled={saving}
                  startIcon={!saving && <Save className="w-4 h-4" />}
                >
                  {saving ? 'Saving Profile...' : 'Save Profile Updates'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};
