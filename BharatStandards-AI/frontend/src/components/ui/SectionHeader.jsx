import React from 'react';
import { cn } from '@/utils/cn';

export const SectionHeader = ({
  title,
  subtitle,
  badge,
  action,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left mb-4',
        className
      )}
    >
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h2>
          {badge && <div>{badge}</div>}
        </div>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>

      {action && <div className="self-start sm:self-center">{action}</div>}
    </div>
  );
};
