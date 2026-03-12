import type { ReactNode } from 'react';

export interface SkeletonProps {
  lines?: number;
  variant?: 'lines' | 'card';
  className?: string;
}

export function Skeleton({ lines = 3, variant = 'lines', className = '' }: SkeletonProps) {
  if (variant === 'card') {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-5 w-3/4 rounded bg-neutral-200" />
        <div className="h-4 w-full rounded bg-neutral-200" />
        <div className="h-4 w-full rounded bg-neutral-200" />
        <div className="h-4 w-5/6 rounded bg-neutral-200" />
      </div>
    );
  }
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 rounded bg-neutral-200"
          style={{ width: i === lines - 1 && lines > 1 ? '75%' : '100%' }}
        />
      ))}
    </div>
  );
}
