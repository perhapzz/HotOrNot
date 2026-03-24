#!/bin/bash

# HotOrNot 开发环境启动脚本

echo "🚀 启动 HotOrNot 开发环境..."

# 检查 Node.js 版本
NODE_VERSION=$(node -v | sed 's/v//')
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
  echo "✅ Node.js 版本检查通过: $NODE_VERSION"
else
  echo "❌ Node.js 版本过低，需要 >= $REQUIRED_VERSION，当前版本: $NODE_VERSION"
  exit 1
fi

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
  echo "❌ pnpm 未安装，正在安装..."
  npm install -g pnpm
  echo "✅ pnpm 安装完成"
else
  echo "✅ pnpm 已安装: $(pnpm -v)"
fi

# 检查依赖是否安装
if [ ! -d "node_modules" ]; then
  echo "📦 安装项目依赖..."
  pnpm install
  echo "✅ 依赖安装完成"
fi

# 检查环境配置文件
if [ ! -f "apps/web/.env.local" ]; then
  echo "⚠️  apps/web/.env.local 文件不存在，请参考 README.md 配置环境变量"
  echo "📝 创建示例配置文件..."
  cp apps/web/.env.example apps/web/.env.local 2>/dev/null || echo "DATABASE_URL=mongodb://localhost:27017/hotornot" > apps/web/.env.local
fi

# 启动开发服务器
echo "🔥 启动开发服务器..."
pnpm dev