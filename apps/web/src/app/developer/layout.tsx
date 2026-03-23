import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "开发者平台 - HotOrNot",
  description: "管理 API Key，查看接口文档，接入 HotOrNot 开放 API",
};

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return children;
}
