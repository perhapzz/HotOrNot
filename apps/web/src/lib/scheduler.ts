import { connectDatabase } from "@hotornot/database";

// 直接导入热点数据获取函数，避免HTTP调用
async function fetchXiaohongshuHotListData() {
  const apiUrl =
    "https://api.tikhub.io/api/v1/xiaohongshu/web_v2/fetch_hot_list";
  const apiKey = process.env.TIKHUB_API_KEY || "YOUR_API_KEY_HERE";

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    accept: "application/json",
  };

  console.log("🚀 直接调用TikHub API - 小红书热点数据");

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: headers,
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `TikHub API请求失败: ${response.status} - ${response.statusText}`,
    );
  }

  const apiData = await response.json();

  if (!apiData || apiData.code !== 200 || !apiData.data?.data) {
    throw new Error("API返回数据格式错误");
  }

  return apiData.data.data;
}

async function fetchDouyinHotListData() {
  const apiUrl =
    "https://api.tikhub.io/api/v1/douyin/app/v3/fetch_hot_search_list";
  const apiKey = process.env.TIKHUB_API_KEY || "YOUR_API_KEY_HERE";

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    accept: "application/json",
  };

  console.log("🚀 直接调用TikHub API - 抖音热点数据");

  const response = await fetch(apiUrl, {
    method: "GET",
    headers: headers,
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `TikHub API请求失败: ${response.status} - ${response.statusText}`,
    );
  }

  const apiData = await response.json();

  // 添加详细的调试日志
  console.log("🔍 抖音API响应调试信息:");
  console.log("  - HTTP状态:", response.status);
  console.log("  - 响应数据存在:", !!apiData);
  console.log("  - 响应代码:", apiData?.code);
  console.log(
    "  - 数据结构:",
    apiData?.data ? Object.keys(apiData.data) : "undefined",
  );

  if (!apiData) {
    throw new Error("API返回数据为空");
  }

  if (apiData.code !== 200) {
    console.error("❌ API返回错误代码:", apiData.code);
    console.error("❌ 错误消息:", apiData.message || "未知错误");
    throw new Error(
      `API返回错误: ${apiData.code} - ${apiData.message || "未知错误"}`,
    );
  }

  // 检查数据结构的多种可能性
  let wordList = null;

  // 根据实际API响应，数据在 data.data.word_list 中
  if (apiData.data?.data?.word_list) {
    wordList = apiData.data.data.word_list;
    console.log("✅ 找到嵌套word_list数据，长度:", wordList.length);
  } else if (apiData.data?.word_list) {
    wordList = apiData.data.word_list;
    console.log("✅ 找到word_list数据，长度:", wordList.length);
  } else if (apiData.data?.list) {
    wordList = apiData.data.list;
    console.log("✅ 找到list数据，长度:", wordList.length);
  } else if (apiData.word_list) {
    wordList = apiData.word_list;
    console.log("✅ 找到顶层word_list数据，长度:", wordList.length);
  } else if (Array.isArray(apiData.data)) {
    wordList = apiData.data;
    console.log("✅ data本身是数组，长度:", wordList.length);
  } else {
    console.error(
      "❌ 未找到热点数据，API数据结构键:",
      Object.keys(apiData.data || {}),
    );
    if (apiData.data?.data) {
      console.error("❌ 嵌套data的键:", Object.keys(apiData.data.data));
    }
    throw new Error("API返回数据中未找到热点列表");
  }

  if (!Array.isArray(wordList) || wordList.length === 0) {
    throw new Error("热点数据列表为空或格式错误");
  }

  console.log("✅ 抖音热点数据获取成功，条数:", wordList.length);
  return wordList;
}

// 定时更新热点数据的服务
class HotlistScheduler {
  private updateInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  // 3小时 = 3 * 60 * 60 * 1000 毫秒
  private readonly UPDATE_INTERVAL = 3 * 60 * 60 * 1000;

  async start() {
    if (this.isRunning) {
      console.log("📅 定时更新服务已在运行中");
      return;
    }

    console.log("🚀 启动热点数据定时更新服务 - 每3小时更新一次");
    this.isRunning = true;

    // 立即执行一次更新
    await this.updateHotlistData();

    // 设置定时更新
    this.updateInterval = setInterval(async () => {
      await this.updateHotlistData();
    }, this.UPDATE_INTERVAL);

    console.log(
      `⏰ 定时更新已启动，间隔: ${this.UPDATE_INTERVAL / 1000 / 60} 分钟`,
    );
  }

  stop() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    this.isRunning = false;
    console.log("⏹️ 热点数据定时更新服务已停止");
  }

  private async updateHotlistData() {
    console.log("🔄 ===========================================");
    console.log("🔄 开始定时更新热点数据");
    console.log(`🔄 当前时间: ${new Date().toLocaleString("zh-CN")}`);
    console.log("🔄 ===========================================");

    try {
      // 确保数据库连接
      await connectDatabase();

      // 并发更新小红书和抖音热点数据
      const [xiaohongshuResult, douyinResult] = await Promise.allSettled([
        this.updateXiaohongshuHotlist(),
        this.updateDouyinHotlist(),
      ]);

      // 记录结果
      let successCount = 0;
      let failCount = 0;

      if (xiaohongshuResult.status === "fulfilled") {
        console.log("✅ 小红书热点数据更新成功");
        successCount++;
      } else {
        console.error("❌ 小红书热点数据更新失败:", xiaohongshuResult.reason);
        failCount++;
      }

      if (douyinResult.status === "fulfilled") {
        console.log("✅ 抖音热点数据更新成功");
        successCount++;
      } else {
        console.error("❌ 抖音热点数据更新失败:", douyinResult.reason);
        failCount++;
      }

      console.log("📊 ===========================================");
      console.log(`📊 定时更新完成: 成功${successCount}个, 失败${failCount}个`);
      console.log(
        `📊 下次更新时间: ${new Date(Date.now() + this.UPDATE_INTERVAL).toLocaleString("zh-CN")}`,
      );
      console.log("📊 ===========================================");
    } catch (error) {
      console.error("❌ 定时更新热点数据时发生错误:", error);
    }
  }

  private async updateXiaohongshuHotlist() {
    try {
      // 直接调用API，避免HTTP网络问题
      const hotListData = await fetchXiaohongshuHotListData();

      // 保存到数据库
      const { XiaohongshuHotList } = await import("@hotornot/database");

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

      console.log(`💾 小红书热点数据保存成功 (${hotListData.items.length}条)`);
      return { success: true, count: hotListData.items.length };
    } catch (error) {
      throw new Error(
        `更新小红书热点数据失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async updateDouyinHotlist() {
    try {
      // 直接调用API，避免HTTP网络问题
      const wordList = await fetchDouyinHotListData();

      // 保存到数据库
      const { DouyinHotList } = await import("@hotornot/database");

      // 根据数据库模型要求，构造符合抖音热点数据模型的数据
      const hotList = new DouyinHotList({
        hot_list_id: `douyin_${Date.now()}`, // 生成唯一ID
        title: "抖音热榜", // 默认标题
        background_color: null,
        host: "douyin.com",
        is_new_hot_list_exp: false,
        items: wordList.map((item: any, index: number) => ({
          id: item.sentence_id || `item_${index}`,
          title: item.word || "",
          icon: "",
          title_img: item.word_cover?.url_list?.[0] || "",
          rank_change: 0,
          score: String(item.hot_value || 0),
          type: "normal",
          word_type: String(item.word_type || 1),
        })),
        fetchedAt: new Date(),
      });

      await hotList.save();

      console.log(`💾 抖音热点数据保存成功 (${wordList.length}条)`);
      return { success: true, count: wordList.length };
    } catch (error) {
      throw new Error(
        `更新抖音热点数据失败: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // 手动触发更新，供API调用
  async updateHotlistDataManually() {
    console.log("🔄 手动触发热点数据更新");
    return await this.updateHotlistData();
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      updateInterval: this.UPDATE_INTERVAL,
      nextUpdateTime: this.isRunning
        ? new Date(Date.now() + this.UPDATE_INTERVAL).toISOString()
        : null,
    };
  }
}

// 创建单例实例
export const hotlistScheduler = new HotlistScheduler();
