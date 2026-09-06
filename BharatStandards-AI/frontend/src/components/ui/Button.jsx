import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

const buttonVariants = {
  primary:
    'bg-bharat-900 text-white hover:bg-bharat-800 active:bg-bharat-950 dark:bg-bharat-600 dark:hover:bg-bharat-500 shadow-sm border border-bharat-900/10 dark:border-transparent',
  secondary:
    'bg-slate-100 text-slate-800 hover:bg-slate-200 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700',
  outline:
    'bg-transparent text-slate-800 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800',
  destructive:
    'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 dark:bg-rose-700 dark:hover:bg-rose-600 shadow-sm border border-transparent',
  link:
    'bg-transparent text-bharat-800 hover:underline dark:text-bharat-400 p-0 h-auto font-medium',
};

const buttonSizes = {
  xs: 'px-2.5 py-1 text-[11px] rounded-md gap-1.5',
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-xs font-semibold rounded-lg gap-2',
  lg: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2.5',
};

export const Button = React.forwardRef(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled = false,
      startIcon = null,
      endIcon = null,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-none select-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          buttonVariants[variant],
          variant !== 'link' && buttonSizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-current" />
        ) : (
          startIcon && <span className="flex-shrink-0">{startIcon}</span>
        )}
        <span>{children}</span>
        {!loading && endIcon && <span className="flex-shrink-0">{endIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
