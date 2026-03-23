import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "团队协作 - HotOrNot",
  description: "创建团队、邀请成员、共享分析结果",
};

export default function TeamsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
