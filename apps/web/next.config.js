/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@hotornot/shared", "@hotornot/ui", "@hotornot/ai", "@hotornot/database"],
  output: 'standalone',
  images: {
    domains: [
      'sns-img-hw.xhscdn.com',
      'sns-video-hw.xhscdn.com',
      'i0.hdslb.com',
      'i1.hdslb.com',
      'i2.hdslb.com',
      'wx1.sinaimg.cn',
      'wx2.sinaimg.cn',
      'wx3.sinaimg.cn',
      'wx4.sinaimg.cn'
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
  },
}

module.exports = nextConfig