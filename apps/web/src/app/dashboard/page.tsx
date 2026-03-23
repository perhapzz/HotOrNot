"use client";

import { useState, useEffect } from "react";
import { Platform } from "@hotornot/shared";
import { MobileNav } from "@/components/MobileNav";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // 用户状态（可选）
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    fetchDashboardData();
    // 设置定时刷新 - 改为6小时刷新一次，因为服务器端会自动更新数据
    const interval = setInterval(fetchDashboardData, 6 * 60 * 60 * 1000); // 6小时刷新一次
    return () => clearInterval(interval);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch("/api/auth/login", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success && data.data.authenticated) {
        setUser(data.data.user);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.log("用户未登录，将以匿名模式使用");
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      setUser(null);
      setIsLoggedIn(false);
    } catch (error) {
      console.error("登出失败:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      // 获取热点数据
      const [xiaohongshuHotList, douyinHotList] = await Promise.all([
        fetch("/api/hotlist/xiaohongshu?limit=1")
          .then((r) => r.json())
          .catch(() => ({ success: false, data: { hotLists: [] } })),
        fetch("/api/hotlist/douyin?limit=1")
          .then((r) => r.json())
          .catch(() => ({ success: false, data: { hotLists: [] } })),
      ]);

      setDashboardData({
        xiaohongshuHotList:
          xiaohongshuHotList.success &&
          xiaohongshuHotList.data.hotLists.length > 0
            ? xiaohongshuHotList.data.hotLists[0]
            : null,
        douyinHotList:
          douyinHotList.success && douyinHotList.data.hotLists.length > 0
            ? douyinHotList.data.hotLists[0]
            : null,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Dashboard data fetch error:", error);
      setError("数据加载失败");
      // 使用模拟数据
      setDashboardData({
        xiaohongshuHotList: null,
        douyinHotList: null,
        lastUpdated: new Date().toISOString(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getWordTypeColor = (wordType: string) => {
    switch (wordType) {
      case "爆":
        return "text-red-500 bg-red-100";
      case "热":
        return "text-orange-500 bg-orange-100";
      case "新":
        return "text-green-500 bg-green-100";
      case "独家":
        return "text-purple-500 bg-purple-100";
      default:
        return "text-gray-500 bg-gray-100";
    }
  };

  const formatScore = (score: string) => {
    return score || "0";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-gray-900 text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p>加载数据大屏中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold text-gray-900">
                HotOrNot
              </a>
              <span className="ml-2 text-sm text-gray-500">数据大屏</span>
            </div>
            <div className="flex items-center space-x-8">
              <nav className="hidden md:flex space-x-8">
                <a href="/" className="text-gray-700 hover:text-gray-900">
                  内容分析
                </a>
                <a
                  href="/analysis/account"
                  className="text-gray-700 hover:text-gray-900"
                >
                  账号分析
                </a>
                <a
                  href="/analysis/keywords"
                  className="text-gray-700 hover:text-gray-900"
                >
                  关键词分析
                </a>
                <a href="/dashboard" className="text-blue-700 font-medium">
                  数据大屏
                </a>
              </nav>
              <MobileNav />

              {/* 用户状态 */}
              <div className="flex items-center">
                {isCheckingAuth ? (
                  <div className="text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                  </div>
                ) : isLoggedIn ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {user?.displayName?.[0] || user?.username?.[0] || "U"}
                      </div>
                      <div className="hidden md:block text-sm">
                        <div className="font-medium text-gray-900">
                          {user?.displayName || user?.username}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {user?.subscription?.plan || "free"} · 已登录
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href="/history"
                        className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md px-3 py-1 hover:border-gray-400 transition-colors"
                      >
                        历史记录
                      </a>
                      <button
                        onClick={handleLogout}
                        className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md px-3 py-1 hover:border-gray-400 transition-colors"
                      >
                        登出
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center space-x-3">
                    <div className="text-sm text-gray-500">匿名模式</div>
                    <a
                      href="/auth"
                      className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      登录/注册
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            实时热点
            <span className="text-indigo-600">大屏</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            实时监控多平台热门话题趋势，把握内容创作风向标
          </p>
        </div>

        {error && (
          <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="mt-12 space-y-8">
          {/* 小红书实时热点 */}
          {dashboardData?.xiaohongshuHotList && (
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  🔴 小红书实时热点
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({dashboardData.xiaohongshuHotList.items?.length || 0}条)
                  </span>
                </h2>
                <div className="text-sm text-gray-600">
                  更新时间:{" "}
                  {dashboardData.xiaohongshuHotList.fetchedAt
                    ? new Date(
                        dashboardData.xiaohongshuHotList.fetchedAt,
                      ).toLocaleString()
                    : "--"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {(dashboardData.xiaohongshuHotList.items || []).map(
                  (item: any, index: number) => (
                    <div
                      key={item.id}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-lg font-bold text-pink-600">
                          #{index + 1}
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.word_type && item.word_type !== "无" && (
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getWordTypeColor(item.word_type)}`}
                            >
                              {item.word_type}
                            </span>
                          )}
                          {item.rank_change !== 0 && (
                            <span
                              className={`text-xs px-1 ${item.rank_change > 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {item.rank_change > 0
                                ? `↑${item.rank_change}`
                                : `↓${Math.abs(item.rank_change)}`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="font-medium text-gray-900 text-sm leading-relaxed line-clamp-2">
                          {item.title}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {item.icon && (
                            <img
                              src={item.icon}
                              alt=""
                              className="w-4 h-4 rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                          <span className="text-xs text-gray-600">
                            {item.type}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-orange-600">
                          {formatScore(item.score)}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* 抖音实时热点 */}
          {dashboardData?.douyinHotList && (
            <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  🎵 抖音实时热点
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    ({dashboardData.douyinHotList.items?.length || 0}条)
                  </span>
                </h2>
                <div className="text-sm text-gray-600">
                  更新时间:{" "}
                  {dashboardData.douyinHotList.fetchedAt
                    ? new Date(
                        dashboardData.douyinHotList.fetchedAt,
                      ).toLocaleString()
                    : "--"}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {(dashboardData.douyinHotList.items || []).map(
                  (item: any, index: number) => (
                    <div
                      key={item.id}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all border border-gray-200"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-lg font-bold text-cyan-600">
                          #{index + 1}
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.word_type && item.word_type !== "无" && (
                            <span
                              className={`px-2 py-1 rounded text-xs font-medium ${getWordTypeColor(item.word_type)}`}
                            >
                              {item.word_type}
                            </span>
                          )}
                          {item.rank_change !== 0 && (
                            <span
                              className={`text-xs px-1 ${item.rank_change > 0 ? "text-green-600" : "text-red-600"}`}
                            >
                              {item.rank_change > 0
                                ? `↑${item.rank_change}`
                                : `↓${Math.abs(item.rank_change)}`}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="font-medium text-gray-900 text-sm leading-relaxed line-clamp-2">
                          {item.title}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {item.icon && (
                            <img
                              src={item.icon}
                              alt=""
                              className="w-4 h-4 rounded"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                          <span className="text-xs text-gray-600">
                            {item.type}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-cyan-600">
                          {formatScore(item.score)}
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
