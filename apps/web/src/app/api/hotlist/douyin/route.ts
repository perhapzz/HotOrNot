import { NextRequest, NextResponse } from "next/server";
import { DouyinHotList, connectDatabase } from "@hotornot/database";
import { getCacheConfig, isCacheExpired } from "../../../../lib/cache-manager";
export const dynamic = "force-dynamic";

// 获取抖音热点数据的API函数
async function fetchDouyinHotList() {
  const apiUrl =
    "https://api.tikhub.io/api/v1/douyin/app/v3/fetch_hot_search_list";
  const apiKey = process.env.TIKHUB_API_KEY || "YOUR_API_KEY_HERE";

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    accept: "application/json",
  };

  console.log("🚀 ===========================================");
  console.log("🚀 发起TikHub API请求 - 抖音热点数据");
  console.log("🚀 ===========================================");
  console.log(`📍 API URL: ${apiUrl}`);
  console.log(`🔑 API Key (前10位): ${apiKey.substring(0, 10)}...`);
  console.log("🚀 ===========================================");

  try {
    const startTime = Date.now();

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: headers,
      signal: AbortSignal.timeout(15000), // 15秒超时
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    console.log("📈 ===========================================");
    console.log("📈 TikHub API响应信息 - 抖音热点");
    console.log("📈 ===========================================");
    console.log(`⏱️ 响应时间: ${responseTime}ms`);
    console.log(`📊 HTTP状态码: ${response.status}`);
    console.log(`📝 状态文本: ${response.statusText}`);

    if (!response.ok) {
      console.error("❌ ===========================================");
      console.error("❌ TikHub API请求失败 - 抖音热点");
      console.error("❌ ===========================================");
      console.error(`❌ 状态码: ${response.status}`);
      console.error(`❌ 错误信息: ${response.statusText}`);

      const errorText = await response.text().catch(() => "无法读取错误响应");
      console.error(`❌ 响应内容: ${errorText}`);
      console.error("❌ ===========================================");

      throw new Error(
        `TikHub API请求失败: ${response.status} - ${response.statusText}`,
      );
    }

    const apiData = await response.json();

    console.log("✅ ===========================================");
    console.log("✅ TikHub API响应成功 - 抖音热点");
    console.log("✅ ===========================================");
    console.log(`📝 响应代码: ${apiData.code || "未知"}`);
    console.log(`🔗 路由: ${apiData.router || "未知"}`);
    console.log(`📊 热点数量: ${apiData.data?.data?.word_list?.length || 0}`);
    console.log(`📋 热点列表ID: ${apiData.data?.data?.active_time || "未知"}`);
    console.log(`📌 标题: 抖音热榜`);

    if (apiData.data?.data?.word_list?.length > 0) {
      console.log("🔥 热点预览 (前3条):");
      apiData.data.data.word_list
        .slice(0, 3)
        .forEach((item: any, index: number) => {
          console.log(
            `   ${index + 1}. ${item.word} (热度: ${item.hot_value}, 标签: ${item.label})`,
          );
        });
    }
    console.log("✅ ===========================================");

    return apiData;
  } catch (error) {
    console.error("❌ ===========================================");
    console.error("❌ TikHub API调用异常 - 抖音热点");
    console.error("❌ ===========================================");
    console.error(
      `❌ 错误类型: ${error instanceof Error ? error.constructor.name : typeof error}`,
    );
    console.error(
      `❌ 错误信息: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error(
      `❌ 错误堆栈: ${error instanceof Error ? error.stack : "无堆栈信息"}`,
    );
    console.error("❌ ===========================================");

    throw error;
  }
}

// 保存热点数据到数据库
async function saveHotListToDatabase(hotListData: any) {
  try {
    await connectDatabase();

    const hotList = new DouyinHotList({
      hot_list_id: hotListData.active_time || "douyin_hotlist",
      title: "抖音热榜",
      background_color: null,
      host: "douyin.com",
      is_new_hot_list_exp: false,
      items: (hotListData.word_list || []).map((item: any, index: number) => ({
        id:
          item.sentence_id || item.group_id || `douyin_${index}_${Date.now()}`,
        title: item.word || "未知标题",
        icon: item.word_cover?.url_list?.[0] || "",
        title_img: item.word_cover?.url_list?.[0] || "",
        rank_change: 0, // Douyin API doesn't provide rank change info
        score: item.hot_value?.toString() || "0",
        type: item.sentence_tag?.toString() || "normal",
        word_type:
          item.label === 0
            ? "正常"
            : item.label === 1
              ? "上升"
              : item.label === 3
                ? "热"
                : "其他",
      })),
      fetchedAt: new Date(),
    });

    await hotList.save();

    console.log("💾 ===========================================");
    console.log("💾 抖音热点数据保存成功");
    console.log("💾 ===========================================");
    console.log(`📋 热点列表ID: ${hotList.hot_list_id}`);
    console.log(`📊 保存条目数: ${hotList.items.length}`);
    console.log(`⏰ 保存时间: ${new Date().toLocaleString()}`);
    console.log("💾 ===========================================");

    return hotList;
  } catch (error) {
    console.error("❌ 保存抖音热点数据失败:", error);
    throw error;
  }
}

// GET 请求 - 获取最新的热点数据
export async function GET(request: NextRequest) {
  try {
    await connectDatabase();

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "1");
    const includeItems = url.searchParams.get("includeItems") !== "false";
    const forceRefresh = url.searchParams.get("refresh") === "true";

    const cacheConfig = getCacheConfig();

    // 获取最新的热点数据
    const query = DouyinHotList.find();

    if (!includeItems) {
      query.select("-items"); // 不包含items数据，只返回基本信息
    }

    const hotLists = await query.sort({ fetchedAt: -1 }).limit(limit).lean();

    if (hotLists.length === 0) {
      return NextResponse.json({
        success: true,
        message: "暂无抖音热点数据",
        data: {
          hotLists: [],
          total: 0,
          lastUpdated: null,
          fromCache: false,
        },
      });
    }

    // 检查缓存是否有效
    const isCached =
      !forceRefresh &&
      !isCacheExpired(hotLists[0]?.fetchedAt, cacheConfig.hotlistData);

    return NextResponse.json({
      success: true,
      data: {
        hotLists: hotLists,
        total: hotLists.length,
        lastUpdated: hotLists[0]?.fetchedAt,
        fromCache: isCached,
        cacheExpiresIn: isCached
          ? Math.ceil(
              (new Date(hotLists[0]?.fetchedAt).getTime() +
                cacheConfig.hotlistData * 60 * 60 * 1000 -
                Date.now()) /
                (1000 * 60),
            )
          : 0,
      },
    });
  } catch (error) {
    console.error("❌ 获取抖音热点数据失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取抖音热点数据失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

// POST 请求 - 手动触发热点数据获取
export async function POST(request: NextRequest) {
  try {
    console.log("🎯 ===========================================");
    console.log("🎯 手动触发抖音热点数据获取");
    console.log("🎯 ===========================================");

    // 获取抖音热点数据
    const apiData = await fetchDouyinHotList();

    // 检查API响应 - 修正数据结构检查
    if (!apiData || apiData.code !== 200 || !apiData.data?.data) {
      console.error(
        "❌ 抖音API响应数据结构:",
        JSON.stringify(apiData, null, 2),
      );
      throw new Error("抖音API返回数据格式错误");
    }

    // 保存到数据库
    const savedHotList = await saveHotListToDatabase(apiData.data.data);

    return NextResponse.json({
      success: true,
      message: "抖音热点数据获取成功",
      data: {
        hot_list_id: savedHotList.hot_list_id,
        title: savedHotList.title,
        itemCount: savedHotList.items.length,
        fetchedAt: savedHotList.fetchedAt,
        items: savedHotList.items.slice(0, 10), // 返回前10条作为预览
      },
    });
  } catch (error) {
    console.error("❌ 抖音热点数据获取失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "抖音热点数据获取失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
