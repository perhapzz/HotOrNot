"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Eye,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getPlatformStyle, getPlatformDisplayName } from "@/lib/platform-utils";
import {
  getTrendDirectionText,
  getRecommendationLevelText,
  getTrendDirectionColor,
  getRecommendationLevelColor
} from "@/lib/display-utils";

export default function HistoryPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [error, setError] = useState("");
  // 真实的统计数字
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    contentAnalyses: 0,
    accountAnalyses: 0,
    keywordAnalyses: 0,
  });

  // 分析详情显示状态
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  useEffect(() => {
    checkAuthAndLoadHistory();
  }, []);

  const checkAuthAndLoadHistory = async () => {
    try {
      // 检查登录状态
      const response = await fetch("/api/auth/login", {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (data.success && data.data.authenticated) {
        setUser(data.data.user);
        setIsLoggedIn(true);
        // 加载历史记录
        await loadAnalysisHistory();
      } else {
        setError("请先登录以查看分析历史");
      }
    } catch (error) {
      setError("加载失败，请刷新重试");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAnalysisHistory = async () => {
    try {
      // 同时加载内容分析、账号分析和关键词分析历史记录
      const [contentResponse, accountResponse, keywordResponse] =
        await Promise.all([
          fetch("/api/user/history?type=content", {
            method: "GET",
            credentials: "include",
          }),
          fetch("/api/user/history?type=account", {
            method: "GET",
            credentials: "include",
          }),
          fetch("/api/user/history?type=keyword", {
            method: "GET",
            credentials: "include",
          }),
        ]);

      const [contentData, accountData, keywordData] = await Promise.all([
        contentResponse.json(),
        accountResponse.json(),
        keywordResponse.json(),
      ]);

      const allAnalyses = [];
      let contentTotal = 0;
      let accountTotal = 0;
      let keywordTotal = 0;

      // 添加内容分析记录
      if (contentData.success && contentData.data?.analyses) {
        const contentAnalyses = contentData.data.analyses.map(
          (analysis: any) => ({
            ...analysis,
            analysisType: "content",
          }),
        );
        allAnalyses.push(...contentAnalyses);
        // 使用API返回的总数，而不是返回的记录数（可能受分页限制）
        contentTotal =
          contentData.data.pagination?.total || contentAnalyses.length;
      }

      // 添加账号分析记录
      if (accountData.success && accountData.data) {
        const accountAnalyses = accountData.data.map((analysis: any) => ({
          ...analysis,
          analysisType: "account",
        }));
        allAnalyses.push(...accountAnalyses);
        // 账号分析API的pagination在顶层，不在data中
        accountTotal = accountData.pagination?.total || accountAnalyses.length;
      }

      // 添加关键词分析记录
      if (keywordData.success && keywordData.data?.analyses) {
        const keywordAnalyses = keywordData.data.analyses.map(
          (analysis: any) => ({
            ...analysis,
            analysisType: "keyword",
          }),
        );
        allAnalyses.push(...keywordAnalyses);
        keywordTotal =
          keywordData.data.pagination?.total || keywordAnalyses.length;
      }

      // 按创建时间倒序排列
      allAnalyses.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

      setAnalyses(allAnalyses);

      // 更新统计数字，使用API查询到的实际总数
      setStats({
        totalAnalyses: contentTotal + accountTotal + keywordTotal,
        contentAnalyses: contentTotal,
        accountAnalyses: accountTotal,
        keywordAnalyses: keywordTotal,
      });

      console.log(
        `📊 统计更新: 内容分析=${contentTotal}, 账号分析=${accountTotal}, 关键词分析=${keywordTotal}, 总计=${contentTotal + accountTotal + keywordTotal}`,
      );
    } catch (error) {
      console.error("加载历史记录失败:", error);
    }
  };

  // 获取分析详情
  const fetchAnalysisDetail = async (analysis: any) => {
    setIsLoadingDetail(true);
    try {
      // 获取分析记录的ID（可能是_id或analysisId）
      const recordId = analysis._id || analysis.analysisId || analysis.id;

      if (!recordId) {
        console.error("❌ 未找到分析记录ID:", analysis);
        return;
      }

      console.log("🔍 获取分析详情:", recordId, "类型:", analysis.analysisType);

      // 根据analysisType调用对应的API获取详细数据
      let response;

      if (analysis.analysisType === "content") {
        response = await fetch(`/api/user/analysis/content/${recordId}`, {
          method: "GET",
          credentials: "include",
        });
      } else if (analysis.analysisType === "account") {
        response = await fetch(`/api/user/analysis/account/${recordId}`, {
          method: "GET",
          credentials: "include",
        });
      } else if (analysis.analysisType === "keyword") {
        response = await fetch(`/api/user/analysis/keyword/${recordId}`, {
          method: "GET",
          credentials: "include",
        });
      }

      if (response) {
        const data = await response.json();
        if (data.success) {
          console.log("✅ 获取分析详情成功:", data.data);
          setSelectedAnalysis({ ...analysis, detail: data.data });
        } else {
          console.error("❌ 获取分析详情失败:", data.error);
        }
      }
    } catch (error) {
      console.error("❌ 获取分析详情失败:", error);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("zh-CN");
  };

  const getPlatformBadge = (platform: string) => {
    const platformInfo = getPlatformStyle(platform);

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${platformInfo.color}`}
      >
        {platformInfo.name}
      </span>
    );
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">需要登录</h2>
          <p className="text-gray-600 mb-6">请先登录以查看您的分析历史记录</p>
          <div className="space-y-3">
            <a
              href="/auth"
              className="w-full inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              登录/注册
            </a>
            <a
              href="/"
              className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              返回首页
            </a>
          </div>
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
              <span className="ml-2 text-sm text-gray-500">分析历史</span>
            </div>
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
              <a
                href="/dashboard"
                className="text-gray-700 hover:text-gray-900"
              >
                数据大屏
              </a>
              <a href="/history" className="text-blue-700 font-medium">
                历史记录
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">分析历史记录</h1>
          <p className="mt-2 text-gray-600">
            欢迎回来，{user?.displayName || user?.username}！
            这里是您的所有分析记录。
          </p>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">总分析次数</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalAnalyses}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">内容分析</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.contentAnalyses}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-purple-600"
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">账号分析</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.accountAnalyses}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-yellow-600"
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
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">关键词分析</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.keywordAnalyses}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 分析记录列表 */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              最近的分析记录
            </h3>
          </div>

          {analyses.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                暂无分析记录
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                开始使用我们的分析功能吧！
              </p>
              <div className="mt-6">
                <a
                  href="/"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  开始分析
                </a>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {analyses.map((analysis, index) => (
                <div key={index} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3">
                        {analysis.analysisType === "keyword"
                          ? // 关键词分析显示多个平台标签
                            (analysis.platforms || []).map(
                              (platform: string, index: number) => (
                                <span
                                  key={index}
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPlatformStyle(platform).color}`}
                                >
                                  {getPlatformDisplayName(platform)}
                                </span>
                              ),
                            )
                          : // 内容分析和账号分析显示单个平台标签
                            getPlatformBadge(analysis.platform)}
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {analysis.status === "completed"
                            ? "已完成"
                            : analysis.status === "pending"
                              ? "处理中"
                              : "失败"}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            analysis.analysisType === "content"
                              ? "bg-blue-100 text-blue-800"
                              : analysis.analysisType === "account"
                                ? "bg-purple-100 text-purple-800"
                                : "bg-green-100 text-green-800"
                          }`}
                        >
                          {analysis.analysisType === "content"
                            ? "内容分析"
                            : analysis.analysisType === "account"
                              ? "账号分析"
                              : "关键词分析"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-900 truncate">
                        {analysis.analysisType === "content"
                          ? analysis.title || "内容分析"
                          : analysis.analysisType === "account"
                            ? analysis.accountName || "账号分析"
                            : analysis.keyword || "关键词分析"}
                      </p>
                      {analysis.analysisType === "content" &&
                        analysis.author && (
                          <p className="mt-1 text-sm text-gray-500 truncate">
                            作者:{" "}
                            {typeof analysis.author === "object"
                              ? analysis.author.name
                              : analysis.author}
                          </p>
                        )}
                      {analysis.analysisType === "account" && (
                        <p className="mt-1 text-sm text-gray-500 truncate">
                          账号ID: {analysis.accountId}
                        </p>
                      )}
                      <p className="mt-1 text-sm text-gray-500 truncate">
                        {analysis.requestUrl || analysis.url}
                      </p>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <span>分析时间: {formatDate(analysis.createdAt)}</span>
                        {analysis.analysis &&
                          analysis.analysis.overallScore && (
                            <span className="ml-4">
                              评分: {analysis.analysis.overallScore}/10
                            </span>
                          )}
                        {analysis.analysis && analysis.analysis.score && (
                          <span className="ml-4">
                            评分: {analysis.analysis.score}/10
                          </span>
                        )}
                        {analysis.metrics &&
                          analysis.metrics.followersCount && (
                            <span className="ml-4">
                              粉丝数: {analysis.metrics.followersCount}
                            </span>
                          )}
                        {analysis.metrics && analysis.metrics.likes && (
                          <span className="ml-4">
                            点赞数: {analysis.metrics.likes}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => fetchAnalysisDetail(analysis)}
                        disabled={isLoadingDetail}
                        className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                      >
                        {isLoadingDetail ? "加载中..." : "查看详情"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* 分析详情模态框 */}
      {selectedAnalysis && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity"
              aria-hidden="true"
            >
              <div
                className="absolute inset-0 bg-gray-500 opacity-75"
                onClick={() => setSelectedAnalysis(null)}
              ></div>
            </div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    分析详情
                  </h3>
                  <button
                    onClick={() => setSelectedAnalysis(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* 根据分析类型显示不同的详情 */}
                {selectedAnalysis.detail && (
                  <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                    {selectedAnalysis.analysisType === "keyword" && (
                      <div>
                        <h4 className="text-xl font-semibold text-gray-900 mb-4">
                          "{selectedAnalysis.detail.keyword}" 分析概览
                        </h4>

                        {/* 核心指标 */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {selectedAnalysis.detail.analysis?.hotScore || 0}
                              /10
                            </div>
                            <p className="text-sm text-red-800">热度评分</p>
                          </div>
                          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {selectedAnalysis.detail.analysis
                                ?.competitiveness || 0}
                              /10
                            </div>
                            <p className="text-sm text-blue-800">竞争激烈度</p>
                          </div>
                          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 text-center">
                            <div className={`text-lg font-bold ${getTrendDirectionColor(selectedAnalysis.detail.analysis?.trendDirection || '')}`}>
                              {getTrendDirectionText(selectedAnalysis.detail.analysis?.trendDirection || '')}
                            </div>
                            <p className="text-sm text-green-800">趋势方向</p>
                          </div>
                          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 text-center">
                            <div className={`text-lg font-bold ${getRecommendationLevelColor(selectedAnalysis.detail.analysis?.recommendationLevel || '')}`}>
                              {getRecommendationLevelText(selectedAnalysis.detail.analysis?.recommendationLevel || '')}
                            </div>
                            <p className="text-sm text-yellow-800">推荐程度</p>
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
                                {selectedAnalysis.detail.analysis?.insights ||
                                  "暂无洞察"}
                              </p>
                            </div>

                            <div className="bg-purple-50 rounded-lg p-4">
                              <h6 className="font-medium text-purple-800 mb-2">
                                #️⃣ 推荐标签
                              </h6>
                              <div className="flex flex-wrap gap-2">
                                {(
                                  selectedAnalysis.detail.analysis
                                    ?.suggestedHashtags || []
                                ).map((tag: string, index: number) => (
                                  <span
                                    key={index}
                                    className="bg-purple-200 text-purple-800 px-2 py-1 rounded text-xs"
                                  >
                                    #{tag}
                                  </span>
                                ))}
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
                                {(
                                  selectedAnalysis.detail.analysis
                                    ?.contentSuggestions || []
                                ).map((suggestion: string, index: number) => (
                                  <li
                                    key={index}
                                    className="text-sm text-yellow-700"
                                  >
                                    • {suggestion}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div className="bg-indigo-50 rounded-lg p-4">
                              <h6 className="font-medium text-indigo-800 mb-2">
                                ⏰ 发布时机
                              </h6>
                              <ul className="space-y-1">
                                {(
                                  selectedAnalysis.detail.analysis
                                    ?.timingRecommendations || []
                                ).map((timing: string, index: number) => (
                                  <li
                                    key={index}
                                    className="text-sm text-indigo-700"
                                  >
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
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(selectedAnalysis.detail.topContent || [])
                              .slice(0, 6)
                              .map((content: any, index: number) => (
                                <div
                                  key={index}
                                  className="bg-gray-50 rounded-lg p-4"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span
                                      className={`platform-${content.platform} px-2 py-1 rounded text-xs`}
                                    >
                                      {getPlatformDisplayName(content.platform)}
                                    </span>
                                  </div>
                                  <h6 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">
                                    {content.title}
                                  </h6>
                                  <div className="flex flex-wrap gap-2 text-xs">
                                    <div className="text-red-600">
                                      ❤️{" "}
                                      {(
                                        content.metrics?.likes || 0
                                      ).toLocaleString()}
                                    </div>
                                    {content.metrics?.comments > 0 && (
                                      <div className="text-gray-600">
                                        💬{" "}
                                        {content.metrics.comments.toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedAnalysis.analysisType === "account" && (
                      <div>
                        <h4 className="text-lg font-semibold mb-4">
                          账号分析：{selectedAnalysis.detail.accountName}
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* 账号信息 */}
                          <div className="space-y-3">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center space-x-3 mb-3">
                                {selectedAnalysis.detail.avatar && (
                                  <img
                                    src={selectedAnalysis.detail.avatar}
                                    alt="Avatar"
                                    className="w-12 h-12 rounded-full"
                                  />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {selectedAnalysis.detail.accountName}
                                  </p>
                                  <span
                                    className={`platform-${selectedAnalysis.detail.platform} px-2 py-1 rounded text-xs`}
                                  >
                                    {getPlatformDisplayName(
                                      selectedAnalysis.detail.platform,
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* 指标数据 */}
                              <div className="grid grid-cols-2 gap-3 text-center">
                                <div className="bg-purple-50 rounded p-3">
                                  <p className="text-lg font-bold text-purple-600">
                                    {(
                                      selectedAnalysis.detail.metrics
                                        ?.postsCount || 0
                                    ).toLocaleString()}
                                  </p>
                                  <p className="text-sm text-purple-800">
                                    作品数
                                  </p>
                                </div>
                                <div className="bg-red-50 rounded p-3">
                                  <p className="text-lg font-bold text-red-600">
                                    {(
                                      selectedAnalysis.detail.metrics
                                        ?.likesCount || 0
                                    ).toLocaleString()}
                                  </p>
                                  <p className="text-sm text-red-800">获赞数</p>
                                </div>
                              </div>
                            </div>

                            {/* 最近作品表现 */}
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 mb-2">
                                最近作品表现
                              </h5>
                              {selectedAnalysis.detail.recentPosts &&
                              selectedAnalysis.detail.recentPosts.length > 0 ? (
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                  {selectedAnalysis.detail.recentPosts
                                    .slice(0, 5)
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
                                        {(post.metrics?.likes ||
                                          post.likes ||
                                          0) > 0 && (
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
                                <p className="text-gray-600 text-sm">
                                  暂无作品数据
                                </p>
                              )}
                            </div>
                          </div>

                          {/* AI分析 */}
                          <div className="space-y-4">
                            <h5 className="text-lg font-semibold text-gray-900">
                              AI 分析
                            </h5>

                            {/* 内容偏好 */}
                            <div className="bg-green-50 rounded-lg p-4">
                              <h6 className="font-medium text-green-800 mb-2">
                                📊 内容偏好
                              </h6>
                              <div className="flex flex-wrap gap-2">
                                {(
                                  selectedAnalysis.detail.analysis?.content
                                    ?.contentPreferences || []
                                ).map((preference: string, index: number) => (
                                  <span
                                    key={index}
                                    className="bg-green-200 text-green-800 px-2 py-1 rounded text-xs"
                                  >
                                    {preference}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* 发布规律 */}
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h6 className="font-medium text-blue-800 mb-2">
                                ⏰ 发布规律
                              </h6>
                              <div className="text-sm text-blue-700 space-y-1">
                                <p>
                                  发布频率：
                                  {selectedAnalysis.detail.analysis
                                    ?.postingPattern?.frequency || "未知"}
                                </p>
                                <p>
                                  一致性评分：
                                  {selectedAnalysis.detail.analysis
                                    ?.postingPattern?.consistency || 0}
                                  /10
                                </p>
                              </div>
                            </div>

                            {/* 优势分析 */}
                            <div className="bg-yellow-50 rounded-lg p-4">
                              <h6 className="font-medium text-yellow-800 mb-2">
                                💪 优势分析
                              </h6>
                              <p className="text-sm text-yellow-700">
                                {selectedAnalysis.detail.analysis?.content
                                  ?.strengthsAnalysis || "暂无分析"}
                              </p>
                            </div>

                            {/* 改进建议 */}
                            <div className="bg-orange-50 rounded-lg p-4">
                              <h6 className="font-medium text-orange-800 mb-2">
                                🎯 改进建议
                              </h6>
                              <ul className="space-y-1">
                                {(
                                  selectedAnalysis.detail.analysis?.content
                                    ?.improvementAreas || []
                                ).map((area: string, index: number) => (
                                  <li
                                    key={index}
                                    className="text-sm text-orange-700"
                                  >
                                    • {area}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedAnalysis.analysisType === "content" && (
                      <div>
                        <h4 className="text-lg font-semibold mb-4">
                          内容分析结果
                        </h4>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* 内容信息 */}
                          <div className="space-y-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <p className="font-medium text-gray-900">
                                {selectedAnalysis.detail.title || "内容标题"}
                              </p>
                              <p className="text-sm text-gray-600 mt-2">
                                {selectedAnalysis.detail.description ||
                                  "暂无描述"}
                              </p>
                              <div className="flex items-center mt-3 space-x-4 text-sm text-gray-500">
                                <span>
                                  👤{" "}
                                  {typeof selectedAnalysis.detail.author ===
                                  "object"
                                    ? selectedAnalysis.detail.author?.name ||
                                      "未知作者"
                                    : selectedAnalysis.detail.author ||
                                      "未知作者"}
                                </span>
                                <span
                                  className={`platform-${selectedAnalysis.detail.platform} px-2 py-1 rounded text-xs`}
                                >
                                  {getPlatformDisplayName(
                                    selectedAnalysis.detail.platform,
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* 数据指标 */}
                            <div className="space-y-4">
                              {/* 观看量（如果有） */}
                              {selectedAnalysis.detail.metrics?.views > 0 && (
                                <div className="bg-blue-50 rounded-lg p-3 text-center">
                                  <p className="text-2xl font-bold text-blue-600">
                                    {selectedAnalysis.detail.metrics.views.toLocaleString()}
                                  </p>
                                  <p className="text-sm text-blue-800">
                                    观看量
                                  </p>
                                </div>
                              )}
                              {/* 互动指标：点赞、评论、分享 */}
                              <div className="bg-gradient-to-r from-green-50 to-purple-50 rounded-lg p-4">
                                <div className="grid grid-cols-3 gap-4">
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                      {(
                                        selectedAnalysis.detail.metrics
                                          ?.likes || 0
                                      ).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-green-800">
                                      点赞
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-yellow-600">
                                      {(
                                        selectedAnalysis.detail.metrics
                                          ?.comments || 0
                                      ).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-yellow-800">
                                      评论
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-2xl font-bold text-purple-600">
                                      {(
                                        selectedAnalysis.detail.metrics
                                          ?.shares || 0
                                      ).toLocaleString()}
                                    </p>
                                    <p className="text-sm text-purple-800">
                                      分享
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* AI分析结果 */}
                          <div className="space-y-4">
                            <h5 className="text-lg font-semibold text-gray-900">
                              AI 分析
                            </h5>

                            {/* 评分 */}
                            <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                              <div className="text-4xl font-bold text-blue-600">
                                {selectedAnalysis.detail.analysis
                                  ?.overallScore ||
                                  selectedAnalysis.detail.analysis?.score ||
                                  0}
                                /10
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                综合评分
                              </p>
                            </div>

                            {/* 优缺点 */}
                            <div className="grid grid-cols-1 gap-4">
                              {selectedAnalysis.detail.analysis?.pros &&
                                selectedAnalysis.detail.analysis.pros.length >
                                  0 && (
                                  <div className="bg-green-50 rounded-lg p-4">
                                    <h6 className="font-medium text-green-800 mb-2">
                                      ✅ 优点
                                    </h6>
                                    <ul className="space-y-1">
                                      {selectedAnalysis.detail.analysis.pros.map(
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
                                )}

                              {selectedAnalysis.detail.analysis?.cons &&
                                selectedAnalysis.detail.analysis.cons.length >
                                  0 && (
                                  <div className="bg-red-50 rounded-lg p-4">
                                    <h6 className="font-medium text-red-800 mb-2">
                                      ❌ 缺点
                                    </h6>
                                    <ul className="space-y-1">
                                      {selectedAnalysis.detail.analysis.cons.map(
                                        (con: string, index: number) => (
                                          <li
                                            key={index}
                                            className="text-sm text-red-700"
                                          >
                                            • {con}
                                          </li>
                                        ),
                                      )}
                                    </ul>
                                  </div>
                                )}
                            </div>

                            {/* 建议 */}
                            {selectedAnalysis.detail.analysis
                              ?.recommendation && (
                              <div className="bg-blue-50 rounded-lg p-4">
                                <h6 className="font-medium text-blue-800 mb-2">
                                  💡 总体建议
                                </h6>
                                <p className="text-sm text-blue-700">
                                  {
                                    selectedAnalysis.detail.analysis
                                      .recommendation
                                  }
                                </p>
                              </div>
                            )}

                            {/* 标签 */}
                            {selectedAnalysis.detail.analysis?.tags &&
                              selectedAnalysis.detail.analysis.tags.length >
                                0 && (
                                <div>
                                  <h6 className="font-medium text-gray-800 mb-2">
                                    🏷️ 适合标签
                                  </h6>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedAnalysis.detail.analysis.tags.map(
                                      (tag: string, index: number) => (
                                        <span
                                          key={index}
                                          className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium"
                                        >
                                          {tag}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
