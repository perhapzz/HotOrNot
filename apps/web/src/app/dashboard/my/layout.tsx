import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "我的分析面板 - HotOrNot",
  description: "查看您的个人分析统计、趋势图和历史记录",
};

export default function MyDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
