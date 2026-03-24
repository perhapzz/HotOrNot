import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { User, UserAnalysisRecord, ContentAnalysis } from "@hotornot/database";
import { requireAuth } from "@/lib/auth";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();

  const user = await User.findById(authResult.userId).select("-password").lean();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "用户不存在" },
      { status: 404 }
    );
  }

  // Gather user's analysis records
  const records = await UserAnalysisRecord.find({
    userId: authResult.userId,
  })
    .sort({ createdAt: -1 })
    .lean();

  const data = {
    user,
    analysisRecords: records,
    exportedAt: new Date().toISOString(),
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="hotornot-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
