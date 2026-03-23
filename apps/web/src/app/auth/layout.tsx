import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "登录注册",
  description: "登录或注册 HotOrNot 账号，开始使用智能内容分析服务。",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
