import mongoose, { Schema, Document } from "mongoose";
import { Platform } from "@hotornot/shared";

// 账号基本信息接口
export interface IAccountInfo {
  platform: Platform;
  accountId: string;
  accountName: string;
  uniqueId?: string; // 用户名/unique_id
  avatar?: string;
  bio?: string;
  verified?: boolean; // 是否认证账号
  url?: string; // 账号链接
}

// 账号指标接口
export interface IAccountMetrics {
  followersCount: number;
  followingCount: number;
  postsCount: number;
  likesCount?: number; // 总获赞数
  avgViews?: number; // 平均播放量
  engagementRate?: number; // 参与度
}

// 发布时间分析接口
export interface IPostingPattern {
  bestTimes: { hour: number; score: number; count: number }[];
  frequency: string; // 发布频率描述，如"每日2-3次"
  consistency: number; // 一致性评分 1-10
  weekdayPattern: { day: number; count: number }[]; // 星期几发布模式
}

// 账号内容分析接口
export interface IAccountContentAnalysis {
  contentPreferences: string[]; // 内容偏好标签
  topicSuggestions: string[]; // 话题建议
  strengthsAnalysis: string; // 优势分析
  improvementAreas: string[]; // 改进建议
  trendsInsight: string; // 趋势洞察
  contentTypes: { type: string; count: number; percentage: number }[]; // 内容类型分布
}

// 近期作品接口
export interface IRecentPost {
  postId: string;
  title: string;
  description?: string;
  contentType?: string;
  type?: string;
  awemeType?: number;
  metrics: {
    likes: number;
    views?: number;
    comments?: number;
    shares?: number;
  };
  url?: string;
  publishTime?: Date;
  tags?: string[];
}

// 账号分析记录接口
export interface IAccountAnalysis extends Document {
  // 基本信息
  account: IAccountInfo;

  // 指标数据
  metrics: IAccountMetrics;

  // 分析结果
  analysis: {
    postingPattern: IPostingPattern;
    content: IAccountContentAnalysis;
    overallScore: number; // 整体评分 1-10
    summary: string; // 分析总结
  };

  // 近期作品
  recentPosts: IRecentPost[];

  // 元数据
  userId?: string; // 分析请求用户ID
  requestUrl: string; // 原始请求URL
  status: "pending" | "processing" | "completed" | "failed";
  error?: string;
  processingTime?: number; // 处理时间（毫秒）

  // 时间戳
  createdAt: Date;
  updatedAt: Date;

  // 分析版本（用于后续升级）
  analysisVersion?: string;
}

// 账号分析Schema定义
const AccountAnalysisSchema = new Schema<IAccountAnalysis>(
  {
    // 账号基本信息
    account: {
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
        required: true,
      },
      uniqueId: {
        type: String,
      },
      avatar: {
        type: String,
      },
      bio: {
        type: String,
      },
      verified: {
        type: Boolean,
        default: false,
      },
      url: {
        type: String,
      },
    },

    // 账号指标
    metrics: {
      followersCount: { type: Number, required: true, min: 0 },
      followingCount: { type: Number, required: true, min: 0 },
      postsCount: { type: Number, required: true, min: 0 },
      likesCount: { type: Number, min: 0 },
      avgViews: { type: Number, min: 0 },
      engagementRate: { type: Number, min: 0, max: 100 }, // 百分比
    },

    // 分析结果
    analysis: {
      // 发布模式分析
      postingPattern: {
        bestTimes: [
          {
            hour: { type: Number, min: 0, max: 23 },
            score: { type: Number, min: 0, max: 10 },
            count: { type: Number, min: 0 },
          },
        ],
        frequency: { type: String },
        consistency: { type: Number, min: 1, max: 10 },
        weekdayPattern: [
          {
            day: { type: Number, min: 0, max: 6 }, // 0=周日, 6=周六
            count: { type: Number, min: 0 },
          },
        ],
      },

      // 内容分析
      content: {
        contentPreferences: [{ type: String }],
        topicSuggestions: [{ type: String }],
        strengthsAnalysis: { type: String },
        improvementAreas: [{ type: String }],
        trendsInsight: { type: String },
        contentTypes: [
          {
            type: { type: String },
            count: { type: Number, min: 0 },
            percentage: { type: Number, min: 0, max: 100 },
          },
        ],
      },

      // 整体评分和总结
      overallScore: {
        type: Number,
        min: 1,
        max: 10,
        required: true,
      },
      summary: {
        type: String,
        required: true,
      },
    },

    // 近期作品数据
    recentPosts: [
      {
        postId: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String },
        contentType: { type: String },
        type: { type: String },
        awemeType: { type: Number },
        metrics: {
          likes: { type: Number, required: true, min: 0 },
          views: { type: Number, min: 0 },
          comments: { type: Number, min: 0 },
          shares: { type: Number, min: 0 },
        },
        url: { type: String },
        publishTime: { type: Date },
        tags: [{ type: String }],
      },
    ],

    // 元数据
    userId: {
      type: String,
      index: true,
    },
    requestUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    error: {
      type: String,
    },
    processingTime: {
      type: Number, // 毫秒
      min: 0,
    },
    analysisVersion: {
      type: String,
      default: "1.0",
    },
  },
  {
    timestamps: true,
    collection: "account_analyses",
  },
);

// 创建复合索引 - 移除唯一约束，允许同一账号多次分析
AccountAnalysisSchema.index({
  "account.platform": 1,
  "account.accountId": 1,
  createdAt: -1,
});
AccountAnalysisSchema.index({ "account.platform": 1, createdAt: -1 });
AccountAnalysisSchema.index({ userId: 1, createdAt: -1 });
AccountAnalysisSchema.index({ status: 1, createdAt: -1 });
AccountAnalysisSchema.index({ "account.uniqueId": 1 }, { sparse: true });
AccountAnalysisSchema.index({ requestUrl: 1 });
AccountAnalysisSchema.index({ analysisVersion: 1, createdAt: -1 }); // 版本查询

// 静态方法
AccountAnalysisSchema.statics.findByPlatform = function (
  platform: Platform,
  limit = 20,
) {
  return this.find({ "account.platform": platform, status: "completed" })
    .sort({ createdAt: -1 })
    .limit(limit);
};

AccountAnalysisSchema.statics.findByAccountId = function (
  platform: Platform,
  accountId: string,
) {
  return this.findOne({
    "account.platform": platform,
    "account.accountId": accountId,
  }).sort({ createdAt: -1 });
};

AccountAnalysisSchema.statics.findByUser = function (
  userId: string,
  limit = 50,
) {
  return this.find({ userId, status: "completed" })
    .sort({ createdAt: -1 })
    .limit(limit);
};

AccountAnalysisSchema.statics.findPending = function () {
  return this.find({ status: { $in: ["pending", "processing"] } }).sort({
    createdAt: 1,
  });
};

// 实例方法
AccountAnalysisSchema.methods.markAsProcessing = function () {
  this.status = "processing";
  this.updatedAt = new Date();
  return this.save();
};

AccountAnalysisSchema.methods.markAsCompleted = function (
  processingTime?: number,
) {
  this.status = "completed";
  if (processingTime) {
    this.processingTime = processingTime;
  }
  this.updatedAt = new Date();
  return this.save();
};

AccountAnalysisSchema.methods.markAsFailed = function (error: string) {
  this.status = "failed";
  this.error = error;
  this.updatedAt = new Date();
  return this.save();
};

// 虚拟属性 - 计算账号的基本标识符
AccountAnalysisSchema.virtual("accountIdentifier").get(function () {
  return `${this.account.platform}:${this.account.accountId}`;
});

// 虚拟属性 - 获取账号显示名称
AccountAnalysisSchema.virtual("displayName").get(function () {
  return this.account.uniqueId || this.account.accountName;
});

// 创建模型 - 防止重复编译错误
export const AccountAnalysis =
  mongoose.models.AccountAnalysis ||
  mongoose.model<IAccountAnalysis>("AccountAnalysis", AccountAnalysisSchema);
