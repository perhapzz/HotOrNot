import { Platform, ContentType } from "@hotornot/shared";

// AI 服务配置
export interface AIServiceConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// AI 服务提供者类型
export enum AIProvider {
  OPENAI = "openai",
  AZURE_OPENAI = "azure_openai",
  CLAUDE = "claude",
  GEMINI = "gemini",
  DEEPSEEK = "deepseek",
}

// 内容分析请求
export interface ContentAnalysisRequest {
  url: string;
  platform: Platform;
  title?: string;
  description?: string;
  author?: string;
  metrics?: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  contentType: ContentType;
  rawContent?: string;
}

// 内容分析响应
export interface ContentAnalysisResponse {
  score: number; // 1-10分
  pros: string[]; // 优点列表
  cons: string[]; // 缺点列表
  recommendation: string; // 总体建议
  tags: string[]; // 适合标签
  reasoning: string; // 分析推理过程
  suggestions: {
    title?: string; // 标题优化建议
    content?: string; // 内容优化建议
    timing?: string; // 发布时机建议
    hashtags?: string[]; // 推荐标签
  };
}

// 账号分析请求
export interface AccountAnalysisRequest {
  accountId: string;
  platform: Platform;
  accountName: string;
  bio?: string;
  followerCount?: number;
  recentPosts: ContentAnalysisRequest[];
}

// 账号分析响应
export interface AccountAnalysisResponse {
  contentPreferences: string[]; // 内容偏好
  postingPattern: {
    bestTimes: { hour: number; score: number }[];
    frequency: string; // 发布频率分析
    consistency: number; // 一致性评分 1-10
  };
  topicSuggestions: string[]; // 选题建议
  strengthsAnalysis: string; // 优势分析
  improvementAreas: string[]; // 改进建议
  trendsInsight: string; // 趋势洞察
}

// 关键词分析请求
export interface KeywordAnalysisRequest {
  keyword: string;
  platforms: Platform[];
  timeRange?: "week" | "month" | "quarter";
  sampleSize?: number;
}

// 关键词分析响应
export interface KeywordAnalysisResponse {
  trendScore: number; // 热度评分 1-10
  momentum: "rising" | "stable" | "declining"; // 趋势方向
  competitionLevel: "low" | "medium" | "high"; // 竞争程度
  bestPractices: string[]; // 最佳实践
  contentSuggestions: string[]; // 内容建议
  timing: {
    bestDays: string[]; // 最佳发布日期
    bestHours: number[]; // 最佳发布时间
  };
  relatedKeywords: string[]; // 相关关键词
  viralFactors: string[]; // 爆文因子
}

// AI 服务接口
export interface IAIService {
  // 内容分析
  analyzeContent(
    request: ContentAnalysisRequest,
  ): Promise<ContentAnalysisResponse>;

  // 账号分析
  analyzeAccount(
    request: AccountAnalysisRequest,
  ): Promise<AccountAnalysisResponse>;

  // 关键词分析
  analyzeKeyword(
    request: KeywordAnalysisRequest,
  ): Promise<KeywordAnalysisResponse>;

  // 健康检查
  healthCheck(): Promise<boolean>;
}

// AI 服务错误
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: AIProvider,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = "AIServiceError";
  }
}

// 重试配置
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // 基础延迟(ms)
  maxDelay: number; // 最大延迟(ms)
  backoffFactor: number; // 退避因子
}

// 缓存配置
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // 缓存时间(秒)
  keyPrefix: string;
}

// AI 服务选项
export interface AIServiceOptions {
  config: AIServiceConfig;
  retryConfig?: RetryConfig;
  cacheConfig?: CacheConfig;
  timeout?: number; // 请求超时(ms)
}
