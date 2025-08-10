import mongoose, { Schema, Document } from "mongoose";

// 用户角色枚举
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
  MODERATOR = "moderator",
}

// 用户状态枚举
export enum UserStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  SUSPENDED = "suspended",
  PENDING = "pending",
}

// 用户接口
export interface IUser extends Document {
  email: string;
  username: string;
  password?: string; // 可选，社交登录时可能没有密码
  displayName?: string;
  avatar?: string;
  bio?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt?: Date;

  // 社交登录信息
  providers: {
    google?: {
      id: string;
      email: string;
    };
    github?: {
      id: string;
      username: string;
    };
  };

  // 用户偏好设置
  preferences: {
    theme: "light" | "dark" | "auto";
    language: string;
    notifications: {
      email: boolean;
      browser: boolean;
      analysis: boolean;
      weekly: boolean;
    };
  };

  // 使用统计
  stats: {
    totalAnalyses: number;
    contentAnalyses: number;
    accountAnalyses: number;
    keywordAnalyses: number;
    lastAnalysisAt?: Date;
  };

  // 订阅信息
  subscription?: {
    plan: "free" | "pro" | "enterprise";
    status: "active" | "canceled" | "past_due";
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd: boolean;
  };

  createdAt: Date;
  updatedAt: Date;
}

// 用户Schema定义
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "请输入有效的邮箱地址",
      ],
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: [3, "用户名至少3个字符"],
      maxlength: [30, "用户名最多30个字符"],
      match: [/^[a-zA-Z0-9_-]+$/, "用户名只能包含字母、数字、下划线和连字符"],
    },
    password: {
      type: String,
      minlength: [6, "密码至少6个字符"],
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: [50, "显示名最多50个字符"],
    },
    avatar: {
      type: String,
      match: [/^https?:\/\/.+/, "头像必须是有效的URL"],
    },
    bio: {
      type: String,
      maxlength: [200, "个人简介最多200个字符"],
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.PENDING,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
    },

    // 社交登录
    providers: {
      google: {
        id: String,
        email: String,
      },
      github: {
        id: String,
        username: String,
      },
    },

    // 用户偏好
    preferences: {
      theme: {
        type: String,
        enum: ["light", "dark", "auto"],
        default: "auto",
      },
      language: {
        type: String,
        default: "zh-CN",
      },
      notifications: {
        email: { type: Boolean, default: true },
        browser: { type: Boolean, default: true },
        analysis: { type: Boolean, default: true },
        weekly: { type: Boolean, default: true },
      },
    },

    // 使用统计
    stats: {
      totalAnalyses: { type: Number, default: 0 },
      contentAnalyses: { type: Number, default: 0 },
      accountAnalyses: { type: Number, default: 0 },
      keywordAnalyses: { type: Number, default: 0 },
      lastAnalysisAt: Date,
    },

    // 订阅
    subscription: {
      plan: {
        type: String,
        enum: ["free", "pro", "enterprise"],
        default: "free",
      },
      status: {
        type: String,
        enum: ["active", "canceled", "past_due"],
        default: "active",
      },
      currentPeriodStart: Date,
      currentPeriodEnd: Date,
      cancelAtPeriodEnd: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
    collection: "users",
  },
);

// 创建复合索引（单字段索引已通过unique: true自动创建）
UserSchema.index({ "providers.google.id": 1 });
UserSchema.index({ "providers.github.id": 1 });
UserSchema.index({ status: 1, role: 1 });
UserSchema.index({ "subscription.plan": 1, "subscription.status": 1 });
UserSchema.index({ createdAt: -1 });

// 虚拟字段
UserSchema.virtual("isActive").get(function () {
  return this.status === UserStatus.ACTIVE;
});

UserSchema.virtual("isPro").get(function () {
  return (
    this.subscription?.plan === "pro" && this.subscription?.status === "active"
  );
});

UserSchema.virtual("fullName").get(function () {
  return this.displayName || this.username;
});

// 实例方法
UserSchema.methods.updateLastLogin = function () {
  this.lastLoginAt = new Date();
  return this.save();
};

UserSchema.methods.incrementAnalysisCount = function (
  type: "content" | "account" | "keyword",
) {
  this.stats.totalAnalyses += 1;
  if (type === "content") this.stats.contentAnalyses += 1;
  if (type === "account") this.stats.accountAnalyses += 1;
  if (type === "keyword") this.stats.keywordAnalyses += 1;
  this.stats.lastAnalysisAt = new Date();
  return this.save();
};

UserSchema.methods.updateSubscription = function (subscription: any) {
  this.subscription = { ...this.subscription, ...subscription };
  return this.save();
};

UserSchema.methods.canAnalyze = function () {
  // 免费用户限制
  if (this.subscription?.plan === "free") {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));

    // 这里可以添加更复杂的限制逻辑
    // 例如：免费用户每天最多10次分析
    return this.stats.totalAnalyses < 10;
  }

  // Pro 和企业用户没有限制
  return true;
};

// 静态方法
UserSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email: email.toLowerCase() });
};

UserSchema.statics.findByUsername = function (username: string) {
  return this.findOne({ username });
};

UserSchema.statics.findByProvider = function (
  provider: "google" | "github",
  id: string,
) {
  return this.findOne({ [`providers.${provider}.id`]: id });
};

UserSchema.statics.getActiveUsers = function () {
  return this.find({ status: UserStatus.ACTIVE });
};

UserSchema.statics.getUserStats = function () {
  return this.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
};

// 中间件 - 保存前处理
UserSchema.pre("save", function (next) {
  // 设置默认显示名
  if (!this.displayName && this.username) {
    this.displayName = this.username;
  }

  // 邮箱验证后激活用户
  if (this.emailVerified && this.status === UserStatus.PENDING) {
    this.status = UserStatus.ACTIVE;
  }

  next();
});

// 排除敏感字段的方法
UserSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// 创建模型 - 防止重复编译错误
export const User =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
