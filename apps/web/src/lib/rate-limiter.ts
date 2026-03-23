/**
 * API 限流器
 *
 * 基于内存 Map 的滑动窗口限流，支持不同路由配置。
 * 自动清理过期记录，避免内存泄漏。
 */

export interface RateLimitConfig {
  /** 时间窗口（毫秒） */
  windowMs: number;
  /** 窗口内最大请求数 */
  max: number;
}

interface RateLimitEntry {
  /** 请求时间戳列表 */
  timestamps: number[];
  /** 最后访问时间（用于清理） */
  lastAccess: number;
}

/** 路由限流配置，可通过环境变量覆盖 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  '/api/analysis': {
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_ANALYSIS_MAX || '20', 10),
  },
  '/api/auth': {
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10', 10),
  },
  '/api/hotlist': {
    windowMs: 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_HOTLIST_MAX || '30', 10),
  },
  '/api/admin': {
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_ADMIN_MAX || '5', 10),
  },
  '/api': {
    windowMs: 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_DEFAULT_MAX || '60', 10),
  },
};

// 存储：key = `${ip}:${routePrefix}`
const store = new Map<string, RateLimitEntry>();

// 每 5 分钟清理过期记录
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store) {
      // 超过最大窗口时间 2 倍未访问则清理
      if (now - entry.lastAccess > 30 * 60 * 1000) {
        store.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  // 不阻止进程退出
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * 匹配路由对应的限流配置
 */
export function getConfigForPath(pathname: string): RateLimitConfig {
  // 按路径长度降序匹配，优先匹配更具体的规则
  const prefixes = Object.keys(RATE_LIMIT_CONFIGS).sort(
    (a, b) => b.length - a.length
  );
  for (const prefix of prefixes) {
    if (pathname.startsWith(prefix)) {
      return RATE_LIMIT_CONFIGS[prefix];
    }
  }
  return RATE_LIMIT_CONFIGS['/api'];
}

export interface RateLimitResult {
  allowed: boolean;
  /** 剩余请求数 */
  remaining: number;
  /** 总限额 */
  limit: number;
  /** 窗口重置时间（秒） */
  retryAfter: number;
}

/**
 * 检查请求是否允许通过
 */
export function checkRateLimit(
  ip: string,
  pathname: string
): RateLimitResult {
  startCleanup();

  const config = getConfigForPath(pathname);
  // 用匹配到的前缀作为 key 的一部分
  const prefixes = Object.keys(RATE_LIMIT_CONFIGS).sort(
    (a, b) => b.length - a.length
  );
  const matchedPrefix =
    prefixes.find((p) => pathname.startsWith(p)) || '/api';
  const key = `${ip}:${matchedPrefix}`;

  const now = Date.now();
  const windowStart = now - config.windowMs;

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [], lastAccess: now };
    store.set(key, entry);
  }

  // 清理窗口外的时间戳
  entry.timestamps = entry.timestamps.filter((t) => t > windowStart);
  entry.lastAccess = now;

  if (entry.timestamps.length >= config.max) {
    // 计算最早请求过期时间
    const oldestInWindow = entry.timestamps[0];
    const retryAfter = Math.ceil(
      (oldestInWindow + config.windowMs - now) / 1000
    );
    return {
      allowed: false,
      remaining: 0,
      limit: config.max,
      retryAfter: Math.max(retryAfter, 1),
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.max - entry.timestamps.length,
    limit: config.max,
    retryAfter: 0,
  };
}
