import { UserActivity } from "@hotornot/database";

type Action = "analysis" | "export" | "share" | "api_call" | "login" | "register";

/**
 * Track a user activity event. Fire-and-forget.
 */
export function trackActivity(
  action: Action,
  userId?: string,
  metadata: Record<string, any> = {}
): void {
  UserActivity.create({ userId, action, metadata }).catch((err) =>
    console.error("[Activity] Track failed:", err.message)
  );
}
