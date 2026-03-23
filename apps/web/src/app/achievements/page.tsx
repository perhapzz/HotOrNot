"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";

interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  unlocked: boolean;
  unlockedAt: string | null;
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for new achievements first, then load all
    fetch("/api/user/achievements", { method: "POST", credentials: "include" })
      .then(() =>
        fetch("/api/user/achievements", { credentials: "include" })
      )
      .then((r) => r.json())
      .then((d) => d.success && setAchievements(d.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AppHeader />
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          🏆 成就墙
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          已解锁 {unlocked.length} / {achievements.length}
        </p>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : (
          <>
            {/* Progress bar */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-8">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{
                  width: `${achievements.length > 0 ? (unlocked.length / achievements.length) * 100 : 0}%`,
                }}
              />
            </div>

            {/* Unlocked */}
            {unlocked.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  ✨ 已解锁
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {unlocked.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 bg-white dark:bg-gray-800 rounded-lg border-2 border-yellow-300 dark:border-yellow-600 text-center"
                    >
                      <span className="text-3xl">{a.emoji}</span>
                      <p className="font-medium text-gray-900 dark:text-white mt-2 text-sm">
                        {a.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{a.description}</p>
                      {a.unlockedAt && (
                        <p className="text-xs text-yellow-600 mt-1">
                          {new Date(a.unlockedAt).toLocaleDateString("zh-CN")}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked */}
            {locked.length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-4">
                  🔒 未解锁
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {locked.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg border dark:border-gray-700 text-center opacity-60"
                    >
                      <span className="text-3xl grayscale">{a.emoji}</span>
                      <p className="font-medium text-gray-500 mt-2 text-sm">
                        {a.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{a.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
