import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { generateWeeklyReport, reportToHtml } from "@/lib/report-generator";

export async function GET(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";

  const report = await generateWeeklyReport(authResult.userId);

  if (format === "html") {
    return new Response(reportToHtml(report), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return NextResponse.json({ success: true, data: report });
}
