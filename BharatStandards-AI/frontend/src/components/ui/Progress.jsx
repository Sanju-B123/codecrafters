import React from 'react';
import { cn } from '@/utils/cn';

export const Progress = ({
  value = 0,
  max = 100,
  segments,
  size = 'md',
  showLabel = false,
  label,
  className,
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const sizeClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className={cn('w-full text-left space-y-1.5', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
          <span>{label || 'Progress'}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn(
          'w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex',
          sizeClasses[size]
        )}
      >
        {segments && segments.length > 0 ? (
          segments.map((seg, idx) => (
            <div
              key={idx}
              style={{ width: `${(seg.value / max) * 100}%` }}
              className={cn('h-full transition-all duration-300', seg.className)}
              title={seg.title || `${seg.value}`}
            />
          ))
        ) : (
          <div
            style={{ width: `${percentage}%` }}
            className="h-full bg-bharat-900 dark:bg-bharat-500 rounded-full transition-all duration-300"
          />
        )}
      </div>
    </div>
  );
};
