"use client";

import { useState, useEffect, useCallback } from "react";
import { AppHeader } from "@/components/AppHeader";

type Tab = "overview" | "users" | "feedback" | "system";

interface Stats {
  users: { total: number; today: number; monthlyActive: number };
  analyses: { total: number; today: number };
  apiKeys: number;
  feedback: Record<string, number>;
}

interface User {
  _id: string;
  email: string;
  name?: string;
  role: string;
  banned?: boolean;
  createdAt: string;
}

interface FeedbackItem {
  _id: string;
  analysisType: string;
  rating: string;
  comment: string;
  userId?: string;
  status?: string;
  createdAt: string;
}

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => d.success && setStats(d.data))
      .catch(() => {});
  }, []);

  const loadUsers = useCallback((search = "") => {
    fetch(`/api/admin/users?search=${encodeURIComponent(search)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => d.success && setUsers(d.data.users))
      .catch(() => {});
  }, []);

  const loadFeedback = useCallback(() => {
    fetch("/api/admin/feedback?limit=50", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => d.success && setFeedbacks(d.data.feedbacks))
      .catch(() => {});
  }, []);

  const loadHealth = useCallback(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "users") loadUsers(userSearch);
    if (tab === "feedback") loadFeedback();
    if (tab === "system") loadHealth();
  }, [tab, loadUsers, loadFeedback, loadHealth, userSearch]);

  const handleUserAction = async (userId: string, action: string, value: any) => {
    await fetch("/api/admin/users", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action, value }),
    });
    loadUsers(userSearch);
  };

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "概览", icon: "📊" },
    { key: "users", label: "用户管理", icon: "👥" },
    { key: "feedback", label: "反馈管理", icon: "💬" },
    { key: "system", label: "系统状态", icon: "🖥️" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">🔧 管理后台</h1>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white dark:bg-gray-800 p-1 rounded-lg border dark:border-gray-700">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 px-4 py-2 text-sm rounded-md transition-colors ${
                tab === t.key
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="总用户" value={stats.users.total} sub={`今日 +${stats.users.today}`} icon="👥" />
            <StatCard label="月活跃" value={stats.users.monthlyActive} icon="📈" />
            <StatCard label="总分析" value={stats.analyses.total} sub={`今日 +${stats.analyses.today}`} icon="📊" />
            <StatCard label="API Keys" value={stats.apiKeys} icon="🔑" />
            <StatCard label="正面反馈" value={stats.feedback.up || 0} icon="👍" />
            <StatCard label="负面反馈" value={stats.feedback.down || 0} icon="👎" />
          </div>
        )}

        {/* Users */}
        {tab === "users" && (
          <div className="space-y-4">
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="搜索邮箱或用户名..."
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
            />
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left">邮箱</th>
                    <th className="px-4 py-3 text-left">角色</th>
                    <th className="px-4 py-3 text-left">状态</th>
                    <th className="px-4 py-3 text-left">注册时间</th>
                    <th className="px-4 py-3 text-left">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-gray-700">
                  {users.map((u) => (
                    <tr key={u._id} className="text-gray-700 dark:text-gray-300">
                      <td className="px-4 py-3">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          u.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {u.banned ? <span className="text-red-500">已封禁</span> : <span className="text-green-500">正常</span>}
                      </td>
                      <td className="px-4 py-3">{new Date(u.createdAt).toLocaleDateString("zh-CN")}</td>
                      <td className="px-4 py-3 space-x-2">
                        <button
                          onClick={() => handleUserAction(u._id, "ban", !u.banned)}
                          className="text-xs px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {u.banned ? "解封" : "封禁"}
                        </button>
                        <button
                          onClick={() => handleUserAction(u._id, "role", u.role === "admin" ? "user" : "admin")}
                          className="text-xs px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          {u.role === "admin" ? "降为用户" : "设为管理员"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Feedback */}
        {tab === "feedback" && (
          <div className="space-y-3">
            {feedbacks.map((f) => (
              <div key={f._id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{f.rating === "up" ? "👍" : "👎"}</span>
                    <span className="text-sm text-gray-500">{f.analysisType}</span>
                    <span className="text-xs text-gray-400">{new Date(f.createdAt).toLocaleString("zh-CN")}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    f.status === "processed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {f.status === "processed" ? "已处理" : "待处理"}
                  </span>
                </div>
                {f.comment && <p className="text-sm text-gray-700 dark:text-gray-300">{f.comment}</p>}
              </div>
            ))}
            {feedbacks.length === 0 && <p className="text-center text-gray-500 py-8">暂无反馈</p>}
          </div>
        )}

        {/* System */}
        {tab === "system" && (
          <div className="space-y-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
              <h3 className="font-medium mb-3 text-gray-900 dark:text-white">系统健康</h3>
              {health ? (
                <div className="space-y-2 text-sm">
                  <p>状态: <span className={health.status === "ok" ? "text-green-500" : "text-red-500"}>{health.status}</span></p>
                  <p>数据库: {health.database || "unknown"}</p>
                  <p>运行时间: {health.uptime ? `${Math.floor(health.uptime / 3600)}h` : "N/A"}</p>
                </div>
              ) : (
                <p className="text-gray-500">加载中...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: number; sub?: string; icon: string }) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        <span className="text-xl">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
