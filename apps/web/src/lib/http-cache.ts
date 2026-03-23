import { NextResponse } from "next/server";
import crypto from "crypto";

interface CacheOptions {
  /** Cache-Control max-age in seconds */
  maxAge?: number;
  /** stale-while-revalidate in seconds */
  swr?: number;
  /** Whether content is public (default: private) */
  isPublic?: boolean;
  /** Generate ETag from response body */
  etag?: boolean;
}

/**
 * Apply HTTP cache headers to a NextResponse.
 * Call before returning the response.
 */
export function withCacheHeaders(
  response: NextResponse,
  options: CacheOptions = {}
): NextResponse {
  const {
    maxAge = 0,
    swr = 0,
    isPublic = false,
    etag = false,
  } = options;

  const directives: string[] = [];

  if (maxAge > 0) {
    directives.push(isPublic ? "public" : "private");
    directives.push(`max-age=${maxAge}`);
    if (swr > 0) {
      directives.push(`stale-while-revalidate=${swr}`);
    }
  } else {
    directives.push("no-cache", "no-store", "must-revalidate");
  }

  response.headers.set("Cache-Control", directives.join(", "));

  return response;
}

/**
 * Generate ETag from JSON data and check If-None-Match.
 * Returns 304 if matched, null otherwise.
 */
export function checkETag(
  requestETag: string | null,
  data: any
): { etag: string; notModified: boolean } {
  const hash = crypto
    .createHash("md5")
    .update(JSON.stringify(data))
    .digest("hex");
  const etag = `"${hash}"`;
  const notModified = requestETag === etag;
  return { etag, notModified };
}

/**
 * Create a cached JSON response with proper headers.
 */
export function cachedJsonResponse(
  data: any,
  options: CacheOptions & { requestETag?: string | null; status?: number } = {}
) {
  const { requestETag, status = 200, ...cacheOpts } = options;

  // Check ETag if provided
  if (cacheOpts.etag && requestETag) {
    const { etag, notModified } = checkETag(requestETag, data);
    if (notModified) {
      return new NextResponse(null, {
        status: 304,
        headers: { ETag: etag },
      });
    }
    const response = NextResponse.json(data, { status });
    response.headers.set("ETag", etag);
    return withCacheHeaders(response, cacheOpts);
  }

  // Generate ETag without checking
  const response = NextResponse.json(data, { status });
  if (cacheOpts.etag) {
    const { etag } = checkETag(null, data);
    response.headers.set("ETag", etag);
  }
  return withCacheHeaders(response, cacheOpts);
}

/** Preset cache profiles */
export const CACHE_PROFILES = {
  /** Hotlist data: public, 5min cache, 10min SWR */
  hotlist: { maxAge: 300, swr: 600, isPublic: true, etag: true },
  /** Dashboard stats: private, 1min cache */
  dashboard: { maxAge: 60, swr: 120, isPublic: false, etag: true },
  /** Analysis results: private, 10min cache */
  analysis: { maxAge: 600, swr: 300, isPublic: false, etag: true },
  /** Auth endpoints: no cache */
  auth: { maxAge: 0 },
  /** Static config: public, 1h cache */
  config: { maxAge: 3600, swr: 600, isPublic: true },
} as const;
