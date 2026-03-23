import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "关键词分析",
  description:
    "AI 驱动的关键词趋势分析，发现热门话题、追踪搜索趋势、挖掘内容机会。",
};

export default function KeywordsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
