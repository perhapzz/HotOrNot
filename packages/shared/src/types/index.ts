// 平台类型
export enum Platform {
  XIAOHONGSHU = "xiaohongshu",
  BILIBILI = "bilibili",
  DOUYIN = "douyin",
  WEIBO = "weibo",
}

// 内容类型
export enum ContentType {
  VIDEO = "video",
  IMAGE = "image",
  TEXT = "text",
  MIXED = "mixed",
}

// 内容分析结果
export interface ContentAnalysis {
  id: string;
  url: string;
  platform: Platform;
  contentType: ContentType;
  title: string;
  description: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    followersCount?: number;
  };
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  analysis: {
    score: number; // 1-10分
    pros: string[];
    cons: string[];
    recommendation: string;
    tags: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// 账号分析结果
export interface AccountAnalysis {
  id: string;
  platform: Platform;
  accountId: string;
  accountName: string;
  avatar?: string;
  bio?: string;
  metrics: {
    followersCount: number;
    followingCount: number;
    postsCount: number;
  };
  analysis: {
    contentPreferences: string[];
    postingTimes: {
      hour: number;
      count: number;
    }[];
    topicSuggestions: string[];
    trendsAnalysis: string;
  };
  recentPosts: ContentAnalysis[];
  createdAt: Date;
  updatedAt: Date;
}

// 关键词分析
export interface KeywordAnalysis {
  id: string;
  keyword: string;
  platforms: Platform[];
  analysis: {
    trendScore: number;
    totalPosts: number;
    avgEngagement: number;
    topFeatures: string[];
    suggestions: string[];
  };
  topPosts: ContentAnalysis[];
  createdAt: Date;
  updatedAt: Date;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 分页参数
export interface PaginationParams {
  page: number;
  limit: number;
}

// 分页响应
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
