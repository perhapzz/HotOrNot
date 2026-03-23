import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { UserActivity } from "@hotornot/database";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();
  const { searchParams } = new URL(request.url);
  const days = Math.min(90, parseInt(searchParams.get("days") || "7"));

  const since = new Date();
  since.setDate(since.getDate() - days);

  // Daily active trend
  const dailyTrend = await UserActivity.aggregate([
    { $match: { createdAt: { $gte: since } } },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        count: { $sum: 1 },
        uniqueUsers: { $addToSet: "$userId" },
      },
    },
    { $sort: { _id: 1 } },
    {
      $project: {
        date: "$_id",
        count: 1,
        uniqueUsers: { $size: "$uniqueUsers" },
      },
    },
  ]);

  // Action distribution
  const actionDist = await UserActivity.aggregate([
    { $match: { createdAt: { $gte: since } } },
    { $group: { _id: "$action", count: { $sum: 1 } } },
  ]);

  // Top keywords/URLs
  const topAnalyses = await UserActivity.aggregate([
    {
      $match: {
        action: "analysis",
        createdAt: { $gte: since },
        "metadata.query": { $exists: true },
      },
    },
    { $group: { _id: "$metadata.query", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  return NextResponse.json({
    success: true,
    data: {
      dailyTrend,
      actionDistribution: Object.fromEntries(
        actionDist.map((a: any) => [a._id, a.count])
      ),
      topAnalyses: topAnalyses.map((a: any) => ({
        query: a._id,
        count: a.count,
      })),
    },
  });
}
