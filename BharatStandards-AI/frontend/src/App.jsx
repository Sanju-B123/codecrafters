import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from '@/routes/AppRoutes';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/ui/ToastContext';
import { mongoStorageService } from '@/services/mongoStorageService';

export const App = () => {
  useEffect(() => {
    // Automatically synchronize client session metadata with MongoDB
    mongoStorageService.loadState('client_preferences').then((state) => {
      if (!state) {
        mongoStorageService.saveState('client_preferences', {
          initialized_at: new Date().toISOString(),
          app_version: '1.0.0',
          client_platform: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        });
      }
    });
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
