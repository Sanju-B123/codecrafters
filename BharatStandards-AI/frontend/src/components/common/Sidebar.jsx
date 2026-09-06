import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  Box,
  Compass,
  FileText,
  CheckCircle2,
  Workflow,
  BarChart3,
  Bell,
  User,
  Settings,
  LogOut,
  ShieldCheck,
  HelpCircle,
  Palette,
  History,
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';

const primaryNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'AI Assistant', href: '/assistant', icon: Bot },
  { name: 'My Products', href: '/products', icon: Box },
  { name: 'Standards', href: '/standards', icon: Compass },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Compliance', href: '/compliance', icon: CheckCircle2 },
  { name: 'BIS Services', href: '/services', icon: Workflow },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Activity Log', href: '/activity', icon: History },
];

const secondaryNavigation = [
  { name: 'Profile', href: '/profile', icon: User },
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Design System', href: '/design-system', icon: Palette },
];

export const Sidebar = ({ className, onLinkClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'w-64 bg-slate-900 dark:bg-slate-950 text-slate-200 flex flex-col border-r border-slate-800 h-full select-none text-left',
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 flex items-center gap-3 border-b border-slate-800/80 bg-slate-950/50 flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-bharat-600 flex items-center justify-center text-white font-bold shadow-md">
          <ShieldCheck className="w-5 h-5 text-saffron-400" />
        </div>
        <div className="leading-tight">
          <span className="font-extrabold text-white tracking-tight text-sm block">
            BharatStandards<span className="text-saffron-400">.AI</span>
          </span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
            Compliance Copilot
          </span>
        </div>
      </div>

      {/* Navigation Scroll Area */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {/* Main Pipeline Links */}
        <div className="space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Standards & Compliance
          </div>
          {primaryNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onLinkClick}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-bharat-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  )
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-800/80" />

        {/* Account & Settings Links */}
        <div className="space-y-1">
          <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Workspace & Account
          </div>
          {secondaryNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                onClick={onLinkClick}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all',
                    isActive
                      ? 'bg-bharat-600 text-white shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                  )
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Admin Console Shortcut for Admins */}
        {String(user?.role || '').toUpperCase() === 'ADMIN' && (
          <div className="space-y-1 pt-2">
            <div className="px-3 pb-1.5 text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
              System Administration
            </div>
            <NavLink
              to="/admin"
              onClick={onLinkClick}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-900/60 hover:text-white transition-all shadow-sm"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Admin Console</span>
              </div>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-indigo-500/30 text-indigo-200">
                OPERATIONAL
              </span>
            </NavLink>
          </div>
        )}
      </div>


      {/* User Info & Logout Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 space-y-2 flex-shrink-0">
        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-bharat-700 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {user?.name || 'Industry Lead'}
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                {user?.email || 'authorized@session.in'}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 border border-transparent hover:border-rose-900/40 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};
