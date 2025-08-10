interface DouyinSearchResponse {
  code: number;
  router: string;
  params: {
    keyword: string;
    count: string;
    sort_type: string;
    publish_time: string;
  };
  data: {
    status_code: number;
    data: DouyinSearchItem[];
  };
}

interface DouyinSearchItem {
  type: number;
  aweme_info: {
    aweme_id: string;
    desc: string;
    create_time: number;
    author: {
      uid: string;
      nickname: string;
      avatar_thumb: {
        uri: string;
        url_list: string[];
        width: number;
        height: number;
      };
      follow_status: number;
      follower_count: number;
      total_favorited: number;
      sec_uid: string;
    };
    music: {
      id: number;
      id_str: string;
      title: string;
      author: string;
      album: string;
      cover_medium?: {
        uri: string;
        url_list: string[];
        width: number;
        height: number;
      };
      cover_thumb?: {
        uri: string;
        url_list: string[];
        width: number;
        height: number;
      };
      play_url?: {
        uri: string;
        url_list: string[];
        width: number;
        height: number;
        url_key: string;
      };
      duration: number;
    };
    video: {
      play_addr: {
        uri: string;
        url_list: string[];
        width: number;
        height: number;
        url_key: string;
        data_size: number;
        file_hash: string;
        file_cs: string;
      };
      cover: {
        uri: string;
        url_list: string[];
        width: number;
        height: number;
      };
      height: number;
      width: number;
      dynamic_cover?: {
        uri: string;
        url_list: string[];
        width: number;
        height: number;
      };
      origin_cover?: {
        uri: string;
        url_list: string[];
        width: number;
        height: number;
      };
      duration: number;
    };
    statistics: {
      comment_count: number;
      digg_count: number;
      download_count: number;
      play_count: number;
      share_count: number;
      forward_count: number;
      live_watch_count: number;
      collect_count: number;
    };
    text_extra?: Array<{
      start: number;
      end: number;
      type: number;
      hashtag_name?: string;
      hashtag_id?: string;
      is_commerce?: boolean;
    }>;
  };
}

interface KeywordSearchResult {
  id: string;
  title: string;
  author: string;
  authorId: string;
  authorAvatar: string;
  url: string;
  metrics: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
    collected: number;
  };
  publishedAt: Date;
  coverImage: string;
  images: string[];
}

export class DouyinKeywordParser {
  private apiKey: string;
  private baseUrl = "https://api.tikhub.io/api/v1/douyin/web";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 搜索抖音关键词相关视频
   */
  async searchKeywordVideos(
    keyword: string,
    count: number = 10,
    sortType: "0" | "1" | "2" = "0", // 0:综合排序 1:最多点赞 2:最新发布 (改为综合排序)
    publishTime: "0" | "1" | "7" | "182" = "0", // 0:不限 1:一天内 7:一周内 182:半年内 (改为不限时间)
  ): Promise<KeywordSearchResult[]> {
    // 限制count在合理范围内，抖音API可能不支持太大的数值
    const validCount = Math.min(Math.max(count, 1), 20);
    const url = `${this.baseUrl}/fetch_general_search_result`;
    const params = new URLSearchParams({
      keyword: keyword,
      count: validCount.toString(),
      sort_type: sortType,
      publish_time: publishTime,
    });

    try {
      const requestUrl = `${url}?${params}`;
      console.log("🔍 抖音API请求URL:", requestUrl);
      console.log("🔍 请求参数:", { keyword, count, sortType, publishTime });

      const response = await fetch(requestUrl, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      console.log("🔍 抖音API响应状态:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("🔍 抖音API错误响应:", errorText);
        throw new Error(
          `抖音API请求失败: ${response.status} ${response.statusText} - ${errorText}`,
        );
      }

      const data: DouyinSearchResponse = await response.json();
      console.log("🔍 抖音API原始响应:", JSON.stringify(data, null, 2));

      if (data.code !== 200) {
        throw new Error(
          `抖音API返回错误: ${data.code} - ${JSON.stringify(data)}`,
        );
      }

      if (data.data.status_code !== 0) {
        throw new Error(
          `抖音搜索失败: ${data.data.status_code} - ${JSON.stringify(data.data)}`,
        );
      }

      console.log(
        "🔍 抖音原始搜索结果数量:",
        data.data.data ? data.data.data.length : 0,
      );

      return this.parseSearchResults(data.data.data, keyword);
    } catch (error) {
      console.error("抖音API调用失败:", error);
      throw error;
    }
  }

  /**
   * 解析搜索结果
   */
  private parseSearchResults(
    items: DouyinSearchItem[],
    keyword: string,
  ): KeywordSearchResult[] {
    console.log("🔍 开始解析抖音搜索结果...");
    console.log("🔍 items参数:", items);
    console.log("🔍 items是否为数组:", Array.isArray(items));
    console.log("🔍 items长度:", items ? items.length : "undefined");

    if (!items || !Array.isArray(items)) {
      console.warn("抖音搜索结果为空或格式错误");
      console.warn("items值:", items);
      return [];
    }

    if (items.length === 0) {
      console.warn("抖音搜索结果数组为空");
      return [];
    }

    return items
      .filter((item) => item && item.aweme_info && item.type === 1) // 只处理视频类型
      .map((item, index) => {
        const aweme = item.aweme_info;

        // 解析发布时间
        const publishedAt = new Date(aweme.create_time * 1000);

        // 提取hashtags作为图片列表的替代（抖音主要是视频内容）
        const hashtags: string[] = [];
        if (aweme.text_extra && Array.isArray(aweme.text_extra)) {
          aweme.text_extra.forEach((extra) => {
            if (extra.type === 1 && extra.hashtag_name) {
              hashtags.push(extra.hashtag_name);
            }
          });
        }

        // 获取视频封面
        let coverImage = "";
        if (
          aweme.video?.cover?.url_list &&
          aweme.video.cover.url_list.length > 0
        ) {
          coverImage = aweme.video.cover.url_list[0];
        }

        // 获取作者头像
        let authorAvatar = "";
        if (
          aweme.author?.avatar_thumb?.url_list &&
          aweme.author.avatar_thumb.url_list.length > 0
        ) {
          authorAvatar = aweme.author.avatar_thumb.url_list[0];
        }

        const result: KeywordSearchResult = {
          id: aweme.aweme_id || "",
          title: aweme.desc || "无标题",
          author: aweme.author?.nickname || "未知作者",
          authorId: aweme.author?.uid || "",
          authorAvatar,
          url: `https://www.douyin.com/video/${aweme.aweme_id}`,
          metrics: {
            views: aweme.statistics?.play_count || 0,
            likes: aweme.statistics?.digg_count || 0,
            comments: aweme.statistics?.comment_count || 0,
            shares: aweme.statistics?.share_count || 0,
            collected: aweme.statistics?.collect_count || 0,
          },
          publishedAt,
          coverImage, // 抖音视频封面图片
          images: [], // 抖音是视频内容，没有多张图片，hashtags信息可以通过其他方式展示
        };

        return result;
      });
  }

  /**
   * 分析关键词搜索结果
   */
  async analyzeKeywordResults(
    keyword: string,
    limit: number = 50,
  ): Promise<{
    results: KeywordSearchResult[];
    analysis: {
      totalResults: number;
      avgEngagement: number;
      avgLikes: number;
      avgComments: number;
      avgShares: number;
      avgCollected: number;
      topAuthors: Array<{ name: string; count: number; totalLikes: number }>;
      contentTrends: {
        averageImagesPerPost: number;
        publishTimeTrends: Array<{ date: string; count: number }>;
      };
    };
  }> {
    try {
      const results = await this.searchKeywordVideos(
        keyword,
        Math.min(limit, 20),
        "1",
        "7",
      ); // 抖音API限制单次最多20条
      const limitedResults = results.slice(0, limit);

      if (limitedResults.length === 0) {
        throw new Error("未获取到任何搜索结果");
      }

      // 计算基础统计
      const totalResults = limitedResults.length;
      const totalLikes = limitedResults.reduce(
        (sum, item) => sum + item.metrics.likes,
        0,
      );
      const totalComments = limitedResults.reduce(
        (sum, item) => sum + item.metrics.comments,
        0,
      );
      const totalShares = limitedResults.reduce(
        (sum, item) => sum + item.metrics.shares,
        0,
      );
      const totalCollected = limitedResults.reduce(
        (sum, item) => sum + item.metrics.collected,
        0,
      );
      const totalViews = limitedResults.reduce(
        (sum, item) => sum + item.metrics.views,
        0,
      );
      const totalEngagement =
        totalLikes +
        totalComments +
        totalShares +
        totalCollected +
        totalViews * 0.01; // 播放量按1%计算参与度

      // 分析作者分布
      const authorMap = new Map<
        string,
        { count: number; totalLikes: number }
      >();
      limitedResults.forEach((item) => {
        const authorData = authorMap.get(item.author) || {
          count: 0,
          totalLikes: 0,
        };
        authorData.count += 1;
        authorData.totalLikes += item.metrics.likes;
        authorMap.set(item.author, authorData);
      });

      const topAuthors = Array.from(authorMap.entries())
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.totalLikes - a.totalLikes)
        .slice(0, 10);

      // 分析发布时间趋势
      const publishDates = new Map<string, number>();
      limitedResults.forEach((item) => {
        const dateStr = item.publishedAt.toISOString().split("T")[0];
        publishDates.set(dateStr, (publishDates.get(dateStr) || 0) + 1);
      });

      const publishTimeTrends = Array.from(publishDates.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // 计算平均hashtags数量（对于抖音，这代替了图片数量）
      const totalHashtags = limitedResults.reduce(
        (sum, item) => sum + item.images.length,
        0,
      );
      const averageImagesPerPost =
        totalResults > 0 ? totalHashtags / totalResults : 0;

      console.log(
        `成功分析抖音关键词 "${keyword}" 的 ${limitedResults.length} 条搜索结果`,
      );

      return {
        results: limitedResults,
        analysis: {
          totalResults,
          avgEngagement: totalResults > 0 ? totalEngagement / totalResults : 0,
          avgLikes: totalResults > 0 ? totalLikes / totalResults : 0,
          avgComments: totalResults > 0 ? totalComments / totalResults : 0,
          avgShares: totalResults > 0 ? totalShares / totalResults : 0,
          avgCollected: totalResults > 0 ? totalCollected / totalResults : 0,
          topAuthors,
          contentTrends: {
            averageImagesPerPost,
            publishTimeTrends,
          },
        },
      };
    } catch (error) {
      console.error("抖音关键词结果分析失败:", error);
      throw error;
    }
  }
}
