import mongoose, { Schema, Document } from "mongoose";

export interface IApiKey extends Document {
  key: string;
  userId: string;
  name: string;
  permissions: string[];
  rateLimit: number; // requests per minute
  totalCalls: number;
  lastUsedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ApiKeySchema = new Schema<IApiKey>(
  {
    key: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 50 },
    permissions: {
      type: [String],
      default: ["analysis:content", "analysis:keyword", "hotlist:read"],
    },
    rateLimit: { type: Number, default: 60 },
    totalCalls: { type: Number, default: 0 },
    lastUsedAt: { type: Date },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ApiKey =
  mongoose.models.ApiKey || mongoose.model<IApiKey>("ApiKey", ApiKeySchema);
