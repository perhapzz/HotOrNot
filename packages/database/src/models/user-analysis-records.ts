import mongoose, { Schema, Document } from "mongoose";
import { Platform } from "@hotornot/shared";

// 用户分析记录接口
export interface IUserAnalysisRecord extends Document {
  // 用户信息
  userId?: string; // 用户ID（如果已登录）
  sessionId?: string; // 会话ID（未登录用户）
  userIP?: string; // 用户IP地址
  userAgent?: string; // 用户浏览器信息

  // 分析请求信息
  requestUrl: string; // 原始请求URL
  platform: Platform; // 平台类型
  accountId: string; // 被分析的账号ID
  accountName?: string; // 被分析的账号名称

  // 分析结果引用
  analysisId: string; // 关联的分析结果ID（指向account_analyses表）
  analysisType: "account" | "content" | "keyword"; // 分析类型

  // 分析状态和进度
  status: "pending" | "processing" | "completed" | "failed";
  progress?: number; // 分析进度 0-100
  error?: string; // 错误信息

  // 性能指标
  processingTime?: number; // 处理时间（毫秒）
  dataQuality: "high" | "medium" | "low"; // 数据质量评级

  // 元数据
  analysisVersion: string; // 分析版本
  requestSource: "web" | "api" | "mobile"; // 请求来源

  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date; // 完成时间

  // 可选的额外信息
  notes?: string; // 备注
  tags?: string[]; // 标签
  isPublic?: boolean; // 是否公开
  shareToken?: string; // 分享令牌
}

// 用户分析记录Schema定义
const UserAnalysisRecordSchema = new Schema<IUserAnalysisRecord>(
  {
    // 用户信息
    userId: {
      type: String,
      index: true,
    },
    sessionId: {
      type: String,
      index: true,
    },
    userIP: {
      type: String,
      index: true,
    },
    userAgent: {
      type: String,
    },

    // 分析请求信息
    requestUrl: {
      type: String,
      required: true,
    },
    platform: {
      type: String,
      enum: Object.values(Platform),
      required: true,
      index: true,
    },
    accountId: {
      type: String,
      required: true,
      index: true,
    },
    accountName: {
      type: String,
    },

    // 分析结果引用
    analysisId: {
      type: String,
      required: false, // 改为非必填，因为创建时可能还没有分析结果
      index: true,
    },
    analysisType: {
      type: String,
      enum: ["account", "content", "keyword"],
      required: true,
      index: true,
    },

    // 分析状态和进度
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      required: true,
      index: true,
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    error: {
      type: String,
    },

    // 性能指标
    processingTime: {
      type: Number,
      min: 0,
    },
    dataQuality: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
      index: true,
    },

    // 元数据
    analysisVersion: {
      type: String,
      default: "1.0",
      required: true,
    },
    requestSource: {
      type: String,
      enum: ["web", "api", "mobile"],
      default: "web",
      index: true,
    },

    // 时间戳
    completedAt: {
      type: Date,
    },

    // 可选的额外信息
    notes: {
      type: String,
    },
    tags: [
      {
        type: String,
      },
    ],
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    shareToken: {
      type: String,
      unique: true,
      sparse: true, // 允许为空，但如果存在必须唯一
    },
  },
  {
    timestamps: true,
    collection: "user_analysis_records",
  },
);

// 创建复合索引
UserAnalysisRecordSchema.index({ userId: 1, createdAt: -1 }); // 用户历史记录查询
UserAnalysisRecordSchema.index({ sessionId: 1, createdAt: -1 }); // 会话历史记录查询
UserAnalysisRecordSchema.index({ platform: 1, accountId: 1, createdAt: -1 }); // 账号分析历史
UserAnalysisRecordSchema.index({ status: 1, createdAt: 1 }); // 待处理任务队列
UserAnalysisRecordSchema.index({ analysisType: 1, platform: 1, createdAt: -1 }); // 分析类型统计
UserAnalysisRecordSchema.index({ userIP: 1, createdAt: -1 }); // IP分析记录（防滥用）
UserAnalysisRecordSchema.index({ dataQuality: 1, createdAt: -1 }); // 数据质量统计

// 静态方法
UserAnalysisRecordSchema.statics.findByUser = function (
  userId: string,
  limit = 50,
) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("analysisId"); // 如果需要关联分析结果
};

UserAnalysisRecordSchema.statics.findBySession = function (
  sessionId: string,
  limit = 20,
) {
  return this.find({ sessionId }).sort({ createdAt: -1 }).limit(limit);
};

UserAnalysisRecordSchema.statics.findByPlatformAndAccount = function (
  platform: Platform,
  accountId: string,
  limit = 10,
) {
  return this.find({ platform, accountId })
    .sort({ createdAt: -1 })
    .limit(limit);
};

UserAnalysisRecordSchema.statics.findPendingTasks = function (limit = 100) {
  return this.find({ status: { $in: ["pending", "processing"] } })
    .sort({ createdAt: 1 })
    .limit(limit);
};

UserAnalysisRecordSchema.statics.findByShareToken = function (
  shareToken: string,
) {
  return this.findOne({ shareToken, isPublic: true });
};

UserAnalysisRecordSchema.statics.getAnalysisStats = function (days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  return this.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          platform: "$platform",
          analysisType: "$analysisType",
          status: "$status",
        },
        count: { $sum: 1 },
        avgProcessingTime: { $avg: "$processingTime" },
      },
    },
  ]);
};

// 实例方法
UserAnalysisRecordSchema.methods.markAsProcessing = function (progress = 0) {
  this.status = "processing";
  this.progress = progress;
  this.updatedAt = new Date();
  return this.save();
};

UserAnalysisRecordSchema.methods.updateProgress = function (progress: number) {
  this.progress = Math.min(100, Math.max(0, progress));
  this.updatedAt = new Date();
  return this.save();
};

UserAnalysisRecordSchema.methods.markAsCompleted = function (
  analysisId: string,
  processingTime?: number,
  dataQuality?: "high" | "medium" | "low",
) {
  this.status = "completed";
  this.analysisId = analysisId;
  this.progress = 100;
  this.completedAt = new Date();

  if (processingTime) {
    this.processingTime = processingTime;
  }

  if (dataQuality) {
    this.dataQuality = dataQuality;
  }

  this.updatedAt = new Date();
  return this.save();
};

UserAnalysisRecordSchema.methods.markAsFailed = function (error: string) {
  this.status = "failed";
  this.error = error;
  this.updatedAt = new Date();
  return this.save();
};

UserAnalysisRecordSchema.methods.generateShareToken = function () {
  if (!this.shareToken) {
    this.shareToken =
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
  }
  this.isPublic = true;
  return this.save();
};

// 虚拟属性
UserAnalysisRecordSchema.virtual("identifier").get(function () {
  return this.userId || this.sessionId || this.userIP;
});

UserAnalysisRecordSchema.virtual("duration").get(function () {
  if (this.completedAt && this.createdAt) {
    return this.completedAt.getTime() - this.createdAt.getTime();
  }
  return null;
});

UserAnalysisRecordSchema.virtual("isCompleted").get(function () {
  return this.status === "completed";
});

// 创建模型
export const UserAnalysisRecord =
  mongoose.models.UserAnalysisRecord ||
  mongoose.model<IUserAnalysisRecord>(
    "UserAnalysisRecord",
    UserAnalysisRecordSchema,
  );
