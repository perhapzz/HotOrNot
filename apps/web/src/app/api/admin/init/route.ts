import { NextResponse } from "next/server";
import { hotlistScheduler } from "../../../../lib/scheduler";

export async function POST() {
  try {
    console.log("🔄 手动触发服务器初始化...");

    // 获取调度器状态
    const currentStatus = hotlistScheduler.getStatus();
    console.log("🔄 当前调度器状态:", currentStatus);

    if (currentStatus.isRunning) {
      return NextResponse.json({
        success: true,
        message: "调度器已在运行中",
        status: currentStatus,
        timestamp: new Date().toISOString(),
      });
    }

    // 启动调度器
    console.log("🔄 启动调度器...");
    await hotlistScheduler.start();

    const status = hotlistScheduler.getStatus();
    console.log("✅ 调度器启动完成，状态:", status);

    return NextResponse.json({
      success: true,
      message: "服务器初始化成功，调度器已启动",
      status: status,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ 手动初始化失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const status = hotlistScheduler.getStatus();

    return NextResponse.json({
      success: true,
      status: status,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        AUTO_START_SCHEDULER: process.env.AUTO_START_SCHEDULER,
        TIKHUB_API_KEY_EXISTS: !!process.env.TIKHUB_API_KEY,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ 获取初始化状态失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "未知错误",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
