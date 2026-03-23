'use client';

interface ErrorFallbackProps {
  error?: Error | null;
  onRetry?: () => void;
}

/**
 * 错误回退 UI
 *
 * 显示友好的错误提示 + 重试按钮，Tailwind 样式。
 */
export function ErrorFallback({ error, onRetry }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
      {/* 错误图标 */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
        <svg
          className="h-8 w-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-red-800">
          页面出现了问题
        </h3>
        <p className="max-w-md text-sm text-red-600">
          很抱歉，页面遇到了意外错误。请尝试重新加载。
        </p>
        {error && process.env.NODE_ENV === 'development' && (
          <details className="mt-2 text-left">
            <summary className="cursor-pointer text-xs text-red-400 hover:text-red-600">
              错误详情（仅开发环境）
            </summary>
            <pre className="mt-1 max-h-40 overflow-auto rounded bg-red-100 p-2 text-xs text-red-700">
              {error.message}
              {'\n'}
              {error.stack}
            </pre>
          </details>
        )}
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-red-600 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          重试
        </button>
      )}
    </div>
  );
}
