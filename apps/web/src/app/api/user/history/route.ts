import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import {
  ContentAnalysis,
  AccountAnalysis,
  UserAnalysisRecord,
  User,
} from "@hotornot/database";
import { connectDatabase } from "@hotornot/database/src/utils/connection";



export async function GET(request: NextRequest) {
  try {
    await connectDatabase();

    // 获取用户信息
    const authPayload = getUserFromRequest(request);
    const user = authPayload ? await User.findById(authPayload.userId) : null;
    if (!user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 },
      );
    }

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const type = searchParams.get("type"); // content, account, keyword

    // 构建查询条件
    const query: any = { userId: user._id };

    // 根据分析类型过滤
    if (type === "content") {
      // 内容分析记录 - 查询UserAnalysisRecord，然后关联ContentAnalysis
      console.log("🔍 查询内容分析历史记录，用户ID:", user._id);

      try {
        // 查询用户的内容分析记录
        const userRecordsQuery = {
          userId: user._id.toString(),
          analysisType: "content",
          status: "completed",
        };

        // 获取总数
        const total = await UserAnalysisRecord.countDocuments(userRecordsQuery);
        console.log("📊 用户内容分析历史记录总数:", total);

        // 获取用户记录
        const userRecords = await UserAnalysisRecord.find(userRecordsQuery)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip((page - 1) * limit)
          .lean();

        console.log("📋 返回的用户记录数:", userRecords.length);

        // 获取对应的分析结果
        const analysisIds = userRecords
          .map((record) => record.analysisId)
          .filter(
            (id) => id && id !== "pending_" && !id.startsWith("pending_"),
          );

        const analysisResults = await ContentAnalysis.find({
          _id: { $in: analysisIds },
        }).lean();

        // 创建分析结果的映射
        const analysisMap = new Map(
          analysisResults.map((analysis) => [
            (analysis as any)._id.toString(),
            analysis,
          ]),
        );

        // 合并用户记录和分析结果
        const formattedRecords = userRecords.map((record) => {
          const analysis = analysisMap.get(record.analysisId);

          return {
            id: record._id,
            url: record.requestUrl,
            platform: record.platform,
            title: analysis?.title || "未知标题",
            description: analysis?.description || "暂无描述",
            author: analysis?.author || { name: "未知作者" },
            contentType: analysis?.contentType || "unknown",
            metrics: analysis?.metrics || {},
            analysis: analysis?.analysis || {},
            status: record.status,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt || record.createdAt,
            processingTime: record.processingTime,
            dataQuality: record.dataQuality,
          };
        });

        return NextResponse.json({
          success: true,
          data: {
            analyses: formattedRecords,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit),
              hasNext: page * limit < total,
              hasPrev: page > 1,
            },
            user: {
              id: user._id,
              username: user.username,
              displayName: user.displayName,
              stats: user.stats,
            },
          },
        });
      } catch (error) {
        console.error("❌ 查询内容分析历史记录失败:", error);
        return NextResponse.json({
          success: true,
          data: {
            analyses: [],
            pagination: {
              page,
              limit,
              total: 0,
              pages: 0,
              hasNext: false,
              hasPrev: false,
            },
            user: {
              id: user._id,
              username: user.username,
              displayName: user.displayName,
              stats: user.stats,
            },
          },
        });
      }
    } else if (type === "account") {
      // 账号分析记录 - 查询UserAnalysisRecord，然后关联AccountAnalysis
      console.log("🔍 查询账号分析历史记录，用户ID:", user._id);

      try {
        // 查询用户的账号分析记录
        const userRecordsQuery = {
          userId: user._id.toString(),
          analysisType: "account",
          status: "completed",
        };

        // 获取总数
        const total = await UserAnalysisRecord.countDocuments(userRecordsQuery);
        console.log("📊 用户账号分析历史记录总数:", total);

        // 获取用户记录
        const userRecords = await UserAnalysisRecord.find(userRecordsQuery)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip((page - 1) * limit)
          .lean();

        console.log("📋 返回的用户记录数:", userRecords.length);

        // 获取对应的分析结果
        const analysisIds = userRecords
          .map((record) => record.analysisId)
          .filter(
            (id) => id && id !== "pending_" && !id.startsWith("pending_"),
          );

        const analysisResults = await AccountAnalysis.find({
          _id: { $in: analysisIds },
        }).lean();

        // 创建分析结果的映射
        const analysisMap = new Map(
          analysisResults.map((analysis) => [
            (analysis as any)._id.toString(),
            analysis,
          ]),
        );

        // 合并用户记录和分析结果
        const formattedRecords = userRecords.map((record) => {
          const analysis = analysisMap.get(record.analysisId);

          return {
            id: record._id,
            platform: record.platform,
            accountId: record.accountId,
            accountName:
              analysis?.account?.accountName ||
              record.accountName ||
              "未知用户",
            avatar: analysis?.account?.avatar || "",
            bio: analysis?.account?.bio || "",
            metrics: analysis?.metrics || {},
            analysis: analysis?.analysis || {},
            recentPosts: analysis?.recentPosts || [],
            status: record.status,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt || record.createdAt,
            requestUrl: record.requestUrl,
            processingTime: record.processingTime,
            dataQuality: record.dataQuality,
          };
        });

        return NextResponse.json({
          success: true,
          data: formattedRecords,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        });
      } catch (error) {
        console.error("❌ 查询用户历史记录失败:", error);
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page,
            limit,
            total: 0,
            pages: 0,
            hasNext: false,
            hasPrev: false,
          },
        });
      }
    } else if (type === "keyword") {
      // 关键词分析记录 - 查询UserAnalysisRecord，然后关联KeywordAnalysis
      console.log("🔍 查询关键词分析历史记录，用户ID:", user._id);

      try {
        // 查询用户的关键词分析记录
        const userRecordsQuery = {
          userId: user._id.toString(),
          analysisType: "keyword",
          status: "completed",
        };

        console.log("📋 关键词分析查询条件:", userRecordsQuery);

        // 获取总数
        const total = await UserAnalysisRecord.countDocuments(userRecordsQuery);
        console.log("📊 用户关键词分析历史记录总数:", total);

        // 获取用户记录
        const userRecords = await UserAnalysisRecord.find(userRecordsQuery)
          .sort({ createdAt: -1 })
          .limit(limit)
          .skip((page - 1) * limit)
          .lean();

        console.log("📋 返回的用户关键词记录数:", userRecords.length);
        userRecords.forEach((record, index) => {
          console.log(`📄 记录 ${index + 1}:`, {
            id: record._id,
            analysisId: record.analysisId,
            requestUrl: record.requestUrl,
            platform: record.platform,
            accountId: record.accountId,
            createdAt: record.createdAt,
          });
        });

        // 导入KeywordAnalysis模型
        const { KeywordAnalysis } = await import("@hotornot/database");

        // 获取对应的分析结果
        const analysisIds = userRecords
          .map((record) => record.analysisId)
          .filter(
            (id) => id && id !== "pending_" && !id.startsWith("pending_"),
          );

        console.log("🔎 查询的分析ID列表:", analysisIds);

        const analysisResults = await KeywordAnalysis.find({
          _id: { $in: analysisIds },
        }).lean();

        console.log("📊 找到的关键词分析结果数:", analysisResults.length);

        // 创建分析结果的映射
        const analysisMap = new Map(
          analysisResults.map((analysis) => [
            (analysis as any)._id.toString(),
            analysis,
          ]),
        );

        // 合并用户记录和分析结果
        const formattedRecords = userRecords.map((record) => {
          const analysis = analysisMap.get(record.analysisId);

          return {
            id: record._id,
            keyword:
              analysis?.keyword ||
              record.requestUrl.replace("keyword:", "") ||
              "未知关键词",
            platforms: analysis?.platforms || [record.platform],
            analysis: analysis?.analysis || {},
            topContent: analysis?.topContent || [],
            status: record.status,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt || record.createdAt,
            processingTime: record.processingTime,
            dataQuality: record.dataQuality,
            analysisType: record.analysisType,
          };
        });

        console.log("✅ 格式化后的关键词记录数:", formattedRecords.length);

        return NextResponse.json({
          success: true,
          data: {
            analyses: formattedRecords,
            pagination: {
              page,
              limit,
              total,
              pages: Math.ceil(total / limit),
              hasNext: page * limit < total,
              hasPrev: page > 1,
            },
            user: {
              id: user._id,
              username: user.username,
              displayName: user.displayName,
              stats: user.stats,
            },
          },
        });
      } catch (error) {
        console.error("❌ 查询关键词分析历史记录失败:", error);
        return NextResponse.json({
          success: true,
          data: {
            analyses: [],
            pagination: {
              page,
              limit,
              total: 0,
              pages: 0,
              hasNext: false,
              hasPrev: false,
            },
            user: {
              id: user._id,
              username: user.username,
              displayName: user.displayName,
              stats: user.stats,
            },
          },
        });
      }
    }

    // 获取总数
    const total = await ContentAnalysis.countDocuments(query);

    // 获取分析记录
    const analyses = await ContentAnalysis.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    // 格式化数据
    const formattedAnalyses = analyses.map((analysis) => ({
      id: analysis._id,
      url: analysis.url,
      platform: analysis.platform,
      title: analysis.title,
      description: analysis.description,
      author: analysis.author,
      contentType: analysis.contentType,
      metrics: analysis.metrics,
      analysis: analysis.analysis,
      status: analysis.status,
      createdAt: analysis.createdAt,
      updatedAt: analysis.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: {
        analyses: formattedAnalyses,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        user: {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
          stats: user.stats,
        },
      },
    });
  } catch (error) {
    console.error("获取用户历史记录失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 },
    );
  }
}

// 删除分析记录
export async function DELETE(request: NextRequest) {
  try {
    await connectDatabase();

    // 获取用户信息
    const authPayload = getUserFromRequest(request);
    const user = authPayload ? await User.findById(authPayload.userId) : null;
    if (!user) {
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 },
      );
    }

    const { searchParams } = new URL(request.url);
    const analysisId = searchParams.get("id");

    if (!analysisId) {
      return NextResponse.json(
        { success: false, error: "缺少分析记录ID" },
        { status: 400 },
      );
    }

    // 确认记录属于当前用户
    const analysis = await ContentAnalysis.findOne({
      _id: analysisId,
      userId: user._id,
    });

    if (!analysis) {
      return NextResponse.json(
        { success: false, error: "记录不存在或无权限删除" },
        { status: 404 },
      );
    }

    // 删除记录
    await ContentAnalysis.findByIdAndDelete(analysisId);

    // 更新用户统计
    await User.findByIdAndUpdate(user._id, {
      $inc: {
        "stats.totalAnalyses": -1,
        "stats.contentAnalyses": -1,
      },
    });

    return NextResponse.json({
      success: true,
      data: { message: "删除成功" },
    });
  } catch (error) {
    console.error("删除分析记录失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 },
    );
  }
}
