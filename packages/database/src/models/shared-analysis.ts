import mongoose, { Schema, Document } from "mongoose";

export interface ISharedAnalysis extends Document {
  analysisId: string;
  analysisType: "content" | "account" | "keyword";
  teamId: string;
  sharedBy: string;
  note?: string;
  createdAt: Date;
}

const SharedAnalysisSchema = new Schema<ISharedAnalysis>(
  {
    analysisId: { type: String, required: true },
    analysisType: {
      type: String,
      required: true,
      enum: ["content", "account", "keyword"],
    },
    teamId: { type: String, required: true, index: true },
    sharedBy: { type: String, required: true },
    note: { type: String, maxlength: 500 },
  },
  { timestamps: true }
);

SharedAnalysisSchema.index({ teamId: 1, createdAt: -1 });
SharedAnalysisSchema.index({ analysisId: 1, teamId: 1 }, { unique: true });

export const SharedAnalysis =
  mongoose.models.SharedAnalysis ||
  mongoose.model<ISharedAnalysis>("SharedAnalysis", SharedAnalysisSchema);
