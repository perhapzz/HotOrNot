"use client";

import { useState, useEffect, useRef } from "react";
import { MobileNav } from "@/components/MobileNav";

interface BatchItem {
  index: number;
  input: string;
  status: "pending" | "processing" | "completed" | "failed";
  resultId?: string;
  error?: string;
}

interface BatchJob {
  jobId: string;
  type: string;
  status: string;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  items: BatchItem[];
}

export default function BatchAnalysisPage() {
  const [inputText, setInputText] = useState("");
  const [type, setType] = useState<"content" | "keyword">("content");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [job, setJob] = useState<BatchJob | null>(null);
  const [error, setError] = useState("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    setError("");
    const lines = inputText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setError("请输入至少一个链接或关键词");
      return;
    }
    if (lines.length > 10) {
      setError("每次最多 10 条");
      return;
    }

    setIsSubmitting(true);
    try {
      const items = lines.map((line) => {
        if (type === "content") return { url: line };
        return { keyword: line };
      });

      const res = await fetch("/api/analysis/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, type }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Start polling
      const jobId = data.data.jobId;
      setJob({
        jobId,
        type,
        status: "processing",
        totalItems: lines.length,
        completedItems: 0,
        failedItems: 0,
        items: lines.map((input, index) => ({
          index,
          input,
          status: "pending",
        })),
      });

      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/analysis/batch/${jobId}`);
          const pollData = await pollRes.json();
          if (pollData.success) {
            setJob(pollData.data);
            if (
              pollData.data.status === "completed" ||
              pollData.data.status === "failed"
            ) {
              if (pollRef.current) clearInterval(pollRef.current);
            }
          }
        } catch {}
      }, 2000);
    } catch (err: any) {
      setError(err.message || "提交失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .slice(0, 10);
      setInputText(lines.join("\n"));
    };
    reader.readAsText(file);
  };

  const progress = job
    ? Math.round(
        ((job.completedItems + job.failedItems) / job.totalItems) * 100
      )
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <a href="/" className="text-2xl font-bold text-gray-900">
                HotOrNot
              </a>
              <span className="ml-2 text-sm text-gray-500">批量分析</span>
            </div>
            <div className="flex items-center space-x-4 md:space-x-8">
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
                  href="/analysis/batch"
                  className="text-blue-700 font-medium"
                >
                  批量分析
                </a>
                <a
                  href="/dashboard"
                  className="text-gray-700 hover:text-gray-900"
                >
                  数据大屏
                </a>
              </nav>
              <MobileNav />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            批量分析
          </h1>
          <p className="mt-3 text-gray-500">
            一次提交多个链接或关键词，最多 10 条
          </p>
        </div>

        {/* Input Form */}
        {!job && (
          <div className="bg-white rounded-lg shadow-lg p-4 sm:p-8">
            <div className="space-y-6">
              {/* Type selector */}
              <div className="flex gap-4">
                <button
                  onClick={() => setType("content")}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                    type === "content"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  内容分析（链接）
                </button>
                <button
                  onClick={() => setType("keyword")}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 text-sm font-medium transition-colors ${
                    type === "keyword"
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  关键词分析
                </button>
              </div>

              {/* Text input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {type === "content"
                    ? "输入链接（每行一个）"
                    : "输入关键词（每行一个）"}
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder={
                    type === "content"
                      ? "https://www.douyin.com/video/xxx\nhttps://www.xiaohongshu.com/xxx\n..."
                      : "美食探店\n穿搭分享\n旅行攻略\n..."
                  }
                />
                <div className="flex justify-between mt-2 text-xs text-gray-400">
                  <span>
                    {inputText.split("\n").filter((l) => l.trim()).length} / 10
                    条
                  </span>
                  <label className="cursor-pointer text-blue-500 hover:text-blue-700">
                    上传 CSV
                    <input
                      type="file"
                      accept=".csv,.txt"
                      className="hidden"
                      onChange={handleCSV}
                    />
                  </label>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || !inputText.trim()}
                className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "提交中..." : "开始批量分析"}
              </button>
            </div>
          </div>
        )}

        {/* Progress & Results */}
        {job && (
          <div className="space-y-6">
            {/* Progress bar */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between mb-2 text-sm">
                <span className="font-medium text-gray-700">
                  {job.status === "completed"
                    ? "分析完成"
                    : job.status === "failed"
                      ? "分析失败"
                      : "分析中..."}
                </span>
                <span className="text-gray-500">
                  {job.completedItems + job.failedItems} / {job.totalItems}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    job.status === "completed"
                      ? "bg-green-500"
                      : job.status === "failed"
                        ? "bg-red-500"
                        : "bg-blue-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {job.failedItems > 0 && (
                <p className="text-xs text-red-500 mt-1">
                  {job.failedItems} 项失败
                </p>
              )}
            </div>

            {/* Results list */}
            <div className="bg-white rounded-lg shadow-lg divide-y">
              {job.items.map((item) => (
                <div
                  key={item.index}
                  className="px-4 sm:px-6 py-4 flex items-center justify-between"
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.input}
                    </p>
                    {item.error && (
                      <p className="text-xs text-red-500 mt-1">{item.error}</p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {item.status === "pending" && (
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                        等待中
                      </span>
                    )}
                    {item.status === "processing" && (
                      <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded animate-pulse">
                        分析中
                      </span>
                    )}
                    {item.status === "completed" && (
                      <a
                        href={
                          job.type === "content"
                            ? `/?resultId=${item.resultId}`
                            : `/analysis/keywords?resultId=${item.resultId}`
                        }
                        className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded hover:bg-green-100"
                      >
                        查看结果 →
                      </a>
                    )}
                    {item.status === "failed" && (
                      <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        失败
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* New batch button */}
            {(job.status === "completed" || job.status === "failed") && (
              <button
                onClick={() => {
                  setJob(null);
                  setInputText("");
                  setError("");
                }}
                className="w-full py-3 px-6 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                开始新的批量分析
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
