import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Compass,
  FileCheck2,
  ArrowRight,
  LogOut,
  User,
  Menu,
  X,
  Bot,
  Layers,
  Sparkles,
  LayoutDashboard,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Badge, Button } from '@/components/ui';

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu whenever location changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    navigate('/login');
  };

  const dashboardTarget = user?.role === 'consumer' ? '/consumer-dashboard' : '/dashboard';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center space-x-2.5 sm:space-x-3 group flex-shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-bharat-900 to-bharat-700 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
            <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-saffron-400" />
          </div>
          <div className="text-left">
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white">
                BharatStandards<span className="text-saffron-600">.AI</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                SIH Prototype
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden lg:block">
              Intelligent BIS Compliance Copilot
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 text-sm font-medium text-slate-600 dark:text-slate-300">
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
          <Link
            to="/assistant"
            className="hover:text-bharat-800 dark:hover:text-white transition-colors flex items-center gap-1.5"
          >
            <Bot className="w-4 h-4 text-saffron-500" />
            <span>AI Copilot</span>
          </Link>
        </nav>

        {/* Desktop Auth Actions */}
        <div className="hidden md:flex items-center space-x-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <Link to={dashboardTarget} className="flex items-center gap-2 text-left hover:opacity-80 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-bharat-100 dark:bg-bharat-900 text-bharat-800 dark:text-bharat-200 flex items-center justify-center font-bold text-xs">
                  {user.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div>
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
                Logout
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

        {/* Mobile Header Actions: Avatar/SignIn & Hamburger Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {isAuthenticated && user ? (
            <Link
              to={dashboardTarget}
              className="w-8 h-8 rounded-full bg-bharat-900 text-white flex items-center justify-center font-bold text-xs shadow-sm"
              title="Dashboard"
            >
              {user.name ? user.name[0].toUpperCase() : 'U'}
            </Link>
          ) : (
            <Link
              to="/login"
              className="text-xs font-bold text-bharat-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg"
            >
              Sign In
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer / Dropdown */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 top-16 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Panel */}
          <div className="fixed top-16 left-0 right-0 max-h-[calc(100vh-4rem)] overflow-y-auto bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-2xl p-4 sm:p-6 z-50 md:hidden text-left space-y-4 animate-in slide-in-from-top-2 duration-200">
            {/* User status card on mobile */}
            {isAuthenticated && user && (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-bharat-900 dark:bg-bharat-600 text-white flex items-center justify-center font-bold text-sm">
                    {user.name ? user.name[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {user.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                      {user.email}
                    </div>
                  </div>
                </div>
                <Badge variant={user.role === 'consumer' ? 'saffron' : 'primary'} size="sm">
                  {user.role}
                </Badge>
              </div>
            )}

            {/* Navigation links with rich icons */}
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Navigation
              </div>

              <Link
                to="/standards"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
              >
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-900 dark:text-white">Standards Explorer</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    Search 20,000+ Indian Standards
                  </div>
                </div>
              </Link>

              <Link
                to="/services"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
              >
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-900 dark:text-white">BIS Services & Schemes</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    Scheme-I ISI mark, CRS & testing roadmaps
                  </div>
                </div>
              </Link>

              <Link
                to="/assistant"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
              >
                <div className="p-2 rounded-lg bg-saffron-50 dark:bg-saffron-950/60 text-saffron-600 dark:text-saffron-400">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-900 dark:text-white">AI Standards Copilot</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    Grounded AI compliance reasoning & assistance
                  </div>
                </div>
              </Link>

              <Link
                to="/products/new"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
              >
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-900 dark:text-white">Check My Product</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    Evaluate compliance readiness in minutes
                  </div>
                </div>
              </Link>

              <Link
                to="/#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3.5 p-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold text-xs transition-colors"
              >
                <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-slate-900 dark:text-white">How It Works</div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-normal">
                    Discover, Understand, Verify, Fix, Guide
                  </div>
                </div>
              </Link>
            </div>

            {/* Mobile Actions: Login, Register, or Dashboard */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              {isAuthenticated && user ? (
                <>
                  <Link
                    to={dashboardTarget}
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-bharat-900 text-white font-bold text-xs shadow-md active:scale-[0.98] transition-transform"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Go to Console Dashboard</span>
                  </Link>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 font-semibold text-xs transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center py-3 px-4 rounded-xl bg-bharat-900 text-white font-bold text-xs shadow-md hover:bg-bharat-800 transition-colors"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </header>
  );
};

export default Header;

