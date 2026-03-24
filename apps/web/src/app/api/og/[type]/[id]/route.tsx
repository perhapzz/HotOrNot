import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

// No edge runtime — Mongoose needs Node.js runtime
// DB connection is lazy (only at request time, not build time)

export async function GET(
  request: NextRequest,
  { params }: { params: { type: string; id: string } }
) {
  const { type, id } = params;

  let title = "HotOrNot 分析结果";
  let score = 0;
  let subtitle = "";

  try {
    const { connectDatabase } = await import("@hotornot/database");
    const { ContentAnalysis, AccountAnalysis } = await import("@hotornot/database");

    await connectDatabase();

    if (type === "content") {
      const analysis = await ContentAnalysis.findById(id).lean();
      if (analysis) {
        const a = analysis as any;
        title = a.title || "内容分析";
        score = a.analysis?.overallScore || a.analysis?.hotScore || 0;
        subtitle = a.platform || "";
      }
    } else if (type === "account") {
      const analysis = await AccountAnalysis.findById(id).lean();
      if (analysis) {
        const a = analysis as any;
        title = a.nickname || "账号分析";
        score = a.analysis?.overallScore || 0;
        subtitle = a.platform || "";
      }
    }
  } catch {
    // Use defaults
  }

  const scoreColor =
    score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: "32px", opacity: 0.8, marginBottom: "16px" }}>
          🔥 HotOrNot
        </div>
        <div
          style={{
            fontSize: "48px",
            fontWeight: "bold",
            marginBottom: "24px",
            maxWidth: "900px",
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {title}
        </div>
        {score > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              fontSize: "72px",
              fontWeight: "bold",
              color: scoreColor,
            }}
          >
            {score}
            <span style={{ fontSize: "24px", color: "white", opacity: 0.6 }}>
              / 100
            </span>
          </div>
        )}
        {subtitle && (
          <div
            style={{
              fontSize: "24px",
              opacity: 0.6,
              marginTop: "16px",
              textTransform: "uppercase",
            }}
          >
            {subtitle}
          </div>
        )}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
