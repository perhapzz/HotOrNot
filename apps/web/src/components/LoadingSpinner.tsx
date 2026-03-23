"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  className?: string;
}

const SIZES = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-3",
};

export function LoadingSpinner({ size = "md", text, className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-8 ${className}`} role="status" aria-label={text || "加载中"}>
      <div
        className={`${SIZES[size]} rounded-full border-gray-200 border-t-blue-600 animate-spin dark:border-gray-700 dark:border-t-blue-400`}
      />
      {text && <p className="text-sm text-gray-500 dark:text-gray-400">{text}</p>}
      <span className="sr-only">{text || "加载中"}</span>
    </div>
  );
}
