'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/web-vitals';

/**
 * Client-side providers wrapper.
 * Initializes Web Vitals collection on mount.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    reportWebVitals();
  }, []);

  return <>{children}</>;
}
