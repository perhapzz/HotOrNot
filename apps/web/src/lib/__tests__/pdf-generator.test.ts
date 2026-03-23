import { generatePDF } from "../export-generators/pdf-generator";

describe("pdf-generator", () => {
  const sampleData = {
    type: "内容分析",
    title: "Test Content",
    fields: {
      URL: "https://example.com",
      平台: "抖音",
    },
    metrics: {
      播放量: 50000,
      点赞: 2000,
    },
    analysis: {
      score: 72,
      pros: ["Great thumbnail", "Good hook"],
      cons: ["Too long"],
      recommendation: "Trim to under 60 seconds",
      tags: ["fitness", "workout"],
    },
  };

  it("generates a buffer", () => {
    const buffer = generatePDF(sampleData);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it("generates valid PDF magic bytes", () => {
    const buffer = generatePDF(sampleData);
    const header = buffer.slice(0, 5).toString("ascii");
    expect(header).toBe("%PDF-");
  });

  it("works without optional fields", () => {
    const minimal = {
      type: "关键词",
      title: "Test",
      fields: { keyword: "test" },
    };
    const buffer = generatePDF(minimal);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.slice(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("handles long content without crashing", () => {
    const data = {
      ...sampleData,
      analysis: {
        ...sampleData.analysis,
        pros: Array(50).fill("A very long strength description that should wrap properly in the PDF output"),
        cons: Array(50).fill("A very long weakness description"),
      },
    };
    const buffer = generatePDF(data);
    expect(buffer).toBeInstanceOf(Buffer);
  });
});
