import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Providers } from "./providers";

// 导入服务器端初始化脚本
import "../lib/init-server";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://hotornot.app";

export const metadata: Metadata = {
  title: {
    default: "HotOrNot - 智能内容分析平台",
    template: "%s | HotOrNot",
  },
  description:
    "AI 驱动的内容分析平台，覆盖小红书、抖音等主流平台。关键词趋势分析、账号数据洞察、爆款内容预测，助力创作者找到爆款密码。",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: SITE_URL,
    siteName: "HotOrNot",
    title: "HotOrNot - 智能内容分析平台",
    description:
      "AI 驱动的内容分析平台，关键词趋势分析、账号数据洞察、爆款内容预测。",
  },
  twitter: {
    card: "summary_large_image",
    title: "HotOrNot - 智能内容分析平台",
    description:
      "AI 驱动的内容分析平台，关键词趋势分析、账号数据洞察、爆款内容预测。",
  },
  robots: {
    index: true,
    follow: true,
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
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
          <Providers>
            <ErrorBoundary>{children}</ErrorBoundary>
          </Providers>
        </div>
      </body>
    </html>
  );
}
