import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { requireAdmin } from "@/lib/auth";
import { getQualityScore, shouldAlert } from "@/lib/quality-scorer";

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");

  const [content, keyword, account, overall] = await Promise.all([
    getQualityScore("content", days),
    getQualityScore("keyword", days),
    getQualityScore("account", days),
    getQualityScore(undefined, days),
  ]);

  const alerts = [];
  if (shouldAlert(content)) alerts.push({ type: "content", score: content.overall });
  if (shouldAlert(keyword)) alerts.push({ type: "keyword", score: keyword.overall });
  if (shouldAlert(account)) alerts.push({ type: "account", score: account.overall });

  return NextResponse.json({
    success: true,
    data: {
      overall,
      byType: { content, keyword, account },
      alerts,
    },
  });
}
