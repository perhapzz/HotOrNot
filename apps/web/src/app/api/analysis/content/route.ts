import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { createAIServiceFromEnv } from "@hotornot/ai";
import { UrlUtils, Platform, ContentType } from "@hotornot/shared";
import { ContentAnalysisRequestSchema } from "@hotornot/shared";
import {
  ContentAnalysis,
  UserAnalysisRecord,
  User,
  connectDatabase,
} from "@hotornot/database";
import {
  getCacheConfig,
  getCacheExpiration,
  getCacheAge,
} from "../../../../lib/cache-manager";
export const dynamic = "force-dynamic";

// TikHub API调用函数 - 获取抖音单个视频详细数据
async function fetchDouyinSingleVideo(awemeId: string) {
  const apiUrl = `https://api.tikhub.io/api/v1/douyin/app/v3/fetch_one_video_v2`;
  const apiKey = process.env.TIKHUB_API_KEY || "YOUR_API_KEY_HERE";

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    accept: "application/json",
  };

  const params = new URLSearchParams({
    aweme_id: awemeId,
  });

  const fullUrl = `${apiUrl}?${params.toString()}`;

  console.log("🚀 ===========================================");
  console.log("🚀 发起TikHub API请求 - 抖音单个视频");
  console.log("🚀 ===========================================");
  console.log(`📍 API URL: ${apiUrl}`);
  console.log(`🔗 完整请求URL: ${fullUrl}`);
  console.log(`🔑 API Key (前10位): ${apiKey.substring(0, 10)}...`);
  console.log(`📊 请求参数:`, { aweme_id: awemeId });
  console.log(`📋 请求头:`, {
    ...headers,
    Authorization: `Bearer ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`,
  });
  console.log("🚀 ===========================================");

  try {
    const startTime = Date.now();

    // 发起真实的API请求
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: headers,
      // Node.js环境中使用signal来实现超时
      signal: AbortSignal.timeout(15000), // 15秒超时
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log("📈 ===========================================");
    console.log("📈 TikHub API响应信息");
    console.log("📈 ===========================================");
    console.log(`⏱️ 响应时间: ${responseTime}ms`);
    console.log(`📊 HTTP状态码: ${response.status}`);
    console.log(`📝 状态文本: ${response.statusText}`);
    console.log(`🔗 响应URL: ${response.url}`);
    console.log(
      `📋 响应头:`,
      Object.fromEntries(Array.from(response.headers.entries())),
    );

    if (!response.ok) {
      console.error("❌ ===========================================");
      console.error("❌ TikHub API请求失败");
      console.error("❌ ===========================================");
      console.error(`❌ 状态码: ${response.status}`);
      console.error(`❌ 错误信息: ${response.statusText}`);

      const errorText = await response.text().catch(() => "无法读取错误响应");
      console.error(`❌ 响应内容: ${errorText}`);
      console.error("❌ ===========================================");

      throw new Error(
        `TikHub API请求失败: ${response.status} - ${response.statusText}`,
      );
    }

    // 解析响应数据
    const apiData = await response.json();

    console.log("✅ ===========================================");
    console.log("✅ TikHub API响应成功");
    console.log("✅ ===========================================");
    console.log(`📝 响应代码: ${apiData.code || "未知"}`);
    console.log(`🔗 路由: ${apiData.router || "未知"}`);
    console.log(`📊 响应参数: ${JSON.stringify(apiData.params || {})}`);
    console.log(`📹 视频数据: ${apiData.data ? "有数据" : "无数据"}`);

    if (apiData.data?.aweme_detail) {
      const video = apiData.data.aweme_detail;
      console.log(`📹 视频详情:`, {
        aweme_id: video.aweme_id,
        desc: video.desc || video.item_title || "无标题",
        author: video.author?.nickname || "未知作者",
        statistics: {
          play_count: video.statistics?.play_count || 0,
          digg_count: video.statistics?.digg_count || 0,
          comment_count: video.statistics?.comment_count || 0,
          share_count: video.statistics?.share_count || 0,
        },
      });
    }
    console.log("✅ ===========================================");

    return apiData;
  } catch (error) {
    console.error("❌ ===========================================");
    console.error("❌ TikHub API调用异常");
    console.error("❌ ===========================================");
    console.error(
      `❌ 错误类型: ${error instanceof Error ? error.constructor.name : typeof error}`,
    );
    console.error(
      `❌ 错误信息: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error(
      `❌ 错误堆栈: ${error instanceof Error ? error.stack : "无堆栈信息"}`,
    );
    console.error("❌ ===========================================");

    // 抛出错误，让调用方处理
    throw error;
  }
}

// TikHub API调用函数 - 获取小红书单个笔记详细数据
async function fetchXiaohongshuSingleNote(noteId: string) {
  const apiUrl = `https://api.tikhub.io/api/v1/xiaohongshu/web_v2/fetch_feed_notes_v2`;
  const apiKey = process.env.TIKHUB_API_KEY || "YOUR_API_KEY_HERE";

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    accept: "application/json",
  };

  const params = new URLSearchParams({
    note_id: noteId,
  });

  const fullUrl = `${apiUrl}?${params.toString()}`;

  console.log("🚀 ===========================================");
  console.log("🚀 发起TikHub API请求 - 小红书单个笔记");
  console.log("🚀 ===========================================");
  console.log(`📍 API URL: ${apiUrl}`);
  console.log(`🔗 完整请求URL: ${fullUrl}`);
  console.log(`🔑 API Key (前10位): ${apiKey.substring(0, 10)}...`);
  console.log(`📊 请求参数:`, { note_id: noteId });
  console.log(`📋 请求头:`, {
    ...headers,
    Authorization: `Bearer ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 4)}`,
  });
  console.log("🚀 ===========================================");

  try {
    const startTime = Date.now();

    // 发起真实的API请求
    const response = await fetch(fullUrl, {
      method: "GET",
      headers: headers,
      // Node.js环境中使用signal来实现超时
      signal: AbortSignal.timeout(15000), // 15秒超时
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log("📈 ===========================================");
    console.log("📈 TikHub API响应信息");
    console.log("📈 ===========================================");
    console.log(`⏱️ 响应时间: ${responseTime}ms`);
    console.log(`📊 HTTP状态码: ${response.status}`);
    console.log(`📝 状态文本: ${response.statusText}`);
    console.log(`🔗 响应URL: ${response.url}`);
    console.log(
      `📋 响应头:`,
      Object.fromEntries(Array.from(response.headers.entries())),
    );

    if (!response.ok) {
      console.error("❌ ===========================================");
      console.error("❌ TikHub API请求失败");
      console.error("❌ ===========================================");
      console.error(`❌ 状态码: ${response.status}`);
      console.error(`❌ 错误信息: ${response.statusText}`);

      const errorText = await response.text().catch(() => "无法读取错误响应");
      console.error(`❌ 响应内容: ${errorText}`);
      console.error("❌ ===========================================");

      throw new Error(
        `TikHub API请求失败: ${response.status} - ${response.statusText}`,
      );
    }

    // 解析响应数据
    const apiData = await response.json();

    console.log("✅ ===========================================");
    console.log("✅ TikHub API响应成功");
    console.log("✅ ===========================================");
    console.log(`📝 响应代码: ${apiData.code || "未知"}`);
    console.log(`🔗 路由: ${apiData.router || "未知"}`);
    console.log(`📊 响应参数: ${JSON.stringify(apiData.params || {})}`);
    console.log(`📚 笔记数据: ${apiData.data ? "有数据" : "无数据"}`);

    if (apiData.data?.note_list && apiData.data.note_list.length > 0) {
      const note = apiData.data.note_list[0];
      const user = apiData.data.user;
      console.log(`📚 笔记详情:`, {
        id: note.id,
        title: note.title,
        desc: note.desc,
        author: user?.nickname || note.user?.nickname,
        metrics: {
          view_count: note.view_count || 0,
          liked_count: note.liked_count || 0,
          comments_count: note.comments_count || 0,
          shared_count: note.shared_count || 0,
        },
      });
    }
    console.log("✅ ===========================================");

    return apiData;
  } catch (error) {
    console.error("❌ ===========================================");
    console.error("❌ TikHub API调用异常");
    console.error("❌ ===========================================");
    console.error(
      `❌ 错误类型: ${error instanceof Error ? error.constructor.name : typeof error}`,
    );
    console.error(
      `❌ 错误信息: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error(
      `❌ 错误堆栈: ${error instanceof Error ? error.stack : "无堆栈信息"}`,
    );
    console.error("❌ ===========================================");

    // 抛出错误，让调用方处理
    throw error;
  }
}

// 从小红书URL中提取note_id
function extractXiaohongshuNoteId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    console.log(`🔍 小红书URL解析: ${url}`);
    console.log(`🔍 路径: ${urlObj.pathname}`);

    // 小红书笔记链接格式:
    // https://www.xiaohongshu.com/explore/66c9cc31000000001f03a4bc
    // https://www.xiaohongshu.com/discovery/item/66c9cc31000000001f03a4bc

    // 从路径中提取note_id
    const noteIdMatch = urlObj.pathname.match(
      /(?:explore|discovery\/item)\/([a-fA-F0-9]+)/,
    );
    if (noteIdMatch) {
      const noteId = noteIdMatch[1];
      console.log(`🔍 匹配到note_id: ${noteId}`);
      return noteId;
    }

    // 从查询参数中提取note_id（如果有的话）
    const noteId = urlObj.searchParams.get("note_id");
    if (noteId) {
      console.log(`🔍 从查询参数匹配到note_id: ${noteId}`);
      return noteId;
    }

    console.log(`🔍 未能从URL中提取note_id`);
    return null;
  } catch (error) {
    console.error(`❌ 小红书URL解析失败: ${error}`);
    return null;
  }
}

// 从抖音URL中提取aweme_id
function extractDouyinAwemeId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    console.log(`🔍 抖音URL解析: ${url}`);
    console.log(`🔍 路径: ${urlObj.pathname}`);

    // 抖音视频链接格式:
    // https://www.douyin.com/video/7448118827402972455
    // https://v.douyin.com/idVZhPQ/ (短链接)

    // 从路径中提取aweme_id
    const awemeIdMatch = urlObj.pathname.match(/\/video\/([0-9]+)/);
    if (awemeIdMatch) {
      const awemeId = awemeIdMatch[1];
      console.log(`🔍 匹配到aweme_id: ${awemeId}`);
      return awemeId;
    }

    // 从查询参数中提取aweme_id（如果有的话）
    const awemeId =
      urlObj.searchParams.get("modal_id") ||
      urlObj.searchParams.get("aweme_id");
    if (awemeId) {
      console.log(`🔍 从查询参数匹配到aweme_id: ${awemeId}`);
      return awemeId;
    }

    console.log(`🔍 未能从URL中提取aweme_id`);
    return null;
  } catch (error) {
    console.error(`❌ 抖音URL解析失败: ${error}`);
    return null;
  }
}



export async function POST(request: NextRequest) {
  try {
    // 连接数据库
    await connectDatabase();

    // 获取用户信息（如果已登录）
    const authPayload = getUserFromRequest(request);
    const user = authPayload ? await User.findById(authPayload.userId) : null;

    // 解析请求体
    const body = await request.json();

    // 验证请求数据
    const validatedData = ContentAnalysisRequestSchema.parse(body);

    // 从URL自动检测平台（如果没有提供）
    let platform = validatedData.platform;
    if (!platform) {
      const detectedPlatform = UrlUtils.extractPlatform(validatedData.url);
      if (!detectedPlatform) {
        return NextResponse.json(
          { success: false, error: "无法识别平台，请提供平台参数" },
          { status: 400 },
        );
      }
      platform = detectedPlatform;
    }

    // 获取请求元信息
    const userIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // 提取内容ID作为accountId (内容分析中accountId字段用来存储内容标识符)
    let contentId = "content_" + Date.now();
    if (platform === Platform.DOUYIN) {
      contentId = extractDouyinAwemeId(validatedData.url) || contentId;
    } else if (platform === Platform.XIAOHONGSHU) {
      contentId = extractXiaohongshuNoteId(validatedData.url) || contentId;
    }

    // 创建用户分析记录
    const userRecord = new UserAnalysisRecord({
      userId: user?.id,
      sessionId: !user ? "session_" + Date.now() : undefined,
      userIP: userIP,
      userAgent: userAgent,
      requestUrl: validatedData.url,
      platform: platform,
      accountId: contentId, // 对于内容分析，这里存储内容ID
      analysisId: "pending_" + Date.now(), // 临时ID，完成时更新为实际分析ID
      analysisType: "content",
      requestSource: "web",
      status: "pending",
    });

    await userRecord.save();
    console.log(`✅ 用户分析记录已创建 (ID: ${userRecord._id})`);

    // 检查是否有最近的分析结果可以复用（使用配置的缓存有效期）
    const cacheConfig = getCacheConfig();
    const cacheExpiration = getCacheExpiration(cacheConfig.contentAnalysis);

    const recentAnalysis = await ContentAnalysis.findOne({
      url: validatedData.url,
      platform,
      status: "completed",
      createdAt: { $gte: cacheExpiration }, // 在有效期内的记录
    }).sort({ createdAt: -1 });

    if (recentAnalysis) {
      const cacheAge = getCacheAge(recentAnalysis.createdAt);
      console.log(
        `📋 找到${cacheConfig.contentAnalysis}小时内的分析记录 (${new Date(recentAnalysis.createdAt).toLocaleString()})，返回缓存结果`,
      );

      // 更新用户记录为完成状态（复用缓存）
      await userRecord.markAsCompleted(
        recentAnalysis._id.toString(),
        0, // 复用结果，处理时间为0
        "medium", // 复用数据质量标记为medium
      );

      return NextResponse.json({
        success: true,
        data: {
          content: {
            url: recentAnalysis.url,
            platform: recentAnalysis.platform,
            title: recentAnalysis.title,
            description: recentAnalysis.description,
            author: recentAnalysis.author.name,
            contentType: recentAnalysis.contentType,
            metrics: recentAnalysis.metrics,
          },
          analysis: recentAnalysis.analysis,
          timestamp: recentAnalysis.updatedAt.toISOString(),
          cached: true,
          cacheAge: cacheAge,
          cacheExpirationHours: cacheConfig.contentAnalysis,
          userRecordId: userRecord._id,
        },
      });
    }

    console.log("🆕 未找到分析记录，开始新的内容分析...");

    // 根据平台获取真实内容数据
    let contentData: any = null;

    if (platform === Platform.DOUYIN) {
      console.log("🎬 获取抖音视频内容数据...");
      try {
        // 从URL提取aweme_id
        const awemeId = extractDouyinAwemeId(validatedData.url);
        if (!awemeId) {
          return NextResponse.json(
            { success: false, error: "无法从抖音URL中提取视频ID" },
            { status: 400 },
          );
        }

        // 调用抖音单个视频API
        const douyinData = await fetchDouyinSingleVideo(awemeId);

        if (!douyinData?.data?.aweme_detail) {
          throw new Error("抖音API返回数据为空");
        }

        const video = douyinData.data.aweme_detail;

        // 转换为统一格式
        contentData = {
          title: video.desc || video.item_title || "无标题",
          description:
            video.desc || video.caption || video.item_title || "暂无描述", // 确保description不为空
          author: {
            id: video.author?.sec_uid || "unknown",
            name: video.author?.nickname || "未知作者",
            avatar:
              video.author?.avatar_thumb?.url_list?.[0] ||
              "https://example.com/default-avatar.jpg",
            followersCount: video.author?.follower_count || 0,
          },
          contentType: ContentType.VIDEO,
          metrics: {
            views: video.statistics?.play_count || 0,
            likes: video.statistics?.digg_count || 0,
            comments: video.statistics?.comment_count || 0,
            shares: video.statistics?.share_count || 0,
          },
        };

        console.log("✅ 抖音视频数据获取成功");
      } catch (error) {
        console.error("❌ 抖音API调用失败:", error);
        return NextResponse.json(
          {
            success: false,
            error: `抖音API调用失败: ${error instanceof Error ? error.message : "未知错误"}`,
          },
          { status: 500 },
        );
      }
    } else if (platform === Platform.XIAOHONGSHU) {
      console.log("📱 获取小红书笔记内容数据...");
      try {
        // 从URL提取note_id
        const noteId = extractXiaohongshuNoteId(validatedData.url);
        if (!noteId) {
          return NextResponse.json(
            { success: false, error: "无法从小红书URL中提取笔记ID" },
            { status: 400 },
          );
        }

        // 调用小红书单个笔记API
        const xiaohongshuData = await fetchXiaohongshuSingleNote(noteId);

        if (
          !xiaohongshuData?.data?.note_list ||
          xiaohongshuData.data.note_list.length === 0
        ) {
          throw new Error("小红书API返回数据为空");
        }

        // 获取第一个笔记数据
        const note = xiaohongshuData.data.note_list[0];
        const user = xiaohongshuData.data.user;

        // 转换为统一格式
        contentData = {
          title: note.title || note.desc || "无标题",
          description: note.desc || note.title || "暂无描述", // 确保description不为空
          author: {
            id: user?.userid || note.user?.id || "unknown",
            name: user?.nickname || note.user?.nickname || "未知作者",
            avatar:
              user?.image ||
              note.user?.image ||
              "https://example.com/default-avatar.jpg",
            followersCount: 0, // 小红书API不返回粉丝数
          },
          contentType:
            note.images_list && note.images_list.length > 0
              ? ContentType.IMAGE
              : ContentType.TEXT,
          metrics: {
            views: note.view_count || 0,
            likes: note.liked_count || 0,
            comments: note.comments_count || 0,
            shares: note.shared_count || 0,
          },
        };

        console.log("✅ 小红书笔记数据获取成功");
      } catch (error) {
        console.error("❌ 小红书API调用失败:", error);
        return NextResponse.json(
          {
            success: false,
            error: `小红书API调用失败: ${error instanceof Error ? error.message : "未知错误"}`,
          },
          { status: 500 },
        );
      }
    } else {
      // 其他平台使用模拟数据
      console.log(`🎭 使用模拟数据 - 平台: ${platform}`);
      contentData = {
        title: "【测试内容】如何制作治愈系桌搭vlog？超详细教程分享！",
        description:
          "今天分享一个超治愈的桌搭布置教程，从色彩搭配到物件选择，每个细节都很重要。包括如何选择合适的装饰品、灯光搭配、色彩协调等实用技巧。",
        author: {
          id: "test-user-123",
          name: "桌搭小能手",
          avatar: "https://example.com/avatar.jpg",
          followersCount: 25800,
        },
        contentType: ContentType.VIDEO,
        metrics: {
          views: 12580,
          likes: 856,
          comments: 132,
          shares: 89,
        },
      };
    }

    // 使用upsert避免重复键错误，如果记录已存在则更新
    const savedAnalysis = await ContentAnalysis.findOneAndUpdate(
      {
        url: validatedData.url,
        platform,
      },
      {
        title: contentData.title,
        description: contentData.description,
        author: contentData.author,
        contentType: contentData.contentType,
        metrics: contentData.metrics,
        userId: user ? user._id : null,
        userType: user ? "registered" : "anonymous",
        status: "pending",
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      },
    );
    console.log("💾 分析记录已保存到数据库 (upsert)");

    // 创建AI服务实例
    const aiService = createAIServiceFromEnv();

    // 准备AI分析数据
    const analysisInput = {
      url: savedAnalysis.url,
      platform: savedAnalysis.platform,
      title: savedAnalysis.title,
      description: savedAnalysis.description,
      author: savedAnalysis.author.name,
      contentType: savedAnalysis.contentType,
      metrics: savedAnalysis.metrics,
    };

    try {
      // 调用AI分析服务
      const analysisResult = await aiService.analyzeContent(analysisInput);

      // 更新分析结果
      savedAnalysis.analysis = analysisResult;
      savedAnalysis.status = "completed";
      await savedAnalysis.save();

      // 更新用户记录为完成状态
      await userRecord.markAsCompleted(
        savedAnalysis._id.toString(),
        2000, // 假设内容分析平均耗时2秒
        "high", // 新分析结果质量标记为high
      );

      // 如果用户已登录，更新用户统计
      if (user) {
        try {
          await User.findByIdAndUpdate(user._id, {
            $inc: {
              "stats.totalAnalyses": 1,
              "stats.contentAnalyses": 1,
            },
            lastAnalysisAt: new Date(),
          });
        } catch (userUpdateError) {
          console.warn("用户统计更新失败:", userUpdateError);
          // 不影响主要功能，继续执行
        }
      }

      // 返回分析结果
      return NextResponse.json({
        success: true,
        data: {
          content: {
            url: savedAnalysis.url,
            platform: savedAnalysis.platform,
            title: savedAnalysis.title,
            description: savedAnalysis.description,
            author: savedAnalysis.author.name,
            contentType: savedAnalysis.contentType,
            metrics: savedAnalysis.metrics,
          },
          analysis: analysisResult,
          timestamp: savedAnalysis.updatedAt.toISOString(),
          cached: false,
          userRecordId: userRecord._id,
        },
      });
    } catch (aiError) {
      // AI分析失败，更新状态
      savedAnalysis.status = "failed";
      savedAnalysis.error =
        aiError instanceof Error ? aiError.message : "AI分析失败";
      await savedAnalysis.save();
      throw aiError;
    }
  } catch (error) {
    console.error("Content analysis error:", error);

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

// 健康检查端点 - 暂时禁用 AI 健康检查
export async function GET() {
  try {
    // 暂时注释掉 AI 健康检查，避免频繁调用消耗配额
    // const aiService = createAIServiceFromEnv();
    // const isHealthy = await aiService.healthCheck();

    return NextResponse.json({
      success: true,
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        message:
          "AI health check temporarily disabled to prevent quota exhaustion",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "AI服务不可用",
      },
      { status: 503 },
    );
  }
}
