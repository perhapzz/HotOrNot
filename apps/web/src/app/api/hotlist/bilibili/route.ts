import { NextRequest } from "next/server";
import { createHotlistHandler } from "../../../../lib/hotlist-handler";

async function fetchBilibiliHotList() {
  const response = await fetch(
    "https://api.bilibili.com/x/web-interface/ranking/v2",
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Referer: "https://www.bilibili.com",
      },
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!response.ok) throw new Error(`Bilibili API error: ${response.status}`);
  const data = await response.json();
  if (data.code !== 0 || !data.data?.list)
    throw new Error("Invalid Bilibili API response");

  const items = data.data.list
    .slice(0, 50)
    .map((item: any, index: number) => ({
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

export const GET = createHotlistHandler({
  platform: "bilibili",
  modelName: "BilibiliHotList",
  cacheKey: "bilibili_ranking",
  fetcher: fetchBilibiliHotList,
});
