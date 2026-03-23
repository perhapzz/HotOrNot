import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAllQueueStatuses } from "@/lib/queue";

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const statuses = await getAllQueueStatuses();

  return NextResponse.json({
    success: true,
    data: { queues: statuses },
  });
}
