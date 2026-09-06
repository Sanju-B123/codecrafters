import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export const LoadingState = ({
  message = 'Loading compliance data...',
  description,
  className,
}) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'p-10 text-center flex flex-col items-center justify-center space-y-3',
        className
      )}
    >
      <div className="w-10 h-10 rounded-xl bg-bharat-50 dark:bg-bharat-950/60 border border-bharat-200 dark:border-bharat-800 flex items-center justify-center text-bharat-800 dark:text-bharat-400">
        <Loader2 className="w-5 h-5 animate-spin text-current" />
      </div>

      <div className="space-y-1">
        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 tracking-tight">
          {message}
        </div>
        {description && (
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};
