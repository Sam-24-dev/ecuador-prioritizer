import { useId } from 'react';
import { cn } from '@/lib/utils';

interface BrandMarkProps {
  className?: string;
  decorative?: boolean;
}

export function BrandMark({ className, decorative = false }: BrandMarkProps) {
  const titleId = useId();

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={cn('shrink-0', className)}
      aria-hidden={decorative || undefined}
      aria-labelledby={decorative ? undefined : titleId}
      role={decorative ? undefined : 'img'}
    >
      {!decorative && <title id={titleId}>Ecuador Prioritizer</title>}
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="square" strokeLinejoin="miter">
        <path d="M5 6H15L25 24" />
        <path d="M5 15H17L25 24" />
        <path d="M5 24H25" />
        <path d="M5 33H17L25 24" />
        <path d="M5 42H15L25 24" />
      </g>
      <circle cx="25" cy="24" r="2.5" fill="currentColor" />
    </svg>
  );
}