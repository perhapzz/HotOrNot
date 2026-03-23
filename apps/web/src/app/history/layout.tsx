import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "分析历史",
  description: "查看历史分析记录，追踪内容表现变化，回顾关键数据洞察。",
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
