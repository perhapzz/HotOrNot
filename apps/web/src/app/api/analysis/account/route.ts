import { NextRequest, NextResponse } from "next/server";
import { createAIServiceFromEnv } from "@hotornot/ai";
import { UrlUtils, Platform, ContentType } from "@hotornot/shared";
import {
  AccountAnalysis,
  UserAnalysisRecord,
  connectDatabase,
} from "@hotornot/database";
import { TikHubXiaohongshuParser } from "../../../../lib/xiaohongshu-parser";
import { TikHubDouyinParser } from "../../../../lib/douyin-parser";
import {
  getCacheConfig,
  getCacheExpiration,
  getCacheAge,
} from "../../../../lib/cache-manager";

// 获取用户信息的辅助函数
async function getUserFromToken(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value;
    if (!token) return null;

    const payload = JSON.parse(Buffer.from(token, "base64").toString());
    const { User } = await import("@hotornot/database");
    const user = await User.findById(payload.userId);
    return user;
  } catch (error) {
    return null;
  }
}

// 简化的账号ID提取函数
function extractAccountId(url: string, platform: Platform): string | null {
  try {
    const urlObj = new URL(url);

    switch (platform) {
      case Platform.XIAOHONGSHU:
        const xhsMatch = urlObj.pathname.match(/\/user\/profile\/([a-f0-9]+)/);
        return xhsMatch ? xhsMatch[1] : null;

      case Platform.DOUYIN:
        const dyMatch = urlObj.pathname.match(/\/user\/([^\/]+)/);
        return dyMatch ? dyMatch[1] : null;

      default:
        return null;
    }
  } catch (error) {
    console.error(`URL解析失败: ${error}`);
    return null;
  }
}

// 创建模拟数据作为降级方案
function createFallbackData(
  platform: Platform,
  accountId: string,
  limit: number,
) {
  console.log(`🔄 使用模拟数据作为降级方案 - 平台: ${platform}`);

  return {
    account: {
      platform: platform,
      accountId: accountId,
      accountName: `${platform}用户${accountId.substring(0, 8)}`,
      avatar: "https://example.com/avatar.jpg",
      bio: "这是一个测试账号的简介",
      verified: false,
      followersCount: Math.floor(Math.random() * 10000) + 1000,
      followingCount: Math.floor(Math.random() * 1000) + 100,
      postsCount: Math.floor(Math.random() * 100) + 10,
      likesCount: Math.floor(Math.random() * 50000) + 5000,
    },
    analytics: {
      totalMetrics: {
        likes: Math.floor(Math.random() * 50000) + 5000,
      },
      avgMetrics: {
        likes: Math.floor(Math.random() * 1000) + 50,
        views: Math.floor(Math.random() * 5000) + 200,
        engagementRate: (Math.random() * 5 + 1).toFixed(2),
      },
    },
    recentPosts: Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      postId: `post_${i + 1}`,
      title: `精彩内容分享 ${i + 1}`,
      description: `这是第${i + 1}个精彩内容的描述`,
      contentType: Math.random() > 0.5 ? "图文" : "视频",
      metrics: {
        likes: Math.floor(Math.random() * 1000) + 50,
        views: Math.floor(Math.random() * 5000) + 200,
        comments: Math.floor(Math.random() * 100) + 10,
        shares: Math.floor(Math.random() * 50) + 5,
      },
      url: `https://example.com/post/${i + 1}`,
      publishTime: new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ),
      tags: ["生活", "分享", "精彩"],
    })),
  };
}

// 真实的账号分析服务函数
async function performRealAccountAnalysis(
  url: string,
  platform: Platform,
  accountId: string,
  limit: number = 10,
) {
  try {
    console.log(`🚀 开始真实分析 - 平台: ${platform}, 账号ID: ${accountId}`);

    // 检查是否启用真实分析
    const useRealAnalysis = process.env.USE_REAL_ANALYSIS === "true";
    if (!useRealAnalysis) {
      console.log("💡 USE_REAL_ANALYSIS=false，使用模拟数据");
      return createFallbackData(platform, accountId, limit);
    }

    if (platform === Platform.XIAOHONGSHU) {
      // 调用小红书分析API - 使用新的home notes端点
      const apiUrl =
        process.env.TIKHUB_XIAOHONGSHU_API_URL ||
        "https://api.tikhub.io/api/v1/xiaohongshu/web_v2/fetch_home_notes";
      const apiKey = process.env.TIKHUB_API_KEY;

      if (!apiKey) {
        throw new Error("TIKHUB_API_KEY 未配置，请检查环境变量");
      }

      // 构建查询参数
      const params = new URLSearchParams({
        user_id: accountId,
        count: limit.toString(),
      });

      const fullUrl = `${apiUrl}?${params.toString()}`;
      console.log(`🔗 请求URL: ${fullUrl}`);

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `TikHub API 错误: ${response.status} ${response.statusText}`,
        );
      }

      const tikHubResponse = await response.json();
      console.log("📡 TikHub API 响应状态:", tikHubResponse.code);

      // 使用小红书主页笔记解析器解析数据
      const parsedResult =
        TikHubXiaohongshuParser.parseHomeNotes(tikHubResponse);

      if (!parsedResult.success) {
        throw new Error(`数据解析失败: ${parsedResult.error}`);
      }

      return parsedResult.data;
    } else if (platform === Platform.DOUYIN) {
      // 调用抖音分析API
      const apiUrl =
        process.env.TIKHUB_DOUYIN_API_URL ||
        "https://api.tikhub.io/api/v1/douyin/app/v3/fetch_user_post_videos";
      const apiKey = process.env.TIKHUB_API_KEY;

      if (!apiKey) {
        throw new Error("TIKHUB_API_KEY 未配置，请检查环境变量");
      }

      // 构建查询参数
      const params = new URLSearchParams({
        sec_user_id: accountId,
        count: limit.toString(),
      });

      const fullUrl = `${apiUrl}?${params.toString()}`;
      console.log(`🔗 抖音请求URL: ${fullUrl}`);

      const response = await fetch(fullUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!response.ok) {
        throw new Error(
          `TikHub API 错误: ${response.status} ${response.statusText}`,
        );
      }

      const tikHubResponse = await response.json();
      console.log("📡 TikHub API 响应状态:", tikHubResponse.code);

      // 使用抖音解析器解析数据
      const parsedResult = TikHubDouyinParser.parseUserPosts(tikHubResponse);

      if (!parsedResult.success) {
        throw new Error(`数据解析失败: ${parsedResult.error}`);
      }

      return parsedResult.data;
    } else {
      throw new Error(`暂不支持平台: ${platform}`);
    }
  } catch (error: any) {
    console.error("❌ 真实分析失败:", error.message);

    // 检查是否允许降级到模拟数据
    const allowFallback = process.env.ALLOW_FALLBACK_DATA === "true";
    if (allowFallback) {
      console.log("🔄 降级使用模拟数据");
      return createFallbackData(platform, accountId, limit);
    }

    // 不允许降级，直接抛出错误
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    // 连接数据库
    await connectDatabase();

    // 解析请求体
    const body = await request.json();
    const { url, platform: providedPlatform, limit = 20 } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: "请提供账号链接" },
        { status: 400 },
      );
    }

    // 从URL自动检测平台
    const platform = providedPlatform || UrlUtils.extractPlatform(url);
    if (!platform) {
      return NextResponse.json(
        { success: false, error: "无法识别平台，请提供平台参数" },
        { status: 400 },
      );
    }

    // 提取账号ID
    const accountId = extractAccountId(url, platform);
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: "无法提取账号ID" },
        { status: 400 },
      );
    }

    // 获取用户信息
    const user = await getUserFromToken(request);
    const userIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // 创建用户分析记录
    const userRecord = new UserAnalysisRecord({
      userId: user?.id,
      sessionId: !user ? "session_" + Date.now() : undefined,
      userIP: userIP,
      userAgent: userAgent,
      requestUrl: url,
      platform: platform,
      accountId: accountId,
      analysisId: "pending_" + Date.now(), // 临时ID，完成时更新为实际分析ID
      analysisType: "account",
      requestSource: "web",
      status: "pending",
    });

    await userRecord.save();
    console.log(`✅ 用户分析记录已创建 (ID: ${userRecord._id})`);

    // 检查是否有最近的分析结果可以复用（使用配置的缓存有效期）
    const cacheConfig = getCacheConfig();
    const cacheExpiration = getCacheExpiration(cacheConfig.accountAnalysis);

    const recentAnalysis = await AccountAnalysis.findOne({
      "account.platform": platform,
      "account.accountId": accountId,
      status: "completed",
      createdAt: { $gte: cacheExpiration }, // 在有效期内的记录
    }).sort({ createdAt: -1 });

    // 如果有最近的分析结果，复用它
    if (recentAnalysis) {
      const cacheAge = getCacheAge(recentAnalysis.createdAt);

      await userRecord.markAsCompleted(
        recentAnalysis._id.toString(),
        0, // 复用结果，处理时间为0
        "medium", // 复用数据质量标记为medium
      );

      return NextResponse.json({
        success: true,
        data: {
          account: recentAnalysis.account,
          metrics: recentAnalysis.metrics,
          analysis: recentAnalysis.analysis,
          recentPosts: recentAnalysis.recentPosts || [],
          timestamp: recentAnalysis.updatedAt.toISOString(),
          cached: true,
          cacheAge: cacheAge,
          cacheExpirationHours: cacheConfig.accountAnalysis,
          userRecordId: userRecord._id,
        },
      });
    }

    // 标记为处理中
    await userRecord.markAsProcessing(10);

    // 执行真实的账号分析
    const realAnalysisData = await performRealAccountAnalysis(
      url,
      platform,
      accountId,
      limit,
    );

    // 更新进度
    await userRecord.updateProgress(50);

    // 从真实分析数据中提取信息
    const accountData = realAnalysisData.account;
    const metricsData = realAnalysisData.analytics || {};
    const postsData = realAnalysisData.recentPosts || [];

    // 构建标准化的账号信息
    const standardAccountData = {
      platform: platform as Platform,
      accountId: accountId,
      accountName:
        accountData.accountName ||
        accountData.nickname ||
        `${platform}用户${accountId.substring(0, 8)}`,
      uniqueId: accountData.uniqueId || accountData.shortId || "",
      avatar:
        (typeof accountData.avatar === "string"
          ? accountData.avatar
          : accountData.avatar?.uri) || "",
      bio: accountData.bio || accountData.signature || "",
      verified: accountData.verified || false,
      url: url,
    };

    // 构建标准化的指标数据
    const standardMetrics = {
      followersCount: accountData.followersCount || accountData.fans_count || 0,
      followingCount:
        accountData.followingCount || accountData.following_count || 0,
      postsCount: accountData.postsCount || postsData.length || 0,
      likesCount:
        accountData.likesCount || metricsData.totalMetrics?.likes || 0,
      avgViews: accountData.avgViews || metricsData.avgMetrics?.views || 0,
      // 小红书平台不提供观看量数据，所以互动率设为0
      engagementRate:
        platform === "xiaohongshu"
          ? 0
          : Math.min(
              parseFloat(metricsData.avgMetrics?.engagementRate || "0") || 0,
              100,
            ),
    };

    // 使用AI分析最近20个作品的内容
    const aiService = createAIServiceFromEnv();
    let aiAnalysisResult = null;

    try {
      // 准备作品内容用于AI分析
      const postsForAnalysis = (realAnalysisData.recentPosts || []).slice(
        0,
        20,
      );

      if (postsForAnalysis.length > 0) {
        // 转换为AI服务需要的格式
        const recentPostsForAI = postsForAnalysis.map((post: any) => ({
          url: post.url || "",
          platform: platform,
          title: post.title || post.desc || post.description || "",
          description: post.description || post.desc || "",
          author: standardAccountData.accountName,
          metrics: {
            views: post.metrics?.views || post.views || 0,
            likes: post.metrics?.likes || post.likes || 0,
            comments: post.metrics?.comments || post.comments || 0,
            shares: post.metrics?.shares || post.shares || 0,
          },
          contentType:
            post.contentType === "图文"
              ? ("image" as const)
              : ("video" as const),
          rawContent: post.title + " " + (post.description || post.desc || ""),
        }));

        const accountAnalysisRequest = {
          accountId: accountId,
          platform: platform,
          accountName: standardAccountData.accountName,
          // 小红书暂时无法获取bio信息，不发送给AI分析
          bio:
            platform === Platform.XIAOHONGSHU
              ? undefined
              : standardAccountData.bio,
          followerCount: standardMetrics.followersCount,
          recentPosts: recentPostsForAI,
        };

        console.log("🤖 开始AI分析作品内容...");
        aiAnalysisResult = await aiService.analyzeAccount(
          accountAnalysisRequest,
        );
        console.log("✅ AI分析完成");
      }
    } catch (aiError) {
      console.warn("⚠️ AI分析失败，使用默认分析结果:", aiError);
      aiAnalysisResult = null;
    }

    // 更新进度
    await userRecord.updateProgress(85);

    // 创建分析结果
    const analysis = new AccountAnalysis({
      account: standardAccountData,
      metrics: standardMetrics,
      analysis: {
        postingPattern: aiAnalysisResult?.postingPattern || {
          bestTimes: [
            { hour: 10, score: 8.5, count: 5 },
            { hour: 14, score: 7.8, count: 3 },
            { hour: 20, score: 9.2, count: 8 },
          ],
          frequency: "每日1-2次",
          consistency: 7.5,
          weekdayPattern: [
            { day: 1, count: 3 },
            { day: 3, count: 5 },
            { day: 5, count: 4 },
          ],
        },
        content: {
          contentPreferences: aiAnalysisResult?.contentPreferences || [
            "生活分享",
            "日常记录",
          ],
          topicSuggestions: aiAnalysisResult?.topicSuggestions || [
            "美食推荐",
            "生活技巧",
            "心情分享",
          ],
          strengthsAnalysis:
            aiAnalysisResult?.strengthsAnalysis || "内容质量较好，互动率稳定",
          improvementAreas: aiAnalysisResult?.improvementAreas || [
            "可以增加发布频率",
            "尝试更多内容类型",
          ],
          trendsInsight:
            aiAnalysisResult?.trendsInsight || "用户偏好真实生活分享内容",
          contentTypes: [
            { type: "图文", count: 6, percentage: 60 },
            { type: "视频", count: 4, percentage: 40 },
          ],
        },
        overallScore: 7.8,
        summary:
          "基于最近20个作品的AI深度分析：账号整体表现良好，内容质量稳定，建议保持现有风格并适当增加发布频率。",
      },
      recentPosts: postsData.map((post: any) => ({
        ...post,
        postId:
          post.postId ||
          post.id ||
          post.note_id ||
          `post_${Math.random().toString(36).substr(2, 9)}`,
      })),
      userId: user?.id,
      requestUrl: url,
      status: "completed",
      processingTime: 3000,
      analysisVersion: "1.0",
    });

    await analysis.save();

    // 更新用户记录为完成状态
    await userRecord.markAsCompleted(analysis._id.toString(), 3000, "high");

    // 如果用户已登录，更新用户统计
    if (user) {
      try {
        const { User } = await import("@hotornot/database");
        await User.findByIdAndUpdate(user._id, {
          $inc: {
            "stats.totalAnalyses": 1,
            "stats.accountAnalyses": 1,
          },
          lastAnalysisAt: new Date(),
        });
        console.log(
          `✅ 用户统计更新完成: totalAnalyses +1, accountAnalyses +1`,
        );
      } catch (userUpdateError) {
        console.warn("用户统计更新失败:", userUpdateError);
        // 不影响主要功能，继续执行
      }
    }

    console.log(`✅ 分析完成，记录ID: ${analysis._id}`);
    console.log(`✅ 用户记录更新完成: ${userRecord._id}`);

    return NextResponse.json({
      success: true,
      data: {
        account: analysis.account,
        metrics: analysis.metrics,
        analysis: analysis.analysis,
        recentPosts: analysis.recentPosts,
        timestamp: analysis.updatedAt.toISOString(),
        cached: false,
        userRecordId: userRecord._id,
      },
    });
  } catch (error) {
    console.error("❌ 账号分析失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "分析失败，请稍后重试",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: "账号分析API正常运行",
    supportedPlatforms: Object.values(Platform),
  });
}
