import { NextRequest, NextResponse } from "next/server";
import { XiaohongshuHotList, connectDatabase } from "@hotornot/database";
import { getCacheConfig, isCacheExpired } from "../../../../lib/cache-manager";

// 获取小红书热点数据的API函数
async function fetchXiaohongshuHotList() {
  const apiUrl =
    "https://api.tikhub.io/api/v1/xiaohongshu/web_v2/fetch_hot_list";
  const apiKey = process.env.TIKHUB_API_KEY || "YOUR_API_KEY_HERE";

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    accept: "application/json",
  };

  console.log("🚀 ===========================================");
  console.log("🚀 发起TikHub API请求 - 小红书热点数据");
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
    console.log("📈 TikHub API响应信息 - 小红书热点");
    console.log("📈 ===========================================");
    console.log(`⏱️ 响应时间: ${responseTime}ms`);
    console.log(`📊 HTTP状态码: ${response.status}`);
    console.log(`📝 状态文本: ${response.statusText}`);

    if (!response.ok) {
      console.error("❌ ===========================================");
      console.error("❌ TikHub API请求失败 - 小红书热点");
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
    console.log("✅ TikHub API响应成功 - 小红书热点");
    console.log("✅ ===========================================");
    console.log(`📝 响应代码: ${apiData.code || "未知"}`);
    console.log(`🔗 路由: ${apiData.router || "未知"}`);
    console.log(`📊 热点数量: ${apiData.data?.data?.items?.length || 0}`);
    console.log(`📋 热点列表ID: ${apiData.data?.data?.hot_list_id || "未知"}`);
    console.log(`📌 标题: ${apiData.data?.data?.title || "未知"}`);

    if (apiData.data?.data?.items?.length > 0) {
      console.log("🔥 热点预览 (前3条):");
      apiData.data.data.items
        .slice(0, 3)
        .forEach((item: any, index: number) => {
          console.log(
            `   ${index + 1}. ${item.title} (评分: ${item.score}, 类型: ${item.word_type})`,
          );
        });
    }
    console.log("✅ ===========================================");

    return apiData;
  } catch (error) {
    console.error("❌ ===========================================");
    console.error("❌ TikHub API调用异常 - 小红书热点");
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

    const hotList = new XiaohongshuHotList({
      hot_list_id: hotListData.hot_list_id,
      title: hotListData.title,
      background_color: hotListData.background_color,
      host: hotListData.host,
      is_new_hot_list_exp: hotListData.is_new_hot_list_exp,
      items: hotListData.items.map((item: any) => ({
        id: item.id,
        title: item.title,
        icon: item.icon,
        title_img: item.title_img,
        rank_change: item.rank_change,
        score: item.score,
        type: item.type,
        word_type: item.word_type,
      })),
      fetchedAt: new Date(),
    });

    await hotList.save();

    console.log("💾 ===========================================");
    console.log("💾 热点数据保存成功");
    console.log("💾 ===========================================");
    console.log(`📋 热点列表ID: ${hotListData.hot_list_id}`);
    console.log(`📊 保存条目数: ${hotListData.items.length}`);
    console.log(`⏰ 保存时间: ${new Date().toLocaleString()}`);
    console.log("💾 ===========================================");

    return hotList;
  } catch (error) {
    console.error("❌ 保存热点数据失败:", error);
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
    const query = XiaohongshuHotList.find();

    if (!includeItems) {
      query.select("-items"); // 不包含items数据，只返回基本信息
    }

    const hotLists = await query.sort({ fetchedAt: -1 }).limit(limit).lean();

    if (hotLists.length === 0) {
      return NextResponse.json({
        success: true,
        message: "暂无热点数据",
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
    console.error("❌ 获取热点数据失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "获取热点数据失败",
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
    console.log("🎯 手动触发热点数据获取");
    console.log("🎯 ===========================================");

    // 获取小红书热点数据
    const apiData = await fetchXiaohongshuHotList();

    // 检查API响应 - 修正数据结构检查
    if (!apiData || apiData.code !== 200 || !apiData.data?.data) {
      console.error("❌ API响应数据结构:", JSON.stringify(apiData, null, 2));
      throw new Error("API返回数据格式错误");
    }

    // 保存到数据库
    const savedHotList = await saveHotListToDatabase(apiData.data.data);

    return NextResponse.json({
      success: true,
      message: "热点数据获取成功",
      data: {
        hot_list_id: savedHotList.hot_list_id,
        title: savedHotList.title,
        itemCount: savedHotList.items.length,
        fetchedAt: savedHotList.fetchedAt,
        items: savedHotList.items.slice(0, 10), // 返回前10条作为预览
      },
    });
  } catch (error) {
    console.error("❌ 热点数据获取失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: "热点数据获取失败",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
