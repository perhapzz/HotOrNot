import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// 导入服务器端初始化脚本
import "../lib/init-server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "HotOrNot - 内容分析平台",
  description: "智能内容分析，助力创作者找到爆款密码",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        <div className="min-h-screen bg-background">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      </body>
    </html>
  );
}
