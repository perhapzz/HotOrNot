import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getTaskStatuses, triggerTask, getTaskNames } from "@/lib/scheduler";

export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  return NextResponse.json({
    success: true,
    data: { tasks: getTaskStatuses() },
  });
}

export async function POST(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { taskName } = await request.json();

  if (!taskName) {
    return NextResponse.json(
      { success: false, error: "缺少 taskName" },
      { status: 400 }
    );
  }

  if (!getTaskNames().includes(taskName)) {
    return NextResponse.json(
      { success: false, error: `任务 ${taskName} 不存在` },
      { status: 404 }
    );
  }

  await triggerTask(taskName);

  return NextResponse.json({
    success: true,
    message: `任务 ${taskName} 已触发`,
  });
}
