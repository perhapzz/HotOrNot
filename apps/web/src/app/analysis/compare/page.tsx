"use client";

import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { RadarChart } from "@/components/RadarChart";

const COLORS = ["#2563eb", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

export default function ComparePage() {
  const [targets, setTargets] = useState(["", ""]);
  const [type, setType] = useState<"content" | "account">("content");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const addTarget = () => {
    if (targets.length < 5) setTargets([...targets, ""]);
  };

  const removeTarget = (i: number) => {
    if (targets.length > 2) setTargets(targets.filter((_, idx) => idx !== i));
  };

  const analyze = async () => {
    const filtered = targets.filter((t) => t.trim());
    if (filtered.length < 2) return;

    setLoading(true);
    try {
      const res = await fetch("/api/analysis/compare", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets: filtered, type }),
      });
      const data = await res.json();
      if (data.success) setResult(data.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          🔍 竞品对比分析
        </h1>

        {/* Type selector */}
        <div className="flex gap-2 mb-4">
          {(["content", "account"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`px-4 py-2 text-sm rounded-lg border ${
                type === t
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700"
              }`}
            >
              {t === "content" ? "📝 内容对比" : "👤 账号对比"}
            </button>
          ))}
        </div>

        {/* Inputs */}
        <div className="space-y-2 mb-4">
          {targets.map((t, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={t}
                onChange={(e) => {
                  const copy = [...targets];
                  copy[i] = e.target.value;
                  setTargets(copy);
                }}
                placeholder={
                  type === "content"
                    ? `内容链接 ${i + 1}`
                    : `账号用户名 ${i + 1}`
                }
                className="flex-1 px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
              {targets.length > 2 && (
                <button
                  onClick={() => removeTarget(i)}
                  className="px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-8">
          {targets.length < 5 && (
            <button
              onClick={addTarget}
              className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              + 添加目标
            </button>
          )}
          <button
            onClick={analyze}
            disabled={loading || targets.filter((t) => t.trim()).length < 2}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "分析中..." : "开始对比"}
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {result.errors?.length > 0 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg text-sm">
                ⚠️ 部分目标分析失败：
                {result.errors.map((e: any, i: number) => (
                  <div key={i}>
                    {e.target}: {e.error}
                  </div>
                ))}
              </div>
            )}

            {/* Radar overlay */}
            {result.comparison && (
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                <h3 className="font-medium mb-4">📊 维度对比</h3>
                <div className="flex flex-wrap gap-4 mb-4">
                  {result.comparison.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: COLORS[i] }}
                      />
                      {item.target}
                    </div>
                  ))}
                </div>
                {/* Individual radar charts side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.comparison.items.map((item: any, i: number) => (
                    <div key={i}>
                      <p className="text-sm font-medium text-center mb-2" style={{ color: COLORS[i] }}>
                        {item.target}
                      </p>
                      <RadarChart
                        data={result.comparison.dimensions.map((d: string) => ({
                          label: d,
                          value: item.scores[d] || 0,
                          maxValue: 100,
                        }))}
                        size={200}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.results.map((r: any, i: number) => (
                <div
                  key={i}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700"
                  style={{ borderTopColor: COLORS[i], borderTopWidth: 3 }}
                >
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {r.target}
                  </p>
                  <p className="text-3xl font-bold mt-2" style={{ color: COLORS[i] }}>
                    {r.analysis?.overallScore || r.analysis?.hotScore || "—"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {r.platform || type}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
