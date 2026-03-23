import { detectPlatformFromUrl, getPlatformDisplayName, getPlatformStyle } from "../platform-utils";

describe("platform-utils", () => {
  describe("detectPlatformFromUrl", () => {
    it("detects douyin.com", () => {
      expect(detectPlatformFromUrl("https://www.douyin.com/video/123")).toBe("douyin");
    });

    it("detects iesdouyin.com (short link)", () => {
      expect(detectPlatformFromUrl("https://v.iesdouyin.com/abc")).toBe("douyin");
    });

    it("detects xiaohongshu.com", () => {
      expect(detectPlatformFromUrl("https://www.xiaohongshu.com/explore/123")).toBe("xiaohongshu");
    });

    it("detects xhslink.com (short link)", () => {
      expect(detectPlatformFromUrl("https://xhslink.com/abc")).toBe("xiaohongshu");
    });

    it("detects bilibili.com", () => {
      expect(detectPlatformFromUrl("https://www.bilibili.com/video/BV1xx")).toBe("bilibili");
    });

    it("detects b23.tv (short link)", () => {
      expect(detectPlatformFromUrl("https://b23.tv/abc123")).toBe("bilibili");
    });

    it("detects weibo.com", () => {
      expect(detectPlatformFromUrl("https://weibo.com/123/abc")).toBe("weibo");
    });

    it("detects weibo.cn (mobile)", () => {
      expect(detectPlatformFromUrl("https://m.weibo.cn/status/123")).toBe("weibo");
    });

    it("returns null for unknown URLs", () => {
      expect(detectPlatformFromUrl("https://example.com/page")).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(detectPlatformFromUrl("")).toBeNull();
    });
  });

  describe("getPlatformDisplayName", () => {
    it("returns Chinese name for known platforms", () => {
      expect(getPlatformDisplayName("douyin")).toBe("抖音");
      expect(getPlatformDisplayName("xiaohongshu")).toBe("小红书");
      expect(getPlatformDisplayName("bilibili")).toBe("B站");
      expect(getPlatformDisplayName("weibo")).toBe("微博");
    });

    it("returns key as-is for unknown platforms", () => {
      expect(getPlatformDisplayName("unknown")).toBe("unknown");
    });
  });

  describe("getPlatformStyle", () => {
    it("returns color classes for known platforms", () => {
      const style = getPlatformStyle("douyin");
      expect(style.name).toBe("抖音");
      expect(style.color).toBeTruthy();
    });

    it("returns default style for unknown platforms", () => {
      const style = getPlatformStyle("unknown");
      expect(style.color).toContain("gray");
    });
  });
});
