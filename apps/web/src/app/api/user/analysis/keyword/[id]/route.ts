import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { UserAnalysisRecord, User } from "@hotornot/database";
import { connectDatabase } from "@hotornot/database/src/utils/connection";



export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    console.log("🔍 获取关键词分析详情:", params.id);

    // 检查ID是否有效
    if (!params.id || params.id === "undefined") {
      console.log("❌ 无效的分析ID:", params.id);
      return NextResponse.json(
        { success: false, error: "无效的分析ID" },
        { status: 400 },
      );
    }

    // 验证用户登录
    const authPayload = getUserFromRequest(request);
    const user = authPayload ? await User.findById(authPayload.userId) : null;
    if (!user) {
      console.log("❌ 用户未登录");
      return NextResponse.json(
        { success: false, error: "请先登录" },
        { status: 401 },
      );
    }

    // 连接数据库
    await connectDatabase();

    // 查找关键词分析记录
    const analysis = await UserAnalysisRecord.findOne({
      _id: params.id,
      userId: user._id,
      analysisType: "keyword",
    });

    if (!analysis) {
      console.log("❌ 未找到分析记录:", params.id);
      return NextResponse.json(
        { success: false, error: "未找到分析记录" },
        { status: 404 },
      );
    }

    console.log("✅ 找到关键词分析记录:", analysis._id);

    // 关键词分析数据需要从 KeywordAnalysis 表中获取
    if (!analysis.analysisId) {
      console.log("❌ 分析记录缺少 analysisId:", analysis._id);
      return NextResponse.json(
        { success: false, error: "分析记录不完整" },
        { status: 404 },
      );
    }

    // 查找对应的关键词分析结果
    const KeywordAnalysis = (await import("@hotornot/database"))
      .KeywordAnalysis;
    const keywordAnalysisResult = await KeywordAnalysis.findById(
      analysis.analysisId,
    );

    if (!keywordAnalysisResult) {
      console.log("❌ 未找到关键词分析结果:", analysis.analysisId);
      return NextResponse.json(
        { success: false, error: "未找到分析结果" },
        { status: 404 },
      );
    }

    console.log("✅ 找到关键词分析结果:", keywordAnalysisResult.keyword);

    // 合并用户记录和分析结果
    const result = {
      ...analysis.toObject(),
      keyword: keywordAnalysisResult.keyword,
      platforms: keywordAnalysisResult.platforms,
      analysis: keywordAnalysisResult.analysis,
      topContent: keywordAnalysisResult.topContent,
      searchStats: keywordAnalysisResult.searchStats,
      dataSource: keywordAnalysisResult.searchStats ? "real" : "mock",
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ 获取关键词分析详情失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 },
    );
  }
}
