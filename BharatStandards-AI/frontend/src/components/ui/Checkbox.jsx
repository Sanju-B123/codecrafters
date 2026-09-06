import React, { useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export const Checkbox = React.forwardRef(
  (
    {
      label,
      description,
      checked = false,
      onChange,
      id: customId,
      className,
      disabled = false,
      error,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;

    return (
      <div className={cn('flex items-start gap-2.5 text-left', className)}>
        <div className="relative flex items-center mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="peer sr-only"
            {...props}
          />
          <label
            htmlFor={id}
            className={cn(
              'w-4 h-4 rounded border flex items-center justify-center transition-all cursor-pointer select-none',
              checked
                ? 'bg-bharat-900 dark:bg-bharat-600 border-bharat-900 dark:border-bharat-600 text-white'
                : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-transparent',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-bharat-700 dark:peer-focus-visible:ring-bharat-400 peer-focus-visible:ring-offset-2',
              disabled && 'opacity-50 cursor-not-allowed',
              error && 'border-rose-500'
            )}
          >
            <Check className={cn('w-3 h-3 stroke-[3]', checked ? 'block' : 'hidden')} />
          </label>
        </div>

        {(label || description) && (
          <div className="text-xs select-none">
            {label && (
              <label
                htmlFor={id}
                className={cn(
                  'font-medium text-slate-800 dark:text-slate-200 cursor-pointer block',
                  disabled && 'opacity-50 cursor-not-allowed'
                )}
              >
                {label}
              </label>
            )}
            {description && (
              <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">{description}</p>
            )}
            {error && <p className="text-rose-600 text-[11px] mt-0.5">{error}</p>}
          </div>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
