import { NextRequest, NextResponse } from "next/server";
import {
  connectDatabase,
  ContentAnalysis,
  KeywordAnalysis,
} from "@hotornot/database";
import { generateExcel } from "@/lib/export-generators/excel-generator";
import { generatePDF } from "@/lib/export-generators/pdf-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  try {
    const format = request.nextUrl.searchParams.get("format") || "excel";
    const { type, id } = params;

    await connectDatabase();

    let exportData: any;

    if (type === "content") {
      const record = await ContentAnalysis.findById(id).lean();
      if (!record) {
        return NextResponse.json(
          { success: false, error: "Record not found" },
          { status: 404 }
        );
      }
      exportData = {
        type: "内容分析",
        title: record.title || record.url,
        fields: {
          URL: record.url,
          平台: record.platform,
          作者: record.author?.name || "-",
          创建时间: record.createdAt,
        },
        metrics: record.metrics || {},
        analysis: record.analysis,
      };
    } else if (type === "keyword") {
      const record = await KeywordAnalysis.findById(id).lean();
      if (!record) {
        return NextResponse.json(
          { success: false, error: "Record not found" },
          { status: 404 }
        );
      }
      exportData = {
        type: "关键词分析",
        title: record.keyword,
        fields: {
          关键词: record.keyword,
          平台: Array.isArray(record.platforms)
            ? record.platforms.join(", ")
            : record.platforms,
          创建时间: record.createdAt,
        },
        analysis: record.analysis
          ? {
              score: record.analysis.hotScore,
              pros: record.analysis.opportunities,
              cons: record.analysis.risks,
              recommendation: record.analysis.recommendation,
              tags: record.analysis.relatedKeywords,
            }
          : undefined,
      };
    } else {
      return NextResponse.json(
        { success: false, error: "Unsupported export type" },
        { status: 400 }
      );
    }

    const dateStr = new Date().toISOString().split("T")[0];
    const filename = `HotOrNot_${type}_${dateStr}`;

    if (format === "pdf") {
      const buffer = generatePDF(exportData);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        },
      });
    } else {
      const buffer = generateExcel(exportData);
      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
        },
      });
    }
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Export failed" },
      { status: 500 }
    );
  }
}
