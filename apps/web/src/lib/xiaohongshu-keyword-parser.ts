interface XiaohongshuSearchResponse {
  code: number;
  router: string;
  params: {
    keywords: string;
    sort_type: string;
    note_type: string;
  };
  data: {
    has_more: boolean;
    items: XiaohongshuSearchItem[];
  };
}

interface XiaohongshuSearchItem {
  id: string;
  model_type: string;
  note_card: {
    type: string;
    display_title: string;
    user: {
      nick_name: string;
      avatar: string;
      user_id: string;
      nickname: string;
      xsec_token: string;
    };
    interact_info?: {
      liked: boolean;
      liked_count: string;
      collected: boolean;
      collected_count: string;
      comment_count: string;
      shared_count: string;
    };
    cover?: {
      height: number;
      width: number;
      url_default: string;
      url_pre: string;
    };
    image_list?: Array<{
      height: number;
      width: number;
      info_list: Array<{
        image_scene: string;
        url: string;
      }>;
    }>;
    corner_tag_info?: Array<{
      type: string;
      text: string;
    }>;
  };
  xsec_token: string;
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

export class XiaohongshuKeywordParser {
  private apiKey: string;
  private baseUrl = "https://api.tikhub.io/api/v1/xiaohongshu/web_v2";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * 搜索小红书关键词相关笔记
   */
  async searchKeywordNotes(
    keyword: string,
    sortType:
      | "popularity_descending"
      | "time_descending"
      | "time_ascending" = "popularity_descending",
    noteType: "0" | "1" | "2" = "2", // 0:全部 1:视频 2:图文
  ): Promise<KeywordSearchResult[]> {
    const url = `${this.baseUrl}/fetch_search_notes`;
    const params = new URLSearchParams({
      keywords: keyword,
      sort_type: sortType,
      note_type: noteType,
    });

    try {
      const response = await fetch(`${url}?${params}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `小红书API请求失败: ${response.status} ${response.statusText}`,
        );
      }

      const data: XiaohongshuSearchResponse = await response.json();

      if (data.code !== 200) {
        throw new Error(`小红书API返回错误: ${data.code}`);
      }

      return this.parseSearchResults(data.data.items, keyword);
    } catch (error) {
      console.error("小红书API调用失败:", error);
      throw error;
    }
  }

  /**
   * 解析搜索结果
   */
  private parseSearchResults(
    items: XiaohongshuSearchItem[],
    keyword: string,
  ): KeywordSearchResult[] {
    if (!items || !Array.isArray(items)) {
      console.warn("搜索结果为空或格式错误");
      return [];
    }

    return items
      .filter((item) => item && item.note_card)
      .map((item, index) => {
        const noteCard = item.note_card;

        // 安全检查 interact_info，如果不存在则使用默认值
        const interactInfo = noteCard.interact_info || {
          liked: false,
          liked_count: "0",
          collected: false,
          collected_count: "0",
          comment_count: "0",
          shared_count: "0",
        };

        // 解析发布时间（从corner_tag_info中获取）
        let publishedAt = new Date();
        if (
          noteCard.corner_tag_info &&
          Array.isArray(noteCard.corner_tag_info)
        ) {
          const timeTag = noteCard.corner_tag_info.find(
            (tag) => tag && tag.type === "publish_time",
          );
          if (timeTag && timeTag.text) {
            // 处理时间格式，如 "05-09"
            const timeText = timeTag.text;
            const currentYear = new Date().getFullYear();

            // 如果是 MM-DD 格式
            if (timeText.match(/^\d{2}-\d{2}$/)) {
              try {
                const [month, day] = timeText.split("-").map(Number);
                publishedAt = new Date(currentYear, month - 1, day);
              } catch (e) {
                console.warn("日期解析失败:", timeText);
              }
            }
          }
        }

        // 提取图片列表
        const images: string[] = [];

        if (noteCard.image_list && Array.isArray(noteCard.image_list)) {
          noteCard.image_list.forEach((img, imgIndex) => {
            if (img && img.info_list && Array.isArray(img.info_list)) {
              const defaultImg = img.info_list.find(
                (info) => info && info.image_scene === "WB_DFT",
              );
              if (defaultImg && defaultImg.url) {
                images.push(defaultImg.url);
              }
            }
          });
        }

        // 调试：记录第一条笔记的图片数据
        if (index === 0) {
          console.log("🖼️ 第一条笔记原始数据:");
          console.log("  - noteCard.user:", noteCard.user ? "存在" : "不存在");
          console.log("  - noteCard.user.avatar:", noteCard.user?.avatar);
          console.log(
            "  - noteCard.cover:",
            noteCard.cover ? "存在" : "不存在",
          );
          console.log(
            "  - noteCard.cover.url_default:",
            noteCard.cover?.url_default,
          );
          console.log(
            "  - noteCard.image_list:",
            noteCard.image_list
              ? `数组长度${noteCard.image_list.length}`
              : "不存在",
          );
          console.log("  - 提取的images数量:", images.length);
          if (images.length > 0) {
            console.log("  - 第一张图片URL:", images[0]);
          }
        }

        // 安全解析数值
        const safeParseInt = (str: string | number): number => {
          if (typeof str === "number") return str;
          if (typeof str === "string") {
            const num = parseInt(str.replace(/[^\d]/g, ""));
            return isNaN(num) ? 0 : num;
          }
          return 0;
        };

        const result = {
          id: item.id || "",
          title: noteCard.display_title || "无标题",
          author:
            noteCard.user?.nick_name || noteCard.user?.nickname || "未知作者",
          authorId: noteCard.user?.user_id || "",
          authorAvatar: noteCard.user?.avatar || "",
          url: `https://www.xiaohongshu.com/explore/${item.id}`,
          metrics: {
            views: 0, // 小红书不直接提供浏览量
            likes: safeParseInt(interactInfo.liked_count),
            comments: safeParseInt(interactInfo.comment_count),
            shares: safeParseInt(interactInfo.shared_count),
            collected: safeParseInt(interactInfo.collected_count),
          },
          publishedAt,
          coverImage: noteCard.cover?.url_default || "",
          images,
        };

        // 调试：记录返回的完整数据结构
        if (index === 0) {
          console.log("🔍 解析器返回的完整结果:");
          console.log("  - authorAvatar:", result.authorAvatar);
          console.log("  - coverImage:", result.coverImage);
          console.log("  - images:", result.images);
          console.log(
            "  - 结果包含所有字段:",
            JSON.stringify(Object.keys(result)),
          );
        }

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
      const results = await this.searchKeywordNotes(keyword);
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
      const totalEngagement =
        totalLikes + totalComments + totalShares + totalCollected;

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

      // 计算平均图片数量
      const totalImages = limitedResults.reduce(
        (sum, item) => sum + item.images.length,
        0,
      );
      const averageImagesPerPost =
        totalResults > 0 ? totalImages / totalResults : 0;

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
      console.error("关键词结果分析失败:", error);
      throw error;
    }
  }
}
