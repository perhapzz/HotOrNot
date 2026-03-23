import mongoose, { Schema, Document } from "mongoose";

export interface INotificationChannel {
  type: "dingtalk" | "feishu" | "email";
  webhook?: string; // For dingtalk/feishu
  address?: string; // For email
  enabled: boolean;
}

export interface INotificationRule {
  platform: string;
  keyword?: string;
  threshold?: number; // Min rank change to trigger
}

export interface INotificationConfig extends Document {
  userId: string;
  channels: INotificationChannel[];
  rules: INotificationRule[];
  enabled: boolean;
  lastNotifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationChannelSchema = new Schema(
  {
    type: { type: String, enum: ["dingtalk", "feishu", "email"], required: true },
    webhook: { type: String },
    address: { type: String },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const NotificationRuleSchema = new Schema(
  {
    platform: { type: String, required: true },
    keyword: { type: String },
    threshold: { type: Number, default: 10 },
  },
  { _id: false }
);

const NotificationConfigSchema = new Schema<INotificationConfig>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    channels: [NotificationChannelSchema],
    rules: [NotificationRuleSchema],
    enabled: { type: Boolean, default: true },
    lastNotifiedAt: { type: Date },
  },
  { timestamps: true }
);

export const NotificationConfig =
  mongoose.models.NotificationConfig ||
  mongoose.model<INotificationConfig>("NotificationConfig", NotificationConfigSchema);
