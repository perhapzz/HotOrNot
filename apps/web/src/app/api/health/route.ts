import { NextResponse } from "next/server";
import { checkDatabaseHealth, connectDatabase } from "@hotornot/database";
import { createAIServiceFromEnv } from "@hotornot/ai";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();

  const health: any = {
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || "unknown",
    node: process.version,
    services: {
      database: { ok: false, latency: 0 },
      ai: { ok: false },
    },
    hotlist: {},
    memory: {
      rss: 0,
      heapUsed: 0,
      heapTotal: 0,
    },
  };

  // Database health + latency
  try {
    const dbStart = Date.now();
    await connectDatabase();
    const dbOk = await checkDatabaseHealth();
    health.services.database = {
      ok: dbOk,
      latency: Date.now() - dbStart,
      state: mongoose.connection.readyState,
    };
  } catch (error: any) {
    health.services.database = {
      ok: false,
      error: error.message,
      latency: Date.now() - start,
    };
  }

  // AI service health
  try {
    const aiService = createAIServiceFromEnv();
    health.services.ai = { ok: await aiService.healthCheck() };
  } catch (error: any) {
    health.services.ai = { ok: false, error: error.message };
  }

  // Hotlist freshness check
  if (health.services.database.ok) {
    try {
      const platforms = ["DouyinHotList", "XiaohongshuHotList", "BilibiliHotList", "WeiboHotList"];
      const STALE_THRESHOLD = 30 * 60 * 1000; // 30 min

      for (const modelName of platforms) {
        const Model = mongoose.models[modelName];
        if (!Model) {
          health.hotlist[modelName] = { status: "model_not_found" };
          continue;
        }
        const latest = await Model.findOne().sort({ fetchedAt: -1 }).select("fetchedAt").lean();
        if (latest) {
          const age = Date.now() - new Date((latest as any).fetchedAt).getTime();
          health.hotlist[modelName] = {
            lastFetch: (latest as any).fetchedAt,
            ageMinutes: Math.round(age / 60000),
            stale: age > STALE_THRESHOLD,
          };
        } else {
          health.hotlist[modelName] = { status: "no_data" };
        }
      }
    } catch {
      health.hotlist = { error: "check_failed" };
    }
  }

  // Memory
  const mem = process.memoryUsage();
  health.memory = {
    rss: Math.round(mem.rss / 1024 / 1024),
    heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
    heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
  };

  // Overall status
  const dbOk = health.services.database.ok;
  const aiOk = health.services.ai.ok;
  const anyStale = Object.values(health.hotlist).some((h: any) => h.stale);

  health.status = !dbOk
    ? "unhealthy"
    : !aiOk || anyStale
      ? "degraded"
      : "healthy";

  health.responseTime = Date.now() - start;

  return NextResponse.json(health, {
    status: health.status === "unhealthy" ? 503 : 200,
    headers: { "Cache-Control": "no-cache, no-store" },
  });
}
