import mongoose, { Schema, Document, Model } from "mongoose";
import { Platform } from "@hotornot/shared";

// 静态方法接口
export interface IKeywordAnalysisModel extends Model<IKeywordAnalysis> {
  findHotKeywords(limit?: number): Promise<IKeywordAnalysis[]>;
  findByPlatform(
    platform: Platform,
    limit?: number,
  ): Promise<IKeywordAnalysis[]>;
  findRecommended(level?: string, limit?: number): Promise<IKeywordAnalysis[]>;
}

// 关键词分析记录接口
export interface IKeywordAnalysis extends Document {
  keyword: string;
  platforms: Platform[];
  analysis: {
    totalResults: number;
    avgEngagement: number;
    trendDirection: "rising" | "stable" | "declining";
    hotScore: number; // 1-10
    competitiveness: number; // 1-10
    recommendationLevel: "high" | "medium" | "low";
    insights: string;
    suggestedHashtags: string[];
    bestPlatforms: Platform[];
    contentSuggestions: string[];
    timingRecommendations: string[];
  };
  topContent: {
    platform: Platform;
    url: string;
    title: string;
    author: string;
    authorId?: string;
    authorAvatar?: string;
    metrics: {
      views: number;
      likes: number;
      comments: number;
      shares: number;
      collected?: number; // 小红书收藏数
    };
    publishedAt: Date;
    coverImage?: string;
    images?: string[]; // 小红书图片列表
  }[];
  searchStats?: {
    totalResults: number;
    avgLikes: number;
    avgComments: number;
    avgShares: number;
    avgCollected: number;
    topAuthors: Array<{
      name: string;
      count: number;
      totalLikes: number;
    }>;
    averageImagesPerPost: number;
  };
  createdAt: Date;
  updatedAt: Date;
  userId?: string;
  status: "pending" | "completed" | "failed";
  error?: string;
}

// 关键词分析Schema定义
const KeywordAnalysisSchema = new Schema<IKeywordAnalysis>(
  {
    keyword: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    platforms: [
      {
        type: String,
        enum: Object.values(Platform),
        required: true,
      },
    ],
    analysis: {
      totalResults: { type: Number, required: false, min: 0 },
      avgEngagement: { type: Number, required: false, min: 0 },
      trendDirection: {
        type: String,
        enum: ["rising", "stable", "declining"],
        required: false,
      },
      hotScore: {
        type: Number,
        required: false,
        min: 1,
        max: 10,
      },
      competitiveness: {
        type: Number,
        required: false,
        min: 1,
        max: 10,
      },
      recommendationLevel: {
        type: String,
        enum: ["high", "medium", "low"],
        required: false,
      },
      insights: { type: String, required: false },
      suggestedHashtags: [{ type: String }],
      bestPlatforms: [
        {
          type: String,
          enum: Object.values(Platform),
        },
      ],
      contentSuggestions: [{ type: String }],
      timingRecommendations: [{ type: String }],
    },
    topContent: [
      {
        platform: {
          type: String,
          enum: Object.values(Platform),
          required: true,
        },
        url: { type: String, required: true },
        title: { type: String, required: true },
        author: { type: String, required: true },
        authorId: { type: String, required: false },
        authorAvatar: { type: String, required: false },
        metrics: {
          views: { type: Number, required: true, min: 0 },
          likes: { type: Number, required: true, min: 0 },
          comments: { type: Number, required: true, min: 0 },
          shares: { type: Number, required: true, min: 0 },
          collected: { type: Number, required: false, min: 0 }, // 小红书收藏数
        },
        publishedAt: { type: Date, required: true },
        coverImage: { type: String, required: false },
        images: [{ type: String }], // 小红书图片列表
      },
    ],
    searchStats: {
      totalResults: { type: Number, required: false },
      avgLikes: { type: Number, required: false },
      avgComments: { type: Number, required: false },
      avgShares: { type: Number, required: false },
      avgCollected: { type: Number, required: false },
      topAuthors: [
        {
          name: { type: String, required: false },
          count: { type: Number, required: false },
          totalLikes: { type: Number, required: false },
        },
      ],
      averageImagesPerPost: { type: Number, required: false },
    },
    userId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
      index: true,
    },
    error: {
      type: String,
    },
  },
  {
    timestamps: true,
    collection: "keyword_analyses",
    // 确保所有字段都包含在JSON输出中
    toJSON: {
      transform: function (doc, ret) {
        // 不删除任何字段，保持完整性
        return ret;
      },
    },
  },
);

// 创建复合索引
KeywordAnalysisSchema.index({ keyword: 1, platforms: 1 });
KeywordAnalysisSchema.index({ keyword: 1, createdAt: -1 });
KeywordAnalysisSchema.index({ userId: 1, createdAt: -1 });
KeywordAnalysisSchema.index({ "analysis.hotScore": -1, createdAt: -1 });
KeywordAnalysisSchema.index({
  "analysis.recommendationLevel": 1,
  createdAt: -1,
});

// 添加虚拟字段
KeywordAnalysisSchema.virtual("isHot").get(function () {
  return this.analysis?.hotScore >= 7;
});

KeywordAnalysisSchema.virtual("platformCount").get(function () {
  return this.platforms?.length || 0;
});

// 静态方法：获取热门关键词
KeywordAnalysisSchema.statics.findHotKeywords = function (limit = 10) {
  return this.find({
    "analysis.hotScore": { $gte: 7 },
    status: "completed",
  })
    .sort({ "analysis.hotScore": -1, createdAt: -1 })
    .limit(limit);
};

// 静态方法：按平台搜索关键词
KeywordAnalysisSchema.statics.findByPlatform = function (
  platform: Platform,
  limit = 20,
) {
  return this.find({
    platforms: platform,
    status: "completed",
  })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// 静态方法：获取推荐关键词
KeywordAnalysisSchema.statics.findRecommended = function (
  level = "high",
  limit = 10,
) {
  return this.find({
    "analysis.recommendationLevel": level,
    status: "completed",
  })
    .sort({ "analysis.hotScore": -1, createdAt: -1 })
    .limit(limit);
};

// 实例方法：更新分析状态
KeywordAnalysisSchema.methods.updateStatus = function (
  status: "pending" | "completed" | "failed",
  error?: string,
) {
  this.status = status;
  if (error) this.error = error;
  return this.save();
};

// 实例方法：添加热门内容
KeywordAnalysisSchema.methods.addTopContent = function (content: any) {
  if (!this.topContent) this.topContent = [];
  this.topContent.push(content);
  // 保持只有前10个最热门的内容
  if (this.topContent.length > 10) {
    this.topContent = this.topContent
      .sort(
        (a: any, b: any) =>
          b.metrics.likes +
          b.metrics.views -
          (a.metrics.likes + a.metrics.views),
      )
      .slice(0, 10);
  }
  return this.save();
};

// 创建模型 - 防止重复编译错误
export const KeywordAnalysis = (mongoose.models.KeywordAnalysis ||
  mongoose.model<IKeywordAnalysis>(
    "KeywordAnalysis",
    KeywordAnalysisSchema,
  )) as IKeywordAnalysisModel;
