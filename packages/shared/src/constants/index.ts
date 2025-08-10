import { Platform } from "../types";

// 平台配置
export const PLATFORM_CONFIG = {
  [Platform.XIAOHONGSHU]: {
    name: "小红书",
    baseUrl: "https://www.xiaohongshu.com",
    color: "#ff2442",
    icon: "xiaohongshu",
  },
  [Platform.BILIBILI]: {
    name: "B站",
    baseUrl: "https://www.bilibili.com",
    color: "#00a1d6",
    icon: "bilibili",
  },
  [Platform.DOUYIN]: {
    name: "抖音",
    baseUrl: "https://www.douyin.com",
    color: "#000000",
    icon: "douyin",
  },
  [Platform.WEIBO]: {
    name: "微博",
    baseUrl: "https://weibo.com",
    color: "#e6162d",
    icon: "weibo",
  },
} as const;

// 分析评分范围
export const SCORE_RANGES = {
  EXCELLENT: { min: 8, max: 10, label: "优秀", color: "green" },
  GOOD: { min: 6, max: 7.9, label: "良好", color: "blue" },
  AVERAGE: { min: 4, max: 5.9, label: "一般", color: "yellow" },
  POOR: { min: 0, max: 3.9, label: "较差", color: "red" },
} as const;

// 默认分页参数
export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;

// API端点
export const API_ENDPOINTS = {
  CONTENT_ANALYSIS: "/api/analysis/content",
  ACCOUNT_ANALYSIS: "/api/analysis/account",
  KEYWORD_ANALYSIS: "/api/analysis/keyword",
  DASHBOARD_DATA: "/api/dashboard",
  TRENDING: "/api/trending",
} as const;

// 缓存键前缀
export const CACHE_KEYS = {
  CONTENT_ANALYSIS: "content_analysis",
  ACCOUNT_ANALYSIS: "account_analysis",
  KEYWORD_ANALYSIS: "keyword_analysis",
  TRENDING_DATA: "trending_data",
} as const;

// 缓存过期时间（秒）
export const CACHE_TTL = {
  SHORT: 300, // 5分钟
  MEDIUM: 1800, // 30分钟
  LONG: 3600, // 1小时
  DAILY: 86400, // 24小时
} as const;

// 支持的文件类型
export const SUPPORTED_FILE_TYPES = {
  IMAGE: ["jpg", "jpeg", "png", "webp", "gif"],
  VIDEO: ["mp4", "avi", "mov", "wmv", "flv", "mkv"],
  DOCUMENT: ["pdf", "doc", "docx", "txt", "md"],
} as const;

// 错误代码
export const ERROR_CODES = {
  INVALID_URL: "INVALID_URL",
  PLATFORM_NOT_SUPPORTED: "PLATFORM_NOT_SUPPORTED",
  CONTENT_NOT_FOUND: "CONTENT_NOT_FOUND",
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  ANALYSIS_FAILED: "ANALYSIS_FAILED",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
