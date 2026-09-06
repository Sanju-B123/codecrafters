import React from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { cn } from '@/utils/cn';

const alertVariants = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-950 dark:bg-blue-950/60 dark:border-blue-800 dark:text-blue-100',
    icon: Info,
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-950 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-100',
    icon: CheckCircle2,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-950 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-100',
    icon: AlertTriangle,
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  destructive: {
    container: 'bg-rose-50 border-rose-200 text-rose-950 dark:bg-rose-950/60 dark:border-rose-800 dark:text-rose-100',
    icon: AlertCircle,
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
};

export const Alert = ({
  variant = 'info',
  title,
  children,
  onClose,
  className,
}) => {
  const config = alertVariants[variant] || alertVariants.info;
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn(
        'p-4 rounded-xl border flex items-start gap-3 text-xs text-left',
        config.container,
        className
      )}
    >
      <Icon className={cn('w-4 h-4 flex-shrink-0 mt-0.5', config.iconColor)} />
      <div className="flex-1 space-y-0.5">
        {title && <h5 className="font-bold text-sm tracking-tight">{title}</h5>}
        <div className="leading-relaxed opacity-90">{children}</div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 -mr-1 -mt-1 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export const AlertTitle = ({ children, className, ...props }) => (
  <h5 className={cn('font-bold text-sm tracking-tight text-slate-900 dark:text-white', className)} {...props}>
    {children}
  </h5>
);

export const AlertDescription = ({ children, className, ...props }) => (
  <div className={cn('text-xs leading-relaxed opacity-90', className)} {...props}>
    {children}
  </div>
);

