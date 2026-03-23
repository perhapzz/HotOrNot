import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { Feedback } from "@hotornot/database";
import { requireAdmin } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(50, parseInt(searchParams.get("limit") || "20"));

  const [feedbacks, total] = await Promise.all([
    Feedback.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Feedback.countDocuments(),
  ]);

  const stats = await Feedback.aggregate([
    { $group: { _id: "$rating", count: { $sum: 1 } } },
  ]);

  return NextResponse.json({
    success: true,
    data: {
      feedbacks,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: Object.fromEntries(stats.map((s) => [s._id, s.count])),
    },
  });
}
