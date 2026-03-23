import { NextRequest, NextResponse } from "next/server";
import { getTaskStatuses, triggerTask, getTaskNames } from "@/lib/scheduler";

export async function GET() {
  return NextResponse.json({
    success: true,
    data: { tasks: getTaskStatuses() },
  });
}

export async function POST(request: NextRequest) {
  const { action, taskName } = await request.json();

  if (action === "trigger" && taskName) {
    if (!getTaskNames().includes(taskName)) {
      return NextResponse.json(
        { success: false, error: `任务 ${taskName} 不存在` },
        { status: 404 }
      );
    }
    await triggerTask(taskName);
    return NextResponse.json({ success: true, message: `${taskName} 已触发` });
  }

  return NextResponse.json(
    { success: false, error: "无效操作" },
    { status: 400 }
  );
}
