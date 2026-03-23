import mongoose, { Schema, Document } from "mongoose";

export interface ISubscription extends Document {
  userId: string;
  type: "keyword" | "account";
  target: string;
  platform?: string;
  frequency: "daily" | "weekly";
  active: boolean;
  lastNotified?: Date;
  createdAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: String, required: true, index: true },
    type: { type: String, required: true, enum: ["keyword", "account"] },
    target: { type: String, required: true },
    platform: { type: String },
    frequency: { type: String, required: true, enum: ["daily", "weekly"], default: "daily" },
    active: { type: Boolean, default: true },
    lastNotified: { type: Date },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ userId: 1, type: 1, target: 1 }, { unique: true });

export const Subscription =
  mongoose.models.Subscription ||
  mongoose.model<ISubscription>("Subscription", SubscriptionSchema);
