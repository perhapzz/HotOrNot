import { Platform } from "@hotornot/shared";

// 平台显示名称映射
export const PLATFORM_NAMES: { [key: string]: string } = {
  douyin: "抖音",
  xiaohongshu: "小红书",
  bilibili: "B站",
  weibo: "微博",
  kuaishou: "快手",
  tiktok: "TikTok",
  instagram: "Instagram",
  youtube: "YouTube",
};

// 平台样式映射
export const PLATFORM_STYLES: {
  [key: string]: { name: string; color: string };
} = {
  douyin: { name: "抖音", color: "bg-purple-100 text-purple-800" },
  xiaohongshu: { name: "小红书", color: "bg-red-100 text-red-800" },
  bilibili: { name: "B站", color: "bg-blue-100 text-blue-800" },
  weibo: { name: "微博", color: "bg-orange-100 text-orange-800" },
  kuaishou: { name: "快手", color: "bg-yellow-100 text-yellow-800" },
  tiktok: { name: "TikTok", color: "bg-pink-100 text-pink-800" },
  instagram: {
    name: "Instagram",
    color: "bg-gradient-to-r from-purple-400 to-pink-400 text-white",
  },
  youtube: { name: "YouTube", color: "bg-red-600 text-white" },
};

/**
 * 获取平台的中文显示名称
 */
export function getPlatformDisplayName(platform: string | Platform): string {
  const platformKey =
    typeof platform === "string" ? platform.toLowerCase() : platform;
  return PLATFORM_NAMES[platformKey] || platformKey;
}

/**
 * 获取平台的样式信息
 */
export function getPlatformStyle(platform: string | Platform): {
  name: string;
  color: string;
} {
  const platformKey =
    typeof platform === "string" ? platform.toLowerCase() : platform;
  return (
    PLATFORM_STYLES[platformKey] || {
      name: getPlatformDisplayName(platform),
      color: "bg-gray-100 text-gray-800",
    }
  );
}

/**
 * 获取Platform枚举对应的中文名称
 */
export function getPlatformNameByEnum(platform: Platform): string {
  switch (platform) {
    case Platform.DOUYIN:
      return "抖音";
    case Platform.XIAOHONGSHU:
      return "小红书";
    case Platform.BILIBILI:
      return "B站";
    case Platform.WEIBO:
      return "微博";
    default:
      return platform;
  }
}

/**
 * Detect platform from URL
 */
export function detectPlatformFromUrl(url: string): Platform | null {
  const u = url.toLowerCase();
  if (u.includes("douyin.com") || u.includes("iesdouyin.com")) return Platform.DOUYIN;
  if (u.includes("xiaohongshu.com") || u.includes("xhslink.com")) return Platform.XIAOHONGSHU;
  if (u.includes("bilibili.com") || u.includes("b23.tv")) return Platform.BILIBILI;
  if (u.includes("weibo.com") || u.includes("weibo.cn")) return Platform.WEIBO;
  return null;
}
