"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface SystemStatus {
  scheduler: { running: boolean; lastRun: string | null };
  cache: { modules: number; totalEntries: number };
  api: { totalRequests: number; rateLimitHits: number };
}

function StatusCard({
  title,
  icon,
  value,
  subtitle,
  href,
  status,
}: {
  title: string;
  icon: string;
  value: string;
  subtitle: string;
  href: string;
  status?: "ok" | "warn" | "error";
}) {
  const statusColors = {
    ok: "bg-green-100 text-green-700",
    warn: "bg-yellow-100 text-yellow-700",
    error: "bg-red-100 text-red-700",
  };

  return (
    <Link
      href={href}
      className="block bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          <p className="text-sm text-gray-400 mt-1">{subtitle}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-2xl">{icon}</span>
          {status && (
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${statusColors[status]}`}
            >
              {status === "ok" ? "正常" : status === "warn" ? "警告" : "异常"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function AdminPage() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch system status from various endpoints
    async function fetchStatus() {
      try {
        const [schedulerRes, cacheRes] = await Promise.allSettled([
          fetch("/api/admin/scheduler/status"),
          fetch("/api/cache/config"),
        ]);

        const scheduler =
          schedulerRes.status === "fulfilled" && schedulerRes.value.ok
            ? await schedulerRes.value.json()
            : null;

        const cache =
          cacheRes.status === "fulfilled" && cacheRes.value.ok
            ? await cacheRes.value.json()
            : null;

        setStatus({
          scheduler: {
            running: scheduler?.data?.isRunning ?? false,
            lastRun: scheduler?.data?.lastFetchTime ?? null,
          },
          cache: {
            modules: cache?.data ? Object.keys(cache.data).length : 0,
            totalEntries: 0,
          },
          api: {
            totalRequests: 0,
            rateLimitHits: 0,
          },
        });
      } catch {
        // Silently fail, show defaults
      } finally {
        setLoading(false);
      }
    }

    fetchStatus();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">系统概览</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatusCard
          title="定时任务"
          icon="⏰"
          value={status?.scheduler.running ? "运行中" : "已停止"}
          subtitle={
            status?.scheduler.lastRun
              ? `上次运行: ${new Date(status.scheduler.lastRun).toLocaleString("zh-CN")}`
              : "尚未运行"
          }
          href="/admin/scheduler"
          status={status?.scheduler.running ? "ok" : "warn"}
        />

        <StatusCard
          title="缓存管理"
          icon="🗄️"
          value={`${status?.cache.modules ?? 0} 个模块`}
          subtitle="点击查看缓存配置和状态"
          href="/admin/cache"
          status="ok"
        />

        <StatusCard
          title="API 监控"
          icon="📡"
          value="限流已启用"
          subtitle="rate-limiter 滑动窗口"
          href="/admin"
          status="ok"
        />
      </div>

      {/* Quick actions */}
      <h3 className="text-lg font-medium text-gray-900 mt-8 mb-4">
        快捷操作
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/scheduler"
          className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
        >
          <span className="text-xl">▶️</span>
          <div>
            <p className="font-medium text-gray-900">管理定时任务</p>
            <p className="text-sm text-gray-500">启动、停止、手动触发热点抓取</p>
          </div>
        </Link>
        <Link
          href="/admin/cache"
          className="flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-4 hover:bg-gray-50 transition-colors"
        >
          <span className="text-xl">🧹</span>
          <div>
            <p className="font-medium text-gray-900">缓存管理</p>
            <p className="text-sm text-gray-500">查看配置、手动清除过期缓存</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
