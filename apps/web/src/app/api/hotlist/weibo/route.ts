import { NextRequest, NextResponse } from "next/server";
import { WeiboHotList, connectDatabase } from "@hotornot/database";
import { getCacheConfig, isCacheExpired } from "../../../../lib/cache-manager";

async function fetchWeiboHotSearch() {
  const apiUrl = "https://weibo.com/ajax/side/hotSearch";

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "https://weibo.com",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Weibo API error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.data?.realtime) {
    throw new Error("Invalid Weibo API response");
  }

  const items = data.data.realtime.slice(0, 50).map((item: any, index: number) => ({
    title: item.note || item.word,
    url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word || item.note)}`,
    hotValue: item.num || item.raw_hot || 0,
    category: item.category || "",
    icon: item.icon_desc || "",
    rank: index + 1,
  }));

  return { items, title: "微博热搜" };
}

export async function GET(request: NextRequest) {
  try {
    await connectDatabase();

    const cacheConfig = getCacheConfig("weibo");
    const latestRecord = await WeiboHotList.findOne({
      hot_list_id: "weibo_hotsearch",
    })
      .sort({ fetchedAt: -1 })
      .lean();

    if (latestRecord && !isCacheExpired(latestRecord.fetchedAt, cacheConfig.ttl)) {
      return NextResponse.json({
        success: true,
        data: latestRecord,
        source: "cache",
      });
    }

    try {
      const hotData = await fetchWeiboHotSearch();

      const newRecord = await WeiboHotList.create({
        hot_list_id: "weibo_hotsearch",
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
    console.error("Weibo hotlist error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
