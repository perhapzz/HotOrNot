import { NextRequest, NextResponse } from "next/server";
import { connectDatabase, BatchAnalysis } from "@hotornot/database";
import { generateJobId, processBatchJob } from "@/lib/batch-processor";
export const dynamic = "force-dynamic";

const MAX_BATCH_SIZE = 10;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, type } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { success: false, error: "items array is required and cannot be empty" },
        { status: 400 }
      );
    }

    if (items.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { success: false, error: `Maximum ${MAX_BATCH_SIZE} items per batch` },
        { status: 400 }
      );
    }

    if (!["content", "keyword"].includes(type)) {
      return NextResponse.json(
        { success: false, error: "type must be 'content' or 'keyword'" },
        { status: 400 }
      );
    }

    await connectDatabase();

    const jobId = generateJobId();
    const batchItems = items.map((item: any, index: number) => ({
      index,
      input: item.url || item.keyword || item.input || "",
      platform: item.platform,
      status: "pending" as const,
    }));

    await BatchAnalysis.create({
      jobId,
      type,
      items: batchItems,
      status: "pending",
      totalItems: batchItems.length,
      completedItems: 0,
      failedItems: 0,
    });

    // Start processing in background (non-blocking)
    const baseUrl = request.nextUrl.origin;
    processBatchJob(jobId, async (input, platform) => {
      const endpoint =
        type === "content"
          ? `${baseUrl}/api/analysis/content`
          : `${baseUrl}/api/analysis/keyword`;

      const payload =
        type === "content"
          ? { url: input, platform }
          : { keyword: input, platforms: platform ? [platform] : ["xiaohongshu", "douyin"] };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Analysis failed (${res.status})`);
      }

      const data = await res.json();
      return { resultId: data.data?._id || data.data?.id || "unknown" };
    }).catch((err) => {
      console.error(`Batch job ${jobId} processing error:`, err);
    });

    return NextResponse.json({
      success: true,
      data: { jobId, status: "processing", totalItems: batchItems.length },
    });
  } catch (error: any) {
    console.error("Batch analysis error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
