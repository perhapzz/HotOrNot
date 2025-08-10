// TikHub 小红书数据解析器
// 专门处理 TikHub 小红书API响应数据的解析

export class TikHubXiaohongshuParser {
  /**
   * 解析 TikHub 小红书主页笔记数据 (web_v2/fetch_home_notes)
   * @param tikHubResponse TikHub API 完整响应
   * @returns 解析后的标准格式数据
   */
  static parseHomeNotes(tikHubResponse: any): any {
    try {
      if (!tikHubResponse || tikHubResponse.code !== 200) {
        throw new Error(
          `API响应错误: ${tikHubResponse?.code || "未知错误"}, 消息: ${tikHubResponse?.message || "无详细信息"}`,
        );
      }

      const data = tikHubResponse.data;

      // 检查数据结构
      if (!data) {
        throw new Error("API响应中缺少data字段");
      }

      console.log("📊 API响应数据结构:", {
        hasUserInfo: !!data.user_info,
        hasNotes: !!data.notes,
        notesCount: data.notes ? data.notes.length : 0,
        hasMore: data.has_more,
      });

      const notesList = data.notes || [];
      const userInfo = data.user_info || {};

      // 如果没有用户信息，从第一个笔记中提取
      const effectiveUserInfo = userInfo.user_id
        ? userInfo
        : notesList[0]?.user || {};

      // 解析账号基本信息
      const accountInfo = this.parseHomeAccountInfo(
        effectiveUserInfo,
        notesList,
      );

      // 解析笔记列表
      const notes = notesList.map((note: any) => this.parseHomeNote(note));

      // 生成统计数据
      const analytics = this.generateAnalytics(notes);

      return {
        success: true,
        data: {
          account: accountInfo,
          recentPosts: notes,
          analytics: analytics,
          timestamp: new Date().toISOString(),
          cached: false,
          source: "TikHub API 小红书 (home_notes)",
          totalCount: notesList.length,
          hasMore: data.has_more === true,
          cursor: data.cursor || "",
          rawApiInfo: {
            router: tikHubResponse.router,
            params: tikHubResponse.params,
            statusCode: tikHubResponse.code,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `数据解析失败: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * 解析主页API的账号基本信息
   * @param userInfo 用户信息对象
   * @param notesList 笔记列表
   * @returns 账号信息
   */
  static parseHomeAccountInfo(userInfo: any, notesList: any[]): any {
    return {
      // 基本信息
      accountName: userInfo.nickname || userInfo.nick_name || "未知用户",
      accountId: userInfo.user_id || "未知",
      platform: "xiaohongshu",
      profileUrl: `https://www.xiaohongshu.com/user/profile/${userInfo.user_id}`,

      // 用户资料
      signature: userInfo.desc || userInfo.signature || "",
      region: "CN",
      language: "zh-Hans",

      // 认证信息
      verified:
        userInfo.official_verified === true || userInfo.verified === true,

      // 头像信息 (数据库需要字符串格式)
      avatar: userInfo.avatar || userInfo.image || "",

      // 统计数据
      metrics: {
        followersCount: userInfo.fans_count || userInfo.followers_count || 0,
        followingCount: userInfo.follows_count || userInfo.following_count || 0,
        postsCount: userInfo.notes_count || notesList.length || 0,
        totalLikes: notesList.reduce(
          (sum, note) =>
            sum + this.parseLikeCount(note.interact_info?.liked_count || "0"),
          0,
        ),
      },
    };
  }

  /**
   * 解析主页API的单个笔记数据
   * @param note 笔记数据
   * @returns 解析后的笔记信息
   */
  static parseHomeNote(note: any): any {
    const interactInfo = note.interact_info || {};
    const imageList = note.image_list || [];
    const user = note.user || {};

    return {
      // 基本信息
      postId: note.note_id || note.id, // 数据库必需字段
      id: note.note_id || note.id,
      title: note.title || note.display_title || "无标题",
      description: note.desc || note.title || note.display_title || "",
      url: `https://www.xiaohongshu.com/explore/${note.note_id || note.id}`,
      shareUrl: `https://www.xiaohongshu.com/discovery/item/${note.note_id || note.id}`,

      // 时间信息
      createTime: note.time ? new Date(note.time * 1000).toISOString() : null,
      publishTime: note.time ? new Date(note.time * 1000).toISOString() : null,

      // 内容信息
      contentType: note.type || "normal", // normal, video等
      cover: {
        url: imageList[0]?.url || note.cover?.url || "",
        width: imageList[0]?.width || note.cover?.width || 0,
        height: imageList[0]?.height || note.cover?.height || 0,
        fileId: imageList[0]?.file_id || note.cover?.file_id || "",
        traceId: imageList[0]?.trace_id || note.cover?.trace_id || "",
      },

      // 统计数据
      metrics: {
        views: 0, // 小红书API通常不提供浏览量
        likes: this.parseLikeCount(interactInfo.liked_count || "0"),
        comments: this.parseLikeCount(interactInfo.comment_count || "0"),
        shares: this.parseLikeCount(interactInfo.share_count || "0"),
        collects: this.parseLikeCount(interactInfo.collected_count || "0"),
        isLiked: interactInfo.liked || false,
        isSticky: interactInfo.sticky || false,
      },

      // 作者信息
      author: {
        uid: user.user_id || "",
        nickname: user.nickname || user.nick_name || "",
        avatar: user.avatar || user.image || "",
      },

      // 标签信息
      hashtags: (note.tag_list || []).map((tag: any) => ({
        name: tag.name || tag.title || "",
        id: tag.id || "",
        type: tag.type || "normal",
      })),

      // 地理信息
      location: {
        region: note.ip_location || "",
        city: "",
      },
    };
  }
  /**
   * 解析 TikHub 小红书用户笔记数据
   * @param tikHubResponse TikHub API 完整响应
   * @returns 解析后的标准格式数据
   */
  static parseUserNotes(tikHubResponse: any): any {
    try {
      if (!tikHubResponse || tikHubResponse.code !== 200) {
        throw new Error(`API响应错误: ${tikHubResponse?.code || "未知错误"}`);
      }

      const data = tikHubResponse.data;
      const notesList = data.notes || [];

      // 解析账号基本信息（从第一个笔记中获取）
      const accountInfo = this.parseAccountInfo(data, notesList);

      // 解析笔记列表
      const notes = notesList.map((note: any) => this.parseNote(note));

      // 生成统计数据
      const analytics = this.generateAnalytics(notes);

      return {
        success: true,
        data: {
          account: accountInfo,
          recentPosts: notes,
          analytics: analytics,
          timestamp: new Date().toISOString(),
          cached: false,
          source: "TikHub API 小红书",
          totalCount: notesList.length,
          hasMore: data.has_more === true,
          cursor: data.cursor || "",
          rawApiInfo: {
            router: tikHubResponse.router,
            params: tikHubResponse.params,
            statusCode: tikHubResponse.code,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        error: `数据解析失败: ${error.message}`,
        data: null,
      };
    }
  }

  /**
   * 解析账号基本信息
   * @param data API 数据根对象
   * @param notesList 笔记列表
   * @returns 账号信息
   */
  static parseAccountInfo(data: any, notesList: any[]): any {
    // 从第一个笔记中获取用户信息
    const firstNote = notesList[0];
    const user = firstNote?.user;

    return {
      // 基本信息
      accountName: user?.nickname || user?.nick_name || "未知用户",
      accountId: user?.user_id || "未知",
      platform: "xiaohongshu",
      profileUrl: `https://www.xiaohongshu.com/user/profile/${user?.user_id}`,

      // 用户资料
      signature: "", // 小红书API中没有提供签名信息
      region: "CN",
      language: "zh-Hans",

      // 认证信息
      verified: false, // 需要其他API获取认证信息

      // 头像信息 (数据库需要字符串格式)
      avatar: user?.avatar || "",

      // 统计数据（需要用户详情API获取）
      metrics: {
        followersCount: 0, // 需要用户详情API
        followingCount: 0, // 需要用户详情API
        postsCount: notesList.length,
        totalLikes: notesList.reduce(
          (sum, note) =>
            sum + this.parseLikeCount(note.interact_info?.liked_count || "0"),
          0,
        ),
      },
    };
  }

  /**
   * 解析单个笔记数据
   * @param note 笔记数据
   * @returns 解析后的笔记信息
   */
  static parseNote(note: any): any {
    const interactInfo = note.interact_info || {};
    const cover = note.cover || {};
    const user = note.user || {};

    return {
      // 基本信息
      postId: note.note_id, // 数据库必需字段
      id: note.note_id,
      title: note.display_title || "无标题",
      description: note.display_title || "",
      url: `https://www.xiaohongshu.com/explore/${note.note_id}`,
      shareUrl: `https://www.xiaohongshu.com/discovery/item/${note.note_id}`,

      // 时间信息（小红书API没有提供时间戳）
      createTime: null,
      publishTime: null,

      // 内容信息
      contentType: note.type || "unknown", // video, image等
      cover: {
        url: cover.url || "",
        width: cover.width || 0,
        height: cover.height || 0,
        fileId: cover.file_id || "",
        traceId: cover.trace_id || "",
      },

      // 统计数据
      metrics: {
        views: 0, // 小红书API没有提供浏览量
        likes: this.parseLikeCount(interactInfo.liked_count || "0"),
        comments: 0, // 需要详细笔记API获取
        shares: 0, // 小红书API没有提供分享数
        collects: 0, // 需要详细笔记API获取
        isLiked: interactInfo.liked || false,
        isSticky: interactInfo.sticky || false,
      },

      // 作者信息
      author: {
        uid: user.user_id || "",
        nickname: user.nickname || user.nick_name || "",
        avatar: user.avatar || "",
      },

      // 标签信息（需要详细笔记API获取）
      hashtags: [],

      // 地理信息
      location: {
        region: "",
        city: "",
      },
    };
  }

  /**
   * 解析点赞数（处理k、万等单位）
   * @param likeCountStr 点赞数字符串
   * @returns 数字格式的点赞数
   */
  static parseLikeCount(likeCountStr: string): number {
    if (!likeCountStr || likeCountStr === "0") return 0;

    const numStr = likeCountStr.toLowerCase();
    if (numStr.includes("k")) {
      return Math.round(parseFloat(numStr.replace("k", "")) * 1000);
    }
    if (numStr.includes("万")) {
      return Math.round(parseFloat(numStr.replace("万", "")) * 10000);
    }
    return parseInt(numStr) || 0;
  }

  /**
   * 生成数据统计分析
   * @param notes 笔记列表
   * @returns 统计分析数据
   */
  static generateAnalytics(notes: any[]): any {
    if (!notes || notes.length === 0) {
      return {
        totalPosts: 0,
        avgMetrics: {},
        totalMetrics: {},
        topPerformingPost: null,
        contentAnalysis: {},
      };
    }

    // 计算总数和平均数
    const totalLikes = notes.reduce(
      (sum, note) => sum + (note.metrics.likes || 0),
      0,
    );

    // 找出表现最好的笔记
    const topNote = notes.reduce((max, note) =>
      (note.metrics.likes || 0) > (max.metrics.likes || 0) ? note : max,
    );

    // 内容分析
    const contentTypeMap: { [key: string]: number } = {};
    notes.forEach((note) => {
      const type = note.contentType || "unknown";
      contentTypeMap[type] = (contentTypeMap[type] || 0) + 1;
    });

    // 小红书API无法获取观看量数据，所以不计算互动率
    const avgLikes = notes.length > 0 ? totalLikes / notes.length : 0;

    return {
      totalPosts: notes.length,

      // 平均指标（小红书只提供点赞数据）
      avgMetrics: {
        likes: Math.round(avgLikes),
        views: 0, // 小红书API不提供观看量
        engagementRate: "0", // 无法计算真实互动率
      },

      // 总计指标
      totalMetrics: {
        likes: totalLikes,
      },

      // 表现最佳笔记
      topPerformingPost: {
        id: topNote.id,
        title: topNote.title,
        likes: topNote.metrics.likes,
        engagementScore: topNote.metrics.likes,
        url: topNote.url,
      },

      // 内容分析
      contentAnalysis: {
        // 内容类型分布
        contentTypes: Object.entries(contentTypeMap)
          .sort(([, a], [, b]) => b - a)
          .map(([type, count]) => ({ type, count })),

        // 平均互动
        avgLikes: Math.round(totalLikes / notes.length),

        // 发布规律分析（小红书API没有时间信息，使用占位符）
        publishPattern: {
          bestPostingHour: 20, // 默认晚上8点
          bestPostingDay: "周末",
          hourlyDistribution: [],
          weeklyDistribution: [],
        },
      },
    };
  }

  /**
   * 生成AI风格的分析结果
   * @param parsedData 解析后的数据
   * @returns 包含AI分析的格式化数据
   */
  static formatForDisplay(parsedData: any): any {
    if (!parsedData.success) {
      return parsedData;
    }

    const analytics = parsedData.data.analytics;
    const notes = parsedData.data.recentPosts;

    return {
      ...parsedData,
      data: {
        ...parsedData.data,
        analysis: {
          contentStyle: this.inferContentStyle(notes, analytics),
          contentPreferences: this.getContentPreferences(analytics),
          audienceInsights: this.generateAudienceInsights(analytics),
          topicSuggestions: this.generateTopicSuggestions(analytics),
          postingPattern: `建议发布时间: ${analytics.contentAnalysis.publishPattern.bestPostingHour}:00, ${analytics.contentAnalysis.publishPattern.bestPostingDay}`,
          performanceInsights: this.generatePerformanceInsights(analytics),
        },
      },
    };
  }

  /**
   * 推断内容风格
   * @param notes 笔记列表
   * @param analytics 分析数据
   * @returns 内容风格描述
   */
  static inferContentStyle(notes: any[], analytics: any): string {
    if (!notes || notes.length === 0) return "未知风格";

    const contentTypes = analytics.contentAnalysis.contentTypes;
    const avgLikes = analytics.avgMetrics.likes;

    let style = "";

    // 基于内容类型判断
    if (contentTypes.length > 0) {
      const mainType = contentTypes[0].type;
      if (mainType === "video") {
        style += "视频创作";
      } else if (mainType === "image") {
        style += "图文分享";
      } else {
        style += "多元内容";
      }
    }

    // 基于互动表现判断
    if (avgLikes > 1000) {
      style += " + 高互动爆款";
    } else if (avgLikes > 100) {
      style += " + 中等互动";
    } else {
      style += " + 精品内容";
    }

    return style;
  }

  /**
   * 获取内容偏好
   * @param analytics 分析数据
   * @returns 内容偏好列表
   */
  static getContentPreferences(analytics: any): string[] {
    const preferences: string[] = [];
    const contentTypes = analytics.contentAnalysis.contentTypes;

    contentTypes.forEach((type: any) => {
      if (type.type === "video") {
        preferences.push("视频内容");
      } else if (type.type === "image") {
        preferences.push("图文内容");
      }
    });

    return preferences.slice(0, 5);
  }

  /**
   * 生成受众画像分析
   * @param analytics 分析数据
   * @returns 受众画像描述
   */
  static generateAudienceInsights(analytics: any): string {
    const avgLikes = analytics.avgMetrics.likes;

    let insights = "";

    if (avgLikes > 1000) {
      insights += "拥有高活跃度粉丝群体，内容传播力强";
    } else if (avgLikes > 100) {
      insights += "中等活跃度粉丝群体，内容质量受认可";
    } else {
      insights += "精准小众粉丝群体，专业内容导向";
    }

    return insights;
  }

  /**
   * 生成话题建议
   * @param analytics 分析数据
   * @returns 话题建议列表
   */
  static generateTopicSuggestions(analytics: any): string[] {
    const suggestions: string[] = [];
    const contentTypes = analytics.contentAnalysis.contentTypes;

    // 基于内容类型生成建议
    contentTypes.forEach((type: any) => {
      if (type.type === "video") {
        suggestions.push("生活vlog", "美食分享", "穿搭搭配");
      } else if (type.type === "image") {
        suggestions.push("美妆教程", "旅行攻略", "家居装饰");
      }
    });

    // 通用建议
    suggestions.push("热门话题", "节日活动");

    return [...new Set(suggestions)].slice(0, 5);
  }

  /**
   * 生成性能洞察
   * @param analytics 分析数据
   * @returns 性能洞察数据
   */
  static generatePerformanceInsights(analytics: any): any {
    const bestPost = analytics.topPerformingPost;
    const avgLikes = analytics.avgMetrics.likes;

    return {
      bestPostPerformance: `表现最佳笔记获得${bestPost.likes}个赞，超出平均水平${avgLikes > 0 ? Math.round(((bestPost.likes - avgLikes) / avgLikes) * 100) : 0}%`,
      engagementLevel: avgLikes > 1000 ? "高" : avgLikes > 100 ? "中" : "精准",
      contentConsistency:
        analytics.contentAnalysis.contentTypes.length === 1
          ? "内容类型专一"
          : "内容形式多样化",
      optimalPostingTime: "18:00-22:00 (小红书用户活跃时段)",
    };
  }
}
