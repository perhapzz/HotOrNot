"use client";

import { useState, useEffect } from "react";

const ONBOARDING_KEY = "hotornot_onboarding_complete";

interface Step {
  emoji: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    emoji: "👋",
    title: "欢迎来到 HotOrNot！",
    description:
      "AI 驱动的智能内容分析平台，覆盖小红书、抖音、B站、微博四大平台。帮你找到爆款密码！",
  },
  {
    emoji: "🔗",
    title: "粘贴链接，开始分析",
    description:
      "在首页粘贴任意平台的内容链接或账号主页，AI 会自动分析内容质量、互动潜力和优化建议。",
  },
  {
    emoji: "🔥",
    title: "关注热榜趋势",
    description:
      "查看各平台实时热榜，了解当前热点话题。结合关键词分析，提前布局爆款内容。",
  },
  {
    emoji: "🔔",
    title: "设置通知，不错过机会",
    description:
      "在设置中开启浏览器通知，当关注的关键词上热榜时第一时间提醒你。",
  },
];

export function useOnboarding() {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(ONBOARDING_KEY);
    if (!done) setShouldShow(true);
  }, []);

  const complete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setShouldShow(false);
  };

  const reset = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setShouldShow(true);
  };

  return { shouldShow, complete, reset };
}

export function OnboardingModal({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Progress */}
        <div className="flex gap-1 p-4 pb-0">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-blue-500" : "bg-gray-200 dark:bg-gray-600"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <div className="text-5xl mb-4">{current.emoji}</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            {current.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4 pt-0">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              上一步
            </button>
          )}
          <button
            onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setStep(step + 1);
              }
            }}
            className="flex-1 py-2.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            {isLast ? "开始使用 🚀" : "下一步"}
          </button>
        </div>

        {/* Skip */}
        <div className="text-center pb-4">
          <button
            onClick={onComplete}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            跳过引导
          </button>
        </div>
      </div>
    </div>
  );
}
