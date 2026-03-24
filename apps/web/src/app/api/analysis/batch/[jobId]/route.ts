import { NextRequest, NextResponse } from "next/server";
import { connectDatabase, BatchAnalysis } from "@hotornot/database";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  try {
    await connectDatabase();

    const job = await BatchAnalysis.findOne({ jobId: params.jobId });

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        jobId: job.jobId,
        type: job.type,
        status: job.status,
        totalItems: job.totalItems,
        completedItems: job.completedItems,
        failedItems: job.failedItems,
        items: job.items.map((item: any) => ({
          index: item.index,
          input: item.input,
          status: item.status,
          resultId: item.resultId,
          error: item.error,
        })),
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      },
    });
  } catch (error: any) {
    console.error("Batch status error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
