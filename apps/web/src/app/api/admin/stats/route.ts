import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { requireAdmin } from "@/lib/auth";
import mongoose from "mongoose";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();
  const db = mongoose.connection.db!;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    todayUsers,
    monthlyUsers,
    totalAnalyses,
    todayAnalyses,
    totalApiKeys,
    feedbackStats,
    recentUsers,
  ] = await Promise.all([
    db.collection("users").countDocuments(),
    db.collection("users").countDocuments({ createdAt: { $gte: today } }),
    db.collection("users").countDocuments({ lastLoginAt: { $gte: thisMonth } }),
    Promise.all([
      db.collection("contentanalyses").countDocuments(),
      db.collection("keywordanalyses").countDocuments(),
      db.collection("accountanalyses").countDocuments(),
    ]).then((counts) => counts.reduce((a, b) => a + b, 0)),
    Promise.all([
      db.collection("contentanalyses").countDocuments({ createdAt: { $gte: today } }),
      db.collection("keywordanalyses").countDocuments({ createdAt: { $gte: today } }),
      db.collection("accountanalyses").countDocuments({ createdAt: { $gte: today } }),
    ]).then((counts) => counts.reduce((a, b) => a + b, 0)),
    db.collection("apikeys").countDocuments(),
    db.collection("feedbacks").aggregate([
      { $group: { _id: "$rating", count: { $sum: 1 } } },
    ]).toArray(),
    db.collection("users")
      .find({}, { projection: { email: 1, createdAt: 1, role: 1, password: 0 } })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray(),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      users: { total: totalUsers, today: todayUsers, monthlyActive: monthlyUsers },
      analyses: { total: totalAnalyses, today: todayAnalyses },
      apiKeys: totalApiKeys,
      feedback: Object.fromEntries(feedbackStats.map((s: any) => [s._id, s.count])),
      recentUsers,
    },
  });
}
