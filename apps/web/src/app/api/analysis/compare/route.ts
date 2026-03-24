import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { requireAuth } from "@/lib/auth";
import { trackActivity } from "@/lib/activity-tracker";
export const dynamic = "force-dynamic";

const MAX_COMPARE = 5;
const MAX_CONCURRENCY = 3;

export async function POST(request: NextRequest) {
  const authResult = requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;

  await connectDatabase();
  const { targets, type } = await request.json();

  if (!Array.isArray(targets) || targets.length < 2 || targets.length > MAX_COMPARE) {
    return NextResponse.json(
      { success: false, error: `需要 2-${MAX_COMPARE} 个对比目标` },
      { status: 400 }
    );
  }

  if (!["content", "account"].includes(type)) {
    return NextResponse.json(
      { success: false, error: "type 必须为 content 或 account" },
      { status: 400 }
    );
  }

  // Analyze each target in parallel with concurrency limit
  const results: any[] = [];
  const errors: { target: string; error: string }[] = [];

  for (let i = 0; i < targets.length; i += MAX_CONCURRENCY) {
    const batch = targets.slice(i, i + MAX_CONCURRENCY);
    const batchResults = await Promise.allSettled(
      batch.map(async (target: string) => {
        const endpoint =
          type === "content" ? "/api/analysis/content" : "/api/analysis/account";
        const body =
          type === "content" ? { url: target } : { platform: "xiaohongshu", username: target };

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}${endpoint}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Cookie: request.headers.get("cookie") || "",
            },
            body: JSON.stringify(body),
          }
        );
        const data = await res.json();
        if (!data.success) throw new Error(data.error || "分析失败");
        return { target, ...data.data };
      })
    );

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      } else {
        errors.push({
          target: batch[batchResults.indexOf(result)],
          error: result.reason?.message || "分析失败",
        });
      }
    }
  }

  trackActivity("analysis", authResult.userId, {
    type: "compare",
    targetCount: targets.length,
    successCount: results.length,
  });

  // Build comparison dimensions
  const comparison = buildComparison(results, type);

  return NextResponse.json({
    success: true,
    data: {
      results,
      errors,
      comparison,
      type,
    },
  });
}

function buildComparison(results: any[], type: string) {
  if (results.length === 0) return null;

  const dimensions =
    type === "content"
      ? ["overallScore", "engagement", "creativity", "relevance", "readability"]
      : ["overallScore", "influence", "consistency", "growth", "engagement"];

  return {
    dimensions,
    items: results.map((r) => ({
      target: r.target,
      scores: dimensions.reduce(
        (acc, dim) => {
          acc[dim] =
            r.analysis?.[dim] ??
            r.analysis?.scores?.[dim] ??
            r.analysis?.overallScore ??
            0;
          return acc;
        },
        {} as Record<string, number>
      ),
    })),
  };
}
