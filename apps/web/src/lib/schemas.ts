import { z } from "zod";
import { Platform } from "@hotornot/shared";

/**
 * Shared Zod schemas for API request validation.
 * Import these in route handlers for type-safe validation.
 */

// Content analysis
export const contentAnalysisSchema = z.object({
  url: z
    .string()
    .min(1, "URL 不能为空")
    .url("请输入有效的 URL"),
  analysisType: z
    .enum(["quick", "deep"])
    .optional()
    .default("quick"),
});

// Account analysis
export const accountAnalysisSchema = z.object({
  url: z
    .string()
    .min(1, "URL 不能为空")
    .url("请输入有效的 URL"),
  platform: z
    .nativeEnum(Platform)
    .optional(),
});

// Keyword analysis
export const keywordAnalysisSchema = z.object({
  keyword: z
    .string()
    .min(1, "关键词不能为空")
    .max(100, "关键词不能超过 100 字符"),
  platform: z
    .nativeEnum(Platform)
    .optional(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(50)
    .optional()
    .default(10),
});

// Batch analysis
export const batchAnalysisSchema = z.object({
  urls: z
    .array(z.string().url("请输入有效的 URL"))
    .min(1, "至少提供一个 URL")
    .max(10, "批量分析最多 10 条"),
  analysisType: z
    .enum(["quick", "deep"])
    .optional()
    .default("quick"),
});

// Team creation
export const createTeamSchema = z.object({
  name: z
    .string()
    .min(1, "团队名称不能为空")
    .max(50, "团队名称不能超过 50 字符")
    .trim(),
  description: z
    .string()
    .max(200, "描述不能超过 200 字符")
    .trim()
    .optional(),
});

// Share analysis to team
export const shareAnalysisSchema = z.object({
  analysisId: z.string().min(1, "缺少 analysisId"),
  analysisType: z.enum(["content", "account", "keyword"]),
  note: z.string().max(500).trim().optional(),
});

// API key creation
export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(1, "API key 名称不能为空")
    .max(50, "名称不能超过 50 字符")
    .trim(),
  permissions: z
    .array(z.enum(["analysis:content", "analysis:keyword", "hotlist:read"]))
    .optional(),
});

// Notification config
export const notificationConfigSchema = z.object({
  channel: z.enum(["dingtalk", "feishu", "email"]),
  webhookUrl: z.string().url("请输入有效的 Webhook URL").optional(),
  email: z.string().email("请输入有效的邮箱").optional(),
  enabled: z.boolean().optional().default(true),
  platforms: z.array(z.nativeEnum(Platform)).optional(),
  minInterval: z.number().int().min(10).max(1440).optional().default(60),
});

// Login
export const loginSchema = z.object({
  email: z.string().email("请输入有效的邮箱"),
  password: z.string().min(6, "密码至少 6 个字符"),
  rememberMe: z.boolean().optional().default(false),
});

// Register
export const registerSchema = z.object({
  email: z.string().email("请输入有效的邮箱"),
  password: z.string().min(6, "密码至少 6 个字符").max(128),
  displayName: z.string().max(50).trim().optional(),
});

/**
 * Helper: parse request body with a zod schema.
 * Returns { success: true, data } or { success: false, error }.
 */
export function parseBody<T>(
  schema: z.ZodSchema<T>,
  body: unknown
): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstError = result.error.issues[0];
  return {
    success: false,
    error: firstError
      ? `${firstError.path.join(".")}: ${firstError.message}`
      : "请求参数无效",
  };
}
