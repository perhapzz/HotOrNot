import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { UserAnalysisRecord } from "@hotornot/database";
import { requireAuth } from "../../../../lib/auth";

export async function GET(request: NextRequest) {
  try {
    await connectDatabase();

    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) return authResult;
    const userId = authResult.userId;
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") || "10"));

    // 1. Analysis counts by type
    const typeCounts = await UserAnalysisRecord.aggregate([
      { $match: { userId, status: "completed" } },
      { $group: { _id: "$analysisType", count: { $sum: 1 } } },
    ]);

    const countsByType: Record<string, number> = {};
    let totalCount = 0;
    for (const item of typeCounts) {
      countsByType[item._id] = item.count;
      totalCount += item.count;
    }

    // 2. This month's count
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthCount = await UserAnalysisRecord.countDocuments({
      userId,
      status: "completed",
      createdAt: { $gte: monthStart },
    });

    // 3. Last 30 days trend (by day)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyTrend = await UserAnalysisRecord.aggregate([
      {
        $match: {
          userId,
          status: "completed",
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing days with 0
    const trendData: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const found = dailyTrend.find((t: any) => t._id === dateStr);
      trendData.push({ date: dateStr, count: found ? found.count : 0 });
    }

    // 4. Platform distribution
    const platformDist = await UserAnalysisRecord.aggregate([
      { $match: { userId, status: "completed" } },
      { $group: { _id: "$platform", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // 5. Top keywords (from keyword analyses, last 90 days)
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    const topTags = await UserAnalysisRecord.aggregate([
      {
        $match: {
          userId,
          status: "completed",
          tags: { $exists: true, $ne: [] },
          createdAt: { $gte: ninetyDaysAgo },
        },
      },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // 6. Recent analyses (paginated)
    const recentAnalyses = await UserAnalysisRecord.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const totalRecords = await UserAnalysisRecord.countDocuments({ userId });

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalAnalyses: totalCount,
          monthAnalyses: monthCount,
          byType: countsByType,
        },
        trend: trendData,
        platformDistribution: platformDist.map((p: any) => ({
          platform: p._id,
          count: p.count,
        })),
        topTags: topTags.map((t: any) => ({ tag: t._id, count: t.count })),
        recentAnalyses,
        pagination: {
          page,
          limit,
          total: totalRecords,
          totalPages: Math.ceil(totalRecords / limit),
        },
      },
    });
  } catch (error: any) {
    console.error("[Dashboard My] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
