import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import { ContentAnalysis, User, UserAnalysisRecord } from "@hotornot/database";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
export const dynamic = "force-dynamic";



export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    console.log("🔍 获取内容分析详情:", params.id);

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

    // 首先查找用户分析记录
    const userRecord = await UserAnalysisRecord.findOne({
      _id: params.id,
      userId: user._id,
      analysisType: "content",
    });

    if (!userRecord) {
      console.log("❌ 未找到用户分析记录:", params.id);
      return NextResponse.json(
        { success: false, error: "未找到分析记录" },
        { status: 404 },
      );
    }

    // 然后查找对应的分析结果
    const analysis = await ContentAnalysis.findOne({
      _id: userRecord.analysisId,
    });

    if (!analysis) {
      console.log("❌ 未找到分析结果:", userRecord.analysisId);
      return NextResponse.json(
        { success: false, error: "分析结果不存在" },
        { status: 404 },
      );
    }

    console.log("✅ 找到内容分析记录:", analysis._id);

    // 合并用户记录和分析结果
    const result = {
      ...analysis.toObject(),
      // 添加用户记录的额外信息
      userRecord: {
        requestUrl: userRecord.requestUrl,
        status: userRecord.status,
        createdAt: userRecord.createdAt,
        updatedAt: userRecord.updatedAt,
        processingTime: userRecord.processingTime,
        dataQuality: userRecord.dataQuality,
      },
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("❌ 获取内容分析详情失败:", error);
    return NextResponse.json(
      { success: false, error: "服务器错误" },
      { status: 500 },
    );
  }
}
