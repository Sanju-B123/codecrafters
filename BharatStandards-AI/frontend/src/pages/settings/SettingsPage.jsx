import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sun,
  Moon,
  Laptop,
  Bell,
  Languages,
  Lock,
  Shield,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Save,
  Key,
  LogOut,
  Trash2,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
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
  Alert,
  Dialog,
} from '@/components/ui';

export const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();
  const navigate = useNavigate();

  // Notification Preferences State
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    in_app_notifications: true,
    compliance_notifications: true,
    document_notifications: true,
    product_notifications: true,
    report_notifications: true,
    language: 'en',
  });
  const [savingPreferences, setSavingPreferences] = useState(false);

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState(null);

  // Account Deletion State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState(null);

  // Load preferences from profile on mount
  useEffect(() => {
    let isMounted = true;
    userService
      .getCurrentUser()
      .then((userData) => {
        if (isMounted && userData?.profile?.preferences) {
          const userPrefs = userData.profile.preferences;
          setPreferences((prev) => ({
            ...prev,
            email_notifications: userPrefs.email_notifications ?? true,
            in_app_notifications: userPrefs.in_app_notifications ?? true,
            compliance_notifications: userPrefs.compliance_notifications ?? true,
            document_notifications: userPrefs.document_notifications ?? true,
            product_notifications: userPrefs.product_notifications ?? true,
            report_notifications: userPrefs.report_notifications ?? true,
            language: userPrefs.language || 'en',
          }));
        }
      })
      .catch(() => {
        // Fallback to defaults
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Preference Toggle
  const handleTogglePreference = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    try {
      await userService.updatePreferences({
        ...preferences,
        theme,
      });
      addToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Settings saved.',
      });
    } catch (err) {
      addToast({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Unable to update preferences.',
      });
    } finally {
      setSavingPreferences(false);
    }
  };

  // Password Form Validation & Submit
  const validatePasswordForm = () => {
    const errs = {};
    if (!passwordForm.current_password) {
      errs.current_password = 'Current password is required';
    }
    if (!passwordForm.new_password) {
      errs.new_password = 'New password is required';
    } else if (passwordForm.new_password.length < 8) {
      errs.new_password = 'Password must be at least 8 characters';
    } else if (passwordForm.new_password === passwordForm.current_password) {
      errs.new_password = 'New password must differ from current password';
    }

    if (!passwordForm.confirm_new_password) {
      errs.confirm_new_password = 'Password confirmation is required';
    } else if (passwordForm.new_password !== passwordForm.confirm_new_password) {
      errs.confirm_new_password = 'Passwords do not match';
    }

    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setChangingPassword(true);
    setPasswordErrorMsg(null);

    try {
      await userService.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_new_password: passwordForm.confirm_new_password,
      });

      setPasswordForm({
        current_password: '',
        new_password: '',
        confirm_new_password: '',
      });

      addToast({
        type: 'success',
        title: 'Password Updated',
        message: 'Password changed successfully.',
      });
    } catch (err) {
      setPasswordErrorMsg(err.message || 'Failed to change password. Please check your current password.');
      addToast({
        type: 'error',
        title: 'Password Error',
        message: err.message || 'Failed to change password.',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  // Account Deletion
  const handleDeleteAccount = async () => {
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') return;

    setDeletingAccount(true);
    setDeleteErrorMsg(null);

    try {
      await userService.deleteAccount('DELETE');
      await logout();
      addToast({
        type: 'info',
        title: 'Account Deleted',
        message: 'Your account and data have been permanently removed.',
      });
      navigate('/register');
    } catch (err) {
      setDeleteErrorMsg(err.message || 'Failed to delete account.');
      setDeletingAccount(false);
    }
  };

  return (
    <div className="space-y-8 text-left max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Console Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Configure appearance, notification channels, security policies, and workspace preferences.
        </p>
      </div>

      {/* 1. Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sun className="w-5 h-5 text-amber-500" />
            <span>Interface Appearance</span>
          </CardTitle>
          <CardDescription>
            BharatStandards AI operates in standard normal mode for compliance readability and accessibility.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-xl border border-bharat-600 bg-bharat-50/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-bharat-200 flex items-center justify-center text-amber-500 shadow-sm">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-slate-900">Standard Normal Mode</div>
                <div className="text-xs text-slate-500">Clean GovTech daylight design system • High-contrast clarity</div>
              </div>
            </div>
            <Badge variant="primary" size="sm">ACTIVE</Badge>
          </div>
        </CardContent>
      </Card>

      {/* 2. Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-5 h-5 text-bharat-700 dark:text-bharat-400" />
            <span>Notification Preferences</span>
          </CardTitle>
          <CardDescription>
            Control how and when BharatStandards AI delivers standards alerts and pipeline updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
          {[
            {
              id: 'in_app_notifications',
              title: 'In-App notifications',
              desc: 'Display real-time notification alerts, unread counts, and activity updates in console header.',
            },
            {
              id: 'email_notifications',
              title: 'Email notifications',
              desc: 'Receive digest emails of standards amendments, gazette orders, and account notices.',
            },
            {
              id: 'compliance_notifications',
              title: 'Compliance notifications',
              desc: 'Immediate notifications when clause pass/fail status or readiness scores change.',
            },
            {
              id: 'document_notifications',
              title: 'Document processing notifications',
              desc: 'Alerts when uploaded NABL lab test reports complete parameter extraction.',
            },
            {
              id: 'product_notifications',
              title: 'Product analysis notifications',
              desc: 'Alerts on newly identified applicable standards and mandatory Quality Control Orders (QCOs).',
            },
            {
              id: 'report_notifications',
              title: 'Readiness report notifications',
              desc: 'Alerts when official readiness dossiers and PDF exports finish compiling.',
            },
          ].map((item) => (
            <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {item.title}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={preferences[item.id]}
                  onChange={() => handleTogglePreference(item.id)}
                  className="sr-only peer"
                />
                <div className="w-10 h-5 bg-slate-200 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-bharat-700"></div>
              </label>
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            type="button"
            variant="primary"
            size="sm"
            loading={savingPreferences}
            disabled={savingPreferences}
            onClick={handleSavePreferences}
            startIcon={!savingPreferences && <Save className="w-4 h-4" />}
          >
            {savingPreferences ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardFooter>
      </Card>

      {/* 3. Language Selection Architecture */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Languages className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            <span>Standard Portal Language</span>
          </CardTitle>
          <CardDescription>
            Select primary working language for standard definitions and interface guidance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-bharat-600 bg-bharat-50/40 dark:bg-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">English</div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">Official BIS Technical Specification Language</div>
              </div>
              <Badge variant="primary" size="sm">ACTIVE</Badge>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 opacity-70 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">हिन्दी (Hindi)</div>
                <div className="text-slate-500 dark:text-slate-400 text-[11px]">Indian Standard Monograms & Consumer Summaries</div>
              </div>
              <Badge variant="neutral" size="sm">COMING SOON</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Security Settings: Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-5 h-5 text-bharat-700 dark:text-bharat-400" />
            <span>Change Account Password</span>
          </CardTitle>
          <CardDescription>
            Update your passphrase. Passwords are never stored in plaintext and are salted with bcrypt.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg" noValidate>
            {passwordErrorMsg && (
              <Alert variant="destructive" className="text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{passwordErrorMsg}</span>
                </div>
              </Alert>
            )}

            {/* Current Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Current Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, current_password: e.target.value });
                    if (passwordErrors.current_password) setPasswordErrors({ ...passwordErrors, current_password: '' });
                  }}
                  placeholder="Enter current password"
                  disabled={changingPassword}
                  className={`w-full pl-9 pr-3.5 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 ${
                    passwordErrors.current_password
                      ? 'border-rose-300 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-bharat-500'
                  }`}
                />
              </div>
              {passwordErrors.current_password && (
                <p className="mt-1 text-[11px] text-rose-600">{passwordErrors.current_password}</p>
              )}
            </div>

            {/* New Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordForm.new_password}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, new_password: e.target.value });
                    if (passwordErrors.new_password) setPasswordErrors({ ...passwordErrors, new_password: '' });
                  }}
                  placeholder="Min 8 chars"
                  disabled={changingPassword}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 ${
                    passwordErrors.new_password
                      ? 'border-rose-300 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-bharat-500'
                  }`}
                />
                {passwordErrors.new_password && (
                  <p className="mt-1 text-[11px] text-rose-600">{passwordErrors.new_password}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Confirm New Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={passwordForm.confirm_new_password}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, confirm_new_password: e.target.value });
                    if (passwordErrors.confirm_new_password) setPasswordErrors({ ...passwordErrors, confirm_new_password: '' });
                  }}
                  placeholder="Repeat new password"
                  disabled={changingPassword}
                  className={`w-full px-3.5 py-2 text-sm rounded-xl border bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 ${
                    passwordErrors.confirm_new_password
                      ? 'border-rose-300 focus:ring-rose-500'
                      : 'border-slate-200 dark:border-slate-700 focus:ring-bharat-500'
                  }`}
                />
                {passwordErrors.confirm_new_password && (
                  <p className="mt-1 text-[11px] text-rose-600">{passwordErrors.confirm_new_password}</p>
                )}
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={changingPassword}
              disabled={changingPassword}
            >
              {changingPassword ? 'Updating Password...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 5. Account Security & Active Session */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Account Security & Active Session</span>
          </CardTitle>
          <CardDescription>
            View current authentication status and security token lifetime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  Active Web Session
                </span>
                <StatusBadge status="COMPLETED" label="ACTIVE" size="sm" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">
                Connected via JWT Bearer authentication • Encrypted SSL transport
              </p>
              <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Account Identity: {user?.email}</span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              startIcon={<LogOut className="w-3.5 h-3.5 text-rose-500" />}
              className="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900"
            >
              Terminate Session
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 6. Danger Zone (Delete Account) */}
      <Card className="border-rose-300 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10">
        <CardHeader>
          <CardTitle className="text-base text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription className="text-rose-800/80 dark:text-rose-400/80">
            Irreversible destructive actions regarding your workspace and organization account.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
            <span className="font-bold text-slate-900 dark:text-white block">
              Delete Account & Clear Compliance Dossiers
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Permanently remove your registered products, test evidence, audit reports, and user profile.
            </p>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setDeleteConfirmationText('');
              setDeleteErrorMsg(null);
              setDeleteModalOpen(true);
            }}
            startIcon={<Trash2 className="w-4 h-4" />}
          >
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Confirmation Dialog for Account Deletion */}
      <Dialog
        open={deleteModalOpen}
        onClose={() => !deletingAccount && setDeleteModalOpen(false)}
        title="Permanently Delete Account?"
        description="This action cannot be undone. All your evaluations, uploaded test evidence, and audit reports will be erased."
      >
        <div className="space-y-4 pt-2">
          {deleteErrorMsg && (
            <Alert variant="destructive">
              <span>{deleteErrorMsg}</span>
            </Alert>
          )}

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Please type <strong className="font-mono text-rose-600 bg-rose-50 dark:bg-rose-950 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800">DELETE</strong> in the box below to confirm your intent.
          </p>

          <input
            type="text"
            value={deleteConfirmationText}
            onChange={(e) => setDeleteConfirmationText(e.target.value)}
            placeholder="Type DELETE to confirm"
            disabled={deletingAccount}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={deletingAccount}
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteConfirmationText.trim().toUpperCase() !== 'DELETE' || deletingAccount}
              loading={deletingAccount}
              onClick={handleDeleteAccount}
            >
              {deletingAccount ? 'Deleting Account...' : 'Permanently Delete'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
