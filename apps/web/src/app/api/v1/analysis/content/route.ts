import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, hasPermission, ApiKeyContext } from "../../../../lib/api-key-auth";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { ContentAnalysis } from "@hotornot/database";

export async function POST(request: NextRequest) {
  const authResult = await validateApiKey(request);
  if (authResult instanceof NextResponse) return authResult;
  const ctx = authResult as ApiKeyContext;

  if (!hasPermission(ctx, "analysis:content")) {
    return NextResponse.json({ success: false, error: "Permission denied" }, { status: 403 });
  }

  try {
    await connectDatabase();
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ success: false, error: "Missing 'url' field" }, { status: 400 });
    }

    // Find existing analysis or return instructions
    const existing = await ContentAnalysis.findOne({ url, status: "completed" })
      .sort({ createdAt: -1 })
      .lean();

    if (existing) {
      return NextResponse.json({
        success: true,
        data: {
          id: existing._id,
          url: existing.url,
          platform: existing.platform,
          title: existing.title,
          analysis: existing.analysis,
          createdAt: existing.createdAt,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: null,
      message: "No cached analysis found. Use the web interface for new analyses.",
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
