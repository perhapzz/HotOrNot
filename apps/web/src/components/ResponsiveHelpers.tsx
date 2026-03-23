"use client";

import { ReactNode } from "react";

/**
 * Wraps a table in a horizontal scroll container for mobile.
 */
export function ResponsiveTable({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 ${className}`}>
      <div className="min-w-[600px]">{children}</div>
    </div>
  );
}

/**
 * Mobile-friendly filter bar that collapses into a toggle on small screens.
 */
export function CollapsibleFilter({
  children,
  label = "筛选",
  className = "",
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  return (
    <details className={`sm:open ${className}`}>
      <summary className="sm:hidden cursor-pointer text-sm text-blue-600 dark:text-blue-400 mb-2 list-none flex items-center gap-1">
        <span>🔍</span> {label}
      </summary>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center flex-wrap">
        {children}
      </div>
    </details>
  );
}
