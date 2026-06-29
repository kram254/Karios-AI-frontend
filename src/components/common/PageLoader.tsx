/**
 * PageLoader — Full-page loading skeleton shown as the Suspense fallback
 * while a lazily-loaded route chunk is being fetched.
 *
 * Keeps the layout shell (sidebar + header chrome) visible and fills the
 * main content area with an animated skeleton so the page never feels blank.
 */
import React from 'react';

interface SkeletonBoxProps {
  className?: string;
}

const SkeletonBox: React.FC<SkeletonBoxProps> = ({ className = '' }) => (
  <div
    className={`animate-pulse rounded-lg bg-white/5 ${className}`}
    aria-hidden="true"
  />
);

const PageLoader: React.FC = () => {
  return (
    <div
      className="flex flex-col w-full h-full p-6 gap-4 bg-[var(--color-surface-base,#080808)]"
      role="status"
      aria-label="Loading page…"
    >
      {/* Top bar skeleton */}
      <div className="flex items-center gap-3 mb-2">
        <SkeletonBox className="h-7 w-40" />
        <SkeletonBox className="h-5 w-24" />
      </div>

      {/* Primary content card */}
      <SkeletonBox className="h-48 w-full" />

      {/* Two-column row */}
      <div className="flex gap-4">
        <SkeletonBox className="h-32 flex-1" />
        <SkeletonBox className="h-32 flex-1" />
        <SkeletonBox className="h-32 flex-1" />
      </div>

      {/* List rows */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonBox className="h-9 w-9 rounded-full flex-shrink-0" />
          <div className="flex flex-col gap-2 flex-1">
            <SkeletonBox className="h-3 w-3/4" />
            <SkeletonBox className="h-3 w-1/2" />
          </div>
          <SkeletonBox className="h-7 w-20 flex-shrink-0" />
        </div>
      ))}

      <span className="sr-only">Loading…</span>
    </div>
  );
};

export default PageLoader;
