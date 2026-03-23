"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PLATFORM_NAMES: Record<string, string> = {
  douyin: "抖音",
  xiaohongshu: "小红书",
  bilibili: "B站",
  weibo: "微博",
};

const TYPE_NAMES: Record<string, string> = {
  content: "内容分析",
  account: "账号分析",
  keyword: "关键词分析",
  batch: "批量分析",
};

const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6", "#06b6d4"];

interface DashboardData {
  overview: {
    totalAnalyses: number;
    monthAnalyses: number;
    byType: Record<string, number>;
  };
  trend: { date: string; count: number }[];
  platformDistribution: { platform: string; count: number }[];
  topTags: { tag: string; count: number }[];
  recentAnalyses: any[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export default function MyDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async (p: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/dashboard/my?page=${p}&limit=10`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
        setError(null);
      } else {
        setError(json.error || "加载失败");
      }
    } catch {
      setError("网络错误");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => fetchData(1)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { overview, trend, platformDistribution, topTags, recentAnalyses, pagination } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader activePath="/dashboard/my" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">📊 我的分析面板</h1>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500">总分析次数</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{overview.totalAnalyses}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500">本月分析</p>
            <p className="text-3xl font-bold text-indigo-600 mt-1">{overview.monthAnalyses}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500">内容分析</p>
            <p className="text-3xl font-bold text-pink-500 mt-1">
              {overview.byType.content || 0}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <p className="text-sm text-gray-500">账号分析</p>
            <p className="text-3xl font-bold text-amber-500 mt-1">
              {overview.byType.account || 0}
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📈 近 30 天趋势</h2>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(v) => `日期: ${v}`}
                  formatter={(v: number) => [`${v} 次`, "分析次数"]}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Pie */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🎯 平台分布</h2>
            {platformDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={platformDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="platform"
                    >
                      {platformDistribution.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, _: any, props: any) => [
                        `${v} 次`,
                        PLATFORM_NAMES[props.payload.platform] || props.payload.platform,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap gap-3 mt-2">
                  {platformDistribution.map((p, i) => (
                    <span key={p.platform} className="flex items-center gap-1 text-xs">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      {PLATFORM_NAMES[p.platform] || p.platform}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-gray-400 text-sm mt-8 text-center">暂无数据</p>
            )}
          </div>
        </div>

        {/* Tags & Recent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Top Tags */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🏷️ 热门标签 Top 10</h2>
            {topTags.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topTags} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="tag"
                    width={80}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(v: number) => [`${v} 次`, "使用次数"]} />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-gray-400 text-sm mt-8 text-center">暂无标签数据</p>
            )}
          </div>

          {/* Recent Analyses Table */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📋 最近分析记录</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500">
                    <th className="text-left py-3 pr-4">类型</th>
                    <th className="text-left py-3 pr-4">平台</th>
                    <th className="text-left py-3 pr-4">目标</th>
                    <th className="text-left py-3 pr-4">状态</th>
                    <th className="text-left py-3">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAnalyses.map((item: any) => (
                    <tr key={item._id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 pr-4">
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-xs">
                          {TYPE_NAMES[item.analysisType] || item.analysisType}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {PLATFORM_NAMES[item.platform] || item.platform}
                      </td>
                      <td className="py-3 pr-4 text-gray-900 max-w-[200px] truncate">
                        {item.accountName || item.requestUrl || "-"}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            item.status === "completed"
                              ? "bg-green-50 text-green-700"
                              : item.status === "failed"
                              ? "bg-red-50 text-red-700"
                              : "bg-yellow-50 text-yellow-700"
                          }`}
                        >
                          {item.status === "completed"
                            ? "完成"
                            : item.status === "failed"
                            ? "失败"
                            : "处理中"}
                        </span>
                      </td>
                      <td className="py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString("zh-CN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                  {recentAnalyses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-400">
                        暂无分析记录
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <span className="text-xs text-gray-400">
                  共 {pagination.total} 条，第 {pagination.page}/{pagination.totalPages} 页
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  >
                    上一页
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    disabled={page >= pagination.totalPages}
                    className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
