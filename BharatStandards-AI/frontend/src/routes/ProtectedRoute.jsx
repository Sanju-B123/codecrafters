import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2, ShieldCheck } from 'lucide-react';

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="w-12 h-12 rounded-2xl bg-bharat-900 text-white flex items-center justify-center mb-4 shadow-lg">
          <ShieldCheck className="w-7 h-7 text-saffron-400" />
        </div>
        <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-sm font-semibold">
          <Loader2 className="w-4 h-4 animate-spin text-bharat-600" />
          <span>Verifying security credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? children : <Outlet />;
};
