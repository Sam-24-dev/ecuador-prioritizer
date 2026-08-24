import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to conditionally merge Tailwind CSS classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format score (0.0 to 1.0) into a human readable scale (0 to 100)
 */
export function formatScorePercentage(score: number): number {
  return Math.round(score * 100);
}

/**
 * Format date string into readable Spanish locale format
 */
export function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}
