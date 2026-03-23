import mongoose, { Schema, Document } from "mongoose";

export interface IUserFavorite extends Document {
  userId: string;
  analysisId: string;
  analysisType: "content" | "keyword" | "account";
  title: string;
  createdAt: Date;
}

const UserFavoriteSchema = new Schema<IUserFavorite>(
  {
    userId: { type: String, required: true, index: true },
    analysisId: { type: String, required: true },
    analysisType: {
      type: String,
      required: true,
      enum: ["content", "keyword", "account"],
    },
    title: { type: String, default: "" },
  },
  { timestamps: true }
);

// Compound index: one favorite per user per analysis
UserFavoriteSchema.index({ userId: 1, analysisId: 1 }, { unique: true });

export const UserFavorite =
  mongoose.models.UserFavorite ||
  mongoose.model<IUserFavorite>("UserFavorite", UserFavoriteSchema);
