/**
 * Sanitize user input to prevent XSS.
 * Strips HTML tags and dangerous patterns.
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<[^>]*>/g, "") // strip HTML tags
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/data:\s*text\/html/gi, "")
    .trim();
}

/**
 * Sanitize a URL — must start with http(s).
 */
export function sanitizeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  // Strip any JS injection attempts
  if (/javascript:/i.test(trimmed)) return null;
  return trimmed;
}

/**
 * CORS headers for API v1 (public API).
 */
export function corsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS?.split(",") || [];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";

  // Default: allow same origin + configured origins
  const allowed =
    origin && (allowedOrigins.includes(origin) || origin === siteUrl)
      ? origin
      : siteUrl;

  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
    "Access-Control-Max-Age": "86400",
  };
}
