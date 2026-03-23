"use client";

interface SkeletonProps {
  className?: string;
  lines?: number;
  variant?: "text" | "card" | "avatar";
}

export function Skeleton({ className = "", lines = 3, variant = "text" }: SkeletonProps) {
  if (variant === "avatar") {
    return (
      <div className={`h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`} />
    );
  }

  if (variant === "card") {
    return (
      <div className={`rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse h-32 ${className}`} />
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"
          style={{ width: i === lines - 1 ? "60%" : `${85 + Math.random() * 15}%` }}
        />
      ))}
    </div>
  );
}
