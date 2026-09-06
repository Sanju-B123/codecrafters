import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/utils/cn';

const TabsContext = createContext(undefined);

export const Tabs = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}) => {
  const [internalTab, setInternalTab] = useState(defaultValue);
  const activeTab = value !== undefined ? value : internalTab;

  const setActiveTab = (newTab) => {
    if (value === undefined) {
      setInternalTab(newTab);
    }
    if (onValueChange) {
      onValueChange(newTab);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={cn('w-full text-left space-y-4', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabList = ({ children, variant = 'underline', className }) => {
  return (
    <div
      role="tablist"
      className={cn(
        'flex items-center gap-2 overflow-x-auto select-none',
        variant === 'underline' && 'border-b border-slate-200 dark:border-slate-800',
        variant === 'pills' && 'p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl',
        className
      )}
    >
      {children}
    </div>
  );
};

export const TabTrigger = ({
  value,
  children,
  icon,
  badge,
  variant = 'underline',
  className,
}) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabTrigger must be used inside Tabs');

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => setActiveTab(value)}
      className={cn(
        'inline-flex items-center gap-2 text-xs font-semibold whitespace-nowrap transition-all focus-visible:outline-none',
        variant === 'underline' &&
          cn(
            'py-3 px-3 -mb-px border-b-2',
            isActive
              ? 'border-bharat-900 text-bharat-900 dark:border-bharat-400 dark:text-bharat-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:border-slate-300'
          ),
        variant === 'pills' &&
          cn(
            'py-1.5 px-3 rounded-lg',
            isActive
              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm font-bold'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          ),
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {badge && <span className="ml-1 flex-shrink-0">{badge}</span>}
    </button>
  );
};

export const TabContent = ({ value, children, className }) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabContent must be used inside Tabs');

  if (context.activeTab !== value) return null;

  return (
    <div
      role="tabpanel"
      className={cn('animate-in fade-in-0 duration-150', className)}
    >
      {children}
    </div>
  );
};
