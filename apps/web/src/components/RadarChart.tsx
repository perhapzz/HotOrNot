"use client";

interface RadarChartProps {
  /** Array of { label, value (0-100) } */
  dimensions: { label: string; value: number }[];
  size?: number;
  color?: string;
}

export function RadarChart({
  dimensions,
  size = 250,
  color = "#3b82f6",
}: RadarChartProps) {
  const n = dimensions.length;
  if (n < 3) return null;

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;

  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const point = (i: number, scale: number) => ({
    x: cx + r * scale * Math.cos(startAngle + i * angleStep),
    y: cy + r * scale * Math.sin(startAngle + i * angleStep),
  });

  // Grid rings
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Data polygon
  const dataPoints = dimensions.map((d, i) => point(i, d.value / 100));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px] mx-auto">
      {/* Grid */}
      {rings.map((scale) => {
        const pts = Array.from({ length: n }, (_, i) => point(i, scale));
        const path = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + "Z";
        return <path key={scale} d={path} fill="none" stroke="#e5e7eb" strokeWidth="1" />;
      })}

      {/* Axes */}
      {Array.from({ length: n }, (_, i) => {
        const p = point(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#e5e7eb" strokeWidth="1" />;
      })}

      {/* Data fill */}
      <path d={dataPath} fill={color} fillOpacity="0.2" stroke={color} strokeWidth="2" />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill={color} />
      ))}

      {/* Labels */}
      {dimensions.map((d, i) => {
        const lp = point(i, 1.18);
        return (
          <text
            key={i}
            x={lp.x}
            y={lp.y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[10px] fill-gray-600 dark:fill-gray-400"
          >
            {d.label} ({d.value})
          </text>
        );
      })}
    </svg>
  );
}
