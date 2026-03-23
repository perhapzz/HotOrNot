const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@hotornot/shared", "@hotornot/ui", "@hotornot/ai", "@hotornot/database"],
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.xhscdn.com' },
      { protocol: 'https', hostname: '*.hdslb.com' },
      { protocol: 'https', hostname: '*.sinaimg.cn' },
      { protocol: 'https', hostname: '*.douyinpic.com' },
    ],
  },
  env: {
    MONGODB_URI: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT: process.env.AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_KEY: process.env.AZURE_OPENAI_API_KEY,
    REDIS_URL: process.env.REDIS_URL,
  },
  // 跳过构建时的健康检查，避免数据库连接错误
  skipTrailingSlashRedirect: true,
  // 禁用在构建时预渲染API路由
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
    optimizePackageImports: ['@hotornot/shared', '@hotornot/ui'],
  },
  // Compress responses
  compress: true,
}

module.exports = withSentryConfig(nextConfig, {
  // Sentry webpack plugin options
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
}, {
  // Sentry SDK options
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});