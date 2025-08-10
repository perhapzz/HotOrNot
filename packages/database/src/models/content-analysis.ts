import mongoose, { Schema, Document } from "mongoose";
import { Platform, ContentType } from "@hotornot/shared";

// 内容分析记录接口
export interface IContentAnalysis extends Document {
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
    score: number;
    pros: string[];
    cons: string[];
    recommendation: string;
    tags: string[];
    reasoning: string;
    suggestions: {
      title?: string;
      content?: string;
      timing?: string;
      hashtags?: string[];
    };
  };
  createdAt: Date;
  updatedAt: Date;
  userId?: string; // 关联用户ID (可选)
  userType: "registered" | "anonymous"; // 用户类型
  status: "pending" | "completed" | "failed";
  error?: string; // 分析失败时的错误信息
}

// 内容分析Schema定义
const ContentAnalysisSchema = new Schema<IContentAnalysis>(
  {
    url: {
      type: String,
      required: true,
      index: true,
    },
    platform: {
      type: String,
      enum: Object.values(Platform),
      required: true,
      index: true,
    },
    contentType: {
      type: String,
      enum: Object.values(ContentType),
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    author: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      avatar: { type: String },
      followersCount: { type: Number },
    },
    metrics: {
      views: { type: Number, required: true, min: 0 },
      likes: { type: Number, required: true, min: 0 },
      comments: { type: Number, required: true, min: 0 },
      shares: { type: Number, required: true, min: 0 },
    },
    analysis: {
      score: {
        type: Number,
        required: false,
        min: 1,
        max: 10,
      },
      pros: [{ type: String }],
      cons: [{ type: String }],
      recommendation: { type: String, required: false },
      tags: [{ type: String }],
      reasoning: { type: String, required: false },
      suggestions: {
        title: { type: String },
        content: { type: String },
        timing: { type: String },
        hashtags: [{ type: String }],
      },
    },
    userId: {
      type: String,
      index: true,
    },
    userType: {
      type: String,
      enum: ["registered", "anonymous"],
      default: "anonymous",
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
    collection: "content_analyses",
  },
);

// 创建复合索引（移除唯一约束，允许重复分析）
ContentAnalysisSchema.index({ url: 1, platform: 1 });
ContentAnalysisSchema.index({ platform: 1, createdAt: -1 });
ContentAnalysisSchema.index({ userId: 1, createdAt: -1 });
ContentAnalysisSchema.index({ "analysis.score": -1, createdAt: -1 });

// 添加虚拟字段
ContentAnalysisSchema.virtual("engagementRate").get(function () {
  const metrics = this.metrics;
  if (metrics.views === 0) return 0;
  return (
    ((metrics.likes + metrics.comments + metrics.shares) / metrics.views) * 100
  );
});

// 静态方法：根据平台获取分析记录
ContentAnalysisSchema.statics.findByPlatform = function (
  platform: Platform,
  limit = 20,
) {
  return this.find({ platform, status: "completed" })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// 静态方法：获取高分内容
ContentAnalysisSchema.statics.findTopScored = function (
  minScore = 8,
  limit = 10,
) {
  return this.find({
    "analysis.score": { $gte: minScore },
    status: "completed",
  })
    .sort({ "analysis.score": -1, createdAt: -1 })
    .limit(limit);
};

// 实例方法：更新分析状态
ContentAnalysisSchema.methods.updateStatus = function (
  status: "pending" | "completed" | "failed",
  error?: string,
) {
  this.status = status;
  if (error) this.error = error;
  return this.save();
};

// 创建模型 - 防止重复编译错误
export const ContentAnalysis =
  mongoose.models.ContentAnalysis ||
  mongoose.model<IContentAnalysis>("ContentAnalysis", ContentAnalysisSchema);
