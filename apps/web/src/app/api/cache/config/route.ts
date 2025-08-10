import { NextRequest, NextResponse } from "next/server";
import { getCacheConfig } from "../../../../lib/cache-manager";

/**
 * 获取缓存配置信息
 */
export async function GET(request: NextRequest) {
  try {
    const cacheConfig = getCacheConfig();

    return NextResponse.json({
      success: true,
      data: {
        cacheConfig,
        description: {
          keywordAnalysis: "关键词分析缓存有效期（小时）",
          contentAnalysis: "内容分析缓存有效期（小时）",
          accountAnalysis: "账号分析缓存有效期（小时）",
        },
        note: "缓存有效期可通过环境变量配置：KEYWORD_ANALYSIS_CACHE_HOURS, CONTENT_ANALYSIS_CACHE_HOURS, ACCOUNT_ANALYSIS_CACHE_HOURS",
      },
    });
  } catch (error) {
    console.error("获取缓存配置失败:", error);

    return NextResponse.json(
      {
        success: false,
        error: "获取缓存配置失败",
      },
      { status: 500 },
    );
  }
}
