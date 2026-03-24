import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { requireAuth } from "@/lib/auth";
import mongoose from "mongoose";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();
  const db = mongoose.connection.db!;
  const { searchParams } = new URL(request.url);

  const target = searchParams.get("target");
  const type = searchParams.get("type") || "content";

  if (!target) {
    return NextResponse.json({ success: false, error: "缺少 target 参数" }, { status: 400 });
  }

  const collectionMap: Record<string, string> = {
    content: "contentanalyses",
    keyword: "keywordanalyses",
    account: "accountanalyses",
  };

  const collection = collectionMap[type];
  if (!collection) {
    return NextResponse.json({ success: false, error: "无效的 type" }, { status: 400 });
  }

  // Find analyses matching the target (URL, keyword, or username)
  const fieldMap: Record<string, string> = {
    content: "url",
    keyword: "keyword",
    account: "username",
  };

  const results = await db
    .collection(collection)
    .find(
      { userId: authResult.userId, [fieldMap[type]]: target },
      {
        projection: {
          createdAt: 1,
          "analysis.overallScore": 1,
          "analysis.hotScore": 1,
          "analysis.scores": 1,
          "analysis.engagement": 1,
          "analysis.creativity": 1,
          "analysis.relevance": 1,
          platform: 1,
        },
      }
    )
    .sort({ createdAt: 1 })
    .limit(20)
    .toArray();

  // Build trend data
  const trend = results.map((r: any) => ({
    date: r.createdAt,
    score: r.analysis?.overallScore || r.analysis?.hotScore || 0,
    scores: r.analysis?.scores || {},
  }));

  // Calculate diffs between last two
  let diff = null;
  if (trend.length >= 2) {
    const prev = trend[trend.length - 2];
    const curr = trend[trend.length - 1];
    diff = {
      score: curr.score - prev.score,
      direction: curr.score > prev.score ? "up" : curr.score < prev.score ? "down" : "same",
    };
  }

  return NextResponse.json({
    success: true,
    data: { target, type, trend, diff, count: trend.length },
  });
}
