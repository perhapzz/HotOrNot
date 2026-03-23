"use client";

import { useState } from "react";

interface ShareLinkProps {
  /** Analysis type: content | keyword | account */
  type: string;
  /** Analysis ID */
  id: string;
  className?: string;
}

export function ShareLink({ type, id, className = "" }: ShareLinkProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/share/${type}/${id}`
      : "";

  const handleShare = async () => {
    // Try native share first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title: "HotOrNot 分析结果",
          url: shareUrl,
        });
        return;
      } catch {
        // User cancelled or not supported, fall through to copy
      }
    }

    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare} aria-label="分享链接"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 ${className}`}
    >
      {copied ? "✅ 链接已复制" : "🔗 分享链接"}
    </button>
  );
}
