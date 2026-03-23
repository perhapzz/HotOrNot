"use client";

import { useState, useEffect } from "react";
import { Platform } from "@hotornot/shared";
import { getPlatformDisplayName } from "@/lib/platform-utils";
import SearchParamsWrapper from "@/components/SearchParamsWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function HomePageContent({ searchParams }: { searchParams: any }) {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  // 用户状态（可选）
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 历史记录状态
  const [contentHistory, setContentHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 检查用户登录状态（静默检查，不影响使用）
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 处理URL参数
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) {
      setUrl(urlParam);
      // 自动触发分析
      setTimeout(() => {
        handleAnalyze();
      }, 1000); // 等待1秒让其他初始化完成
    }
  }, [searchParams]);

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
      // 静默失败，不影响匿名用户使用
      console.log("用户未登录，将以匿名模式使用");
    } finally {
      setIsCheckingAuth(false);
    }
  };

  // 加载内容分析历史记录
  const loadContentHistory = async () => {
    if (!isLoggedIn) return;

    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/user/history?type=content&limit=5", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success) {
        setContentHistory(data.data.analyses || []);
      }
    } catch (error) {
      console.error("加载历史记录失败:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 当用户登录状态改变时，加载历史记录
  useEffect(() => {
    if (isLoggedIn && !isCheckingAuth) {
      loadContentHistory();
    } else {
      setContentHistory([]);
    }
  }, [isLoggedIn, isCheckingAuth]);

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

  // 瞬间定位到目标位置
  const jumpToElement = (elementId: string) => {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        const elementRect = element.getBoundingClientRect();
        const elementTop = elementRect.top + window.pageYOffset;
        const targetScrollY = elementTop - 100; // 定位到元素顶部上方100px处

        window.scrollTo({
          top: targetScrollY,
          behavior: "instant", // 瞬间跳转
        });
      }
    }, 100); // 短暂延迟确保DOM更新
  };

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    setIsAnalyzing(true);
    setError("");
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/analysis/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.data);
        // 分析完成后刷新历史记录
        if (isLoggedIn) {
          loadContentHistory();
        }
        // 瞬间跳转到分析结果区域
        jumpToElement("analysis-result");
      } else {
        setError(data.error || "分析失败");
      }
    } catch (error) {
      console.error("分析失败:", error);
      setError("网络错误，请稍后重试");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">HotOrNot</h1>
              <span className="ml-2 text-sm text-gray-500">内容分析平台</span>
            </div>
            <div className="flex items-center space-x-8">
              <nav className="hidden md:flex space-x-8">
                <a href="/" className="text-blue-700 font-medium">
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
                <a
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900"
                >
                  数据大屏
                </a>
              </nav>

              {/* 用户状态 - 可选登录 */}
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
            发现内容
            <span className="text-blue-600">爆款密码</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            智能分析抖音、小红书平台内容，为创作者提供数据驱动的创作建议
          </p>
        </div>

        {/* 分析工具 */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                开始内容分析
              </h3>
              <p className="text-gray-600">
                输入内容链接，获得AI驱动的深度分析报告
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="url"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  内容链接
                </label>
                <div className="flex rounded-md shadow-sm">
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 min-w-0 block w-full px-4 py-3 rounded-l-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="粘贴抖音、小红书等平台的内容链接..."
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={!url.trim() || isAnalyzing}
                    className="inline-flex items-center px-6 py-3 border border-l-0 border-gray-300 rounded-r-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="loading-spinner w-4 h-4 mr-2"></div>
                        分析中...
                      </>
                    ) : (
                      "开始分析"
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">支持平台：</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="platform-douyin px-3 py-1 rounded-full text-xs font-medium">
                    {getPlatformDisplayName("douyin")}
                  </span>
                  <span className="platform-xiaohongshu px-3 py-1 rounded-full text-xs font-medium">
                    {getPlatformDisplayName("xiaohongshu")}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  自动识别平台类型，无需手动选择
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 分析结果展示 */}
        {error && (
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">分析失败</h3>
                  <p className="mt-1 text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {analysisResult && (
          <div id="analysis-result" className="mt-8 max-w-6xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-purple-600">
                <h3 className="text-lg font-semibold text-white">分析结果</h3>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 内容信息 */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      内容信息
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="font-medium text-gray-900">
                        {analysisResult.content.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">
                        {analysisResult.content.description}
                      </p>
                      <div className="flex items-center mt-3 space-x-4 text-sm text-gray-500">
                        <span>👤 {analysisResult.content.author}</span>
                        <span
                          className={`platform-${analysisResult.content.platform} px-2 py-1 rounded text-xs`}
                        >
                          {getPlatformDisplayName(
                            analysisResult.content.platform,
                          )}
                        </span>
                      </div>
                    </div>

                    {/* 数据指标 */}
                    <div className="space-y-4">
                      {/* 小红书等平台不提供观看量数据，移除此展示 */}
                      {analysisResult.content.metrics.views > 0 && (
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-blue-600">
                            {analysisResult.content.metrics.views.toLocaleString()}
                          </p>
                          <p className="text-sm text-blue-800">观看量</p>
                        </div>
                      )}
                      {/* 互动指标：点赞、评论、分享 - 与上方内容信息宽度对齐 */}
                      <div className="bg-gradient-to-r from-green-50 to-purple-50 rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                              {analysisResult.content.metrics.likes.toLocaleString()}
                            </p>
                            <p className="text-sm text-green-800">点赞</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">
                              {analysisResult.content.metrics.comments.toLocaleString()}
                            </p>
                            <p className="text-sm text-yellow-800">评论</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">
                              {analysisResult.content.metrics.shares.toLocaleString()}
                            </p>
                            <p className="text-sm text-purple-800">分享</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 分析结果 */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      AI 分析
                    </h4>

                    {/* 评分 */}
                    <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                      <div className="text-4xl font-bold text-blue-600">
                        {analysisResult.analysis.score}/10
                      </div>
                      <p className="text-sm text-gray-600 mt-1">综合评分</p>
                    </div>

                    {/* 优缺点 */}
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <h5 className="font-medium text-green-800 mb-2">
                          ✅ 优点
                        </h5>
                        <ul className="space-y-1">
                          {analysisResult.analysis.pros.map(
                            (pro: string, index: number) => (
                              <li
                                key={index}
                                className="text-sm text-green-700"
                              >
                                • {pro}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>

                      <div className="bg-red-50 rounded-lg p-4">
                        <h5 className="font-medium text-red-800 mb-2">
                          ❌ 缺点
                        </h5>
                        <ul className="space-y-1">
                          {analysisResult.analysis.cons.map(
                            (con: string, index: number) => (
                              <li key={index} className="text-sm text-red-700">
                                • {con}
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* 建议 */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-medium text-blue-800 mb-2">
                        💡 总体建议
                      </h5>
                      <p className="text-sm text-blue-700">
                        {analysisResult.analysis.recommendation}
                      </p>
                    </div>

                    {/* 标签 */}
                    <div>
                      <h5 className="font-medium text-gray-800 mb-2">
                        🏷️ 适合标签
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.analysis.tags.map(
                          (tag: string, index: number) => (
                            <span key={index} className="tag tag-primary">
                              {tag}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 登录用户的历史记录展示 */}
        {isLoggedIn && (
          <div className="mt-16 max-w-7xl mx-auto">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">
                我的内容分析记录
              </h3>
              <p className="mt-2 text-gray-600">最近的内容分析历史记录</p>
            </div>

            {isLoadingHistory ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="loading-spinner w-6 h-6 mx-auto mb-4"></div>
                <p className="text-gray-600">加载历史记录中...</p>
              </div>
            ) : contentHistory.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-600">
                  <h4 className="text-lg font-semibold text-white">
                    最近分析记录
                  </h4>
                </div>
                <div className="divide-y divide-gray-200">
                  {contentHistory.map((record, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span
                              className={`platform-${record.platform} px-2 py-1 rounded text-xs`}
                            >
                              {getPlatformDisplayName(record.platform)}
                            </span>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                record.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : record.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {record.status === "completed"
                                ? "已完成"
                                : record.status === "pending"
                                  ? "处理中"
                                  : "失败"}
                            </span>
                          </div>
                          <h5 className="text-lg font-medium text-gray-900 mb-2">
                            {record.title}
                          </h5>
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {record.description}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              分析时间:{" "}
                              {new Date(record.createdAt).toLocaleString(
                                "zh-CN",
                              )}
                            </span>
                            {record.analysis && (
                              <span className="text-blue-600 font-medium">
                                评分: {record.analysis.score}/10
                              </span>
                            )}
                          </div>
                          {record.metrics && (
                            <div className="mt-3 flex items-center space-x-4 text-sm">
                              {record.metrics.views > 0 && (
                                <span className="text-blue-600">
                                  👁 {record.metrics.views?.toLocaleString()}
                                </span>
                              )}
                              <span className="text-red-600">
                                ❤️ {record.metrics.likes?.toLocaleString()}
                              </span>
                              <span className="text-green-600">
                                💬 {record.metrics.comments?.toLocaleString()}
                              </span>
                              <span className="text-purple-600">
                                📤 {record.metrics.shares?.toLocaleString()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => {
                              console.log(
                                "🔍 查看详情 - 显示已有结果:",
                                record,
                              );
                              // 设置URL到输入框
                              setUrl(record.url);
                              // 直接显示已有的分析结果，不重新分析
                              setAnalysisResult({
                                content: {
                                  title: record.title,
                                  description: record.description,
                                  author:
                                    typeof record.author === "object"
                                      ? record.author.name
                                      : record.author,
                                  platform: record.platform,
                                  metrics: record.metrics || {},
                                },
                                analysis: record.analysis || {},
                                timestamp: record.updatedAt || record.createdAt,
                                cached: true,
                              });
                              // 查看缓存数据时也需要刷新历史记录（记录这次访问）
                              if (isLoggedIn) {
                                loadContentHistory();
                              }
                              // 瞬间跳转到分析结果区域
                              jumpToElement("analysis-result");
                            }}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            查看详情
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 bg-gray-50 text-center">
                  <a
                    href="/history"
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    查看所有历史记录 →
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  还没有分析记录
                </h4>
                <p className="text-gray-600">
                  在上方输入内容链接开始您的第一次分析吧！
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500">
            <p>&copy; 2024 HotOrNot. 智能内容分析平台.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function HomePage() {
  return (
    <ErrorBoundary>
      <SearchParamsWrapper>
        {(searchParams) => <HomePageContent searchParams={searchParams} />}
      </SearchParamsWrapper>
    </ErrorBoundary>
  );
}
