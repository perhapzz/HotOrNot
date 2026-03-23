import { NextRequest, NextResponse } from "next/server";
import { connectDatabase } from "@hotornot/database/src/utils/connection";
import { getCacheConfig, isCacheExpired } from "../../cache-manager";
import mongoose from "mongoose";

interface HotlistConfig {
  platform: string;
  modelName: string;
  cacheKey: string;
  fetcher: () => Promise<{ items: any[]; title: string }>;
}

/**
 * Generic cached hotlist handler.
 * Eliminates the duplicate cache-first + stale-fallback pattern
 * across all 4 platform routes.
 */
export function createHotlistHandler(config: HotlistConfig) {
  return async (_request: NextRequest) => {
    try {
      await connectDatabase();

      const Model = mongoose.models[config.modelName];
      if (!Model) {
        return NextResponse.json(
          { success: false, error: `Model ${config.modelName} not found` },
          { status: 500 }
        );
      }

      const cacheConfig = getCacheConfig(config.platform);

      // 1. Check cache
      const latestRecord = await Model.findOne({
        hot_list_id: config.cacheKey,
      })
        .sort({ fetchedAt: -1 })
        .lean();

      if (
        latestRecord &&
        !isCacheExpired(latestRecord.fetchedAt, cacheConfig.ttl)
      ) {
        return NextResponse.json({
          success: true,
          data: latestRecord,
          source: "cache",
        });
      }

      // 2. Fetch fresh data
      try {
        const hotData = await config.fetcher();

        const newRecord = await Model.create({
          hot_list_id: config.cacheKey,
          title: hotData.title,
          items: hotData.items,
          fetchedAt: new Date(),
        });

        return NextResponse.json({
          success: true,
          data: newRecord,
          source: "api",
        });
      } catch (fetchError: any) {
        // 3. Stale fallback
        if (latestRecord) {
          return NextResponse.json({
            success: true,
            data: latestRecord,
            source: "stale_cache",
            warning: "Using stale data due to API error",
          });
        }
        throw fetchError;
      }
    } catch (error: any) {
      console.error(`[${config.platform}] Hotlist error:`, error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }
  };
}
