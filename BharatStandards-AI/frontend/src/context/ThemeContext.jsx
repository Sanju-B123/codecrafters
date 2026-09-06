import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(undefined);

export const ThemeProvider = ({ children }) => {
  // Always lock to normal (light) mode - no other modes
  const theme = 'light';

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    try {
      localStorage.setItem('bharat_theme', 'light');
    } catch (e) {
      // ignore
    }
  }, []);

  const setTheme = () => {
    const root = document.documentElement;
    root.classList.remove('dark');
  };

  const toggleTheme = () => {
    const root = document.documentElement;
    root.classList.remove('dark');
  };

  return (
    <ThemeContext.Provider value={{ theme: 'light', setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

