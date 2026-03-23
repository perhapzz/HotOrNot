'use client';

import { onCLS, onFID, onLCP, onTTFB, onINP, type Metric } from 'web-vitals';

export type VitalsReporter = (metric: Metric) => void;

/**
 * Default reporter: logs to console (dev) or JSON (prod).
 * Replace with analytics endpoint for production monitoring.
 */
const defaultReporter: VitalsReporter = (metric) => {
  const data = {
    name: metric.name,
    value: Math.round(metric.value),
    rating: metric.rating,        // 'good' | 'needs-improvement' | 'poor'
    delta: Math.round(metric.delta),
    id: metric.id,
    navigationType: metric.navigationType,
  };

  if (process.env.NODE_ENV === 'production') {
    // In production: structured JSON log, ready for analytics pipeline
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      context: 'web-vitals',
      ...data,
    }));
  } else {
    const color = metric.rating === 'good' ? '🟢' : metric.rating === 'needs-improvement' ? '🟡' : '🔴';
    console.log(`${color} [Web Vitals] ${metric.name}: ${data.value} (${metric.rating})`);
  }
};

/**
 * Initialize Web Vitals collection.
 * Call once from a client component (e.g., layout provider).
 *
 * @param reporter - Optional custom reporter. Defaults to console/JSON logging.
 *                   Pass your own to send metrics to an analytics endpoint.
 *
 * @example
 * // Send to analytics endpoint
 * reportWebVitals((metric) => {
 *   fetch('/api/vitals', {
 *     method: 'POST',
 *     body: JSON.stringify(metric),
 *   });
 * });
 */
export function reportWebVitals(reporter: VitalsReporter = defaultReporter): void {
  onCLS(reporter);
  onFID(reporter);
  onLCP(reporter);
  onTTFB(reporter);
  onINP(reporter);
}
