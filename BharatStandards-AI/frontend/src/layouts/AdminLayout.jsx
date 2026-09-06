import React, { useState, useEffect } from 'react';
import { NavLink, Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  CheckSquare,
  FileText,
  Layers,
  Users,
  ShieldCheck,
  HeartPulse,
  LogOut,
  ArrowUpRight,
  Menu,
  X,
  Clock,
  ExternalLink,
  Shield,
  Activity,
  UploadCloud,
  FileCheck,
  Database,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { adminService } from '@/services/adminService';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, exact: true },
  { name: 'Knowledge Governance', path: '/admin/knowledge', icon: Database, exact: true },
  { name: 'Knowledge Ingestion', path: '/admin/knowledge/import', icon: UploadCloud },
  { name: 'Draft Review Inbox', path: '/admin/knowledge/review', icon: FileCheck },
  { name: 'Authoritative Sources', path: '/admin/knowledge/sources', icon: Globe },
  { name: 'Standards Registry', path: '/admin/standards', icon: BookOpen },
  { name: 'Requirements & Clauses', path: '/admin/requirements', icon: CheckSquare },
  { name: 'Platform Documents', path: '/admin/documents', icon: FileText },
  { name: 'BIS Services & Schemes', path: '/admin/services', icon: Layers },
  { name: 'User Management', path: '/admin/users', icon: Users },
  { name: 'Audit Stream', path: '/admin/audit', icon: Activity },
  { name: 'Subsystem Health', path: '/admin/health', icon: HeartPulse },
];

export const AdminLayout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [timeStr, setTimeStr] = useState('');
  const [healthStatus, setHealthStatus] = useState('HEALTHY');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-IN', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' IST'
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Quick background health probe
    adminService
      .getHealth()
      .then((res) => setHealthStatus(res.overall_status || 'HEALTHY'))
      .catch(() => setHealthStatus('DEGRADED'));
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Telemetry & Clearance Notice */}
      <header className="h-14 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            aria-label="Toggle Navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 tracking-wide">
                  BharatStandards
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Admin Console
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Status Indicators & Exit */}
        <div className="flex items-center gap-3 sm:gap-4 text-xs font-mono">
          {/* Health Pill */}
          <Link
            to="/admin/health"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-700 transition"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                healthStatus === 'HEALTHY'
                  ? 'bg-emerald-500 animate-pulse'
                  : healthStatus === 'DEGRADED'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span className="hidden sm:inline font-sans font-medium text-[11px]">
              {healthStatus}
            </span>
          </Link>

          {/* Clock */}
          <div className="hidden md:flex items-center gap-1.5 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeStr}</span>
          </div>

          {/* Exit to User App */}
          <Link
            to="/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-sans text-xs font-medium transition"
          >
            <span>Exit to App</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation (Desktop) */}
        <aside
          className={`fixed inset-y-14 left-0 z-30 w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between transition-transform duration-200 lg:static lg:translate-x-0 ${
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="space-y-6">
            <div>
              <div className="px-3 mb-2 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
                Governance & Knowledge
              </div>
              <nav className="space-y-1">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            {/* Quick Stats banner */}
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-xs text-amber-900">
              <div className="flex items-center gap-1.5 text-amber-700 font-semibold mb-1 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Audit Enforced</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                All administrative mutations are automatically signed with user IP and timestamp.
              </p>
            </div>
          </div>

          {/* User Profile & Logout */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold text-sm">
                {user?.name ? user.name[0].toUpperCase() : 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Administrator'}</div>
                <div className="text-xs text-slate-500 truncate">{user?.email}</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out session</span>
            </button>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 lg:hidden"
          />
        )}

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
