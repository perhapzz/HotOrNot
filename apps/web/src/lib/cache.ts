import Redis from "ioredis";

// ==================== Memory Fallback ====================

class MemoryCache {
  private store = new Map<string, { value: string; expiresAt: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    this.store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async invalidatePattern(pattern: string): Promise<number> {
    const regex = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
    let count = 0;
    for (const k of this.store.keys()) {
      if (regex.test(k)) {
        this.store.delete(k);
        count++;
      }
    }
    return count;
  }
}

// ==================== Cache Service ====================

interface CacheBackend {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
  del(key: string): Promise<void>;
  invalidatePattern(pattern: string): Promise<number>;
}

class RedisCacheBackend implements CacheBackend {
  constructor(private client: Redis) {}

  async get(key: string) {
    return this.client.get(key);
  }
  async set(key: string, value: string, ttlSeconds: number) {
    await this.client.set(key, value, "EX", ttlSeconds);
  }
  async del(key: string) {
    await this.client.del(key);
  }
  async invalidatePattern(pattern: string): Promise<number> {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) await this.client.del(...keys);
    return keys.length;
  }
}

class CacheService {
  private backend: CacheBackend;
  private prefix = "hon:";

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        const client = new Redis(redisUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => Math.min(times * 200, 2000),
          lazyConnect: true,
        });

        client.on("error", (err) => {
          console.error("[Cache] Redis error, falling back to memory:", err.message);
          this.backend = new MemoryCache();
        });

        client.connect().catch(() => {
          console.warn("[Cache] Redis connect failed, using memory cache");
          this.backend = new MemoryCache();
        });

        this.backend = new RedisCacheBackend(client);
        console.log("[Cache] Using Redis backend");
        return;
      } catch {
        // Fall through to memory
      }
    }

    console.log("[Cache] Using in-memory cache (REDIS_URL not set)");
    this.backend = new MemoryCache();
  }

  private key(k: string) {
    return this.prefix + k;
  }

  async get<T = any>(key: string): Promise<T | null> {
    const raw = await this.backend.get(this.key(key));
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return raw as unknown as T;
    }
  }

  async set<T = any>(key: string, value: T, ttlSeconds = 300): Promise<void> {
    await this.backend.set(this.key(key), JSON.stringify(value), ttlSeconds);
  }

  async del(key: string): Promise<void> {
    await this.backend.del(this.key(key));
  }

  async invalidate(pattern: string): Promise<number> {
    return this.backend.invalidatePattern(this.prefix + pattern);
  }

  /**
   * Cache-aside helper: returns cached value or calls loader and caches result.
   */
  async getOrSet<T>(key: string, loader: () => Promise<T>, ttlSeconds = 300): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== null) return cached;
    const value = await loader();
    await this.set(key, value, ttlSeconds);
    return value;
  }
}

// Singleton
export const cache = new CacheService();
