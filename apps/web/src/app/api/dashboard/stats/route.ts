import { NextResponse } from "next/server";
import {
  ContentAnalysis,
  AccountAnalysis,
  KeywordAnalysis,
  connectDatabase,
} from "@hotornot/database";
import { Platform } from "@hotornot/shared";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // 连接数据库
    await connectDatabase();

    // 获取各平台统计数据
    const platformStats: any = {};

    // 并行获取各平台数据
    const platforms = Object.values(Platform);

    await Promise.all(
      platforms.map(async (platform) => {
        try {
          // 获取内容分析统计
          const contentStats = await ContentAnalysis.aggregate([
            { $match: { platform, status: "completed" } },
            {
              $group: {
                _id: null,
                totalContent: { $sum: 1 },
                avgScore: { $avg: "$analysis.score" },
                highScoreCount: {
                  $sum: {
                    $cond: [{ $gte: ["$analysis.score", 8] }, 1, 0],
                  },
                },
              },
            },
          ]);

          // 获取账号分析统计
          const accountCount = await AccountAnalysis.countDocuments({
            platform,
            status: "completed",
          });

          // 获取关键词分析统计
          const keywordStats = await KeywordAnalysis.aggregate([
            {
              $match: {
                platforms: platform,
                status: "completed",
                "analysis.hotScore": { $gte: 7 },
              },
            },
            {
              $group: {
                _id: null,
                hotKeywords: { $sum: 1 },
                avgHotScore: { $avg: "$analysis.hotScore" },
              },
            },
          ]);

          const contentData = contentStats[0] || {
            totalContent: 0,
            avgScore: 0,
            highScoreCount: 0,
          };
          const keywordData = keywordStats[0] || {
            hotKeywords: 0,
            avgHotScore: 0,
          };

          platformStats[platform] = {
            totalContent: contentData.totalContent,
            avgScore: Math.round(contentData.avgScore * 10) / 10,
            trending: contentData.highScoreCount,
            accounts: accountCount,
            hotKeywords: keywordData.hotKeywords,
            avgHotScore: Math.round(keywordData.avgHotScore * 10) / 10,
          };
        } catch (error) {
          console.error(`Error fetching stats for ${platform}:`, error);
          // 设置默认值
          platformStats[platform] = {
            totalContent: 0,
            avgScore: 0,
            trending: 0,
            accounts: 0,
            hotKeywords: 0,
            avgHotScore: 0,
          };
        }
      }),
    );

    // 获取总体统计
    const [
      totalContentAnalyses,
      totalAccountAnalyses,
      totalKeywordAnalyses,
      recentAnalyses,
    ] = await Promise.all([
      ContentAnalysis.countDocuments({ status: "completed" }),
      AccountAnalysis.countDocuments({ status: "completed" }),
      KeywordAnalysis.countDocuments({ status: "completed" }),
      ContentAnalysis.find({ status: "completed" })
        .sort({ createdAt: -1 })
        .limit(10)
        .select("platform analysis.score createdAt"),
    ]);

    // 计算趋势数据（最近7天 vs 前7天）
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const [recentCount, previousCount] = await Promise.all([
      ContentAnalysis.countDocuments({
        createdAt: { $gte: sevenDaysAgo },
        status: "completed",
      }),
      ContentAnalysis.countDocuments({
        createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo },
        status: "completed",
      }),
    ]);

    const growthRate =
      previousCount > 0
        ? Math.round(((recentCount - previousCount) / previousCount) * 100)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        platforms: platformStats,
        overview: {
          totalContentAnalyses,
          totalAccountAnalyses,
          totalKeywordAnalyses,
          growthRate,
          recentAnalyses: recentAnalyses.length,
        },
        recentActivity: recentAnalyses.map((analysis: any) => ({
          platform: analysis.platform,
          score: analysis.analysis?.score || 0,
          createdAt: analysis.createdAt,
        })),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    // 返回模拟数据作为降级方案
    return NextResponse.json({
      success: false,
      data: {
        platforms: {
          [Platform.XIAOHONGSHU]: {
            totalContent: 1245,
            avgScore: 7.2,
            trending: 15,
            accounts: 89,
            hotKeywords: 12,
            avgHotScore: 8.3,
          },
          [Platform.BILIBILI]: {
            totalContent: 987,
            avgScore: 8.1,
            trending: 23,
            accounts: 67,
            hotKeywords: 18,
            avgHotScore: 8.7,
          },
          [Platform.DOUYIN]: {
            totalContent: 2156,
            avgScore: 6.8,
            trending: 31,
            accounts: 134,
            hotKeywords: 25,
            avgHotScore: 7.9,
          },
          [Platform.WEIBO]: {
            totalContent: 543,
            avgScore: 6.5,
            trending: 8,
            accounts: 45,
            hotKeywords: 7,
            avgHotScore: 7.1,
          },
        },
        overview: {
          totalContentAnalyses: 4931,
          totalAccountAnalyses: 335,
          totalKeywordAnalyses: 62,
          growthRate: 15,
          recentAnalyses: 89,
        },
        recentActivity: [],
        timestamp: new Date().toISOString(),
      },
      error: "Using fallback data",
    });
  }
}

// 获取实时热点数据
export async function POST() {
  try {
    await connectDatabase();

    // 获取最热门的关键词
    const hotKeywords = await KeywordAnalysis.find({
      status: "completed",
      "analysis.hotScore": { $gte: 6 },
    })
      .sort({ "analysis.hotScore": -1, createdAt: -1 })
      .limit(20)
      .select(
        "keyword platforms analysis.hotScore analysis.trendDirection analysis.recommendationLevel",
      );

    // 获取最近高分内容
    const topContent = await ContentAnalysis.find({
      status: "completed",
      "analysis.score": { $gte: 8 },
    })
      .sort({ "analysis.score": -1, createdAt: -1 })
      .limit(10)
      .select("url platform title author analysis.score metrics");

    // 获取活跃账号
    const activeAccounts = await AccountAnalysis.find({
      status: "completed",
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .select(
        "platform accountName metrics.followersCount analysis.strengthsAnalysis",
      );

    return NextResponse.json({
      success: true,
      data: {
        hotKeywords: hotKeywords.map((k: any) => ({
          keyword: k.keyword,
          platforms: k.platforms,
          hotScore: k.analysis?.hotScore,
          trendDirection: k.analysis?.trendDirection,
          recommendationLevel: k.analysis?.recommendationLevel,
        })),
        topContent: topContent.map((c: any) => ({
          platform: c.platform,
          title: c.title,
          author: c.author,
          score: c.analysis?.score,
          metrics: c.metrics,
        })),
        activeAccounts: activeAccounts.map((a: any) => ({
          platform: a.platform,
          accountName: a.accountName,
          followers: a.metrics?.followersCount,
          strengths: a.analysis?.strengthsAnalysis,
        })),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Dashboard realtime data error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "实时数据获取失败",
      },
      { status: 500 },
    );
  }
}
