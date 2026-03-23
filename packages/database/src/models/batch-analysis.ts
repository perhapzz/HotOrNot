import mongoose, { Schema, Document } from "mongoose";

export interface IBatchItem {
  index: number;
  input: string; // URL or keyword
  platform?: string;
  status: "pending" | "processing" | "completed" | "failed";
  resultId?: string; // Reference to ContentAnalysis or KeywordAnalysis
  error?: string;
  startedAt?: Date;
  completedAt?: Date;
}

export interface IBatchAnalysis extends Document {
  jobId: string;
  userId?: string;
  type: "content" | "keyword";
  items: IBatchItem[];
  status: "pending" | "processing" | "completed" | "failed";
  totalItems: number;
  completedItems: number;
  failedItems: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const BatchItemSchema = new Schema<IBatchItem>(
  {
    index: { type: Number, required: true },
    input: { type: String, required: true },
    platform: { type: String },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    resultId: { type: String },
    error: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { _id: false }
);

const BatchAnalysisSchema = new Schema<IBatchAnalysis>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, index: true },
    type: { type: String, enum: ["content", "keyword"], required: true },
    items: [BatchItemSchema],
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    totalItems: { type: Number, required: true },
    completedItems: { type: Number, default: 0 },
    failedItems: { type: Number, default: 0 },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

BatchAnalysisSchema.index({ userId: 1, createdAt: -1 });
BatchAnalysisSchema.index({ status: 1 });

export const BatchAnalysis =
  mongoose.models.BatchAnalysis ||
  mongoose.model<IBatchAnalysis>("BatchAnalysis", BatchAnalysisSchema);
