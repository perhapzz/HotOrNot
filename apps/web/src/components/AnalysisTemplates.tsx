"use client";

interface Template {
  emoji: string;
  label: string;
  keyword: string;
  description: string;
}

const TEMPLATES: Template[] = [
  { emoji: "🍜", label: "美食探店", keyword: "美食探店", description: "餐厅推荐、美食测评" },
  { emoji: "👗", label: "穿搭分享", keyword: "穿搭分享", description: "时尚搭配、OOTD" },
  { emoji: "✈️", label: "旅行攻略", keyword: "旅行攻略", description: "目的地推荐、行程规划" },
  { emoji: "💄", label: "美妆护肤", keyword: "美妆护肤", description: "化妆教程、产品测评" },
  { emoji: "🏠", label: "家居好物", keyword: "家居好物", description: "家居装饰、好物分享" },
  { emoji: "💪", label: "健身打卡", keyword: "健身打卡", description: "运动教程、减脂增肌" },
  { emoji: "📚", label: "学习干货", keyword: "学习干货", description: "知识分享、效率工具" },
  { emoji: "🐱", label: "宠物日常", keyword: "宠物日常", description: "萌宠内容、养宠攻略" },
];

interface AnalysisTemplatesProps {
  onSelect: (keyword: string) => void;
}

export function AnalysisTemplates({ onSelect }: AnalysisTemplatesProps) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
        🚀 快捷模板 — 热门分析主题
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TEMPLATES.map((t) => (
          <button
            key={t.keyword}
            onClick={() => onSelect(t.keyword)}
            className="flex items-center gap-2 p-3 text-left text-sm bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 transition-colors"
          >
            <span className="text-lg">{t.emoji}</span>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
