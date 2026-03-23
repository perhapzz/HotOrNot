"use client";

import { useState } from "react";
import { useToast } from "./Toast";

interface FeedbackWidgetProps {
  analysisId: string;
  analysisType: "content" | "keyword" | "account";
}

export function FeedbackWidget({ analysisId, analysisType }: FeedbackWidgetProps) {
  const toast = useToast();
  const [rating, setRating] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [showComment, setShowComment] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (r: "up" | "down") => {
    setRating(r);
    if (r === "down") {
      setShowComment(true);
      return;
    }
    await sendFeedback(r, "");
  };

  const sendFeedback = async (r: "up" | "down", c: string) => {
    try {
      await fetch("/api/feedback", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysisId, analysisType, rating: r, comment: c }),
      });
      setSubmitted(true);
      toast.success("感谢你的反馈！");
    } catch {
      toast.error("反馈提交失败");
    }
  };

  if (submitted) {
    return (
      <div className="text-center text-sm text-gray-500 dark:text-gray-400 py-3">
        ✅ 感谢反馈！你的意见帮助我们改进分析质量。
      </div>
    );
  }

  return (
    <div className="border-t dark:border-gray-700 pt-4 mt-6">
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
        这个分析结果有帮助吗？
      </p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => submit("up")}
          className={`px-4 py-2 text-sm border rounded-lg transition-colors ${
            rating === "up"
              ? "bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30"
              : "hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          👍 有帮助
        </button>
        <button
          onClick={() => submit("down")}
          className={`px-4 py-2 text-sm border rounded-lg transition-colors ${
            rating === "down"
              ? "bg-red-50 border-red-300 text-red-700 dark:bg-red-900/30"
              : "hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          👎 需改进
        </button>
      </div>

      {showComment && (
        <div className="mt-3 space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="哪里可以改进？（可选）"
            maxLength={500}
            rows={2}
            className="w-full px-3 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <button
            onClick={() => sendFeedback("down", comment)}
            className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            提交反馈
          </button>
        </div>
      )}
    </div>
  );
}
