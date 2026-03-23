"use client";

import { useState, useEffect } from "react";
import { Platform } from "@hotornot/shared";
import { getPlatformDisplayName } from "@/lib/platform-utils";
import SearchParamsWrapper from "@/components/SearchParamsWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useHistory } from "@/hooks/useHistory";
import { jumpToElement } from "@/lib/dom-utils";

function AccountAnalysisContent({ searchParams }: { searchParams: any }) {
  const [url, setUrl] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string>("");

  const { user, isLoggedIn, isCheckingAuth, handleLogout } = useAuth();
  const { history: accountHistory, isLoading: isLoadingHistory, refresh: refreshHistory } = useHistory("account", isLoggedIn, isCheckingAuth);

  // 处理URL参数
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (urlParam) {
      const decodedUrl = decodeURIComponent(urlParam);
      console.log("🔗 从URL参数获取到链接:", decodedUrl);
      setUrl(decodedUrl);
      // 标记需要自动分析
      setAutoAnalyze(true);
    }
  }, [searchParams]);

  // 新增状态来控制自动分析
  const [autoAnalyze, setAutoAnalyze] = useState(false);

  // 当URL更新且需要自动分析时，执行分析
  useEffect(() => {
    if (autoAnalyze && url.trim()) {
      console.log("🚀 开始自动分析:", url);
      setAutoAnalyze(false); // 重置标记
      handleAnalyzeWithUrl(url);
    }
  }, [url, autoAnalyze]);

  // 使用指定URL的分析函数
  const handleAnalyzeWithUrl = async (targetUrl: string) => {
    if (!targetUrl.trim()) return;

    setIsAnalyzing(true);
    setError("");
    setAnalysisResult(null);

    try {
      console.log("📡 发送分析请求:", targetUrl);
      const response = await fetch("/api/analysis/account", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: targetUrl }),
      });

      const data = await response.json();
      console.log("📊 分析结果:", data);

      if (data.success) {
        setAnalysisResult(data.data);
        // 分析完成后刷新历史记录
        if (isLoggedIn) {
          refreshHistory();
        }
        // 瞬间跳转到分析结果区域
        jumpToElement("analysis-result");
      } else {
        setError(data.error || "分析失败，请重试");
      }
    } catch (error) {
      console.error("❌ 分析请求失败:", error);
      setError("网络错误，请检查连接后重试");
    } finally {
      setIsAnalyzing(false);
    }
  };





  

  const handleAnalyze = async () => {
    if (!url.trim()) return;

    setIsAnalyzing(true);
    setError("");
    setAnalysisResult(null);

    try {
      const response = await fetch("/api/analysis/account", {
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
          refreshHistory();
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <AppHeader activePath="/analysis/account" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            账号深度
            <span className="text-green-600">分析</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            AI深度分析创作者账号，基于最近20个作品提供专业的内容策略和优化建议
          </p>
        </div>

        {/* 分析工具 */}
        <div className="mt-12 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                开始账号分析
              </h3>
              <p className="text-gray-600">
                输入创作者主页链接，AI将分析最近20个作品，提供专业的内容策略建议
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label
                  htmlFor="account-url"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  账号主页链接
                </label>
                <div className="flex rounded-md shadow-sm">
                  <input
                    type="url"
                    id="account-url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="flex-1 min-w-0 block w-full px-4 py-3 rounded-l-md border border-gray-300 focus:ring-green-500 focus:border-green-500 text-sm"
                    placeholder="粘贴抖音、小红书等平台的创作者主页链接..."
                  />
                  <button
                    onClick={handleAnalyze}
                    disabled={!url.trim() || isAnalyzing}
                    className="inline-flex items-center px-6 py-3 border border-l-0 border-gray-300 rounded-r-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  自动识别平台类型，分析账号数据和内容特征
                </div>
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
              <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600">
                <h3 className="text-lg font-semibold text-white">
                  账号分析结果
                </h3>
                {analysisResult.cached && (
                  <span className="text-green-100 text-sm">（来自缓存）</span>
                )}
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* 左侧：账号信息和最近作品表现 */}
                  <div className="space-y-6">
                    {/* 账号信息 */}
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-gray-900">
                        账号信息
                      </h4>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-3 mb-3">
                          {analysisResult.account.avatar && (
                            <img
                              src={analysisResult.account.avatar}
                              alt="Avatar"
                              className="w-12 h-12 rounded-full"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">
                              {analysisResult.account.accountName}
                            </p>
                            <span
                              className={`platform-${analysisResult.account.platform} px-2 py-1 rounded text-xs`}
                            >
                              {getPlatformDisplayName(
                                analysisResult.account.platform,
                              )}
                            </span>
                          </div>
                        </div>

                        {/* 指标数据 - 只显示作品数和获赞数 */}
                        <div className="grid grid-cols-2 gap-3 text-center">
                          <div className="bg-purple-50 rounded p-3">
                            <p className="text-lg font-bold text-purple-600">
                              {(
                                analysisResult.metrics.postsCount || 0
                              ).toLocaleString()}
                            </p>
                            <p className="text-sm text-purple-800">作品数</p>
                          </div>
                          <div className="bg-red-50 rounded p-3">
                            <p className="text-lg font-bold text-red-600">
                              {(
                                analysisResult.metrics.likesCount || 0
                              ).toLocaleString()}
                            </p>
                            <p className="text-sm text-red-800">获赞数</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 最近作品表现 */}
                    <div className="space-y-3">
                      <h4 className="text-lg font-semibold text-gray-900">
                        最近作品表现
                      </h4>
                      {analysisResult.recentPosts &&
                      analysisResult.recentPosts.length > 0 ? (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-2 max-h-80 overflow-y-auto">
                          {(analysisResult.recentPosts || [])
                            .slice(0, 10)
                            .map((post: any, index: number) => (
                              <div
                                key={index}
                                className="flex items-center justify-between py-2 px-3 hover:bg-white rounded"
                              >
                                <h6 className="font-medium text-gray-900 text-sm truncate flex-1 mr-3">
                                  {post.title ||
                                    post.desc ||
                                    post.description ||
                                    "无标题"}
                                </h6>
                                {(post.metrics?.likes || post.likes || 0) >
                                  0 && (
                                  <div className="flex-shrink-0 text-red-600 text-sm font-medium">
                                    ❤️{" "}
                                    {(
                                      post.metrics?.likes ||
                                      post.likes ||
                                      0
                                    ).toLocaleString()}
                                  </div>
                                )}
                              </div>
                            ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 text-center text-gray-600">
                          <p>暂无作品数据</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 右侧：AI分析 */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      AI 分析
                    </h4>

                    {/* 内容偏好 */}
                    <div className="bg-green-50 rounded-lg p-4">
                      <h5 className="font-medium text-green-800 mb-2">
                        📊 内容偏好
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {(
                          analysisResult.analysis.content?.contentPreferences ||
                          []
                        ).map((preference: string, index: number) => (
                          <span key={index} className="tag tag-success">
                            {preference}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 发布规律 */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h5 className="font-medium text-blue-800 mb-2">
                        ⏰ 发布规律
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-blue-700 mb-2">
                            发布频率：
                            {analysisResult.analysis.postingPattern
                              ?.frequency || "未知"}
                          </p>
                          <p className="text-sm text-blue-700">
                            一致性评分：
                            {analysisResult.analysis.postingPattern
                              ?.consistency || 0}
                            /10
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-blue-700 mb-2">
                            最佳发布时间：
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {(
                              analysisResult.analysis.postingPattern
                                ?.bestTimes || []
                            ).map((time: any, index: number) => (
                              <span
                                key={index}
                                className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded"
                              >
                                {time.hour}:00
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 优势分析 */}
                    <div className="bg-yellow-50 rounded-lg p-4">
                      <h5 className="font-medium text-yellow-800 mb-2">
                        💪 优势分析
                      </h5>
                      <p className="text-sm text-yellow-700">
                        {analysisResult.analysis.content?.strengthsAnalysis ||
                          "暂无分析"}
                      </p>
                    </div>

                    {/* 改进建议 */}
                    <div className="bg-orange-50 rounded-lg p-4">
                      <h5 className="font-medium text-orange-800 mb-2">
                        🎯 改进建议
                      </h5>
                      <ul className="space-y-1">
                        {(
                          analysisResult.analysis.content?.improvementAreas ||
                          []
                        ).map((area: string, index: number) => (
                          <li key={index} className="text-sm text-orange-700">
                            • {area}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 选题建议 */}
                    <div className="bg-purple-50 rounded-lg p-4">
                      <h5 className="font-medium text-purple-800 mb-2">
                        💡 选题建议
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {(
                          analysisResult.analysis.content?.topicSuggestions ||
                          []
                        ).map((topic: string, index: number) => (
                          <span key={index} className="tag tag-secondary">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* 趋势洞察 */}
                    <div className="bg-indigo-50 rounded-lg p-4">
                      <h5 className="font-medium text-indigo-800 mb-2">
                        🔮 趋势洞察
                      </h5>
                      <p className="text-sm text-indigo-700">
                        {analysisResult.analysis.content?.trendsInsight ||
                          "暂无洞察"}
                      </p>
                    </div>
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
                我的账号分析记录
              </h3>
              <p className="mt-2 text-gray-600">最近的账号分析历史记录</p>
            </div>

            {isLoadingHistory ? (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="loading-spinner w-6 h-6 mx-auto mb-4"></div>
                <p className="text-gray-600">加载历史记录中...</p>
              </div>
            ) : accountHistory.length > 0 ? (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600">
                  <h4 className="text-lg font-semibold text-white">
                    最近分析记录
                  </h4>
                </div>
                <div className="divide-y divide-gray-200">
                  {(accountHistory || []).map((record, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <span
                              className={`platform-${record.platform} px-2 py-1 rounded text-xs`}
                            >
                              {getPlatformDisplayName(record.platform)}
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              已完成
                            </span>
                          </div>
                          <h5 className="text-lg font-medium text-gray-900 mb-2">
                            {record.accountName}
                          </h5>
                          <p className="text-gray-600 text-sm mb-3">
                            {record.bio}
                          </p>
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
                              // 设置URL到输入框
                              setUrl(record.requestUrl);
                              // 直接显示已有的分析结果，不重新分析
                              setAnalysisResult({
                                account: record,
                                metrics: record.metrics || {},
                                analysis: record.analysis || {},
                                recentPosts: record.recentPosts || [],
                                timestamp: record.updatedAt || record.createdAt,
                                cached: true,
                              });
                              // 瞬间跳转到分析结果区域
                              jumpToElement("analysis-result");
                            }}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
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
                    className="text-green-600 hover:text-green-700 font-medium"
                  >
                    查看所有历史记录 →
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  还没有账号分析记录
                </h4>
                <p className="text-gray-600">
                  在上方输入账号链接开始您的第一次账号分析吧！
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

export default function AccountAnalysisPage() {
  return (
    <ErrorBoundary>
      <SearchParamsWrapper>
        {(searchParams) => <AccountAnalysisContent searchParams={searchParams} />}
      </SearchParamsWrapper>
    </ErrorBoundary>
  );
}
