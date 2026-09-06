import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, NavLink, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/common/Sidebar';
import {
  Menu,
  X,
  Bell,
  Search,
  User,
  Shield,
  ShieldCheck,
  LayoutDashboard,
  Bot,
  Compass,
  CheckCircle2,
  AlertTriangle,
  FileCheck2,
  History,
  Trash2,
  Check,
  ArrowRight,
  LogOut,
  Layers,
  FileText,
  BookOpen,
  Cpu,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { DISCLAIMER_TEXT } from '@/constants';
import { Badge } from '@/components/ui';
import { notificationService } from '@/services/notificationService';
import { apiClient } from '@/services/apiClient';

export const DashboardLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsList, setNotificationsList] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const notifRef = useRef(null);
  const searchRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const getPageTitle = (path) => {
    if (path.startsWith('/dashboard')) return 'Enterprise Dashboard';
    if (path.startsWith('/products')) return 'Product Registry';
    if (path.startsWith('/standards')) return 'Indian Standards Catalog';
    if (path.startsWith('/documents')) return 'Document Intelligence Vault';
    if (path.startsWith('/compliance')) return 'Compliance Readiness Engine';
    if (path.startsWith('/assistant')) return 'AI Standards & BIS Copilot';
    if (path.startsWith('/services')) return 'BIS Services & Journey Guide';
    if (path.startsWith('/reports')) return 'Compliance Audit Reports';
    if (path.startsWith('/activity')) return 'Activity Log & Audit Trail';
    if (path.startsWith('/profile')) return 'Organization Profile';
    if (path.startsWith('/settings')) return 'Console Settings';
    if (path.startsWith('/design-system')) return 'GovTech UI/UX Design System';
    return 'Console';
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await notificationService.getUnreadCount();
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      // silently handle background count failure
    }
  };

  const fetchNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const res = await notificationService.getNotifications(undefined, 1, 10);
      setNotificationsList(res.items || []);
      setUnreadCount(res.unread_count || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (notificationsOpen) {
      fetchNotifications();
    }
  }, [notificationsOpen]);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await apiClient.get(`/search?q=${encodeURIComponent(searchQuery.trim())}&limit=4`);
        setSearchResults(data);
        setSearchOpen(true);
      } catch (err) {
        console.error('Global search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotificationsList((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotificationsList((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      const target = notificationsList.find((n) => n.id === id);
      if (target && !target.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
      setNotificationsList((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleNotificationClick = async (n) => {
    if (!n.is_read) {
      try {
        await notificationService.markAsRead(n.id);
        setNotificationsList((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch (err) {
        // ignore
      }
    }
    setNotificationsOpen(false);

    if (n.entity_type === 'compliance_report' && n.entity_id) {
      navigate(`/compliance/${n.entity_id}`);
    } else if (n.entity_type === 'report' && n.entity_id) {
      navigate(`/reports/${n.entity_id}`);
    } else if (n.entity_type === 'document') {
      navigate('/documents');
    } else if (n.entity_type === 'product' && n.entity_id) {
      navigate(`/products/${n.entity_id}`);
    } else {
      navigate('/activity');
    }
  };

  const formatRelativeTime = (isoString) => {
    if (!isoString) return '';
    const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getNotificationIconConfig = (type) => {
    switch (type) {
      case 'COMPLIANCE_GAP':
      case 'DOCUMENT_FAILED':
      case 'ERROR':
        return { icon: AlertTriangle, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/40' };
      case 'COMPLIANCE_COMPLETED':
      case 'DOCUMENT_PROCESSED':
      case 'SUCCESS':
        return { icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40' };
      case 'REPORT_READY':
        return { icon: FileCheck2, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/40' };
      case 'ACCOUNT_SECURITY':
      case 'SYSTEM':
      case 'WELCOME':
        return { icon: ShieldCheck, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40' };
      default:
        return { icon: Bell, color: 'text-bharat-500 bg-bharat-50 dark:bg-bharat-950/40' };
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* 1. Desktop Persistent Sidebar */}
      <Sidebar className="hidden lg:flex flex-shrink-0" />

      {/* 2. Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-2xl z-10">
            <div className="absolute top-3 right-3 z-20">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar onLinkClick={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* 3. Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 lg:pb-0">
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm text-left">
          {/* Left: Mobile hamburger & Page Title */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                {getPageTitle(location.pathname)}
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                BharatStandards AI • Verified BIS Conformance Assistant
              </p>
            </div>
          </div>

          {/* Center: Search input */}
          <div className="hidden md:flex items-center flex-1 max-w-md mx-6 relative" ref={searchRef}>
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onFocus={() => {
                  if (searchResults) setSearchOpen(true);
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, IS standards, documents..."
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-bharat-500 focus:bg-white dark:focus:bg-slate-900 transition-all"
              />
              {isSearching ? (
                <Loader2 className="w-3.5 h-3.5 text-bharat-500 animate-spin absolute right-3 top-2.5" />
              ) : searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSearchResults(null);
                    setSearchOpen(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 absolute right-2 top-1.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : null}
            </div>

            {/* Floating Search Results Dropdown */}
            {searchOpen && searchResults && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 text-left max-h-[440px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 animate-in fade-in zoom-in-95 duration-100">
                {searchResults.total_matches === 0 ? (
                  <div className="p-5 text-center text-xs text-slate-400">
                    No matching products, standards, or documents found for <span className="font-semibold text-slate-700 dark:text-slate-300">"{searchQuery}"</span>.
                  </div>
                ) : (
                  <>
                    {/* Products */}
                    {searchResults.products?.length > 0 && (
                      <div className="p-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                          <Layers className="w-3 h-3 text-bharat-600" />
                          <span>Products ({searchResults.products.length})</span>
                        </div>
                        {searchResults.products.map((p) => (
                          <div
                            key={`prod-${p.id}`}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery('');
                              navigate(p.url);
                            }}
                            className="px-2.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                          >
                            <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-bharat-600 dark:group-hover:text-bharat-400 truncate">
                              {p.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {p.subtitle}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Standards */}
                    {searchResults.standards?.length > 0 && (
                      <div className="p-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                          <BookOpen className="w-3 h-3 text-emerald-600" />
                          <span>Indian Standards ({searchResults.standards.length})</span>
                        </div>
                        {searchResults.standards.map((s) => (
                          <div
                            key={`std-${s.id}`}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery('');
                              navigate(s.url);
                            }}
                            className="px-2.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                          >
                            <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 truncate">
                              {s.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {s.subtitle}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Requirements / Clauses */}
                    {searchResults.requirements?.length > 0 && (
                      <div className="p-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                          <FileText className="w-3 h-3 text-indigo-600" />
                          <span>Clauses & Requirements ({searchResults.requirements.length})</span>
                        </div>
                        {searchResults.requirements.map((r) => (
                          <div
                            key={`req-${r.id}`}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery('');
                              navigate(r.url);
                            }}
                            className="px-2.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                          >
                            <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 truncate">
                              {r.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {r.subtitle}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Documents */}
                    {searchResults.documents?.length > 0 && (
                      <div className="p-2">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1 flex items-center gap-1.5">
                          <FileCheck2 className="w-3 h-3 text-amber-600" />
                          <span>Documents ({searchResults.documents.length})</span>
                        </div>
                        {searchResults.documents.map((d) => (
                          <div
                            key={`doc-${d.id}`}
                            onClick={() => {
                              setSearchOpen(false);
                              setSearchQuery('');
                              navigate(d.url);
                            }}
                            className="px-2.5 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors group"
                          >
                            <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 truncate">
                              {d.title}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {d.subtitle}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right: Notifications, User Avatar & Name */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notifications with Dropdown */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen((prev) => !prev)}
                className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 relative rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Notifications"
                aria-label="View notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-saffron-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 space-y-3 z-50 text-left animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <Badge variant="primary" size="sm">
                          {unreadCount} UNREAD
                        </Badge>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-bharat-600 dark:text-bharat-400 hover:underline font-semibold flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Mark all read</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {loadingNotifs ? (
                      <div className="py-8 text-center text-xs text-slate-400">Loading notifications...</div>
                    ) : notificationsList.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">No notifications yet</div>
                    ) : (
                      notificationsList.map((n) => {
                        const { icon: Icon, color } = getNotificationIconConfig(n.type);
                        return (
                          <div
                            key={n.id}
                            onClick={() => handleNotificationClick(n)}
                            className={`group relative p-2.5 rounded-xl transition-colors flex items-start gap-2.5 text-xs cursor-pointer ${
                              !n.is_read
                                ? 'bg-slate-50 dark:bg-slate-800/60 border-l-2 border-saffron-500'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                            }`}
                          >
                            <div className={`p-1.5 rounded-lg flex-shrink-0 mt-0.5 ${color}`}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                              <div className="font-semibold text-slate-900 dark:text-white flex items-center justify-between">
                                <span className="truncate">{n.title}</span>
                                <span className="text-[10px] text-slate-400 font-normal ml-1 flex-shrink-0">
                                  {formatRelativeTime(n.created_at)}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                                {n.message}
                              </p>
                            </div>

                            {/* Hover Actions: Mark Read & Delete */}
                            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              {!n.is_read && (
                                <button
                                  type="button"
                                  title="Mark as read"
                                  onClick={(e) => handleMarkAsRead(e, n.id)}
                                  className="p-1 rounded text-slate-400 hover:text-emerald-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                                >
                                  <Check className="w-3 h-3" />
                                </button>
                              )}
                              <button
                                type="button"
                                title="Dismiss notification"
                                onClick={(e) => handleDeleteNotification(e, n.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-200 dark:hover:bg-slate-700"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 flex items-center justify-between">
                    <Link
                      to="/activity"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-semibold text-bharat-600 dark:text-bharat-400 hover:text-bharat-700 dark:hover:text-bharat-300 flex items-center gap-1.5 transition-colors"
                    >
                      <span>View Activity Log & Audit Trail</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* User Avatar & Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-slate-200 dark:border-slate-800 hover:opacity-85 transition-opacity"
                aria-label="User account menu"
              >
                <div className="w-8 h-8 rounded-full bg-bharat-900 dark:bg-bharat-600 text-white flex items-center justify-center font-bold text-xs shadow-inner">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </div>
                <div className="hidden md:block text-left leading-tight">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[130px]">
                    {user?.name || 'Industry Lead'}
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    {user?.role || 'Industry'}
                  </div>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 text-xs text-left space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {user?.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                      {user?.email}
                    </div>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                  >
                    <User className="w-4 h-4 text-bharat-600" />
                    <span>User Profile</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                  >
                    <Shield className="w-4 h-4 text-amber-500" />
                    <span>Settings & Security</span>
                  </Link>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        setUserMenuOpen(false);
                        await logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-medium transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Official Mandatory Disclaimer Bar */}
        <div className="bg-amber-50/90 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/80 px-4 sm:px-8 py-2 text-[11px] text-amber-900 dark:text-amber-300 flex items-center gap-2 text-left">
          <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <span className="truncate">{DISCLAIMER_TEXT}</span>
        </div>

        {/* Dynamic Main Workspace Container */}
        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* 4. Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-t border-slate-200 dark:border-slate-800 z-40 flex items-center justify-around px-2"
      >
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center text-[10px] font-bold ${
              isActive
                ? 'text-bharat-900 dark:text-bharat-400'
                : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </NavLink>
        <NavLink
          to="/assistant"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center text-[10px] font-bold ${
              isActive
                ? 'text-bharat-900 dark:text-bharat-400'
                : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <Bot className="w-5 h-5 mb-0.5" />
          <span>Copilot</span>
        </NavLink>
        <NavLink
          to="/standards"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center text-[10px] font-bold ${
              isActive
                ? 'text-bharat-900 dark:text-bharat-400'
                : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <Compass className="w-5 h-5 mb-0.5" />
          <span>Standards</span>
        </NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center text-[10px] font-bold ${
              isActive
                ? 'text-bharat-900 dark:text-bharat-400'
                : 'text-slate-500 dark:text-slate-400'
            }`
          }
        >
          <User className="w-5 h-5 mb-0.5" />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};
