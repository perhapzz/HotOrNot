import { Platform, ContentType } from "../types";
import { PLATFORM_CONFIG } from "../constants";

// URL工具函数
export class UrlUtils {
  // 从URL提取平台类型
  static extractPlatform(url: string): Platform | null {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      if (hostname.includes("xiaohongshu") || hostname.includes("xhscdn")) {
        return Platform.XIAOHONGSHU;
      }
      if (hostname.includes("bilibili")) {
        return Platform.BILIBILI;
      }
      if (hostname.includes("douyin")) {
        return Platform.DOUYIN;
      }
      if (hostname.includes("weibo")) {
        return Platform.WEIBO;
      }

      return null;
    } catch {
      return null;
    }
  }

  // 验证URL是否有效
  static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // 标准化URL
  static normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      // 移除查询参数中的跟踪参数
      const paramsToRemove = [
        "utm_source",
        "utm_medium",
        "utm_campaign",
        "from",
        "source",
      ];
      paramsToRemove.forEach((param) => urlObj.searchParams.delete(param));
      return urlObj.toString();
    } catch {
      return url;
    }
  }
}

// 时间工具函数
export class TimeUtils {
  // 格式化相对时间
  static formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "刚刚";
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;

    return date.toLocaleDateString("zh-CN");
  }

  // 获取时间段
  static getTimeSlot(hour: number): string {
    if (hour >= 6 && hour < 12) return "上午";
    if (hour >= 12 && hour < 18) return "下午";
    if (hour >= 18 && hour < 22) return "晚上";
    return "深夜";
  }

  // 解析发布时间模式
  static analyzePostingPattern(
    times: Date[],
  ): { hour: number; count: number }[] {
    const hourCounts: Record<number, number> = {};

    times.forEach((time) => {
      const hour = time.getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a, b) => b.count - a.count);
  }
}

// 数字格式化工具
export class NumberUtils {
  // 格式化大数字
  static formatLargeNumber(num: number): string {
    if (num >= 100000000) return `${(num / 100000000).toFixed(1)}亿`;
    if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
    return num.toString();
  }

  // 计算增长率
  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  // 计算参与度
  static calculateEngagementRate(
    likes: number,
    comments: number,
    shares: number,
    views: number,
  ): number {
    if (views === 0) return 0;
    return ((likes + comments + shares) / views) * 100;
  }
}

// 文本处理工具
export class TextUtils {
  // 提取关键词
  static extractKeywords(text: string, maxCount = 10): string[] {
    // 简单的关键词提取（实际项目中可能需要更复杂的NLP处理）
    const words = text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5\w\s]/g, "") // 保留中文、英文、数字
      .split(/\s+/)
      .filter((word) => word.length > 1);

    const wordCount: Record<string, number> = {};
    words.forEach((word) => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    return Object.entries(wordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, maxCount)
      .map(([word]) => word);
  }

  // 截断文本
  static truncateText(text: string, maxLength: number, suffix = "..."): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - suffix.length) + suffix;
  }

  // 清理HTML标签
  static stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, "");
  }
}

// 平台工具函数
export class PlatformUtils {
  // 获取平台配置
  static getPlatformConfig(platform: Platform) {
    return PLATFORM_CONFIG[platform];
  }

  // 获取平台颜色
  static getPlatformColor(platform: Platform): string {
    return PLATFORM_CONFIG[platform].color;
  }

  // 获取平台名称
  static getPlatformName(platform: Platform): string {
    return PLATFORM_CONFIG[platform].name;
  }
}

// 缓存键生成工具
export class CacheUtils {
  // 生成内容分析缓存键
  static getContentCacheKey(url: string): string {
    return `content:${this.hashString(url)}`;
  }

  // 生成账号分析缓存键
  static getAccountCacheKey(accountId: string, platform: Platform): string {
    return `account:${platform}:${accountId}`;
  }

  // 生成关键词分析缓存键
  static getKeywordCacheKey(keyword: string, platforms: Platform[]): string {
    const platformsStr = platforms.sort().join(",");
    return `keyword:${this.hashString(keyword)}:${this.hashString(platformsStr)}`;
  }

  // 简单哈希函数
  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // 转换为32位整数
    }
    return Math.abs(hash).toString(36);
  }
}

// 验证工具
export class ValidationUtils {
  // 验证邮箱
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 验证手机号
  static isValidPhone(phone: string): boolean {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phone);
  }

  // 验证密码强度
  static validatePasswordStrength(password: string): {
    isValid: boolean;
    messages: string[];
  } {
    const messages: string[] = [];

    if (password.length < 8) {
      messages.push("密码长度至少8位");
    }
    if (!/[A-Z]/.test(password)) {
      messages.push("密码需包含大写字母");
    }
    if (!/[a-z]/.test(password)) {
      messages.push("密码需包含小写字母");
    }
    if (!/\d/.test(password)) {
      messages.push("密码需包含数字");
    }

    return {
      isValid: messages.length === 0,
      messages,
    };
  }
}
