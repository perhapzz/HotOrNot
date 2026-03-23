import jwt from "jsonwebtoken";
// @ts-ignore — bcryptjs ships its own types but pnpm hoisting may not resolve them
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "CHANGE_ME_IN_PRODUCTION";
const JWT_EXPIRES_IN = "7d";
const BCRYPT_ROUNDS = 12;

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  role: string;
}

/**
 * Hash a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a bcrypt hash.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a signed JWT token.
 */
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify and decode a JWT token. Returns null if invalid/expired.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user from request cookie.
 * Returns payload or null.
 */
export function getUserFromRequest(request: NextRequest): TokenPayload | null {
  const token = request.cookies.get("auth-token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Require authentication. Returns user payload or error response.
 */
export function requireAuth(
  request: NextRequest
): TokenPayload | NextResponse {
  const user = getUserFromRequest(request);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }
  return user;
}

/**
 * Require admin role. Returns user payload or error response.
 */
export function requireAdmin(
  request: NextRequest
): TokenPayload | NextResponse {
  const result = requireAuth(request);
  if (result instanceof NextResponse) return result;
  if (result.role !== "admin") {
    return NextResponse.json(
      { success: false, error: "Forbidden: admin required" },
      { status: 403 }
    );
  }
  return result;
}

/**
 * Set auth cookie on response.
 */
export function setAuthCookie(
  response: NextResponse,
  token: string,
  rememberMe = false
): void {
  response.cookies.set("auth-token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: rememberMe ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60, // 30d or 7d
    path: "/",
  });
}
