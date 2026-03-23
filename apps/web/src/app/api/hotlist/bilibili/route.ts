import { NextRequest, NextResponse } from "next/server";
import { BilibiliHotList, connectDatabase } from "@hotornot/database";
import { getCacheConfig, isCacheExpired } from "../../../../lib/cache-manager";

async function fetchBilibiliHotList() {
  const apiUrl = "https://api.bilibili.com/x/web-interface/ranking/v2";

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "https://www.bilibili.com",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Bilibili API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.code !== 0 || !data.data?.list) {
    throw new Error("Invalid Bilibili API response");
  }

  const items = data.data.list.slice(0, 50).map((item: any, index: number) => ({
    title: item.title,
    url: `https://www.bilibili.com/video/${item.bvid}`,
    pic: item.pic,
    desc: item.desc,
    stat: {
      view: item.stat?.view || 0,
      like: item.stat?.like || 0,
      danmaku: item.stat?.danmaku || 0,
    },
    score: item.score || 0,
    rank: index + 1,
  }));

  return { items, title: "B站热门排行" };
}

export async function GET(request: NextRequest) {
  try {
    await connectDatabase();

    const cacheConfig = getCacheConfig("bilibili");
    const latestRecord = await BilibiliHotList.findOne({
      hot_list_id: "bilibili_ranking",
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
      const hotData = await fetchBilibiliHotList();

      const newRecord = await BilibiliHotList.create({
        hot_list_id: "bilibili_ranking",
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
    console.error("Bilibili hotlist error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
