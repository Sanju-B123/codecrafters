import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, Compass, FileCheck2, ArrowRight, LogOut, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button } from '@/components/ui';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const dashboardTarget = user?.role === 'consumer' ? '/consumer-dashboard' : '/dashboard';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-bharat-900 to-bharat-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-saffron-400" />
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                BharatStandards<span className="text-saffron-600">.AI</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                SIH Prototype
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Intelligent BIS Compliance Copilot
            </p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Link to="/#how-it-works" className="hover:text-bharat-800 dark:hover:text-white transition-colors">
            How it Works
          </Link>
          <Link
            to="/standards"
            className="hover:text-bharat-800 dark:hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Compass className="w-4 h-4 text-slate-400" />
            <span>Standards Explorer</span>
          </Link>
          <Link
            to="/services"
            className="hover:text-bharat-800 dark:hover:text-white transition-colors flex items-center gap-1.5"
          >
            <FileCheck2 className="w-4 h-4 text-slate-400" />
            <span>BIS Services</span>
          </Link>
        </nav>

        {/* Auth Actions */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link to={dashboardTarget} className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-bharat-100 dark:bg-bharat-900 text-bharat-800 dark:text-bharat-200 flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {user.name}
                  </div>
                  <Badge
                    variant={user.role === 'consumer' ? 'saffron' : 'primary'}
                    size="sm"
                    className="text-[9px] py-0 px-1.5"
                  >
                    {user.role}
                  </Badge>
                </div>
              </Link>

              <Button
                size="xs"
                variant="outline"
                onClick={handleLogout}
                title="Log out"
                startIcon={<LogOut className="w-3.5 h-3.5 text-slate-500" />}
              >
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white px-3 py-2 rounded-md transition-colors"
              >
                Sign In
              </Link>
              <Link to="/register">
                <Button
                  size="sm"
                  variant="primary"
                  className="shadow-sm gap-1.5 text-xs font-semibold"
                  endIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Create Account
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
