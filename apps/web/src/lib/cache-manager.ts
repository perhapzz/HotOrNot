/**
 * 缓存管理工具
 * 用于统一管理各种分析功能的缓存有效期
 */

export interface CacheConfig {
  keywordAnalysis: number; // 关键词分析缓存有效期（小时）
  contentAnalysis: number; // 内容分析缓存有效期（小时）
  accountAnalysis: number; // 账号分析缓存有效期（小时）
  hotlistData: number; // 热点数据缓存有效期（小时）
}

/**
 * 获取缓存配置
 */
export function getCacheConfig(): CacheConfig {
  return {
    keywordAnalysis: parseInt(process.env.KEYWORD_ANALYSIS_CACHE_HOURS || "24"),
    contentAnalysis: parseInt(process.env.CONTENT_ANALYSIS_CACHE_HOURS || "6"),
    accountAnalysis: parseInt(process.env.ACCOUNT_ANALYSIS_CACHE_HOURS || "12"),
    hotlistData: parseInt(process.env.HOTLIST_DATA_CACHE_HOURS || "3"), // 热点数据3小时缓存
  };
}

/**
 * 检查缓存是否过期
 * @param updatedAt 缓存更新时间
 * @param cacheHours 缓存有效期（小时）
 * @returns 是否过期
 */
export function isCacheExpired(updatedAt: Date, cacheHours: number): boolean {
  const now = new Date();
  const cacheExpiration = new Date(
    updatedAt.getTime() + cacheHours * 60 * 60 * 1000,
  );
  return now > cacheExpiration;
}

/**
 * 获取缓存年龄描述
 * @param updatedAt 缓存更新时间
 * @returns 缓存年龄描述，如 "2小时前"
 */
export function getCacheAge(updatedAt: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - updatedAt.getTime();

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 0) {
    return `${diffDays}天前`;
  } else if (diffHours > 0) {
    return `${diffHours}小时前`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes}分钟前`;
  } else {
    return "刚刚";
  }
}

/**
 * 获取缓存过期时间
 * @param cacheHours 缓存有效期（小时）
 * @returns 缓存过期时间
 */
export function getCacheExpiration(cacheHours: number): Date {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() - cacheHours);
  return expiration;
}

/**
 * 缓存状态接口
 */
export interface CacheStatus {
  isValid: boolean; // 是否有效
  age: string; // 缓存年龄描述
  expiresIn: string; // 还有多久过期
}

/**
 * 获取缓存状态
 * @param updatedAt 缓存更新时间
 * @param cacheHours 缓存有效期（小时）
 * @returns 缓存状态信息
 */
export function getCacheStatus(
  updatedAt: Date,
  cacheHours: number,
): CacheStatus {
  const isExpired = isCacheExpired(updatedAt, cacheHours);
  const age = getCacheAge(updatedAt);

  // 计算还有多久过期
  const expirationTime = new Date(
    updatedAt.getTime() + cacheHours * 60 * 60 * 1000,
  );
  const now = new Date();
  const timeToExpiration = Math.max(
    0,
    expirationTime.getTime() - now.getTime(),
  );

  const hoursToExpiration = Math.floor(timeToExpiration / (1000 * 60 * 60));
  const minutesToExpiration = Math.floor(
    (timeToExpiration % (1000 * 60 * 60)) / (1000 * 60),
  );

  let expiresIn: string;
  if (isExpired) {
    expiresIn = "已过期";
  } else if (hoursToExpiration > 0) {
    expiresIn = `${hoursToExpiration}小时${minutesToExpiration}分钟后过期`;
  } else {
    expiresIn = `${minutesToExpiration}分钟后过期`;
  }

  return {
    isValid: !isExpired,
    age,
    expiresIn,
  };
}
