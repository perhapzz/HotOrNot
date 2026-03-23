import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "数据大屏",
  description:
    "多维度数据可视化大屏，实时展示平台热度趋势、内容表现、关键指标。",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
