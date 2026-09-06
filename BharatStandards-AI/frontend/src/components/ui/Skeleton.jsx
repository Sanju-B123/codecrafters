import React from 'react';
import { cn } from '@/utils/cn';

export const Skeleton = ({ className, variant = 'text', ...props }) => {
  const variantStyles = {
    text: 'h-4 w-full rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-pulse bg-slate-200 dark:bg-slate-800 select-none',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
};
