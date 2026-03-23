"use client";

import { useMemo } from "react";

interface WordCloudProps {
  words: { text: string; weight: number }[];
  maxWords?: number;
}

const COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b",
  "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
];

export function WordCloud({ words, maxWords = 50 }: WordCloudProps) {
  const rendered = useMemo(() => {
    const sorted = [...words]
      .sort((a, b) => b.weight - a.weight)
      .slice(0, maxWords);

    if (sorted.length === 0) return [];

    const maxW = sorted[0].weight;
    const minW = sorted[sorted.length - 1].weight;
    const range = maxW - minW || 1;

    return sorted.map((w, i) => {
      const norm = (w.weight - minW) / range; // 0-1
      const fontSize = 12 + norm * 24; // 12px to 36px
      const color = COLORS[i % COLORS.length];
      const opacity = 0.6 + norm * 0.4;
      return { ...w, fontSize, color, opacity };
    });
  }, [words, maxWords]);

  if (rendered.length === 0) {
    return <div className="text-center text-gray-400 py-8">暂无热词数据</div>;
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2 py-4">
      {rendered.map((w, i) => (
        <span
          key={i}
          className="cursor-default hover:scale-110 transition-transform inline-block"
          style={{
            fontSize: `${w.fontSize}px`,
            color: w.color,
            opacity: w.opacity,
            fontWeight: w.fontSize > 24 ? 700 : 500,
          }}
          title={`${w.text}: ${w.weight}`}
        >
          {w.text}
        </span>
      ))}
    </div>
  );
}
