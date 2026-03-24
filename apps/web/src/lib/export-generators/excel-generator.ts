interface ExportData {
  type: string;
  title: string;
  fields: Record<string, any>;
  analysis?: {
    score?: number;
    pros?: string[];
    cons?: string[];
    recommendation?: string;
    tags?: string[];
    suggestions?: Record<string, any>;
  };
  metrics?: Record<string, number>;
}

export async function generateExcel(data: ExportData): Promise<Buffer> {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  // Overview sheet
  const overviewRows = [
    ["分析类型", data.type],
    ["标题", data.title],
    ["导出时间", new Date().toLocaleString("zh-CN")],
    [],
  ];

  // Add all fields
  for (const [key, value] of Object.entries(data.fields)) {
    overviewRows.push([key, typeof value === "object" ? JSON.stringify(value) : String(value ?? "")]);
  }

  const overviewSheet = XLSX.utils.aoa_to_sheet(overviewRows);
  XLSX.utils.book_append_sheet(wb, overviewSheet, "概览");

  // Metrics sheet
  if (data.metrics && Object.keys(data.metrics).length > 0) {
    const metricsRows = [["指标", "数值"]];
    for (const [key, value] of Object.entries(data.metrics)) {
      metricsRows.push([key, String(value)]);
    }
    const metricsSheet = XLSX.utils.aoa_to_sheet(metricsRows);
    XLSX.utils.book_append_sheet(wb, metricsSheet, "数据指标");
  }

  // Analysis sheet
  if (data.analysis) {
    const analysisRows: any[][] = [];
    if (data.analysis.score !== undefined) {
      analysisRows.push(["综合评分", String(data.analysis.score)]);
      analysisRows.push([]);
    }
    if (data.analysis.pros?.length) {
      analysisRows.push(["优点"]);
      data.analysis.pros.forEach((p) => analysisRows.push(["", p]));
      analysisRows.push([]);
    }
    if (data.analysis.cons?.length) {
      analysisRows.push(["不足"]);
      data.analysis.cons.forEach((c) => analysisRows.push(["", c]));
      analysisRows.push([]);
    }
    if (data.analysis.recommendation) {
      analysisRows.push(["建议", data.analysis.recommendation]);
    }
    if (data.analysis.tags?.length) {
      analysisRows.push(["标签", data.analysis.tags.join(", ")]);
    }

    if (analysisRows.length > 0) {
      const analysisSheet = XLSX.utils.aoa_to_sheet(analysisRows);
      XLSX.utils.book_append_sheet(wb, analysisSheet, "AI分析");
    }
  }

  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}
