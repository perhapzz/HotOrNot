# 使用官方 Node.js 18 Alpine 镜像作为基础镜像
FROM node:20-alpine AS base

# 安装 pnpm
RUN npm install -g pnpm@9

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 pnpm 相关文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/ui/package.json ./packages/ui/
COPY packages/ai/package.json ./packages/ai/
COPY packages/database/package.json ./packages/database/

# 安装依赖
RUN pnpm install --no-frozen-lockfile

# 复制源代码
COPY . .

# 构建阶段
FROM base AS builder
WORKDIR /app

# 设置构建环境变量，避免数据库连接
ENV SKIP_DATABASE_CONNECTION=true
ENV NODE_ENV=production

# 构建应用
RUN pnpm run build

# 生产阶段
FROM node:20-alpine AS runner
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm@9

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要的文件
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./
COPY --from=builder /app/turbo.json ./

# 复制应用文件
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# 创建空的 public 目录（Next.js 需要）
RUN mkdir -p ./apps/web/public

# 复制 packages
COPY --from=builder /app/packages ./packages

# 安装生产依赖
RUN pnpm install --prod --no-frozen-lockfile

# 复制启动脚本并设置权限（在切换用户之前）
COPY start-with-scheduler.sh ./
RUN chmod +x start-with-scheduler.sh

# 安装 curl (用于健康检查和调度器启动)
RUN apk add --no-cache curl

# 更改所有权并切换用户
RUN chown -R nextjs:nodejs /app
USER nextjs

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV production
ENV PORT 3000

# 使用启动脚本启动应用
CMD ["./start-with-scheduler.sh"]