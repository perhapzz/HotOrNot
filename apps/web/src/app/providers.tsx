'use client';

import { useEffect } from 'react';
import { reportWebVitals } from '@/lib/web-vitals';
import { ToastProvider } from '@/components/Toast';

/**
 * Client-side providers wrapper.
 * Initializes Web Vitals collection on mount.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    reportWebVitals();
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  return <ToastProvider>{children}</ToastProvider>;
}
