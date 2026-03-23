import { NextRequest, NextResponse } from "next/server";
import { analysisQueue, emailQueue, hotlistQueue } from "@/lib/queue";

const QUEUES: Record<string, any> = {
  analysis: analysisQueue,
  email: emailQueue,
  hotlist: hotlistQueue,
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = params.id;
  const { searchParams } = new URL(request.url);
  const queueName = searchParams.get("queue") || "analysis";

  const queue = QUEUES[queueName];
  if (!queue) {
    return NextResponse.json(
      { success: false, error: "无效的队列名" },
      { status: 400 }
    );
  }

  const job = await queue.getJob(jobId);
  if (!job) {
    return NextResponse.json(
      { success: false, error: "任务不存在" },
      { status: 404 }
    );
  }

  const state = await job.getState();

  return NextResponse.json({
    success: true,
    data: {
      id: job.id,
      state,
      progress: job.progress,
      data: job.data,
      result: job.returnvalue,
      failedReason: job.failedReason,
      attemptsMade: job.attemptsMade,
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      finishedAt: job.finishedOn,
    },
  });
}
