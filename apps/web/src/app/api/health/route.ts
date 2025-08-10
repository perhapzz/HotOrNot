import { NextResponse } from "next/server";
import { checkDatabaseHealth, connectDatabase } from "@hotornot/database";
import { createAIServiceFromEnv } from "@hotornot/ai";

export async function GET() {
  const healthStatus = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      database: false,
      ai: false,
    },
    details: {} as any,
  };

  try {
    // 检查数据库连接
    try {
      await connectDatabase();
      healthStatus.services.database = await checkDatabaseHealth();
      healthStatus.details.database = healthStatus.services.database
        ? "Connected"
        : "Connection failed";
    } catch (error) {
      healthStatus.services.database = false;
      healthStatus.details.database =
        error instanceof Error ? error.message : "Unknown error";
    }

    // 检查AI服务
    try {
      const aiService = createAIServiceFromEnv();
      healthStatus.services.ai = await aiService.healthCheck();
      healthStatus.details.ai = healthStatus.services.ai
        ? "Available"
        : "Service unavailable";
    } catch (error) {
      healthStatus.services.ai = false;
      healthStatus.details.ai =
        error instanceof Error ? error.message : "Configuration error";
    }

    // 确定整体状态
    const allServicesHealthy = Object.values(healthStatus.services).every(
      (status) => status === true,
    );
    healthStatus.status = allServicesHealthy ? "healthy" : "degraded";

    const statusCode = allServicesHealthy ? 200 : 503;

    return NextResponse.json(healthStatus, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        services: {
          database: false,
          ai: false,
        },
      },
      { status: 503 },
    );
  }
}
