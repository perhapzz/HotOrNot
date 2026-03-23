import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, hasPermission, ApiKeyContext } from "@/lib/api-key-auth";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { KeywordAnalysis } from "@hotornot/database";

export async function POST(request: NextRequest) {
  const authResult = await validateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;
  const ctx = authResult as ApiKeyContext;

  if (!hasPermission(ctx, "analysis:keyword")) {
    return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
  }

  try {
    await connectDatabase();
    const { keyword, platform } = await request.json();
    if (!keyword) {
      return NextResponse.json({ success: false, error: "Missing 'keyword' field" }, { status: 400 });
    }

    const query: any = { status: "completed" };
    if (keyword) query.keyword = keyword;
    if (platform) query.platform = platform;

    const results = await KeywordAnalysis.find(query)
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    return NextResponse.json({
      success: true,
      data: results.map((r: any) => ({
        id: r._id,
        keyword: r.keyword,
        platform: r.platform,
        analysis: r.analysis,
        createdAt: r.createdAt,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
