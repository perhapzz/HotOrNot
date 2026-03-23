/**
 * Tests for CacheService (cache.ts)
 * Tests the MemoryCache fallback path since Redis isn't available in test.
 */

// Must clear env before importing
delete process.env.REDIS_URL;

import { cache } from "../lib/cache";

describe("CacheService (memory fallback)", () => {
  beforeEach(async () => {
    // Clear any lingering data
    await cache.del("test-key");
  });

  it("returns null for missing key", async () => {
    const result = await cache.get("nonexistent");
    expect(result).toBeNull();
  });

  it("set and get with JSON auto-serialization", async () => {
    await cache.set("test-key", { name: "test", value: 42 }, 60);
    const result = await cache.get<{ name: string; value: number }>("test-key");
    expect(result).toEqual({ name: "test", value: 42 });
  });

  it("del removes key", async () => {
    await cache.set("test-key", "hello", 60);
    await cache.del("test-key");
    const result = await cache.get("test-key");
    expect(result).toBeNull();
  });

  it("getOrSet caches loader result", async () => {
    let callCount = 0;
    const loader = async () => {
      callCount++;
      return { data: "loaded" };
    };

    const first = await cache.getOrSet("loader-test", loader, 60);
    const second = await cache.getOrSet("loader-test", loader, 60);

    expect(first).toEqual({ data: "loaded" });
    expect(second).toEqual({ data: "loaded" });
    expect(callCount).toBe(1); // Loader called only once
  });

  it("respects TTL expiration", async () => {
    // Set with 0-second TTL (should expire immediately)
    await cache.set("ttl-test", "value", 0);

    // Wait a tick for expiration
    await new Promise((r) => setTimeout(r, 10));

    const result = await cache.get("ttl-test");
    expect(result).toBeNull();
  });
});
