import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { createAIServiceFromEnv } from "@hotornot/ai";
import { Platform } from "@hotornot/shared";
import {
  KeywordAnalysis,
  UserAnalysisRecord,
  User,
  connectDatabase,
} from "@hotornot/database";
import { XiaohongshuKeywordParser } from "../../../../lib/xiaohongshu-keyword-parser";
import { DouyinKeywordParser } from "../../../../lib/douyin-keyword-parser";
import {
  getCacheConfig,
  getCacheExpiration,
  getCacheAge,
} from "../../../../lib/cache-manager";
export const dynamic = "force-dynamic";

// 定义搜索结果的类型
interface KeywordSearchResult {
  id: string;
  title: string;
  author: string;
  authorId: string;
  authorAvatar: string;
  url: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    collected: number;
  };
  publishedAt: Date;
  coverImage: string;
  images: string[];
}

export async function POST(request: NextRequest) {
  try {
    // 连接数据库
    await connectDatabase();

    // 解析请求体
    const body = await request.json();
    const {
      keyword,
      platforms = [Platform.XIAOHONGSHU, Platform.DOUYIN],
      limit = 50,
    } = body;

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json(
        { success: false, error: "请提供关键词" },
        { status: 400 },
      );
    }

    if (!Array.isArray(platforms) || platforms.length === 0) {
      return NextResponse.json(
        { success: false, error: "请提供至少一个平台" },
        { status: 400 },
      );
    }

    // 验证平台参数
    const validPlatforms = platforms.filter((p) =>
      Object.values(Platform).includes(p),
    );
    if (validPlatforms.length === 0) {
      return NextResponse.json(
        { success: false, error: "请提供有效的平台参数" },
        { status: 400 },
      );
    }

    console.log(
      `🔍 开始关键词分析: "${keyword}" | 平台: ${validPlatforms.join(", ")} | 限制: ${limit}`,
    );

    // 获取用户信息和请求元数据
    const authPayload = getUserFromRequest(request);
    const user = authPayload ? await User.findById(authPayload.userId) : null;
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
      requestUrl: `keyword:${keyword}`, // 关键词分析使用特殊格式的URL
      platform: validPlatforms[0], // 记录主要平台
      accountId: `keyword_${keyword.toLowerCase().replace(/[^a-z0-9]/g, "_")}`, // 关键词分析使用特殊格式的账号ID
      analysisId: "pending_" + Date.now(), // 临时ID，完成时更新为实际分析ID
      analysisType: "keyword",
      requestSource: "web",
      status: "pending",
    });

    await userRecord.save();
    console.log(`✅ 用户分析记录已创建 (ID: ${userRecord._id})`);

    // 检查是否已有分析记录 (使用配置的缓存有效期)
    const cacheConfig = getCacheConfig();
    const cacheExpiration = getCacheExpiration(cacheConfig.keywordAnalysis);

    const existingAnalysis = await KeywordAnalysis.findOne({
      keyword: keyword.trim().toLowerCase(),
      platforms: { $in: validPlatforms },
      status: "completed",
      updatedAt: { $gte: cacheExpiration }, // 只查找在有效期内的记录
    }).sort({ createdAt: -1 });

    if (existingAnalysis) {
      const cacheAge = getCacheAge(existingAnalysis.updatedAt);

      // 更新用户记录为完成状态（使用缓存结果）
      console.log(
        `📝 正在更新用户记录为完成状态 (缓存结果) - 记录ID: ${userRecord._id}`,
      );
      await userRecord.markAsCompleted(
        (existingAnalysis as any)._id.toString(),
        0, // 复用结果，处理时间为0
        "high", // 缓存结果质量高
      );
      console.log(
        `✅ 用户记录已更新为完成状态 (缓存) - 分析ID: ${(existingAnalysis as any)._id}`,
      );

      return NextResponse.json({
        success: true,
        data: {
          keyword: existingAnalysis.keyword,
          platforms: existingAnalysis.platforms,
          analysis: existingAnalysis.analysis,
          topContent: existingAnalysis.topContent.map((content) => ({
            platform: content.platform,
            url: content.url,
            title: content.title,
            author: content.author,
            authorId: content.authorId || "", // 强制包含字段，即使为空
            authorAvatar: content.authorAvatar || "", // 强制包含博主头像字段
            metrics: content.metrics,
            publishedAt: content.publishedAt,
            coverImage: content.coverImage || "", // 强制包含封面图片字段
            images: content.images || [], // 强制包含图片列表字段
          })),
          searchStats: existingAnalysis.searchStats || null, // 确保包含searchStats字段
          timestamp: existingAnalysis.updatedAt.toISOString(),
          cached: true,
          cacheAge: cacheAge,
          cacheExpirationHours: cacheConfig.keywordAnalysis,
          dataSource: existingAnalysis.searchStats ? "real" : "mock", // 添加数据源标识
        },
      });
    }

    // 创建新的关键词分析记录
    const newAnalysis = new KeywordAnalysis({
      keyword: keyword.trim().toLowerCase(),
      platforms: validPlatforms,
      status: "pending",
    });

    await newAnalysis.save();

    // 获取关键词搜索数据
    let realTopContent: any[] = [];
    let searchAnalysis: any = null;

    const tikHubApiKey = process.env.TIKHUB_API_KEY;

    if (!tikHubApiKey) {
      throw new Error(
        "TIKHUB_API_KEY not configured. Please configure the API key to use keyword analysis.",
      );
    }

    // 支持小红书和抖音平台
    if (validPlatforms.includes(Platform.XIAOHONGSHU)) {
      const xiaohongshuParser = new XiaohongshuKeywordParser(tikHubApiKey);
      const keywordResults = await xiaohongshuParser.analyzeKeywordResults(
        keyword,
        limit,
      );

      searchAnalysis = keywordResults.analysis;

      // 调试：检查解析器返回的数据
      console.log(
        "🔍 小红书解析器返回的结果数量:",
        keywordResults.results.length,
      );
      if (keywordResults.results.length > 0) {
        const firstResult = keywordResults.results[0];
        console.log("🔍 第一条结果数据结构:");
        console.log("  - authorAvatar:", firstResult.authorAvatar);
        console.log("  - coverImage:", firstResult.coverImage);
        console.log("  - images:", firstResult.images?.length || 0, "张图片");
      }

      // 转换为topContent格式
      const xiaohongshuContent = keywordResults.results
        .slice(0, 10)
        .map((item: KeywordSearchResult) => {
          const convertedItem = {
            platform: Platform.XIAOHONGSHU,
            url: item.url,
            title: item.title,
            author: item.author,
            authorId: item.authorId,
            authorAvatar: item.authorAvatar,
            metrics: {
              views: item.metrics.likes * 10, // 估算浏览量为点赞数的10倍
              likes: item.metrics.likes,
              comments: item.metrics.comments,
              shares: item.metrics.shares,
              collected: item.metrics.collected,
            },
            publishedAt: item.publishedAt,
            coverImage: item.coverImage,
            images: item.images,
          };

          // 调试：记录第一条转换后的数据
          if (item === keywordResults.results[0]) {
            console.log("📝 小红书API路由转换后的第一条数据:");
            console.log("  - authorId:", convertedItem.authorId);
            console.log("  - authorAvatar:", convertedItem.authorAvatar);
            console.log("  - coverImage:", convertedItem.coverImage);
            console.log("  - images数量:", convertedItem.images?.length || 0);
            console.log("  - 完整字段列表:", Object.keys(convertedItem));
          }

          return convertedItem;
        });

      realTopContent = [...realTopContent, ...xiaohongshuContent];
      console.log(
        `成功获取小红书关键词 "${keyword}" 的 ${xiaohongshuContent.length} 条搜索结果`,
      );
    }

    if (validPlatforms.includes(Platform.DOUYIN)) {
      const douyinParser = new DouyinKeywordParser(tikHubApiKey);
      const keywordResults = await douyinParser.analyzeKeywordResults(
        keyword,
        limit,
      );

      // 合并分析结果
      if (!searchAnalysis) {
        searchAnalysis = keywordResults.analysis;
      } else {
        // 合并多平台的分析结果
        searchAnalysis.totalResults += keywordResults.analysis.totalResults;
        searchAnalysis.avgEngagement =
          (searchAnalysis.avgEngagement +
            keywordResults.analysis.avgEngagement) /
          2;
        searchAnalysis.avgLikes =
          (searchAnalysis.avgLikes + keywordResults.analysis.avgLikes) / 2;
        searchAnalysis.avgComments =
          (searchAnalysis.avgComments + keywordResults.analysis.avgComments) /
          2;
        searchAnalysis.avgShares =
          (searchAnalysis.avgShares + keywordResults.analysis.avgShares) / 2;
        searchAnalysis.avgCollected =
          (searchAnalysis.avgCollected + keywordResults.analysis.avgCollected) /
          2;
        searchAnalysis.topAuthors = [
          ...searchAnalysis.topAuthors,
          ...keywordResults.analysis.topAuthors,
        ]
          .sort((a: any, b: any) => b.totalLikes - a.totalLikes)
          .slice(0, 10);
      }

      // 调试：检查解析器返回的数据
      console.log(
        "🎬 抖音解析器返回的结果数量:",
        keywordResults.results.length,
      );
      if (keywordResults.results.length > 0) {
        const firstResult = keywordResults.results[0];
        console.log("🎬 第一条结果数据结构:");
        console.log("  - authorAvatar:", firstResult.authorAvatar);
        console.log("  - coverImage:", firstResult.coverImage);
        console.log(
          "  - images (hashtags):",
          firstResult.images?.length || 0,
          "个标签",
        );
      }

      // 转换为topContent格式
      const douyinContent = keywordResults.results
        .slice(0, 10)
        .map((item: KeywordSearchResult) => {
          const convertedItem = {
            platform: Platform.DOUYIN,
            url: item.url,
            title: item.title,
            author: item.author,
            authorId: item.authorId,
            authorAvatar: item.authorAvatar,
            metrics: {
              views: item.metrics.views,
              likes: item.metrics.likes,
              comments: item.metrics.comments,
              shares: item.metrics.shares,
              collected: item.metrics.collected,
            },
            publishedAt: item.publishedAt,
            coverImage: item.coverImage,
            images: [], // 抖音是视频内容，不显示images，只显示coverImage
          };

          // 调试：记录第一条转换后的数据
          if (item === keywordResults.results[0]) {
            console.log("📝 抖音API路由转换后的第一条数据:");
            console.log("  - authorId:", convertedItem.authorId);
            console.log("  - authorAvatar:", convertedItem.authorAvatar);
            console.log("  - coverImage:", convertedItem.coverImage);
            console.log("  - images数量:", convertedItem.images?.length || 0);
            console.log("  - 完整字段列表:", Object.keys(convertedItem));
          }

          return convertedItem;
        });

      realTopContent = [...realTopContent, ...douyinContent];
      console.log(
        `成功获取抖音关键词 "${keyword}" 的 ${douyinContent.length} 条搜索结果`,
      );
    }

    if (realTopContent.length === 0) {
      throw new Error("No supported platforms provided or no results found.");
    }

    try {
      // 创建AI服务实例
      const aiService = createAIServiceFromEnv();

      // 准备关键词分析数据
      const keywordData = {
        keyword: newAnalysis.keyword,
        platforms: newAnalysis.platforms,
        topContent: realTopContent,
        totalResults:
          searchAnalysis?.totalResults || realTopContent.length * 10,
        timeRange: "week" as const,
        searchAnalysis, // 添加小红书真实搜索分析数据
      };

      const analysisResult = await aiService.analyzeKeyword(keywordData);

      // 映射AI分析结果到数据库模型结构，结合真实数据统计
      const avgEngagement =
        searchAnalysis?.avgEngagement ||
        realTopContent.reduce(
          (sum, item) => sum + item.metrics.likes + item.metrics.comments,
          0,
        ) / realTopContent.length;

      // 转换中文趋势值为英文数据库枚举值
      const convertTrendDirection = (
        chineseTrend: string,
      ): "rising" | "stable" | "declining" => {
        if (
          chineseTrend.includes("上升") ||
          chineseTrend.includes("增长") ||
          chineseTrend.includes("rising")
        ) {
          return "rising";
        } else if (
          chineseTrend.includes("下降") ||
          chineseTrend.includes("减少") ||
          chineseTrend.includes("declining")
        ) {
          return "declining";
        } else {
          return "stable"; // 默认为稳定，包括"稳定"等
        }
      };

      newAnalysis.analysis = {
        totalResults:
          searchAnalysis?.totalResults || realTopContent.length * 10,
        avgEngagement,
        trendDirection: convertTrendDirection(analysisResult.momentum),
        hotScore: analysisResult.trendScore,
        competitiveness:
          analysisResult.competitionLevel === "high"
            ? 8
            : analysisResult.competitionLevel === "medium"
              ? 5
              : 3,
        recommendationLevel:
          analysisResult.trendScore >= 7
            ? "high"
            : analysisResult.trendScore >= 4
              ? "medium"
              : "low",
        insights: searchAnalysis
          ? `热度评分: ${analysisResult.trendScore}/10, 趋势: ${analysisResult.momentum}, 平均互动: ${Math.round(avgEngagement)}, 顶级博主: ${searchAnalysis.topAuthors
              .slice(0, 3)
              .map((a: any) => a.name)
              .join(", ")}`
          : `热度评分: ${analysisResult.trendScore}/10, 趋势: ${analysisResult.momentum}, 竞争程度: ${analysisResult.competitionLevel}`,
        suggestedHashtags: analysisResult.relatedKeywords,
        bestPlatforms: validPlatforms,
        contentSuggestions: analysisResult.contentSuggestions.concat(
          searchAnalysis?.topAuthors.length > 0
            ? [
                `参考头部博主: ${searchAnalysis.topAuthors
                  .slice(0, 5)
                  .map((a: any) => `${a.name}(${a.totalLikes}赞)`)
                  .join(", ")}`,
              ]
            : [],
        ),
        timingRecommendations: [
          `最佳发布日期: ${analysisResult.timing.bestDays.join(", ")}`,
          `最佳发布时间: ${analysisResult.timing.bestHours.join(", ")}点`,
        ],
      };
      // 手动构建完全符合Schema的数据结构
      newAnalysis.topContent = realTopContent.map((content) => {
        const topContentItem = {
          platform: content.platform,
          url: content.url,
          title: content.title,
          author: content.author,
          authorId: content.authorId || "",
          authorAvatar: content.authorAvatar || "",
          metrics: {
            views: content.metrics.views || 0,
            likes: content.metrics.likes || 0,
            comments: content.metrics.comments || 0,
            shares: content.metrics.shares || 0,
            collected: content.metrics.collected || 0,
          },
          publishedAt: content.publishedAt,
          coverImage: content.coverImage || "",
          images: content.images || [],
        };

        return topContentItem;
      });

      // 保存searchStats到数据库
      if (searchAnalysis) {
        newAnalysis.searchStats = {
          totalResults: searchAnalysis.totalResults,
          avgLikes: Math.round(searchAnalysis.avgLikes),
          avgComments: Math.round(searchAnalysis.avgComments),
          avgShares: Math.round(searchAnalysis.avgShares),
          avgCollected: Math.round(searchAnalysis.avgCollected),
          topAuthors: searchAnalysis.topAuthors.slice(0, 10),
          averageImagesPerPost:
            Math.round(searchAnalysis.contentTrends.averageImagesPerPost * 10) /
            10,
        };
      }

      newAnalysis.status = "completed";

      // 手动构建完全符合Schema的数据，确保类型安全
      const cleanTopContent = realTopContent.map((content) => ({
        platform: String(content.platform || "xiaohongshu"),
        url: String(content.url || ""),
        title: String(content.title || ""),
        author: String(content.author || ""),
        authorId: String(content.authorId || ""),
        authorAvatar: String(content.authorAvatar || ""),
        metrics: {
          views: Number(content.metrics?.views || 0),
          likes: Number(content.metrics?.likes || 0),
          comments: Number(content.metrics?.comments || 0),
          shares: Number(content.metrics?.shares || 0),
          collected: Number(content.metrics?.collected || 0),
        },
        publishedAt:
          content.publishedAt instanceof Date
            ? content.publishedAt
            : new Date(content.publishedAt),
        coverImage: String(content.coverImage || ""),
        images: Array.isArray(content.images) ? content.images.map(String) : [],
      }));

      const analysisDoc = {
        keyword: String(newAnalysis.keyword),
        platforms: Array.isArray(newAnalysis.platforms)
          ? newAnalysis.platforms
          : ["xiaohongshu"],
        analysis: newAnalysis.analysis,
        topContent: cleanTopContent,
        searchStats: newAnalysis.searchStats,
        status: "completed" as const,
      };

      const savedAnalysis = await KeywordAnalysis.create(analysisDoc);

      // 更新用户记录为完成状态
      const processingTime =
        Date.now() - (userRecord.createdAt?.getTime() || Date.now());
      console.log(
        `📝 正在更新用户记录为完成状态 (新分析) - 记录ID: ${userRecord._id}, 处理时间: ${processingTime}ms`,
      );
      await userRecord.markAsCompleted(
        (savedAnalysis as any)._id.toString(),
        processingTime,
        "high", // 新分析结果质量高
      );
      console.log(
        `✅ 用户记录已更新为完成状态 (新分析) - 分析ID: ${(savedAnalysis as any)._id}`,
      );

      // 返回分析结果 - 直接使用 realTopContent 确保图片数据完整
      return NextResponse.json({
        success: true,
        data: {
          keyword: savedAnalysis.keyword,
          platforms: savedAnalysis.platforms,
          analysis: savedAnalysis.analysis, // 使用构建好的完整分析结果
          topContent: realTopContent.map((content) => ({
            platform: content.platform,
            url: content.url,
            title: content.title,
            author: content.author,
            authorId: content.authorId || "", // 强制包含字段，即使为空
            authorAvatar: content.authorAvatar || "", // 强制包含博主头像字段
            metrics: content.metrics,
            publishedAt: content.publishedAt,
            coverImage: content.coverImage || "", // 强制包含封面图片字段
            images: content.images || [], // 强制包含图片列表字段
          })),
          searchStats: savedAnalysis.searchStats
            ? {
                totalResults: savedAnalysis.searchStats.totalResults,
                avgLikes: savedAnalysis.searchStats.avgLikes,
                avgComments: savedAnalysis.searchStats.avgComments,
                avgShares: savedAnalysis.searchStats.avgShares,
                avgCollected: savedAnalysis.searchStats.avgCollected,
                topAuthors: savedAnalysis.searchStats.topAuthors,
                averageImagesPerPost:
                  savedAnalysis.searchStats.averageImagesPerPost,
              }
            : null,
          timestamp: savedAnalysis.updatedAt.toISOString(),
          cached: false,
          dataSource: "real", // 明确标识为真实数据
        },
      });
    } catch (aiError) {
      // AI分析失败，更新状态
      newAnalysis.status = "failed";
      newAnalysis.error =
        aiError instanceof Error ? aiError.message : "AI分析失败";
      await newAnalysis.save();

      // 更新用户记录为失败状态
      const processingTime =
        Date.now() - (userRecord.createdAt?.getTime() || Date.now());
      await userRecord.markAsFailed(
        aiError instanceof Error ? aiError.message : "AI分析失败",
        processingTime,
      );

      throw aiError;
    }
  } catch (error) {
    console.error("Keyword analysis error:", error);

    // 处理验证错误
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          error: "请求参数无效",
          details: (error as any).errors,
        },
        { status: 400 },
      );
    }

    // 处理AI服务错误
    if (error instanceof Error && error.name === "AIServiceError") {
      return NextResponse.json(
        {
          success: false,
          error: "分析服务暂时不可用，请稍后重试",
        },
        { status: 503 },
      );
    }

    // 处理其他错误
    return NextResponse.json(
      {
        success: false,
        error: "服务器内部错误",
      },
      { status: 500 },
    );
  }
}

// 获取热门关键词端点
export async function GET(request: NextRequest) {
  try {
    await connectDatabase();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "hot";
    const limit = parseInt(searchParams.get("limit") || "10");
    const platform = searchParams.get("platform");

    let keywords;

    switch (type) {
      case "hot":
        keywords = await KeywordAnalysis.findHotKeywords(limit);
        break;
      case "recommended":
        const level = searchParams.get("level") || "high";
        keywords = await KeywordAnalysis.findRecommended(level as any, limit);
        break;
      case "platform":
        if (
          !platform ||
          !Object.values(Platform).includes(platform as Platform)
        ) {
          return NextResponse.json(
            { success: false, error: "请提供有效的平台参数" },
            { status: 400 },
          );
        }
        keywords = await KeywordAnalysis.findByPlatform(
          platform as Platform,
          limit,
        );
        break;
      default:
        keywords = await KeywordAnalysis.find({ status: "completed" })
          .sort({ createdAt: -1 })
          .limit(limit);
    }

    return NextResponse.json({
      success: true,
      data: {
        type,
        keywords: keywords.map((k: any) => ({
          keyword: k.keyword,
          platforms: k.platforms,
          hotScore: k.analysis?.hotScore,
          recommendationLevel: k.analysis?.recommendationLevel,
          trendDirection: k.analysis?.trendDirection,
          createdAt: k.createdAt,
        })),
        total: keywords.length,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "关键词分析服务不可用",
      },
      { status: 503 },
    );
  }
}
