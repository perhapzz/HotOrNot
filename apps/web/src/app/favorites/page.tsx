"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";

interface Favorite {
  _id: string;
  analysisId: string;
  analysisType: string;
  title: string;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  content: "内容分析",
  keyword: "关键词分析",
  account: "账号分析",
};

const TYPE_ICONS: Record<string, string> = {
  content: "📝",
  keyword: "🔑",
  account: "👤",
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/user/favorites", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setFavorites(d.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const removeFavorite = async (analysisId: string) => {
    await fetch("/api/user/favorites", {
      method: "DELETE",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ analysisId }),
    });
    setFavorites((prev) => prev.filter((f) => f.analysisId !== analysisId));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          ⭐ 我的收藏
        </h1>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            还没有收藏任何分析结果
          </div>
        ) : (
          <div className="space-y-3">
            {favorites.map((f) => (
              <div
                key={f._id}
                className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {TYPE_ICONS[f.analysisType] || "📊"}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {f.title || "未命名分析"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {TYPE_LABELS[f.analysisType] || f.analysisType} ·{" "}
                      {new Date(f.createdAt).toLocaleDateString("zh-CN")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => removeFavorite(f.analysisId)}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  取消收藏
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
