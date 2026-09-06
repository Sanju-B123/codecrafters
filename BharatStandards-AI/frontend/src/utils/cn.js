import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines Tailwind CSS class names cleanly, resolving conflicts with twMerge.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
