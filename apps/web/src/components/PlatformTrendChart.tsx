"use client";

import { useMemo } from "react";

interface TrendLineProps {
  /** Platform data: { platform, data: [{date, value}] } */
  series: {
    platform: string;
    color: string;
    data: { date: string; value: number }[];
  }[];
  height?: number;
}

const PLATFORM_COLORS: Record<string, string> = {
  douyin: "#fe2c55",
  xiaohongshu: "#ff2442",
  bilibili: "#00a1d6",
  weibo: "#ff8200",
};

export function PlatformTrendChart({ series, height = 200 }: TrendLineProps) {
  const { viewBox, paths, labels, yLabels } = useMemo(() => {
    const allValues = series.flatMap((s) => s.data.map((d) => d.value));
    const maxVal = Math.max(...allValues, 1);
    const allDates = [...new Set(series.flatMap((s) => s.data.map((d) => d.date)))].sort();

    const w = 600;
    const h = height;
    const pad = { t: 20, r: 20, b: 30, l: 50 };
    const chartW = w - pad.l - pad.r;
    const chartH = h - pad.t - pad.b;

    const xScale = (i: number) => pad.l + (i / Math.max(allDates.length - 1, 1)) * chartW;
    const yScale = (v: number) => pad.t + chartH - (v / maxVal) * chartH;

    const paths = series.map((s) => {
      const points = s.data.map((d) => {
        const xi = allDates.indexOf(d.date);
        return `${xScale(xi)},${yScale(d.value)}`;
      });
      return {
        platform: s.platform,
        color: s.color || PLATFORM_COLORS[s.platform] || "#888",
        d: `M${points.join("L")}`,
      };
    });

    // X labels (show ~5)
    const step = Math.max(1, Math.floor(allDates.length / 5));
    const labels = allDates
      .filter((_, i) => i % step === 0)
      .map((d, i) => ({
        x: xScale(allDates.indexOf(d)),
        y: h - 5,
        text: d.slice(5), // MM-DD
      }));

    // Y labels
    const ySteps = 4;
    const yLabels = Array.from({ length: ySteps + 1 }, (_, i) => {
      const v = (maxVal / ySteps) * i;
      return { x: pad.l - 5, y: yScale(v), text: Math.round(v).toString() };
    });

    return { viewBox: `0 0 ${w} ${h}`, paths, labels, yLabels };
  }, [series, height]);

  if (series.length === 0) {
    return <div className="text-center text-gray-400 py-8">暂无趋势数据</div>;
  }

  return (
    <div>
      <svg viewBox={viewBox} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Y grid + labels */}
        {yLabels.map((l, i) => (
          <g key={i}>
            <line x1="50" y1={l.y} x2="580" y2={l.y} stroke="#e5e7eb" strokeWidth="0.5" />
            <text x={l.x} y={l.y + 4} textAnchor="end" className="text-[10px] fill-gray-400">
              {l.text}
            </text>
          </g>
        ))}

        {/* Lines */}
        {paths.map((p) => (
          <path key={p.platform} d={p.d} fill="none" stroke={p.color} strokeWidth="2" />
        ))}

        {/* X labels */}
        {labels.map((l, i) => (
          <text key={i} x={l.x} y={l.y} textAnchor="middle" className="text-[10px] fill-gray-400">
            {l.text}
          </text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-4 mt-2">
        {paths.map((p) => (
          <div key={p.platform} className="flex items-center gap-1.5 text-sm">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
            <span className="text-gray-600 dark:text-gray-400">{p.platform}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
