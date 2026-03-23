"use client";

import { MobileNav } from "./MobileNav";
import { ThemeToggle } from "./ThemeToggle";

interface AppHeaderProps {
  /** Current page path for active nav highlighting */
  activePath?: string;
  /** Auth state */
  isCheckingAuth?: boolean;
  isLoggedIn?: boolean;
  user?: {
    displayName?: string;
    username?: string;
    subscription?: { plan?: string };
  } | null;
  onLogout?: () => void;
}

const NAV_ITEMS = [
  { href: "/", label: "内容分析" },
  { href: "/analysis/account", label: "账号分析" },
  { href: "/analysis/keywords", label: "关键词分析" },
  { href: "/analysis/batch", label: "批量分析" },
  { href: "/dashboard", label: "数据大屏" },
  { href: "/dashboard/my", label: "我的面板" },
  { href: "/teams", label: "团队协作" },
  { href: "/developer", label: "开发者" },
];

export function AppHeader({
  activePath = "/",
  isCheckingAuth = false,
  isLoggedIn = false,
  user = null,
  onLogout,
}: AppHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-700 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <a href="/" className="text-2xl font-bold text-gray-900 dark:text-white">
              🔥 HotOrNot
            </a>
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">
              内容分析平台
            </span>
          </div>
          <div className="flex items-center space-x-4 md:space-x-8">
            <nav className="hidden md:flex space-x-6">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className={
                    activePath === item.href
                      ? "text-blue-700 font-medium text-sm"
                      : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm"
                  }
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <MobileNav />
            <ThemeToggle />

            {/* User auth area */}
            <div className="flex items-center">
              {isCheckingAuth ? (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
              ) : isLoggedIn && user ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                      {user.displayName?.[0] || user.username?.[0] || "U"}
                    </div>
                    <div className="hidden md:block text-sm">
                      <div className="font-medium text-gray-900">
                        {user.displayName || user.username}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {user.subscription?.plan || "free"} · 已登录
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <a
                      href="/history"
                      className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md px-3 py-1 hover:border-gray-400 transition-colors"
                    >
                      历史
                    </a>
                    {onLogout && (
                      <button
                        onClick={onLogout}
                        className="text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md px-3 py-1 hover:border-gray-400 transition-colors"
                      >
                        登出
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">匿名</span>
                  <a
                    href="/auth"
                    className="text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    登录
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
