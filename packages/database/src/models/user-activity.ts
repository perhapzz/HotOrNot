import mongoose, { Schema, Document } from "mongoose";

export interface IUserActivity extends Document {
  userId?: string;
  action: "analysis" | "export" | "share" | "api_call" | "login" | "register";
  metadata: Record<string, any>;
  createdAt: Date;
}

const UserActivitySchema = new Schema<IUserActivity>(
  {
    userId: { type: String, index: true },
    action: {
      type: String,
      required: true,
      enum: ["analysis", "export", "share", "api_call", "login", "register"],
      index: true,
    },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

UserActivitySchema.index({ createdAt: -1 });
UserActivitySchema.index({ action: 1, createdAt: -1 });

export const UserActivity =
  mongoose.models.UserActivity ||
  mongoose.model<IUserActivity>("UserActivity", UserActivitySchema);
