// ==================== API Response Types ====================

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiError {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

// ==================== Auth ====================

export interface AuthUser {
  userId: string;
  username: string;
  role: "user" | "admin";
}

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

// ==================== Analysis ====================

export type Platform = "xiaohongshu" | "douyin" | "bilibili" | "weibo";

export type AnalysisType = "content" | "keyword" | "account";

export interface AnalysisScores {
  overall: number;
  creativity?: number;
  engagement?: number;
  relevance?: number;
  quality?: number;
  [dimension: string]: number | undefined;
}

export interface ContentAnalysis {
  id: string;
  userId: string;
  url: string;
  platform: Platform;
  analysis: {
    overallScore: number;
    summary: string;
    suggestions: string[];
    scores?: AnalysisScores;
  };
  createdAt: string;
}

export interface KeywordAnalysis {
  id: string;
  userId: string;
  keyword: string;
  platform?: Platform;
  analysis: {
    hotScore: number;
    competition: string;
    suggestions: string[];
  };
  createdAt: string;
}

export interface AccountAnalysis {
  id: string;
  userId: string;
  platform: Platform;
  username: string;
  analysis: {
    overallScore: number;
    influence: string;
    suggestions: string[];
  };
  createdAt: string;
}

// ==================== History ====================

export interface HistoryItem {
  _id: string;
  type: AnalysisType;
  title: string;
  platform?: Platform;
  createdAt: string;
  score?: number;
}

export interface TrendPoint {
  date: string;
  score: number;
  scores?: Record<string, number>;
}

// ==================== Achievements ====================

export interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

// ==================== Subscription ====================

export interface Subscription {
  _id: string;
  userId: string;
  type: "keyword" | "account";
  target: string;
  platform?: Platform;
  frequency: "daily" | "weekly";
  active: boolean;
  lastNotified?: string;
  createdAt: string;
}

// ==================== Team ====================

export interface Team {
  _id: string;
  name: string;
  ownerId: string;
  members: TeamMember[];
  createdAt: string;
}

export interface TeamMember {
  userId: string;
  username: string;
  role: "owner" | "admin" | "member";
  joinedAt: string;
}

// ==================== Queue ====================

export interface QueueStatus {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export interface JobStatus {
  id: string;
  state: "waiting" | "active" | "completed" | "failed" | "delayed";
  progress: number;
  data: Record<string, unknown>;
  result?: unknown;
  failedReason?: string;
  attemptsMade: number;
  createdAt: number;
  processedAt?: number;
  finishedAt?: number;
}

// ==================== Dashboard ====================

export interface DashboardStats {
  totalAnalyses: number;
  totalUsers: number;
  todayAnalyses: number;
  activeUsers: number;
}

// ==================== Pagination ====================

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
