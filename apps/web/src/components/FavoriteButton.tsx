"use client";

import { useState } from "react";

interface FavoriteButtonProps {
  analysisId: string;
  analysisType: "content" | "keyword" | "account";
  title?: string;
  initialFavorited?: boolean;
  className?: string;
}

export function FavoriteButton({
  analysisId,
  analysisType,
  title = "",
  initialFavorited = false,
  className = "",
}: FavoriteButtonProps) {
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    setLoading(true);
    try {
      if (favorited) {
        await fetch("/api/user/favorites", {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysisId }),
        });
        setFavorited(false);
      } else {
        await fetch("/api/user/favorites", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysisId, analysisType, title }),
        });
        setFavorited(true);
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg transition-colors ${
        favorited
          ? "bg-yellow-50 border-yellow-300 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
          : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
      } ${className}`}
      title={favorited ? "取消收藏" : "收藏"}
    >
      {favorited ? "⭐" : "☆"} {favorited ? "已收藏" : "收藏"}
    </button>
  );
}
