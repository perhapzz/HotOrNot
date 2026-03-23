import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './lib/rate-limiter';

/**
 * Next.js Middleware — API rate limiting + request logging
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const start = Date.now();
  const method = request.method;
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown';

  const result = checkRateLimit(ip, pathname);

  if (!result.allowed) {
    const duration = Date.now() - start;
    logRequest(method, pathname, 429, duration);
    return NextResponse.json(
      {
        success: false,
        error: 'Too many requests',
        message: `请求过于频繁，请 ${result.retryAfter} 秒后重试`,
        retryAfter: result.retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(result.retryAfter),
          'X-RateLimit-Limit': String(result.limit),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));

  const duration = Date.now() - start;
  logRequest(method, pathname, 200, duration);

  return response;
}

/**
 * Log API request (uses console directly since logger may not be available in Edge runtime)
 */
function logRequest(method: string, path: string, status: number, durationMs: number) {
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    console.log(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      context: 'api-request',
      method,
      path,
      status,
      durationMs,
    }));
  } else {
    console.log(`→ ${method} ${path} ${status} ${durationMs}ms`);
  }
}

export const config = {
  matcher: '/api/:path*',
};
