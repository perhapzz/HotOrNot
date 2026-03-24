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
  skipTrailingSlashRedirect: true,
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
    optimizePackageImports: ['@hotornot/shared', '@hotornot/ui'],
  },
  compress: true,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://api.tikhub.io",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
}

// Optional Sentry integration — only wrap if @sentry/nextjs is installed
try {
  const { withSentryConfig } = require("@sentry/nextjs");
  module.exports = withSentryConfig(nextConfig, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
  }, {
    widenClientFileUpload: true,
    hideSourceMaps: true,
    disableLogger: true,
  });
} catch {
  module.exports = nextConfig;
}
