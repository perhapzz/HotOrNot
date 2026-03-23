import { NextRequest, NextResponse } from "next/server";
import { ApiKey } from "@hotornot/database";
import { connectDatabase } from "@hotornot/database/src/utils/connection";

// In-memory rate limit tracking for API keys
const apiKeyHits = new Map<string, { count: number; resetAt: number }>();

export interface ApiKeyContext {
  userId: string;
  keyId: string;
  permissions: string[];
}

/**
 * Validate API key from X-API-Key header.
 * Returns context on success, NextResponse error on failure.
 */
export async function validateApiKey(
  request: NextRequest
): Promise<ApiKeyContext | NextResponse> {
  const apiKeyHeader = request.headers.get("X-API-Key");
  if (!apiKeyHeader) {
    return NextResponse.json(
      { success: false, error: "Missing X-API-Key header" },
      { status: 401 }
    );
  }

  await connectDatabase();

  const keyDoc = await ApiKey.findOne({ key: apiKeyHeader, isActive: true });
  if (!keyDoc) {
    return NextResponse.json(
      { success: false, error: "Invalid or inactive API key" },
      { status: 401 }
    );
  }

  // Rate limiting per API key
  const now = Date.now();
  const window = 60_000; // 1 minute
  let entry = apiKeyHits.get(apiKeyHeader);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + window };
    apiKeyHits.set(apiKeyHeader, entry);
  }
  entry.count++;

  if (entry.count > keyDoc.rateLimit) {
    return NextResponse.json(
      {
        success: false,
        error: "Rate limit exceeded",
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((entry.resetAt - now) / 1000)),
          "X-RateLimit-Limit": String(keyDoc.rateLimit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // Update usage stats (fire-and-forget)
  ApiKey.updateOne(
    { _id: keyDoc._id },
    { $inc: { totalCalls: 1 }, $set: { lastUsedAt: new Date() } }
  ).exec();

  return {
    userId: keyDoc.userId,
    keyId: keyDoc._id.toString(),
    permissions: keyDoc.permissions,
  };
}

export function hasPermission(ctx: ApiKeyContext, perm: string): boolean {
  return ctx.permissions.includes(perm) || ctx.permissions.includes("*");
}
