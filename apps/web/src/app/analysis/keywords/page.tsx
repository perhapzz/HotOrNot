"use client";

import { useState, useEffect } from "react";
import { Platform } from "@hotornot/shared";
import {
  getPlatformDisplayName,
  getPlatformNameByEnum,
} from "@/lib/platform-utils";
import SearchParamsWrapper from "@/components/SearchParamsWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MobileNav } from "@/components/MobileNav";

function KeywordsAnalysisContent({ searchParams }: { searchParams: any }) {
  const [keyword, setKeyword] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>(
    Platform.XIAOHONGSHU,
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  // 用户状态（可选）
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 历史记录状态
  const [keywordHistory, setKeywordHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // 检查用户登录状态
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // 处理URL参数
  useEffect(() => {
    const keywordParam = searchParams.get("keyword");
    const platformParam = searchParams.get("platform");

    if (keywordParam) {
      setKeyword(keywordParam);

      // 设置平台
      if (platformParam) {
        const platform = platformParam.toLowerCase();
        if (platform === "douyin") {
          setSelectedPlatform(Platform.DOUYIN);
        } else if (platform === "xiaohongshu") {
          setSelectedPlatform(Platform.XIAOHONGSHU);
        }
      }

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

  // 加载关键词分析历史记录
  const loadKeywordHistory = async () => {
    if (!isLoggedIn) return;

    console.log("🔄 开始加载关键词分析历史记录...");
    setIsLoadingHistory(true);
    try {
      const response = await fetch("/api/user/history?type=keyword&limit=5", {
        method: "GET",
        credentials: "include",
      });

      console.log("📡 历史记录API响应状态:", response.status);
      const data = await response.json();
      console.log("📊 历史记录API响应数据:", data);

      if (data.success && data.data && data.data.analyses) {
        // 设置关键词分析记录 - 注意这里应该是 data.data.analyses
        setKeywordHistory(data.data.analyses);
        console.log(
          "✅ 成功加载关键词分析历史记录:",
          data.data.analyses.length,
          "条",
        );
        console.log("📋 历史记录详情:", data.data.analyses);
      } else {
        console.log("⚠️ 没有找到关键词分析历史记录");
        setKeywordHistory([]);
      }
    } catch (error) {
      console.error("❌ 加载历史记录失败:", error);
      setKeywordHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // 当用户登录状态改变时，加载历史记录
  useEffect(() => {
    if (isLoggedIn && !isCheckingAuth) {
      loadKeywordHistory();
    } else {
      setKeywordHistory([]);
    }
  }, [isLoggedIn, isCheckingAuth]);

  const handlePlatformSelect = (platform: Platform) => {
    setSelectedPlatform(platform);
  };

  // 瞬间定位到目标位置
  const jumpToElement = (elementId: string) => {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      console.log("🎯 尝试跳转到元素:", elementId, element);
      if (element) {
        const elementRect = element.getBoundingClientRect();
        const elementTop = elementRect.top + window.pageYOffset;
        const targetScrollY = elementTop - 100; // 定位到元素顶部上方100px处

        console.log("📍 跳转位置:", targetScrollY);
        window.scrollTo({
          top: targetScrollY,
          behavior: "instant", // 瞬间跳转
        });
      } else {
        console.log("❌ 未找到目标元素:", elementId);
      }
    }, 200); // 增加延迟确保DOM完全更新
  };

  const handleAnalyze = async () => {
    if (!keyword.trim()) return;

    setIsAnalyzing(true);
    setError("");
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/analysis/keyword", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword: keyword.trim(),
          platforms: [selectedPlatform],
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAnalysisResult(data.data);
        // 分析完成后刷新历史记录
        if (isLoggedIn) {
          loadKeywordHistory();
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

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "rising":
        return "📈";
      case "stable":
        return "➡️";
      case "declining":
        return "📉";
      default:
        return "❓";
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case "rising":
        return "上升";
      case "stable":
        return "稳定";
      case "declining":
        return "下降";
      default:
        return "未知";
    }
  };

  const getRecommendationColor = (level: string) => {
    switch (level) {
      case "high":
        return "text-green-600 bg-green-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getRecommendationText = (level: string) => {
    switch (level) {
      case "high":
        return "高";
      case "medium":
        return "中";
      case "low":
        return "低";
      default:
        return "未知";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold text-gray-900">
                HotOrNot
              </a>
              <span className="ml-2 text-sm text-gray-500">关键词分析</span>
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
                  className="text-purple-700 font-medium"
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
              <MobileNav />

              {/* 用户状态 */}
              <div className="flex items-center">
                {isCheckingAuth ? (
                  <div className="text-sm text-gray-500">
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin"></div>
                  </div>
                ) : isLoggedIn ? (
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
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
                      className="text-sm bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            关键词热度
            <span className="text-purple-600">分析</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            发现热门关键词趋势，找到爆文共性特征，优化内容策略
          </p>
        </div>

        {/* 分析工具 */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                开始关键词分析
              </h3>
              <p className="text-gray-600">
                输入关键词，发现热门趋势和内容创作机会
              </p>
            </div>

            <div className="space-y-6">
              {/* 关键词输入 */}
              <div>
                <label
                  htmlFor="keyword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  关键词
                </label>
                <input
                  type="text"
                  id="keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500 text-sm"
                  placeholder="输入要分析的关键词，如：桌搭、治愈系vlog..."
                />
              </div>

              {/* 平台选择 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-3">
                  <span className="font-medium">选择分析平台：</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[Platform.DOUYIN, Platform.XIAOHONGSHU].map((platform) => {
                    const platformName = getPlatformNameByEnum(platform);
                    return (
                      <label
                        key={platform}
                        className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPlatform === platform}
                          onChange={() => handlePlatformSelect(platform)}
                          className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                        />
                        <span
                          className={`platform-${platform} px-3 py-1 rounded-full text-xs font-medium`}
                        >
                          {platformName}
                        </span>
                      </label>
                    );
                  })}
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  选择一个平台进行关键词热度分析
                </div>
              </div>

              {/* 分析按钮 */}
              <div>
                <button
                  onClick={handleAnalyze}
                  disabled={!keyword.trim() || isAnalyzing}
                  className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-md bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
          </div>
        </div>

        {/* 错误显示 */}
        {error && (
          <div className="mt-8 max-w-4xl mx-auto">
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

        {/* 分析结果展示 */}
        {analysisResult && (
          <div id="analysis-result" className="mt-8 max-w-7xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    关键词分析结果
                  </h3>
                  <div className="flex items-center space-x-2">
                    {analysisResult.cached && (
                      <span className="text-purple-100 text-sm bg-purple-600 px-2 py-1 rounded">
                        缓存{" "}
                        {analysisResult.cacheAge &&
                          `(${analysisResult.cacheAge})`}
                      </span>
                    )}
                    <span className="text-purple-100 text-sm bg-purple-600 px-2 py-1 rounded">
                      实时数据
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* 关键词概览 */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-semibold text-gray-900">
                      "{analysisResult.keyword}" 分析概览
                    </h4>
                    <div className="flex items-center space-x-2">
                      {(analysisResult.platforms || []).map(
                        (platform: string) => {
                          const platformName = getPlatformDisplayName(platform);
                          return (
                            <span
                              key={platform}
                              className={`platform-${platform} px-2 py-1 rounded text-xs`}
                            >
                              {platformName}
                            </span>
                          );
                        },
                      )}
                    </div>
                  </div>
                </div>

                {/* 核心指标 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {analysisResult.analysis.hotScore}/10
                    </div>
                    <p className="text-sm text-red-800">热度评分</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {analysisResult.analysis.competitiveness}/10
                    </div>
                    <p className="text-sm text-blue-800">竞争激烈度</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 text-center">
                    <div className="text-lg font-bold text-green-600">
                      {getTrendIcon(analysisResult.analysis.trendDirection)}{" "}
                      {getTrendText(analysisResult.analysis.trendDirection)}
                    </div>
                    <p className="text-sm text-green-800">趋势方向</p>
                  </div>
                  <div
                    className={`rounded-lg p-4 text-center ${getRecommendationColor(analysisResult.analysis.recommendationLevel)}`}
                  >
                    <div className="text-lg font-bold">
                      {getRecommendationText(
                        analysisResult.analysis.recommendationLevel,
                      )}
                    </div>
                    <p className="text-sm">推荐程度</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 深度洞察 */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-gray-900">
                      深度洞察
                    </h5>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <h6 className="font-medium text-blue-800 mb-2">
                        📊 数据洞察
                      </h6>
                      <p className="text-sm text-blue-700">
                        {analysisResult.analysis.insights}
                      </p>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <h6 className="font-medium text-purple-800 mb-2">
                        #️⃣ 推荐标签
                      </h6>
                      <div className="flex flex-wrap gap-2">
                        {(analysisResult.analysis.suggestedHashtags || []).map(
                          (tag: string, index: number) => (
                            <span key={index} className="tag tag-secondary">
                              #{tag}
                            </span>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 创作建议 */}
                  <div className="space-y-4">
                    <h5 className="text-lg font-semibold text-gray-900">
                      创作建议
                    </h5>

                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h6 className="font-medium text-yellow-800 mb-2">
                        💡 内容建议
                      </h6>
                      <ul className="space-y-1">
                        {(analysisResult.analysis.contentSuggestions || []).map(
                          (suggestion: string, index: number) => (
                            <li key={index} className="text-sm text-yellow-700">
                              • {suggestion}
                            </li>
                          ),
                        )}
                      </ul>
                    </div>

                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h6 className="font-medium text-indigo-800 mb-2">
                        ⏰ 发布时机
                      </h6>
                      <ul className="space-y-1">
                        {(
                          analysisResult.analysis.timingRecommendations || []
                        ).map((timing: string, index: number) => (
                          <li key={index} className="text-sm text-indigo-700">
                            • {timing}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 热门内容 */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h5 className="text-lg font-semibold text-gray-900 mb-4">
                    相关热门内容
                  </h5>
                  <div className="columns-1 md:columns-2 lg:columns-3 gap-4 space-y-4">
                    {(analysisResult.topContent || [])
                      .slice(0, 9)
                      .map((content: any, index: number) => (
                        <div
                          key={index}
                          className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow break-inside-avoid mb-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`platform-${content.platform} px-2 py-1 rounded text-xs`}
                            >
                              {getPlatformDisplayName(content.platform)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(
                                content.publishedAt,
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          {/* 图片展示 - 优先显示 coverImage */}
                          {content.coverImage ? (
                            <div className="mb-3">
                              <img
                                src={content.coverImage}
                                alt={content.title}
                                className="w-full h-auto max-h-48 object-contain rounded bg-gray-50"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            </div>
                          ) : (
                            content.images &&
                            content.images.length > 0 && (
                              <div className="mb-3">
                                {/* 如果没有 coverImage，才显示 images */}
                                {content.images.length === 1 ? (
                                  <img
                                    src={content.images[0]}
                                    alt={content.title}
                                    className="w-full h-auto max-h-48 object-contain rounded bg-gray-50"
                                    onError={(e) => {
                                      (
                                        e.target as HTMLImageElement
                                      ).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="grid grid-cols-2 gap-1">
                                    {content.images
                                      .slice(0, 4)
                                      .map((img: string, imgIndex: number) => (
                                        <img
                                          key={imgIndex}
                                          src={img}
                                          alt={`${content.title} - 图片 ${imgIndex + 1}`}
                                          className="w-full h-auto max-h-20 object-contain rounded bg-gray-50"
                                          onError={(e) => {
                                            (
                                              e.target as HTMLImageElement
                                            ).style.display = "none";
                                          }}
                                        />
                                      ))}
                                    {content.images.length > 4 && (
                                      <div className="w-full h-16 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-500">
                                        +{content.images.length - 4}张
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          )}

                          <h6 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                            {content.title}
                          </h6>

                          {/* 作者信息 */}
                          <div className="flex items-center mb-3">
                            {content.authorAvatar && (
                              <img
                                src={content.authorAvatar}
                                alt={content.author}
                                className="w-5 h-5 rounded-full mr-2"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                            )}
                            <p className="text-xs text-gray-600">
                              👤 {content.author}
                            </p>
                          </div>

                          {/* 互动数据 */}
                          <div className="flex flex-wrap gap-2 text-xs">
                            {content.metrics.views > 0 && (
                              <div className="text-blue-600">
                                👁 {content.metrics.views.toLocaleString()}
                              </div>
                            )}
                            <div className="text-red-600">
                              ❤️ {content.metrics.likes.toLocaleString()}
                            </div>
                            {content.metrics.comments > 0 && (
                              <div className="text-gray-600">
                                💬 {content.metrics.comments.toLocaleString()}
                              </div>
                            )}
                            {content.metrics.collected > 0 && (
                              <div className="text-yellow-600">
                                ⭐ {content.metrics.collected.toLocaleString()}
                              </div>
                            )}
                            {content.metrics.shares > 0 && (
                              <div className="text-purple-600">
                                📤 {content.metrics.shares.toLocaleString()}
                              </div>
                            )}
                          </div>

                          {/* 笔记链接 */}
                          {content.url && (
                            <div className="mt-3">
                              <a
                                href={content.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-purple-600 hover:text-purple-800 underline"
                              >
                                查看原笔记 →
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 登录用户的历史记录展示 */}
        {isLoggedIn && (
          <div className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900">
                我的关键词分析记录
              </h3>
              <p className="mt-2 text-gray-600">最近的关键词分析历史记录</p>
            </div>

            {isLoadingHistory ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="loading-spinner w-6 h-6 mx-auto mb-4"></div>
                <p className="text-gray-600">加载历史记录中...</p>
              </div>
            ) : keywordHistory.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-indigo-600">
                  <h4 className="text-lg font-semibold text-white">
                    最近分析记录
                  </h4>
                </div>
                <div className="divide-y divide-gray-200">
                  {keywordHistory.map((record, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {(record.platforms || []).map(
                              (platform: string, i: number) => (
                                <span
                                  key={i}
                                  className={`platform-${platform} px-2 py-1 rounded text-xs`}
                                >
                                  {getPlatformDisplayName(platform)}
                                </span>
                              ),
                            )}
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              已完成
                            </span>
                          </div>
                          <div className="mb-2">
                            <span className="text-base font-medium text-gray-900">
                              {record.keyword}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>
                              分析时间:{" "}
                              {new Date(record.createdAt).toLocaleString(
                                "zh-CN",
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <button
                            onClick={() => {
                              console.log(
                                "🔍 查看详情 - 显示已有结果:",
                                record,
                              );
                              // 设置关键词到输入框
                              setKeyword(record.keyword);
                              // 设置平台选择（取第一个平台）
                              setSelectedPlatform(
                                record.platforms?.[0] || Platform.XIAOHONGSHU,
                              );
                              // 直接显示已有的分析结果，不重新分析
                              setAnalysisResult({
                                keyword: record.keyword,
                                platforms: record.platforms,
                                analysis: record.analysis || {},
                                topContent: record.topContent || [],
                                timestamp: record.updatedAt || record.createdAt,
                                cached: true,
                              });
                              // 瞬间跳转到分析结果区域
                              jumpToElement("analysis-result");
                            }}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
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
                    className="text-purple-600 hover:text-purple-700 font-medium"
                  >
                    查看所有历史记录 →
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  还没有关键词分析记录
                </h4>
                <p className="text-gray-600">
                  在上方输入关键词开始您的第一次关键词分析吧！
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

export default function KeywordsAnalysisPage() {
  return (
    <ErrorBoundary>
      <SearchParamsWrapper>
        {(searchParams) => (
          <KeywordsAnalysisContent searchParams={searchParams} />
        )}
      </SearchParamsWrapper>
    </ErrorBoundary>
  );
}
