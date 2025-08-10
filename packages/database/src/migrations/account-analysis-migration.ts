import mongoose from "mongoose";
import { AccountAnalysis } from "../models/account-analysis";
import { Platform } from "@hotornot/shared";

/**
 * 数据库迁移脚本：从旧的账号分析结构迁移到新结构
 *
 * 主要变化：
 * 1. 将平台相关字段整合到 account 子对象中
 * 2. 重构分析结果结构
 * 3. 添加新的字段和索引
 */

interface OldAccountAnalysis {
  _id: mongoose.Types.ObjectId;
  platform: Platform;
  accountId: string;
  accountName: string;
  avatar?: string;
  bio?: string;
  metrics: {
    followersCount: number;
    followingCount: number;
    postsCount: number;
  };
  analysis: {
    contentPreferences: string[];
    postingPattern: {
      bestTimes: { hour: number; score: number }[];
      frequency: string;
      consistency: number;
    };
    topicSuggestions: string[];
    strengthsAnalysis: string;
    improvementAreas: string[];
    trendsInsight: string;
  };
  recentPostIds?: string[];
  recentPosts?: any[];
  userId?: string;
  status: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class AccountAnalysisMigration {
  /**
   * 检查是否需要迁移
   */
  static async needsMigration(): Promise<boolean> {
    try {
      // 检查是否有旧格式的数据（直接有platform字段的记录）
      const oldFormatCount = await AccountAnalysis.countDocuments({
        platform: { $exists: true },
        "account.platform": { $exists: false },
      });

      console.log(`发现 ${oldFormatCount} 条需要迁移的记录`);
      return oldFormatCount > 0;
    } catch (error) {
      console.error("检查迁移状态失败:", error);
      return false;
    }
  }

  /**
   * 执行数据迁移
   */
  static async migrate(): Promise<{ success: number; failed: number }> {
    let successCount = 0;
    let failedCount = 0;

    try {
      console.log("开始账号分析数据迁移...");

      // 获取所有旧格式的记录
      const oldRecords = (await mongoose.connection
        .collection("account_analyses")
        .find({
          platform: { $exists: true },
          "account.platform": { $exists: false },
        })
        .toArray()) as unknown as OldAccountAnalysis[];

      console.log(`找到 ${oldRecords.length} 条需要迁移的记录`);

      for (const oldRecord of oldRecords) {
        try {
          // 构建新的记录结构
          const newRecord = {
            account: {
              platform: oldRecord.platform,
              accountId: oldRecord.accountId,
              accountName: oldRecord.accountName,
              avatar: oldRecord.avatar,
              bio: oldRecord.bio,
              verified: false, // 默认值
              url: undefined, // 旧记录中没有这个字段
            },
            metrics: {
              ...oldRecord.metrics,
              likesCount: undefined,
              avgViews: undefined,
              engagementRate: undefined,
            },
            analysis: {
              postingPattern: {
                bestTimes: oldRecord.analysis.postingPattern.bestTimes.map(
                  (bt) => ({
                    ...bt,
                    count: 0, // 旧记录中没有count字段
                  }),
                ),
                frequency: oldRecord.analysis.postingPattern.frequency,
                consistency: oldRecord.analysis.postingPattern.consistency,
                weekdayPattern: [], // 新字段，默认为空数组
              },
              content: {
                contentPreferences: oldRecord.analysis.contentPreferences,
                topicSuggestions: oldRecord.analysis.topicSuggestions,
                strengthsAnalysis: oldRecord.analysis.strengthsAnalysis,
                improvementAreas: oldRecord.analysis.improvementAreas,
                trendsInsight: oldRecord.analysis.trendsInsight,
                contentTypes: [], // 新字段，默认为空数组
              },
              overallScore: 7, // 默认评分
              summary: oldRecord.analysis.strengthsAnalysis || "账号分析完成", // 使用优势分析作为总结
            },
            recentPosts: (oldRecord.recentPosts || []).map((post: any) => ({
              postId:
                post._id ||
                post.postId ||
                Math.random().toString(36).substring(7),
              title: post.title,
              description: post.description,
              contentType: post.contentType,
              type: post.type,
              awemeType: post.awemeType,
              metrics: post.metrics,
              url: post.url,
              publishTime: post.publishTime,
              tags: [], // 新字段
            })),
            userId: oldRecord.userId,
            requestUrl: `https://example.com/${oldRecord.platform}/${oldRecord.accountId}`, // 构造一个默认URL
            status: oldRecord.status,
            error: oldRecord.error,
            processingTime: undefined,
            analysisVersion: "1.0",
            createdAt: oldRecord.createdAt,
            updatedAt: oldRecord.updatedAt,
          };

          // 使用updateOne操作，避免触发唯一索引冲突
          await mongoose.connection.collection("account_analyses").updateOne(
            { _id: oldRecord._id },
            {
              $set: newRecord,
              $unset: {
                platform: 1,
                accountId: 1,
                accountName: 1,
                avatar: 1,
                bio: 1,
                recentPostIds: 1,
              },
            },
          );

          successCount++;

          if (successCount % 100 === 0) {
            console.log(`已迁移 ${successCount} 条记录...`);
          }
        } catch (error) {
          console.error(`迁移记录 ${oldRecord._id} 失败:`, error);
          failedCount++;
        }
      }

      console.log(
        `数据迁移完成: 成功 ${successCount} 条, 失败 ${failedCount} 条`,
      );
      return { success: successCount, failed: failedCount };
    } catch (error) {
      console.error("数据迁移失败:", error);
      throw error;
    }
  }

  /**
   * 创建新的索引
   */
  static async createIndexes(): Promise<void> {
    try {
      console.log("创建新的索引...");

      // 删除旧的索引
      try {
        await mongoose.connection
          .collection("account_analyses")
          .dropIndex("platform_1_accountId_1");
        await mongoose.connection
          .collection("account_analyses")
          .dropIndex("platform_1_createdAt_-1");
      } catch (error) {
        // 索引可能已经不存在，忽略错误
      }

      // 通过模型重新创建索引
      await AccountAnalysis.createIndexes();

      console.log("索引创建完成");
    } catch (error) {
      console.error("创建索引失败:", error);
      throw error;
    }
  }

  /**
   * 完整的迁移流程
   */
  static async run(): Promise<void> {
    try {
      const needsMigration = await this.needsMigration();

      if (!needsMigration) {
        console.log("数据库已经是最新格式，无需迁移");
        return;
      }

      // 执行数据迁移
      const result = await this.migrate();

      // 创建新索引
      await this.createIndexes();

      console.log("账号分析数据迁移完成!", result);
    } catch (error) {
      console.error("迁移过程中发生错误:", error);
      throw error;
    }
  }

  /**
   * 验证迁移结果
   */
  static async validateMigration(): Promise<boolean> {
    try {
      // 检查是否还有旧格式的记录
      const oldFormatCount = await AccountAnalysis.countDocuments({
        platform: { $exists: true },
        "account.platform": { $exists: false },
      });

      // 检查新格式记录数量
      const newFormatCount = await AccountAnalysis.countDocuments({
        "account.platform": { $exists: true },
      });

      console.log(
        `验证结果: 旧格式记录 ${oldFormatCount} 条, 新格式记录 ${newFormatCount} 条`,
      );

      return oldFormatCount === 0 && newFormatCount > 0;
    } catch (error) {
      console.error("验证迁移结果失败:", error);
      return false;
    }
  }
}
