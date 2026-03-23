"use client";

interface TrendPoint {
  date: string;
  score: number;
}

interface TrendChartProps {
  data: TrendPoint[];
  width?: number;
  height?: number;
}

export function TrendChart({ data, width = 600, height = 200 }: TrendChartProps) {
  if (data.length < 2) {
    return (
      <div className="text-center text-sm text-gray-500 py-8">
        需要至少 2 次分析记录才能展示趋势
      </div>
    );
  }

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const scores = data.map((d) => d.score);
  const minScore = Math.max(0, Math.min(...scores) - 10);
  const maxScore = Math.min(100, Math.max(...scores) + 10);

  const xScale = (i: number) => padding.left + (i / (data.length - 1)) * chartW;
  const yScale = (v: number) =>
    padding.top + chartH - ((v - minScore) / (maxScore - minScore)) * chartH;

  const linePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(d.score)}`)
    .join(" ");

  // Diff indicator
  const lastDiff = data.length >= 2 ? data[data.length - 1].score - data[data.length - 2].score : 0;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100]
          .filter((v) => v >= minScore && v <= maxScore)
          .map((v) => (
            <g key={v}>
              <line
                x1={padding.left}
                y1={yScale(v)}
                x2={width - padding.right}
                y2={yScale(v)}
                stroke="#e5e7eb"
                strokeDasharray="4"
              />
              <text x={padding.left - 5} y={yScale(v) + 4} textAnchor="end" className="text-[10px] fill-gray-400">
                {v}
              </text>
            </g>
          ))}

        {/* Line */}
        <path d={linePath} fill="none" stroke="#2563eb" strokeWidth="2" />

        {/* Points */}
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xScale(i)} cy={yScale(d.score)} r="4" fill="#2563eb" />
            <text
              x={xScale(i)}
              y={yScale(d.score) - 10}
              textAnchor="middle"
              className="text-[10px] fill-gray-600 dark:fill-gray-400"
            >
              {d.score}
            </text>
            <text
              x={xScale(i)}
              y={height - 5}
              textAnchor="middle"
              className="text-[9px] fill-gray-400"
            >
              {new Date(d.date).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })}
            </text>
          </g>
        ))}
      </svg>

      {/* Diff badge */}
      {lastDiff !== 0 && (
        <div className="text-center mt-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 text-sm rounded-full ${
              lastDiff > 0
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {lastDiff > 0 ? "📈" : "📉"} {lastDiff > 0 ? "+" : ""}{lastDiff} 分
          </span>
        </div>
      )}
    </div>
  );
}
