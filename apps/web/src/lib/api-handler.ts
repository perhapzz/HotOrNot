import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { getUserFromRequest, requireAuth, requireAdmin, TokenPayload } from "./auth";

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface HandlerOptions {
  /** Require authentication */
  auth?: boolean;
  /** Require admin role */
  admin?: boolean;
  /** Skip database connection */
  skipDb?: boolean;
}

type HandlerFn = (
  request: NextRequest,
  context: {
    user: TokenPayload | null;
    params?: any;
  }
) => Promise<NextResponse | Response>;

/**
 * Wraps an API route handler with:
 * - Database connection (unless skipDb)
 * - Authentication (if auth/admin)
 * - Unified error handling
 * - Production error sanitization
 */
export function withApiHandler(handler: HandlerFn, options: HandlerOptions = {}) {
    return async (request: NextRequest, routeContext?: { params?: any }) => {
    let user: TokenPayload | null = null;
    try {
      // Database connection
      if (!options.skipDb) {
        await connectDatabase();
      }

      // Authentication
            if (options.admin) {
        const result = requireAdmin(request);
        if (result instanceof NextResponse) return result;
        user = result;
      } else if (options.auth) {
        const result = requireAuth(request);
        if (result instanceof NextResponse) return result;
        user = result;
      } else {
        // Optional auth — extract user if present, don't fail
        user = getUserFromRequest(request);
      }

      return await handler(request, {
        user,
        params: routeContext?.params,
      });
    } catch (error: any) {
      // Known API errors
      if (error instanceof ApiError) {
        return NextResponse.json(
          {
            success: false,
            error: error.message,
            ...(error.code && { code: error.code }),
          },
          { status: error.statusCode }
        );
      }

      // MongoDB validation errors
      if (error.name === "ValidationError") {
        const messages = Object.values(error.errors || {}).map(
          (e: any) => e.message
        );
        return NextResponse.json(
          {
            success: false,
            error: messages[0] || "数据验证失败",
            code: "VALIDATION_ERROR",
          },
          { status: 400 }
        );
      }

      // MongoDB duplicate key
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0];
        return NextResponse.json(
          {
            success: false,
            error: `${field || "字段"}已存在`,
            code: "DUPLICATE_KEY",
          },
          { status: 409 }
        );
      }

      // Unknown errors — sanitize in production
      console.error("[API Error]", error);

      // Report to Sentry with context tags
      try {
        const Sentry = require("@sentry/nextjs");
        Sentry.withScope((scope: any) => {
          if (user) {
            scope.setUser({ id: user.userId });
            scope.setTag("userId", user.userId);
          }
          scope.setTag("api.path", request.nextUrl.pathname);
          scope.setTag("api.method", request.method);
          if (request.nextUrl.pathname.includes("/analysis/")) {
            const pathParts = request.nextUrl.pathname.split("/");
            const analysisType = pathParts[pathParts.indexOf("analysis") + 1];
            if (analysisType) scope.setTag("analysisType", analysisType);
          }
          Sentry.captureException(error);
        });
      } catch {
        // Sentry not configured — skip silently
      }

      const isDev = process.env.NODE_ENV !== "production";
      return NextResponse.json(
        {
          success: false,
          error: isDev ? error.message : "服务器内部错误，请稍后重试",
          ...(isDev && { stack: error.stack }),
          code: "INTERNAL_ERROR",
        },
        { status: 500 }
      );
    }
  };
}
