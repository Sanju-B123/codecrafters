import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  AlertOctagon,
  Info,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/utils/cn';

const statusConfigs = {
  PASS: {
    label: 'PASS',
    icon: CheckCircle2,
    className:
      'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  PARTIAL: {
    label: 'PARTIAL',
    icon: AlertTriangle,
    className:
      'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700',
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  MISSING: {
    label: 'MISSING',
    icon: XCircle,
    className:
      'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-700',
    iconClass: 'text-rose-600 dark:text-rose-400',
  },
  HIGH: {
    label: 'HIGH PRIORITY',
    icon: AlertOctagon,
    className:
      'bg-red-50 text-red-900 border-red-300 dark:bg-red-950/70 dark:text-red-300 dark:border-red-700',
    iconClass: 'text-red-600 dark:text-red-400',
  },
  MEDIUM: {
    label: 'MEDIUM PRIORITY',
    icon: AlertTriangle,
    className:
      'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-700',
    iconClass: 'text-amber-600 dark:text-amber-400',
  },
  LOW: {
    label: 'LOW PRIORITY',
    icon: Info,
    className:
      'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    iconClass: 'text-slate-500 dark:text-slate-400',
  },
  PROCESSING: {
    label: 'PROCESSING',
    icon: Loader2,
    className:
      'bg-blue-50 text-blue-900 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-700',
    iconClass: 'text-blue-600 dark:text-blue-400 animate-spin',
  },
  ANALYZING: {
    label: 'ANALYZING',
    icon: Loader2,
    className:
      'bg-indigo-50 text-indigo-900 border-indigo-300 dark:bg-indigo-950/70 dark:text-indigo-300 dark:border-indigo-700',
    iconClass: 'text-indigo-600 dark:text-indigo-400 animate-spin',
  },
  READY: {
    label: 'READY',
    icon: CheckCircle2,
    className:
      'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-700',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  DRAFT: {
    label: 'DRAFT',
    icon: Info,
    className:
      'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    iconClass: 'text-slate-500 dark:text-slate-400',
  },
  ARCHIVED: {
    label: 'ARCHIVED',
    icon: AlertCircle,
    className:
      'bg-stone-100 text-stone-700 border-stone-300 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
    iconClass: 'text-stone-500 dark:text-stone-400',
  },
  COMPLETED: {
    label: 'COMPLETED',
    icon: CheckCircle,
    className:
      'bg-teal-50 text-teal-900 border-teal-300 dark:bg-teal-950/70 dark:text-teal-300 dark:border-teal-700',
    iconClass: 'text-teal-600 dark:text-teal-400',
  },
  FAILED: {
    label: 'FAILED',
    icon: AlertCircle,
    className:
      'bg-rose-50 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-700',
    iconClass: 'text-rose-600 dark:text-rose-400',
  },
};

export const StatusBadge = ({
  status = 'PASS',
  label: customLabel,
  size = 'md',
  className,
  showIcon = true,
}) => {
  const normalizedKey = String(status).toUpperCase();
  const config = statusConfigs[normalizedKey] || {
    label: status,
    icon: Info,
    className: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300',
    iconClass: 'text-slate-500',
  };

  const Icon = config.icon;
  const displayText = customLabel || config.label;

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-0.5 text-xs gap-1.5',
    lg: 'px-3 py-1 text-xs gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      role="status"
      aria-label={`Status: ${displayText}`}
      className={cn(
        'inline-flex items-center font-bold uppercase tracking-wider rounded-md border select-none transition-colors',
        sizeStyles[size],
        config.className,
        className
      )}
    >
      {showIcon && (
        <Icon className={cn('flex-shrink-0', iconSizes[size], config.iconClass)} />
      )}
      <span>{displayText}</span>
    </span>
  );
};
