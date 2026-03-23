# 部署指南

## 快速开始（Docker Compose）

### 前提条件
- Docker 24+ & Docker Compose v2+
- 至少 2GB RAM（推荐 4GB）
- 域名 + SSL 证书（生产环境）

### 1. 克隆项目
```bash
git clone https://github.com/perhapzz/HotOrNot.git
cd HotOrNot
```

### 2. 配置环境变量
```bash
cp apps/web/.env.example apps/web/.env.local
```

编辑 `.env.local`，必填项：

| 变量 | 说明 | 必填 | 默认值 |
|------|------|------|--------|
| `MONGODB_URI` | MongoDB 连接字符串 | ✅ | `mongodb://localhost:27017/hotornot` |
| `JWT_SECRET` | JWT 签名密钥（≥32位随机字符串） | ✅ | ⚠️ 必须修改 |
| `GEMINI_API_KEY` | Google Gemini API Key | ✅ | — |
| `TIKHUB_API_KEY` | TikHub 平台数据 API Key | ✅ | — |
| `REDIS_URL` | Redis 连接 URL | ❌ | — (降级内存缓存) |
| `NEXT_PUBLIC_SITE_URL` | 站点公开 URL | ❌ | `http://localhost:3000` |
| `SMTP_HOST` | SMTP 邮件服务器 | ❌ | — |
| `SMTP_PORT` | SMTP 端口 | ❌ | `587` |
| `SMTP_USER` | SMTP 用户名 | ❌ | — |
| `SMTP_PASS` | SMTP 密码 | ❌ | — |
| `SMTP_FROM` | 发件人地址 | ❌ | `noreply@hotornot.app` |
| `SENTRY_DSN` | Sentry 错误追踪 | ❌ | — |
| `AUTO_START_SCHEDULER` | 定时任务策略 | ❌ | `all` |

生成 JWT_SECRET：
```bash
openssl rand -base64 32
```

### 3. 启动服务
```bash
# 生产环境（web + MongoDB + Redis）
docker compose up -d

# 包含调试工具（mongo-express）
docker compose --profile debug up -d
```

### 4. 初始化管理员
访问 `/api/admin/init` 创建第一个管理员账号（仅首次可用）。

### 5. 验证部署
```bash
# 检查容器状态
docker compose ps

# 检查健康
curl http://localhost:3000/api/health
```

---

## Nginx 反向代理

```nginx
server {
    listen 80;
    server_name hotornot.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hotornot.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/hotornot.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hotornot.yourdomain.com/privkey.pem;

    # SSE 支持
    proxy_buffering off;
    proxy_cache off;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # SSE endpoint 特殊配置
    location /api/events {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 86400s;
    }
}
```

### SSL 证书（Let's Encrypt）
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d hotornot.yourdomain.com
```

---

## MongoDB 生产配置

### Replica Set（推荐）
```yaml
# docker-compose.override.yml
services:
  mongodb:
    command: mongod --replSet rs0 --bind_ip_all
```

初始化：
```bash
docker compose exec mongodb mongosh --eval 'rs.initiate()'
```

### 备份
```bash
# 每日备份
docker compose exec mongodb mongodump --db hotornot --out /backup/$(date +%Y%m%d)

# 恢复
docker compose exec mongodb mongorestore --db hotornot /backup/20260323/hotornot
```

---

## 手动部署（无 Docker）

```bash
# 安装依赖
pnpm install

# 构建
pnpm --filter web build

# 启动
cd apps/web && pnpm start
```

需要独立运行 MongoDB 和 Redis。

---

## 环境说明

| 环境 | 说明 |
|------|------|
| `development` | 详细错误 + stack trace，热更新 |
| `production` | 错误脱敏，优化构建，安全 cookie |
