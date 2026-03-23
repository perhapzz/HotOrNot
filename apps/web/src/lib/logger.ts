/**
 * Structured Logger
 *
 * - Production: JSON format (machine-readable)
 * - Development: human-readable colored output
 *
 * Usage:
 *   import { logger } from '@/lib/logger';
 *   logger.info('Server started', { port: 3000 });
 *   logger.error('Request failed', { path: '/api/test', error: err.message });
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context?: string;
  message: string;
  [key: string]: unknown;
}

const isProduction = process.env.NODE_ENV === 'production';

function formatTimestamp(): string {
  return new Date().toISOString();
}

function createLogEntry(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>
): LogEntry {
  return {
    timestamp: formatTimestamp(),
    level,
    message,
    ...data,
  };
}

const LEVEL_COLORS: Record<LogLevel, string> = {
  info: '\x1b[36m',   // cyan
  warn: '\x1b[33m',   // yellow
  error: '\x1b[31m',  // red
};
const RESET = '\x1b[0m';

const LEVEL_ICONS: Record<LogLevel, string> = {
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

function logDev(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  const color = LEVEL_COLORS[level];
  const icon = LEVEL_ICONS[level];
  const time = new Date().toLocaleTimeString();
  const ctx = data?.context ? `[${data.context}] ` : '';
  const extra = data
    ? Object.entries(data)
        .filter(([k]) => k !== 'context')
        .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`)
        .join(' ')
    : '';

  const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  consoleFn(`${color}${icon} ${time} ${ctx}${message}${extra ? ' ' + extra : ''}${RESET}`);
}

function logProd(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  const entry = createLogEntry(level, message, data);
  const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  consoleFn(JSON.stringify(entry));
}

function log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
  if (isProduction) {
    logProd(level, message, data);
  } else {
    logDev(level, message, data);
  }
}

/**
 * Create a child logger with a fixed context
 */
function createLogger(context: string) {
  return {
    info: (message: string, data?: Record<string, unknown>) =>
      log('info', message, { context, ...data }),
    warn: (message: string, data?: Record<string, unknown>) =>
      log('warn', message, { context, ...data }),
    error: (message: string, data?: Record<string, unknown>) =>
      log('error', message, { context, ...data }),
  };
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => log('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => log('error', message, data),
  child: createLogger,
};

export type Logger = typeof logger;
