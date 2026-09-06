import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/utils/cn';

const toastIcons = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: AlertCircle,
  info: Info,
};

const toastStyles = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-100',
  warning: 'border-amber-200 bg-amber-50 text-amber-950 dark:bg-amber-950/80 dark:border-amber-800 dark:text-amber-100',
  error: 'border-rose-200 bg-rose-50 text-rose-950 dark:bg-rose-950/80 dark:border-rose-800 dark:text-rose-100',
  info: 'border-blue-200 bg-blue-50 text-blue-950 dark:bg-blue-950/80 dark:border-blue-800 dark:text-blue-100',
};

const iconStyles = {
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  error: 'text-rose-600 dark:text-rose-400',
  info: 'text-blue-600 dark:text-blue-400',
};

export const Toast = ({ id, type = 'info', title, message, onClose }) => {
  const Icon = toastIcons[type] || Info;

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-3 p-4 rounded-xl border shadow-premium w-full max-w-sm transition-all animate-in slide-in-from-top-2 duration-200',
        toastStyles[type]
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconStyles[type])} />
      <div className="flex-1 text-xs text-left">
        {title && <div className="font-bold text-sm tracking-tight mb-0.5">{title}</div>}
        <div className="leading-relaxed opacity-90">{message}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={() => onClose(id)}
          aria-label="Dismiss notification"
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 -mr-1 -mt-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
