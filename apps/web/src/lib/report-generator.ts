import { connectDatabase } from "@hotornot/database/src/utils/connection";
import mongoose from "mongoose";

interface WeeklyReport {
  period: { start: string; end: string };
  summary: {
    totalAnalyses: number;
    contentAnalyses: number;
    keywordAnalyses: number;
    accountAnalyses: number;
    avgScore: number;
  };
  topKeywords: { keyword: string; count: number }[];
  highlights: string[];
  generatedAt: string;
}

export async function generateWeeklyReport(
  userId: string
): Promise<WeeklyReport> {
  await connectDatabase();
  const db = mongoose.connection.db!;

  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 7);

  const userFilter = { userId, createdAt: { $gte: start, $lte: end } };

  const [contentCount, keywordCount, accountCount] = await Promise.all([
    db.collection("contentanalyses").countDocuments(userFilter),
    db.collection("keywordanalyses").countDocuments(userFilter),
    db.collection("accountanalyses").countDocuments(userFilter),
  ]);

  const totalAnalyses = contentCount + keywordCount + accountCount;

  // Average score from content analyses
  const scoreAgg = await db
    .collection("contentanalyses")
    .aggregate([
      { $match: userFilter },
      {
        $group: {
          _id: null,
          avgScore: {
            $avg: {
              $ifNull: ["$analysis.overallScore", "$analysis.hotScore"],
            },
          },
        },
      },
    ])
    .toArray();

  const avgScore = Math.round(scoreAgg[0]?.avgScore || 0);

  // Top keywords
  const topKeywords = await db
    .collection("keywordanalyses")
    .aggregate([
      { $match: userFilter },
      { $group: { _id: "$keyword", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ])
    .toArray();

  // Generate highlights
  const highlights: string[] = [];
  if (totalAnalyses > 0) {
    highlights.push(`本周完成 ${totalAnalyses} 次分析`);
  }
  if (avgScore > 0) {
    highlights.push(
      `平均评分 ${avgScore} 分${avgScore >= 80 ? "，表现优秀！" : avgScore >= 60 ? "，还有提升空间" : "，建议优化内容策略"}`
    );
  }
  if (topKeywords.length > 0) {
    highlights.push(
      `最关注的关键词：${topKeywords.map((k: any) => k._id).join("、")}`
    );
  }
  if (totalAnalyses === 0) {
    highlights.push("本周暂无分析记录，试试开始你的第一次内容分析吧！");
  }

  return {
    period: { start: start.toISOString(), end: end.toISOString() },
    summary: {
      totalAnalyses,
      contentAnalyses: contentCount,
      keywordAnalyses: keywordCount,
      accountAnalyses: accountCount,
      avgScore,
    },
    topKeywords: topKeywords.map((k: any) => ({
      keyword: k._id,
      count: k.count,
    })),
    highlights,
    generatedAt: new Date().toISOString(),
  };
}

export function reportToHtml(report: WeeklyReport): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><style>
body{font-family:-apple-system,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#333}
h1{color:#2563eb;border-bottom:2px solid #2563eb;padding-bottom:8px}
.card{background:#f9fafb;padding:16px;border-radius:8px;margin:12px 0}
.stat{display:inline-block;text-align:center;margin:0 16px}
.stat-num{font-size:28px;font-weight:bold;color:#2563eb}
.stat-label{font-size:12px;color:#6b7280}
.highlight{padding:8px 12px;margin:4px 0;background:#eff6ff;border-left:3px solid #2563eb;border-radius:4px}
</style></head>
<body>
<h1>🔥 HotOrNot 周报</h1>
<p>${new Date(report.period.start).toLocaleDateString("zh-CN")} — ${new Date(report.period.end).toLocaleDateString("zh-CN")}</p>

<div class="card">
  <div class="stat"><div class="stat-num">${report.summary.totalAnalyses}</div><div class="stat-label">总分析</div></div>
  <div class="stat"><div class="stat-num">${report.summary.avgScore || "—"}</div><div class="stat-label">平均评分</div></div>
  <div class="stat"><div class="stat-num">${report.summary.contentAnalyses}</div><div class="stat-label">内容</div></div>
  <div class="stat"><div class="stat-num">${report.summary.keywordAnalyses}</div><div class="stat-label">关键词</div></div>
</div>

<h2>💡 本周亮点</h2>
${report.highlights.map((h) => `<div class="highlight">${h}</div>`).join("\n")}

${
  report.topKeywords.length > 0
    ? `<h2>🔑 热门关键词</h2><ul>${report.topKeywords.map((k) => `<li>${k.keyword} (${k.count}次)</li>`).join("")}</ul>`
    : ""
}

<p style="color:#9ca3af;font-size:12px;margin-top:24px">HotOrNot 智能内容分析平台 · 自动生成于 ${new Date(report.generatedAt).toLocaleString("zh-CN")}</p>
</body></html>`;
}
