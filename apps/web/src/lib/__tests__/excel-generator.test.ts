import { generateExcel } from "../export-generators/excel-generator";

describe("excel-generator", () => {
  const sampleData = {
    type: "内容分析",
    title: "Test Video",
    fields: {
      URL: "https://douyin.com/video/123",
      平台: "抖音",
      作者: "TestUser",
    },
    metrics: {
      播放量: 10000,
      点赞: 500,
      评论: 100,
    },
    analysis: {
      score: 85,
      pros: ["Good editing", "Trending topic"],
      cons: ["Low engagement rate"],
      recommendation: "Post during peak hours",
      tags: ["vlog", "travel"],
    },
  };

  it("generates a buffer", () => {
    const buffer = generateExcel(sampleData);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("generates valid xlsx magic bytes", () => {
    const buffer = generateExcel(sampleData);
    // XLSX files start with PK (zip format)
    expect(buffer[0]).toBe(0x50); // P
    expect(buffer[1]).toBe(0x4b); // K
  });

  it("works without optional fields", () => {
    const minimal = {
      type: "关键词分析",
      title: "Test Keyword",
      fields: { 关键词: "美食" },
    };
    const buffer = generateExcel(minimal);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("handles empty metrics", () => {
    const data = { ...sampleData, metrics: {} };
    const buffer = generateExcel(data);
    expect(buffer).toBeInstanceOf(Buffer);
  });

  it("handles empty analysis", () => {
    const data = { ...sampleData, analysis: undefined };
    const buffer = generateExcel(data);
    expect(buffer).toBeInstanceOf(Buffer);
  });
});
