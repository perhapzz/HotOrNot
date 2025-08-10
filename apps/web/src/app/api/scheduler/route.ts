import { NextRequest, NextResponse } from "next/server";
import { hotlistScheduler } from "../../../lib/scheduler";

// GET 请求 - 获取定时任务状态
export async function GET() {
  try {
    const status = hotlistScheduler.getStatus();

    return NextResponse.json({
      success: true,
      data: {
        status: status.isRunning ? "running" : "stopped",
        isRunning: status.isRunning,
        updateInterval: status.updateInterval,
        updateIntervalMinutes: status.updateInterval / 1000 / 60,
        nextUpdateTime: status.nextUpdateTime,
        description: "热点数据定时更新服务 - 每3小时更新一次",
      },
    });
  } catch (error) {
    console.error("获取定时任务状态失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取定时任务状态失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// POST 请求 - 控制定时任务
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case "start":
        await hotlistScheduler.start();
        return NextResponse.json({
          success: true,
          message: "定时任务已启动",
          data: hotlistScheduler.getStatus(),
        });

      case "stop":
        hotlistScheduler.stop();
        return NextResponse.json({
          success: true,
          message: "定时任务已停止",
          data: hotlistScheduler.getStatus(),
        });

      case "restart":
        hotlistScheduler.stop();
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 等待1秒
        await hotlistScheduler.start();
        return NextResponse.json({
          success: true,
          message: "定时任务已重启",
          data: hotlistScheduler.getStatus(),
        });

      case "update_now":
        // 立即触发一次热点数据更新
        try {
          // 如果定时器正在运行，先暂停再手动更新
          const wasRunning = hotlistScheduler.getStatus().isRunning;
          if (wasRunning) {
            hotlistScheduler.stop();
          }

          // 手动触发更新
          await hotlistScheduler.updateHotlistDataManually();

          // 如果之前在运行，重新启动
          if (wasRunning) {
            await hotlistScheduler.start();
          }

          return NextResponse.json({
            success: true,
            message: "热点数据更新完成",
            data: {
              ...hotlistScheduler.getStatus(),
              lastManualUpdate: new Date().toISOString(),
            },
          });
        } catch (updateError) {
          return NextResponse.json(
            {
              success: false,
              error: "手动更新热点数据失败",
              details:
                updateError instanceof Error
                  ? updateError.message
                  : String(updateError),
            },
            { status: 500 },
          );
        }

      default:
        return NextResponse.json(
          {
            success: false,
            error: "无效的操作类型",
            availableActions: ["start", "stop", "restart", "update_now"],
          },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("控制定时任务失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "控制定时任务失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
