// TikHub 抖音数据解析器 v2.0
// 根据完整的 TikHub API 响应结构重新设计

export class TikHubDouyinParser {
  /**
   * 解析 TikHub 抖音用户作品数据
   * @param tikHubResponse TikHub API 完整响应
   * @returns 解析后的标准格式数据
   */
  static parseUserPosts(tikHubResponse: any): any {
    try {
      if (!tikHubResponse || tikHubResponse.code !== 200) {
        throw new Error(`API响应错误: ${tikHubResponse?.code || "未知错误"}`);
      }

      const data = tikHubResponse.data;
      const awemeList = data.aweme_list || [];

      // 解析账号基本信息
      const accountInfo = this.parseAccountInfo(data, awemeList);

      // 解析作品列表
      const posts = awemeList.map((aweme: any) => this.parsePost(aweme));

      // 生成统计数据
      const analytics = this.generateAnalytics(posts);

      return {
        success: true,
        data: {
          account: accountInfo,
          recentPosts: posts,
          analytics: analytics,
          timestamp: new Date().toISOString(),
          cached: false,
          source: "TikHub API v2",
          totalCount: awemeList.length,
          hasMore: data.has_more === 1,
          cursor: {
            minCursor: data.min_cursor,
            maxCursor: data.max_cursor,
            uid: data.uid,
            secUid: data.sec_uid,
          },
          rawApiInfo: {
            router: tikHubResponse.router,
            params: tikHubResponse.params,
            statusCode: data.status_code,
            statusMsg: data.status_msg,
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
   * @param awemeList 作品列表
   * @returns 账号信息
   */
  static parseAccountInfo(data: any, awemeList: any[]): any {
    // 从第一个作品中获取作者信息
    const firstAweme = awemeList[0];
    const author = firstAweme?.author;

    // 从 common_flags 中提取关键信息
    const commonFlags = this.parseCommonFlags(
      firstAweme?.feed_comment_config?.common_flags,
    );

    return {
      // 基本信息
      accountName:
        commonFlags?.authorNickname || author?.nickname || "未知用户",
      accountId: author?.uid || data.uid || "未知",
      secUid: author?.sec_uid || data.sec_uid || "",
      shortId: author?.short_id || "",
      platform: "douyin",
      profileUrl: `https://www.douyin.com/user/${author?.sec_uid || data.sec_uid}`,

      // 用户资料
      signature: author?.signature || "",
      region: author?.region || firstAweme?.region || "CN",
      language: author?.language || "zh-Hans",

      // 认证信息
      verified: author?.is_verified || false,
      verificationType: author?.verification_type || 0,
      verifyInfo: author?.verify_info || "",
      customVerify: author?.custom_verify || "",

      // 头像信息
      avatar: {
        thumb: author?.avatar_thumb?.url_list?.[0] || "",
        medium: author?.avatar_medium?.url_list?.[0] || "",
        large: author?.avatar_larger?.url_list?.[0] || "",
        uri: author?.avatar_uri || "",
      },

      // 统计数据（需要单独的API调用获取详细数据）
      metrics: {
        followersCount: 0, // 需要用户详情API
        followingCount: 0, // 需要用户详情API
        postsCount: 0, // 需要用户详情API
        totalLikes: 0, // 需要用户详情API
        storyCount: author?.story_count || 0,
      },

      // 从 common_flags 解析的额外信息
      commonFlagsInfo: commonFlags,

      // 其他设置信息
      settings: {
        commentSetting: author?.comment_setting || 0,
        downloadSetting: author?.download_setting || -1,
        duetSetting: author?.duet_setting || 0,
        stitchSetting: author?.stitch_setting || 0,
        hideLocation: author?.hide_location || false,
        secret: author?.secret || 0,
      },
    };
  }

  /**
   * 解析单个作品数据
   * @param aweme 作品数据
   * @returns 解析后的作品信息
   */
  static parsePost(aweme: any): any {
    const video = aweme.video || {};
    const statistics = aweme.statistics || {};
    const music = aweme.music || {};

    // 解析 common_flags 中的信息
    const commonFlags = this.parseCommonFlags(
      aweme.feed_comment_config?.common_flags,
    );

    return {
      // 基本信息
      id: aweme.aweme_id,
      groupId: aweme.group_id,
      title: aweme.item_title || aweme.desc || "无标题",
      description: aweme.desc || "",
      caption: aweme.caption || "",
      descLanguage: aweme.desc_language || "zh",

      // URL信息
      url: `https://www.douyin.com/video/${aweme.aweme_id}`,
      shareUrl: aweme.share_url || "",

      // 时间信息
      createTime: aweme.create_time,
      publishTime: aweme.create_time
        ? new Date(aweme.create_time * 1000).toISOString()
        : null,

      // 视频信息
      video: {
        duration: aweme.duration || video.duration || 0,
        width: video.width || 0,
        height: video.height || 0,
        ratio: video.ratio || "",
        format: video.format || "mp4",

        // 封面信息
        cover: video.cover?.url_list?.[0] || "",
        originCover: video.origin_cover?.url_list?.[0] || "",
        dynamicCover: video.dynamic_cover?.url_list?.[0] || "",
        animatedCover: video.animated_cover?.url_list?.[0] || "",

        // 播放地址
        playUrl: video.play_addr?.url_list?.[0] || "",
        playUrlH264: video.play_addr_h264?.url_list?.[0] || "",
        playUrl265: video.play_addr_265?.url_list?.[0] || "",
        downloadUrl: video.download_addr?.url_list?.[0] || "",

        // 视频属性
        hasWatermark: video.has_watermark || false,
        isH265: video.is_h265 || 0,
        isSourceHDR: video.is_source_HDR || 0,
        horizontalType: video.horizontal_type || 0,
        bitRate: video.bit_rate || [],
      },

      // 统计数据 - 详细映射所有字段
      metrics: {
        // 基础互动数据
        views: statistics.play_count || 0,
        likes: statistics.digg_count || 0,
        comments: statistics.comment_count || 0,
        shares: statistics.share_count || 0,
        collects: statistics.collect_count || 0,
        forwards: statistics.forward_count || 0,
        downloads: statistics.download_count || 0,

        // 扩展统计数据
        exposureCount: statistics.exposure_count || 0,
        liveWatchCount: statistics.live_watch_count || 0,
        admiresCount: statistics.admire_count || 0,
        whatsappShareCount: statistics.whatsapp_share_count || 0,
        loseCount: statistics.lose_count || 0,
        loseCommentCount: statistics.lose_comment_count || 0,

        // 其他数据
        digest: statistics.digest || "",
      },

      // 音乐信息
      music: music.id
        ? {
            id: music.id_str || music.mid,
            title: music.title || "",
            author: music.author || music.owner_nickname || "",
            duration: music.duration || 0,
            isOriginal: music.is_original_sound || false,
            isOriginalMusic: music.is_original || false,
            playUrl: music.play_url?.url_list?.[0] || "",
            coverLarge: music.cover_large?.url_list?.[0] || "",
            coverMedium: music.cover_medium?.url_list?.[0] || "",
            coverThumb: music.cover_thumb?.url_list?.[0] || "",
            userCount: music.user_count || 0,
            status: music.music_status || 1,
          }
        : null,

      // 话题标签
      hashtags: (aweme.cha_list || []).map((cha: any) => ({
        id: cha.cid,
        name: cha.cha_name,
        viewCount: cha.view_count || 0,
        userCount: cha.user_count || 0,
        description: cha.desc || "",
        isCommerce: cha.is_commerce || false,
      })),

      // 视频分类标签
      videoTags: (aweme.video_tag || []).map((tag: any) => ({
        id: tag.tag_id,
        name: tag.tag_name,
        level: tag.level,
      })),

      // 文本额外信息
      textExtra: aweme.text_extra || [],

      // 作者信息
      author: {
        uid: aweme.author?.uid || "",
        nickname: aweme.author?.nickname || "",
        uniqueId: aweme.author?.unique_id || "",
        signature: aweme.author?.signature || "",
        avatar: aweme.author?.avatar_thumb?.url_list?.[0] || "",
        verified: aweme.author?.is_verified || false,
        followStatus: aweme.author?.follow_status || 0,
      },

      // 地理和位置信息
      location: {
        region: aweme.region || "",
        ipAttribution: aweme.ip_attribution || "",
        city: aweme.city || "",
        distance: aweme.distance || "",
        position: aweme.position,
      },

      // 内容控制和状态
      controls: {
        allowComment: aweme.aweme_control?.can_comment || true,
        allowShare: aweme.aweme_control?.can_share || true,
        allowForward: aweme.aweme_control?.can_forward || true,
        allowDownload: aweme.video_control?.allow_download || false,
        allowDuet: aweme.video_control?.allow_duet || true,
        allowStitch: aweme.video_control?.allow_stitch || true,
        preventDownload: aweme.prevent_download || false,
      },

      // 内容类型和分类
      contentInfo: {
        awemeType: aweme.aweme_type || 0,
        mediaType: aweme.media_type || 4, // 4通常表示视频
        isAds: aweme.is_ads || false,
        isHashTag: aweme.is_hash_tag || 0,
        originalType: aweme.original || 0,
        shootWay: aweme.shoot_way || "",
        horizontalType: aweme.horizontal_type || 1,
      },

      // 风险和警告信息
      riskInfos: aweme.risk_infos
        ? {
            hasWarning: aweme.risk_infos.warn || false,
            content: aweme.risk_infos.content || "",
            type: aweme.risk_infos.type || 0,
            warnLevel: aweme.risk_infos.warn_level || 0,
            riskSink: aweme.risk_infos.risk_sink || false,
            vote: aweme.risk_infos.vote || false,
          }
        : null,

      // 从 common_flags 解析的信息
      commonFlags: commonFlags,

      // 其他扩展信息
      extra: {
        boostStatus: aweme.boost_status || 0,
        rate: aweme.rate || 0,
        collectStat: aweme.collect_stat || 0,
        userDigged: aweme.user_digged || 0,
        itemReact: aweme.item_react || 0,
        distributionType: aweme.distribute_type || 0,
        canCacheToLocal: aweme.can_cache_to_local || false,
        authenticationToken: aweme.authentication_token || "",
      },
    };
  }

  /**
   * 解析 common_flags 字段中的JSON数据
   * @param commonFlagsStr common_flags 字符串
   * @returns 解析后的标志信息
   */
  static parseCommonFlags(commonFlagsStr: string): any {
    if (!commonFlagsStr) return null;

    try {
      const flags = JSON.parse(commonFlagsStr);
      const result = {
        // 作者信息
        authorNickname: flags.item_author_nickname || "",

        // 视频标签
        videoLabels: {
          tag1: flags.video_labels_v2_tag1 || "",
          tag2: flags.video_labels_v2_tag2 || "",
          tag3: flags.video_labels_v2_tag3 || "",
        },

        // 话题标签
        hashtags: [] as any[],

        // 原始数据
        rawFlags: flags,
      };

      // 解析嵌套的 hashtag JSON 字符串
      if (flags.hashtag) {
        try {
          const hashtagData = JSON.parse(flags.hashtag);
          if (Array.isArray(hashtagData)) {
            result.hashtags = hashtagData.map((tag: any) => ({
              name: tag.name,
              id: tag.id,
            }));
          }
        } catch (e) {
          console.warn("解析hashtag字段失败:", e);
        }
      }

      return result;
    } catch (error) {
      console.warn("解析common_flags失败:", error);
      return null;
    }
  }

  /**
   * 生成数据统计分析
   * @param posts 作品列表
   * @returns 统计分析数据
   */
  static generateAnalytics(posts: any[]): any {
    if (!posts || posts.length === 0) {
      return {
        totalPosts: 0,
        avgMetrics: {},
        totalMetrics: {},
        topPerformingPost: null,
        contentAnalysis: {},
      };
    }

    // 计算总数和平均数
    const totalViews = posts.reduce(
      (sum, post) => sum + (post.metrics.views || 0),
      0,
    );
    const totalLikes = posts.reduce(
      (sum, post) => sum + (post.metrics.likes || 0),
      0,
    );
    const totalComments = posts.reduce(
      (sum, post) => sum + (post.metrics.comments || 0),
      0,
    );
    const totalShares = posts.reduce(
      (sum, post) => sum + (post.metrics.shares || 0),
      0,
    );
    const totalCollects = posts.reduce(
      (sum, post) => sum + (post.metrics.collects || 0),
      0,
    );
    const totalDownloads = posts.reduce(
      (sum, post) => sum + (post.metrics.downloads || 0),
      0,
    );

    // 找出表现最好的作品
    const topPost = posts.reduce((max, post) =>
      (post.metrics.likes || 0) > (max.metrics.likes || 0) ? post : max,
    );

    // 内容分析
    const hashtagMap: { [key: string]: number } = {};
    const videoTagMap: { [key: string]: number } = {};
    const totalDuration = posts.reduce(
      (sum, post) => sum + (post.video.duration || 0),
      0,
    );

    posts.forEach((post) => {
      // 统计话题标签
      post.hashtags?.forEach((tag: any) => {
        hashtagMap[tag.name] = (hashtagMap[tag.name] || 0) + 1;
      });

      // 统计视频标签
      post.videoTags?.forEach((tag: any) => {
        videoTagMap[tag.name] = (videoTagMap[tag.name] || 0) + 1;
      });
    });

    const engagementRate =
      totalViews > 0
        ? ((totalLikes + totalComments + totalShares) / totalViews) * 100
        : 0;

    return {
      totalPosts: posts.length,

      // 平均指标
      avgMetrics: {
        views: Math.round(totalViews / posts.length),
        likes: Math.round(totalLikes / posts.length),
        comments: Math.round(totalComments / posts.length),
        shares: Math.round(totalShares / posts.length),
        collects: Math.round(totalCollects / posts.length),
        downloads: Math.round(totalDownloads / posts.length),
        engagementRate: engagementRate.toFixed(2),
      },

      // 总计指标
      totalMetrics: {
        views: totalViews,
        likes: totalLikes,
        comments: totalComments,
        shares: totalShares,
        collects: totalCollects,
        downloads: totalDownloads,
      },

      // 表现最佳作品
      topPerformingPost: {
        id: topPost.id,
        title: topPost.title,
        likes: topPost.metrics.likes,
        views: topPost.metrics.views,
        engagementScore:
          topPost.metrics.likes +
          topPost.metrics.comments +
          topPost.metrics.shares,
        url: topPost.url,
      },

      // 内容分析
      contentAnalysis: {
        // 热门话题标签
        topHashtags: Object.entries(hashtagMap)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count })),

        // 热门视频标签
        topVideoTags: Object.entries(videoTagMap)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 10)
          .map(([name, count]) => ({ name, count })),

        // 视频时长分析
        avgDuration:
          totalDuration > 0
            ? Math.round(totalDuration / posts.length / 1000)
            : 0, // 转换为秒
        totalDuration: Math.round(totalDuration / 1000), // 转换为秒

        // 发布时间分析
        publishPattern: this.analyzePublishPattern(posts),
      },
    };
  }

  /**
   * 分析发布时间规律
   * @param posts 作品列表
   * @returns 发布规律分析
   */
  static analyzePublishPattern(posts: any[]): any {
    const hourCounts = new Array(24).fill(0);
    const dayOfWeekCounts = new Array(7).fill(0);

    posts.forEach((post) => {
      if (post.publishTime) {
        const date = new Date(post.publishTime);
        hourCounts[date.getHours()]++;
        dayOfWeekCounts[date.getDay()]++;
      }
    });

    const bestHour = hourCounts.indexOf(Math.max(...hourCounts));
    const bestDayOfWeek = dayOfWeekCounts.indexOf(Math.max(...dayOfWeekCounts));

    const dayNames = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

    return {
      bestPostingHour: bestHour,
      bestPostingDay: dayNames[bestDayOfWeek],
      hourlyDistribution: hourCounts,
      weeklyDistribution: dayOfWeekCounts,
      mostActiveHour: bestHour,
      mostActiveDay: bestDayOfWeek,
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

    return {
      ...parsedData,
      data: {
        ...parsedData.data,
        analysis: {
          contentStyle: this.inferContentStyle(
            parsedData.data.recentPosts,
            analytics,
          ),
          contentPreferences: analytics.contentAnalysis.topHashtags
            .slice(0, 5)
            .map((h: any) => h.name),
          audienceInsights: this.generateAudienceInsights(analytics),
          topicSuggestions: this.generateTopicSuggestions(analytics),
          postingPattern: `最佳发布时间: ${analytics.contentAnalysis.publishPattern.bestPostingHour}:00, ${analytics.contentAnalysis.publishPattern.bestPostingDay}`,
          performanceInsights: this.generatePerformanceInsights(analytics),
        },
      },
    };
  }

  /**
   * 推断内容风格
   * @param posts 作品列表
   * @param analytics 分析数据
   * @returns 内容风格描述
   */
  static inferContentStyle(posts: any[], analytics: any): string {
    if (!posts || posts.length === 0) return "未知风格";

    const avgDuration = analytics.contentAnalysis.avgDuration;
    const avgEngagement = parseFloat(analytics.avgMetrics.engagementRate);
    const topTags = analytics.contentAnalysis.topVideoTags;

    let style = "";

    // 基于时长判断
    if (avgDuration < 10) {
      style += "超短快节奏";
    } else if (avgDuration < 30) {
      style += "短视频";
    } else if (avgDuration < 60) {
      style += "中等时长";
    } else {
      style += "长视频深度";
    }

    // 基于互动率判断
    if (avgEngagement > 8) {
      style += " + 高互动爆款";
    } else if (avgEngagement > 3) {
      style += " + 中等互动";
    } else {
      style += " + 观看型";
    }

    // 基于内容标签判断
    if (topTags.length > 0) {
      style += ` + ${topTags[0].name}内容`;
    }

    return style;
  }

  /**
   * 生成受众画像分析
   * @param analytics 分析数据
   * @returns 受众画像描述
   */
  static generateAudienceInsights(analytics: any): string {
    const engagementRate = parseFloat(analytics.avgMetrics.engagementRate);
    const avgComments = analytics.avgMetrics.comments;
    const avgLikes = analytics.avgMetrics.likes;
    const commentToLikeRatio = avgLikes > 0 ? avgComments / avgLikes : 0;

    let insights = "";

    if (engagementRate > 8) {
      insights += "高粘性活跃用户群体，";
    } else if (engagementRate > 3) {
      insights += "中等活跃度用户群体，";
    } else {
      insights += "以浏览为主的用户群体，";
    }

    if (commentToLikeRatio > 0.15) {
      insights += "喜欢深度互动和讨论";
    } else if (commentToLikeRatio > 0.05) {
      insights += "适度参与评论互动";
    } else {
      insights += "以点赞表达喜好为主";
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

    // 基于热门话题标签
    analytics.contentAnalysis.topHashtags
      .slice(0, 3)
      .forEach((hashtag: any) => {
        suggestions.push(`${hashtag.name}相关延伸内容`);
      });

    // 基于视频标签
    analytics.contentAnalysis.topVideoTags.slice(0, 2).forEach((tag: any) => {
      suggestions.push(`${tag.name}主题深度挖掘`);
    });

    return suggestions.slice(0, 5);
  }

  /**
   * 生成性能洞察
   * @param analytics 分析数据
   * @returns 性能洞察数据
   */
  static generatePerformanceInsights(analytics: any): any {
    const bestPost = analytics.topPerformingPost;
    const avgMetrics = analytics.avgMetrics;

    return {
      bestPostPerformance: `表现最佳作品获得${bestPost.likes}个赞，超出平均水平${Math.round(((bestPost.likes - avgMetrics.likes) / avgMetrics.likes) * 100)}%`,
      engagementLevel:
        parseFloat(analytics.avgMetrics.engagementRate) > 5
          ? "高"
          : parseFloat(analytics.avgMetrics.engagementRate) > 2
            ? "中"
            : "低",
      contentConsistency:
        analytics.contentAnalysis.topHashtags.length > 2
          ? "内容主题集中"
          : "内容类型多样化",
      optimalPostingTime: `${analytics.contentAnalysis.publishPattern.bestPostingHour}:00-${(analytics.contentAnalysis.publishPattern.bestPostingHour + 1) % 24}:00`,
    };
  }
}
