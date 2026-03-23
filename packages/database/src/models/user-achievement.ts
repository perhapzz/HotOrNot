import mongoose, { Schema, Document } from "mongoose";

export interface IUserAchievement extends Document {
  userId: string;
  achievementId: string;
  unlockedAt: Date;
}

const UserAchievementSchema = new Schema<IUserAchievement>({
  userId: { type: String, required: true, index: true },
  achievementId: { type: String, required: true },
  unlockedAt: { type: Date, default: Date.now },
});

UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

export const UserAchievement =
  mongoose.models.UserAchievement ||
  mongoose.model<IUserAchievement>("UserAchievement", UserAchievementSchema);
