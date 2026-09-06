import React from 'react';
import { cn } from '@/utils/cn';

export const Radio = ({
  name,
  value,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className,
  id,
}) => {
  const inputId = id || `radio-${name}-${value}`;

  return (
    <div className={cn('flex items-start gap-2.5 text-left', className)}>
      <div className="relative flex items-center mt-0.5">
        <input
          type="radio"
          id={inputId}
          name={name}
          value={value}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer sr-only"
        />
        <label
          htmlFor={inputId}
          className={cn(
            'w-4 h-4 rounded-full border flex items-center justify-center transition-all cursor-pointer select-none',
            checked
              ? 'border-bharat-900 dark:border-bharat-500 bg-white dark:bg-slate-900'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900',
            'peer-focus-visible:ring-2 peer-focus-visible:ring-bharat-700 dark:peer-focus-visible:ring-bharat-400 peer-focus-visible:ring-offset-2',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {checked && (
            <span className="w-2 h-2 rounded-full bg-bharat-900 dark:bg-bharat-500 block" />
          )}
        </label>
      </div>

      {(label || description) && (
        <div className="text-xs select-none">
          {label && (
            <label
              htmlFor={inputId}
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
        </div>
      )}
    </div>
  );
};
