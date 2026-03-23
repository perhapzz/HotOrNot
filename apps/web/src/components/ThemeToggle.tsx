"use client";

import { useTheme } from "@/hooks/useTheme";

const ICONS: Record<string, string> = {
  light: "☀️",
  dark: "🌙",
  system: "💻",
};

const LABELS: Record<string, string> = {
  light: "浅色",
  dark: "深色",
  system: "跟随系统",
};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const cycle = () => {
    const order = ["light", "dark", "system"] as const;
    const next = order[(order.indexOf(theme) + 1) % order.length];
    setTheme(next);
  };

  return (
    <button
      onClick={cycle}
      className="p-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={LABELS[theme]}
      aria-label={`切换主题: ${LABELS[theme]}`}
    >
      {ICONS[theme]}
    </button>
  );
}
