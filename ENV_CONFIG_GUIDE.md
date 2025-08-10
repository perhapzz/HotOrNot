# HotOrNot 环境变量配置指南

## 📋 文件说明

已完成环境变量整理，现在项目中的配置文件分工明确：

| 文件                       | 用途            | 状态        |
| -------------------------- | --------------- | ----------- |
| `📁 .env.docker`           | Docker 部署模板 | ✅ 已整理   |
| `📁 .env.local`            | 根目录全局配置  | ✅ 已整理   |
| `📁 apps/web/.env.example` | Web应用配置模板 | ✅ 原有文件 |
| `📁 apps/web/.env.local`   | Web应用主配置   | ✅ 已整理   |

## 🚀 快速配置

### 本地开发

当前 `apps/web/.env.local` 已配置完成，可直接使用：

```bash
cd apps/web
npm run dev  # 或 pnpm dev
```

### Docker 部署

```bash
# 1. 复制Docker模板
cp .env.docker .env

# 2. 编辑.env文件，填入真实API Keys
# 3. 启动Docker
docker-compose up -d --build
```

## 🔑 主要配置项

### API服务

- `TIKHUB_API_KEY` - TikHub API (小红书/抖音数据) ⚠️ 必需
- `GEMINI_API_KEY` - Google AI (内容分析) ⚠️ 必需
- `OPENAI_API_KEY` - OpenAI (可选AI服务)

### 数据库

- `MONGODB_URI` - MongoDB连接字符串
- `DATABASE_URL` - 数据库URL (与MONGODB_URI相同)

### 功能开关

- `USE_REAL_ANALYSIS=true` - 启用真实API分析
- `ALLOW_FALLBACK_DATA=false` - 禁用模拟数据降级
- `AUTO_START_SCHEDULER=prod` - 仅生产环境自动启动定时器

## ⚠️ 常见问题解决

### 环境变量不生效

1. **检查文件位置**: Web应用配置必须在 `apps/web/.env.local`
2. **重启服务**: 修改环境变量后需要重启 dev server
3. **检查语法**: 确保没有多余空格，格式为 `KEY=value`

### API调用失败

1. **检查API Key**: 确保 `TIKHUB_API_KEY` 和 `GEMINI_API_KEY` 正确
2. **检查网络**: 确认可以访问外部API服务
3. **查看日志**: 检查终端输出的错误信息

## 🔒 安全提醒

- ✅ 所有 `.env*` 文件已在 `.gitignore` 中
- ✅ 真实API密钥不会被提交到Git
- ⚠️ 生产环境请使用环境变量注入，不要直接使用文件配置

## 📝 配置完成确认

环境变量配置已整理完成，现在项目结构清晰：

1. **重复配置已清理** - 统一了 `DATABASE_URL` 和 `MONGODB_URI`
2. **文件分工明确** - Docker、本地开发、Web应用各有专用配置
3. **注释完善** - 每个配置项都有详细说明
4. **安全性提升** - 敏感信息已从示例文件中移除

如果遇到任何配置问题，请检查对应的配置文件并确保API Keys正确填写。

## 🐛 故障排除

### Docker 数据库连接错误

#### 问题1: Mongoose 缓冲命令错误

**错误信息**: `Cannot call xiaohongshuhotlists.find() before initial connection is complete if bufferCommands = false`

**解决方案**:

1. ✅ 已修复：将 `bufferCommands` 设置为 `true` 启用命令缓冲
2. ✅ 已修复：改进 `connectDatabase()` 函数，确保连接完全建立后才执行查询
3. ✅ 已修复：正确设置 `.env` 文件中的 `SKIP_DATABASE_CONNECTION=false`

#### 问题2: Docker 网络连接被拒绝

**错误信息**: `MongoNetworkError: connect ECONNREFUSED ::1:27017, connect ECONNREFUSED 127.0.0.1:27017`

**解决方案**:

1. ✅ 已修复：更正 MongoDB 容器名称 (`mongo` → `mongodb`)
2. ✅ 已修复：添加 MongoDB 认证信息 (`admin:password123`)
3. ✅ 已修复：使用正确的连接字符串格式
4. ✅ 已修复：配置 Docker Compose 使用 `.env` 文件

**正确的连接字符串**:

```bash
# Docker 环境
MONGODB_URI=mongodb://admin:password123@mongodb:27017/hotornot?authSource=admin
DATABASE_URL=mongodb://admin:password123@mongodb:27017/hotornot?authSource=admin
```

**原因**:

- 容器名称不匹配 (`mongo` vs `mongodb`)
- 缺少 MongoDB 认证信息
- Docker Compose 环境变量覆盖了 `.env` 配置

#### 问题3: Docker 环境下热点数据不更新

**现象**: 热点数据长时间不更新，定时器无法正常工作

**解决方案**:

1. ✅ 已修复：定时器改为直接调用API函数，避免Docker内部HTTP调用问题
2. ✅ 已修复：添加手动触发更新功能 (`/api/scheduler` POST `{"action": "update_now"}`)
3. ✅ 已修复：改进定时器启动逻辑和环境变量检测

**手动触发更新**:

```bash
# 立即更新热点数据
curl -X POST http://localhost:3000/api/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "update_now"}'

# 检查定时器状态
curl http://localhost:3000/api/scheduler
```

**原因**:

- Docker 容器内无法通过 `localhost:3000` 访问自己的API
- 定时器启动策略配置问题 (`AUTO_START_SCHEDULER=prod`)
- 网络调用延迟和超时问题
