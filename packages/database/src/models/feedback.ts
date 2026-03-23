import mongoose, { Schema, Document } from "mongoose";

export interface IFeedback extends Document {
  analysisId: string;
  analysisType: "content" | "keyword" | "account";
  userId?: string;
  rating: "up" | "down";
  comment: string;
  createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    analysisId: { type: String, required: true, index: true },
    analysisType: {
      type: String,
      required: true,
      enum: ["content", "keyword", "account"],
    },
    userId: { type: String, index: true },
    rating: { type: String, required: true, enum: ["up", "down"] },
    comment: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Feedback =
  mongoose.models.Feedback ||
  mongoose.model<IFeedback>("Feedback", FeedbackSchema);
