import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/utils/cn';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  className,
}) => {
  return (
    <div
      className={cn(
        'p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-left flex items-start justify-between gap-4 transition-all hover:shadow-md',
        className
      )}
    >
      <div className="space-y-1 flex-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
          {title}
        </span>
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          {value}
        </div>

        {(subtitle || trend) && (
          <div className="pt-1 flex items-center gap-2 text-xs">
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 font-semibold text-[11px] px-1.5 py-0.5 rounded',
                  trend === 'up'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                )}
              >
                {trend === 'up' ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {trendLabel}
              </span>
            )}
            {subtitle && (
              <span className="text-slate-500 dark:text-slate-400 text-[11px]">{subtitle}</span>
            )}
          </div>
        )}
      </div>

      {icon && (
        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
    </div>
  );
};
