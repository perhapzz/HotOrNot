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
  };
  metrics?: Record<string, number>;
}

export async function generatePDF(data: ExportData): Promise<Buffer> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  let y = 20;
  const lineHeight = 8;
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth() - margin * 2;

  const addLine = (text: string, fontSize = 10, isBold = false) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(fontSize);
    if (isBold) doc.setFont("helvetica", "bold");
    else doc.setFont("helvetica", "normal");

    const lines = doc.splitTextToSize(text, pageWidth);
    doc.text(lines, margin, y);
    y += lines.length * lineHeight;
  };

  // Title
  addLine("HotOrNot Analysis Report", 18, true);
  y += 4;
  addLine(`Type: ${data.type}`, 11);
  addLine(`Title: ${data.title}`, 11);
  addLine(`Exported: ${new Date().toLocaleString("zh-CN")}`, 9);
  y += 8;

  // Fields
  addLine("Basic Info", 14, true);
  y += 2;
  for (const [key, value] of Object.entries(data.fields)) {
    const val = typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
    addLine(`${key}: ${val}`, 10);
  }
  y += 6;

  // Metrics
  if (data.metrics && Object.keys(data.metrics).length > 0) {
    addLine("Metrics", 14, true);
    y += 2;
    for (const [key, value] of Object.entries(data.metrics)) {
      addLine(`${key}: ${value.toLocaleString()}`, 10);
    }
    y += 6;
  }

  // Analysis
  if (data.analysis) {
    addLine("AI Analysis", 14, true);
    y += 2;
    if (data.analysis.score !== undefined) {
      addLine(`Score: ${data.analysis.score}/100`, 12, true);
    }
    if (data.analysis.pros?.length) {
      y += 4;
      addLine("Strengths:", 11, true);
      data.analysis.pros.forEach((p) => addLine(`  + ${p}`, 10));
    }
    if (data.analysis.cons?.length) {
      y += 4;
      addLine("Weaknesses:", 11, true);
      data.analysis.cons.forEach((c) => addLine(`  - ${c}`, 10));
    }
    if (data.analysis.recommendation) {
      y += 4;
      addLine("Recommendation:", 11, true);
      addLine(data.analysis.recommendation, 10);
    }
    if (data.analysis.tags?.length) {
      y += 4;
      addLine(`Tags: ${data.analysis.tags.join(", ")}`, 10);
    }
  }

  return Buffer.from(doc.output("arraybuffer"));
}
