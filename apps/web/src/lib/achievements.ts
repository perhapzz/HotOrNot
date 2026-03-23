import { UserAchievement } from "@hotornot/database";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import mongoose from "mongoose";

export interface AchievementDef {
  id: string;
  emoji: string;
  name: string;
  description: string;
  check: (userId: string, db: any) => Promise<boolean>;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first_analysis",
    emoji: "🌟",
    name: "初次分析",
    description: "完成第一次内容分析",
    check: async (userId, db) => {
      const count = await db.collection("contentanalyses").countDocuments({ userId });
      return count >= 1;
    },
  },
  {
    id: "analysis_50",
    emoji: "📊",
    name: "分析达人",
    description: "累计完成 50 次分析",
    check: async (userId, db) => {
      const counts = await Promise.all([
        db.collection("contentanalyses").countDocuments({ userId }),
        db.collection("keywordanalyses").countDocuments({ userId }),
        db.collection("accountanalyses").countDocuments({ userId }),
      ]);
      return counts.reduce((a: number, b: number) => a + b, 0) >= 50;
    },
  },
  {
    id: "analysis_200",
    emoji: "🏆",
    name: "资深分析师",
    description: "累计完成 200 次分析",
    check: async (userId, db) => {
      const counts = await Promise.all([
        db.collection("contentanalyses").countDocuments({ userId }),
        db.collection("keywordanalyses").countDocuments({ userId }),
        db.collection("accountanalyses").countDocuments({ userId }),
      ]);
      return counts.reduce((a: number, b: number) => a + b, 0) >= 200;
    },
  },
  {
    id: "streak_7",
    emoji: "🔥",
    name: "连续7天",
    description: "连续 7 天使用平台",
    check: async (userId, db) => {
      const days = 7;
      const now = new Date();
      for (let i = 0; i < days; i++) {
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
        const dayEnd = new Date(dayStart.getTime() + 86400000);
        const count = await db.collection("useractivities").countDocuments({
          userId,
          createdAt: { $gte: dayStart, $lt: dayEnd },
        });
        if (count === 0) return false;
      }
      return true;
    },
  },
  {
    id: "all_platforms",
    emoji: "💎",
    name: "全平台分析",
    description: "在所有 4 个平台都完成过分析",
    check: async (userId, db) => {
      const platforms = await db.collection("contentanalyses").distinct("platform", { userId });
      return platforms.length >= 4;
    },
  },
  {
    id: "team_builder",
    emoji: "👥",
    name: "组建团队",
    description: "创建一个团队",
    check: async (userId, db) => {
      const count = await db.collection("teams").countDocuments({ ownerId: userId });
      return count >= 1;
    },
  },
  {
    id: "share_10",
    emoji: "📤",
    name: "分享达人",
    description: "分享分析结果 10 次",
    check: async (userId, db) => {
      const count = await db.collection("useractivities").countDocuments({
        userId,
        action: "share",
      });
      return count >= 10;
    },
  },
  {
    id: "collector_20",
    emoji: "⭐",
    name: "收藏家",
    description: "收藏 20 个分析结果",
    check: async (userId, db) => {
      const count = await db.collection("userfavorites").countDocuments({ userId });
      return count >= 20;
    },
  },
];

/**
 * Check and unlock achievements for a user.
 * Returns newly unlocked achievements.
 */
export async function checkAchievements(userId: string): Promise<AchievementDef[]> {
  await connectDatabase();
  const db = mongoose.connection.db!;

  // Get already unlocked
  const unlocked = await UserAchievement.find({ userId }).lean();
  const unlockedIds = new Set(unlocked.map((a: any) => a.achievementId));

  const newlyUnlocked: AchievementDef[] = [];

  for (const achievement of ACHIEVEMENTS) {
    if (unlockedIds.has(achievement.id)) continue;

    try {
      const qualified = await achievement.check(userId, db);
      if (qualified) {
        await UserAchievement.create({ userId, achievementId: achievement.id });
        newlyUnlocked.push(achievement);
      }
    } catch {
      // Skip on error
    }
  }

  return newlyUnlocked;
}

/**
 * Get all achievements with unlock status for a user.
 */
export async function getUserAchievements(userId: string) {
  await connectDatabase();
  const unlocked = await UserAchievement.find({ userId }).lean();
  const unlockedMap = new Map(
    unlocked.map((a: any) => [a.achievementId, a.unlockedAt])
  );

  return ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: unlockedMap.has(a.id),
    unlockedAt: unlockedMap.get(a.id) || null,
    check: undefined, // Strip function
  }));
}
