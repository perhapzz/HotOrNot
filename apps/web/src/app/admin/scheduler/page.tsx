"use client";

import { useState, useEffect } from "react";

interface SchedulerStatus {
  status: string;
  isRunning: boolean;
  updateInterval: number;
  updateIntervalMinutes: number;
  nextUpdateTime: string | null;
  description: string;
}

export default function SchedulerAdminPage() {
  const [schedulerStatus, setSchedulerStatus] =
    useState<SchedulerStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isOperating, setIsOperating] = useState(false);
  const [error, setError] = useState<string>("");
  const [lastOperation, setLastOperation] = useState<string>("");

  useEffect(() => {
    fetchStatus();
    // 每30秒刷新状态
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await fetch("/api/scheduler");
      const data = await response.json();

      if (data.success) {
        setSchedulerStatus(data.data);
        setError("");
      } else {
        setError(data.error || "获取状态失败");
      }
    } catch (error) {
      setError("网络错误，请稍后重试");
      console.error("获取定时任务状态失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOperation = async (action: string) => {
    setIsOperating(true);
    setError("");

    try {
      const response = await fetch("/api/scheduler", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (data.success) {
        setSchedulerStatus(data.data);
        setLastOperation(`${action} 操作成功: ${data.message}`);
        setError("");
      } else {
        setError(data.error || "操作失败");
      }
    } catch (error) {
      setError("网络错误，请稍后重试");
      console.error("定时任务操作失败:", error);
    } finally {
      setIsOperating(false);
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return "未设置";
    return new Date(timeString).toLocaleString("zh-CN");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold text-gray-900">
                HotOrNot
              </a>
              <span className="ml-2 text-sm text-gray-500">定时任务管理</span>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/" className="text-gray-700 hover:text-gray-900">
                内容分析
              </a>
              <a
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900"
              >
                数据大屏
              </a>
              <a href="/history" className="text-gray-700 hover:text-gray-900">
                历史记录
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">定时任务管理</h1>
          <p className="mt-2 text-gray-600">管理热点数据自动更新服务</p>
        </div>

        {/* 环境配置信息 */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            🔧 自动启动配置
          </h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p>
              <strong>当前环境:</strong>{" "}
              {typeof window !== "undefined"
                ? "客户端"
                : process.env.NODE_ENV || "development"}
            </p>
            <p>
              <strong>自动启动策略:</strong>{" "}
              {typeof window !== "undefined"
                ? "客户端"
                : process.env.AUTO_START_SCHEDULER || "all"}
            </p>
            <div className="mt-2 text-xs bg-blue-100 rounded p-2">
              💡 <strong>提示:</strong> 修改{" "}
              <code className="bg-white px-1 rounded">
                AUTO_START_SCHEDULER
              </code>{" "}
              环境变量来控制自动启动策略
              <br />
              <strong>可选值:</strong>
              <ul className="ml-4 mt-1">
                <li>
                  • <code className="bg-white px-1 rounded">prod</code> -
                  仅在生产环境自动启动
                </li>
                <li>
                  • <code className="bg-white px-1 rounded">dev</code> -
                  仅在开发环境自动启动
                </li>
                <li>
                  • <code className="bg-white px-1 rounded">all</code> -
                  所有环境都自动启动 (默认)
                </li>
                <li>
                  • <code className="bg-white px-1 rounded">none</code> -
                  禁用自动启动，需要手动启动
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">错误</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* 成功提示 */}
        {lastOperation && !error && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-green-700">{lastOperation}</p>
              </div>
            </div>
          </div>
        )}

        {/* 状态卡片 */}
        {schedulerStatus && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              服务状态
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      服务状态:
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        schedulerStatus.isRunning
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {schedulerStatus.isRunning ? "运行中" : "已停止"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      更新间隔:
                    </span>
                    <span className="text-sm text-gray-900">
                      {schedulerStatus.updateIntervalMinutes} 分钟 (3小时)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500">
                      下次更新:
                    </span>
                    <span className="text-sm text-gray-900">
                      {formatTime(schedulerStatus.nextUpdateTime)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    服务描述
                  </h3>
                  <p className="text-sm text-gray-600">
                    {schedulerStatus.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 控制按钮 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">控制操作</h2>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleOperation("start")}
              disabled={isOperating || (schedulerStatus?.isRunning ?? false)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOperating ? "操作中..." : "启动服务"}
            </button>

            <button
              onClick={() => handleOperation("stop")}
              disabled={isOperating || !(schedulerStatus?.isRunning ?? true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOperating ? "操作中..." : "停止服务"}
            </button>

            <button
              onClick={() => handleOperation("restart")}
              disabled={isOperating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isOperating ? "操作中..." : "重启服务"}
            </button>

            <button
              onClick={fetchStatus}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "刷新中..." : "刷新状态"}
            </button>
          </div>
        </div>

        {/* 说明文档 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">使用说明</h2>

          <div className="space-y-4 text-sm text-gray-600">
            <p>
              <strong>自动更新:</strong>{" "}
              定时任务会每3小时自动更新一次小红书和抖音的热点数据。
            </p>
            <p>
              <strong>手动控制:</strong>{" "}
              你可以通过上方的按钮手动启动、停止或重启定时服务。
            </p>
            <p>
              <strong>状态监控:</strong>{" "}
              页面会每30秒自动刷新状态信息，你也可以手动点击"刷新状态"按钮。
            </p>
            <p>
              <strong>数据同步:</strong>{" "}
              更新的热点数据会自动同步到数据大屏，无需额外操作。
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
