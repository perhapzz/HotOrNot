import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "账号分析",
  description:
    "深度分析小红书、抖音等平台账号数据，粉丝画像、内容表现、增长趋势一目了然。",
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
