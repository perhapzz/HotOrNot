import { NextRequest } from "next/server";
import { createHotlistHandler } from "../../../../lib/hotlist-handler";

async function fetchWeiboHotSearch() {
  const response = await fetch("https://weibo.com/ajax/side/hotSearch", {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Referer: "https://weibo.com",
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) throw new Error(`Weibo API error: ${response.status}`);
  const data = await response.json();
  if (!data.data?.realtime) throw new Error("Invalid Weibo API response");

  const items = data.data.realtime
    .slice(0, 50)
    .map((item: any, index: number) => ({
      title: item.note || item.word,
      url: `https://s.weibo.com/weibo?q=${encodeURIComponent(item.word || item.note)}`,
      hotValue: item.num || item.raw_hot || 0,
      category: item.category || "",
      icon: item.icon_desc || "",
      rank: index + 1,
    }));

  return { items, title: "微博热搜" };
}

export const GET = createHotlistHandler({
  platform: "weibo",
  modelName: "WeiboHotList",
  cacheKey: "weibo_hotsearch",
  fetcher: fetchWeiboHotSearch,
});
