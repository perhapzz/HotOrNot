import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './lib/rate-limiter';

/**
 * Next.js Middleware — API 限流
 *
 * 对所有 /api/* 路由进行速率限制。
 * 超限返回 429 + Retry-After header + JSON body。
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 仅对 API 路由生效
  if (!pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // 获取客户端 IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown';

  const result = checkRateLimit(ip, pathname);

  if (!result.allowed) {
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

  // 放行并附加限流 header
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(result.limit));
  response.headers.set('X-RateLimit-Remaining', String(result.remaining));

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
