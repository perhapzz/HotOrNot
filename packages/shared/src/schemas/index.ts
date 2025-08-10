import { z } from "zod";
import { Platform, ContentType } from "../types";

// 平台枚举schema
export const PlatformSchema = z.nativeEnum(Platform);

// 内容类型枚举schema
export const ContentTypeSchema = z.nativeEnum(ContentType);

// URL验证schema
export const UrlSchema = z.string().url("请输入有效的URL");

// 分页参数schema
export const PaginationSchema = z.object({
  page: z.number().min(1, "页码必须大于0").default(1),
  limit: z
    .number()
    .min(1, "每页数量必须大于0")
    .max(100, "每页数量不能超过100")
    .default(20),
});

// 内容分析请求schema
export const ContentAnalysisRequestSchema = z.object({
  url: UrlSchema,
  platform: PlatformSchema.optional(),
});

// 账号分析请求schema
export const AccountAnalysisRequestSchema = z.object({
  url: UrlSchema,
  platform: PlatformSchema.optional(),
  limit: z.number().min(1).max(50).default(20).optional(),
});

// 关键词分析请求schema
export const KeywordAnalysisRequestSchema = z.object({
  keyword: z
    .string()
    .min(1, "关键词不能为空")
    .max(100, "关键词长度不能超过100"),
  platforms: z.array(PlatformSchema).min(1, "至少选择一个平台"),
  limit: z.number().min(1).max(100).default(20).optional(),
});

// 内容指标schema
export const ContentMetricsSchema = z.object({
  views: z.number().min(0),
  likes: z.number().min(0),
  comments: z.number().min(0),
  shares: z.number().min(0),
});

// 作者信息schema
export const AuthorSchema = z.object({
  id: z.string(),
  name: z.string(),
  avatar: z.string().url().optional(),
  followersCount: z.number().min(0).optional(),
});

// 内容分析结果schema
export const ContentAnalysisSchema = z.object({
  id: z.string(),
  url: UrlSchema,
  platform: PlatformSchema,
  contentType: ContentTypeSchema,
  title: z.string(),
  description: z.string(),
  author: AuthorSchema,
  metrics: ContentMetricsSchema,
  analysis: z.object({
    score: z.number().min(0).max(10),
    pros: z.array(z.string()),
    cons: z.array(z.string()),
    recommendation: z.string(),
    tags: z.array(z.string()),
  }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 账号指标schema
export const AccountMetricsSchema = z.object({
  followersCount: z.number().min(0),
  followingCount: z.number().min(0),
  postsCount: z.number().min(0),
});

// 账号分析结果schema
export const AccountAnalysisSchema = z.object({
  id: z.string(),
  platform: PlatformSchema,
  accountId: z.string(),
  accountName: z.string(),
  avatar: z.string().url().optional(),
  bio: z.string().optional(),
  metrics: AccountMetricsSchema,
  analysis: z.object({
    contentPreferences: z.array(z.string()),
    postingTimes: z.array(
      z.object({
        hour: z.number().min(0).max(23),
        count: z.number().min(0),
      }),
    ),
    topicSuggestions: z.array(z.string()),
    trendsAnalysis: z.string(),
  }),
  recentPosts: z.array(ContentAnalysisSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// 关键词分析结果schema
export const KeywordAnalysisSchema = z.object({
  id: z.string(),
  keyword: z.string(),
  platforms: z.array(PlatformSchema),
  analysis: z.object({
    trendScore: z.number().min(0).max(10),
    totalPosts: z.number().min(0),
    avgEngagement: z.number().min(0),
    topFeatures: z.array(z.string()),
    suggestions: z.array(z.string()),
  }),
  topPosts: z.array(ContentAnalysisSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// API响应schema
export const ApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: z.string().optional(),
    message: z.string().optional(),
  });

// 分页响应schema
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(
  itemSchema: T,
) =>
  z.object({
    data: z.array(itemSchema),
    pagination: z.object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    }),
  });

// 类型导出
export type ContentAnalysisRequest = z.infer<
  typeof ContentAnalysisRequestSchema
>;
export type AccountAnalysisRequest = z.infer<
  typeof AccountAnalysisRequestSchema
>;
export type KeywordAnalysisRequest = z.infer<
  typeof KeywordAnalysisRequestSchema
>;
export type SchemaPaginationParams = z.infer<typeof PaginationSchema>;
