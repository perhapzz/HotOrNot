# 🔥 HotOrNot - 智能内容分析平台

基于 AI 的多平台内容分析平台，帮助创作者发现爆款密码，提升内容创作效果。

## 🚀 项目简介

HotOrNot 是一个现代化的智能内容分析平台，支持小红书、抖音等主流社交媒体平台的内容分析。通过先进的 AI 算法和实时数据更新，为创作者提供数据驱动的创作洞察和建议。

## ✨ 核心功能

### 🔍 智能分析三大核心

- **内容分析**：深度分析单个内容链接，AI 智能评分与改进建议
- **账号分析**：全面分析创作者账号，洞察内容偏好和发布规律
- **关键词分析**：发现热门趋势关键词，挖掘爆文共性特征

### 📊 数据洞察系统

- **热点数据大屏**：实时展示小红书、抖音热榜趋势
- **智能缓存管理**：多层级缓存策略，平衡数据新鲜度与性能
- **定时自动更新**：每3小时自动同步最新热点数据

### 👤 用户体验功能

- **分析历史记录**：完整的用户分析历史，支持数据回溯和分享
- **免注册体验**：核心功能无需注册即可使用
- **响应式设计**：完美适配桌面和移动端

### 🛠️ 管理后台功能

- **定时任务管理**：可视化任务调度器，灵活控制数据更新
- **缓存状态监控**：实时查看各模块缓存状态和性能指标
- **数据迁移工具**：数据库结构升级和数据迁移支持

## 🏗️ 技术架构

### Monorepo 项目结构

```
HotOrNot/
├── packages/           # 共享包
│   ├── shared/        # 通用类型、工具、常量 ✅
│   ├── ui/           # UI 组件库 ✅
│   ├── ai/           # AI 服务抽象层 ✅
│   └── database/     # 数据库操作 ✅
├── apps/
│   └── web/          # Next.js 14 主应用 ✅
├── scripts/          # 开发和部署脚本 ✅
└── docker/           # 容器化配置 ✅
```

### 技术栈选型

| 领域         | 技术选择                | 版本     | 状态 |
| ------------ | ----------------------- | -------- | ---- |
| **前端框架** | Next.js + App Router    | 14.1.0   | ✅   |
| **UI 设计**  | Tailwind CSS + 自研组件 | 3.4.1    | ✅   |
| **状态管理** | React Hooks + Zustand   | 18.2.0   | ✅   |
| **数据库**   | MongoDB + Mongoose      | 8.1.1    | ✅   |
| **AI 服务**  | OpenAI + Google Gemini  | 多供应商 | ✅   |
| **数据源**   | TikHub API              | 实时热点 | ✅   |
| **用户认证** | JWT + HTTP-only Cookie  | 安全会话 | ✅   |
| **开发工具** | Turborepo + pnpm        | 8.15.6   | ✅   |
| **类型安全** | TypeScript              | 5.3.3    | ✅   |


## 🐳 Docker 部署

### 本地 Docker 开发

```bash
# 1. 配置环境变量
cp .env.docker .env
# 编辑 .env 文件，填入真实的 API Keys

# 2. 启动服务
docker-compose up -d --build

# 3. 查看服务状态
docker-compose ps

# 4. 访问应用
# http://localhost:3000
```

### 生产环境部署

```bash
# 使用生产配置
docker-compose -f docker-compose.prod.yml up -d
```

详细的 Docker 部署指南请参考 [`ENV_CONFIG_GUIDE.md`](ENV_CONFIG_GUIDE.md)


## 🛠️ 开发环境设置

### 环境要求

```bash
Node.js >= 18
pnpm >= 8
MongoDB
```

### 本地启动

1. **克隆项目并安装依赖**

```bash
git clone https://github.com/perhapzz/HotOrNot.git
cd HotOrNot

# 安装 pnpm (如果没有)
npm install -g pnpm

# 安装所有依赖
pnpm install
```

2. **配置环境变量**

```bash
# 复制环境配置文件
cp apps/web/.env.example apps/web/.env.local

# 编辑 apps/web/.env.local，配置以下关键参数：
```

3. **环境变量配置**

```env
# 数据库连接
MONGODB_URI=mongodb://localhost:27017/hotornot
DATABASE_URL=mongodb://localhost:27017/hotornot

# AI 服务配置 (至少配置一个)
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# TikHub API (热点数据源)
TIKHUB_API_KEY=your_tikhub_api_key_here

# 功能控制
USE_REAL_ANALYSIS=true
ALLOW_FALLBACK_DATA=false
AUTO_START_SCHEDULER=all

# 缓存配置 (单位：小时)
KEYWORD_ANALYSIS_CACHE_HOURS=24
CONTENT_ANALYSIS_CACHE_HOURS=6
ACCOUNT_ANALYSIS_CACHE_HOURS=12
HOTLIST_DATA_CACHE_HOURS=1

# 应用配置
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. **启动开发服务器**

```bash
# 启动所有服务
pnpm dev

# 访问应用
# http://localhost:3000
```

5. **构建生产版本**

```bash
# 构建所有包
pnpm build

# 启动生产服务
cd apps/web && pnpm start
```

## 📦 核心包说明

### [@hotornot/shared](packages/shared)

**通用类型定义和工具库**

主要导出：

- `Platform` - 平台枚举 (小红书、抖音等)
- `ContentAnalysis`, `AccountAnalysis`, `KeywordAnalysis` - 分析结果类型
- `ApiResponse<T>` - 统一 API 响应格式
- 通用工具函数和常量定义

### [@hotornot/ui](packages/ui)

**自研 UI 组件库**

核心组件：

- `Button` - 多变体按钮组件 (primary, secondary, outline 等)
- `Card` - 数据展示卡片组件
- `Modal` - 模态框系统
- `Layout` - 页面布局组件

### [@hotornot/ai](packages/ai)

**AI 服务抽象层**

支持的 AI 供应商：

- OpenAI GPT-4/GPT-3.5-turbo
- Google Gemini Pro
- 工厂模式支持动态切换 AI 供应商

### [@hotornot/database](packages/database)

**数据库操作层**

7个核心 Mongoose 模型：

- `ContentAnalysis` - 内容分析记录
- `AccountAnalysis` - 账号分析记录
- `KeywordAnalysis` - 关键词分析记录
- `User` - 用户管理
- `UserAnalysisRecord` - 用户分析行为记录
- `XiaohongshuHotList` - 小红书热点数据
- `DouyinHotList` - 抖音热点数据

### [@hotornot/web](apps/web)

**Next.js 14 主应用**

#### 主要功能页面

| 路由                 | 功能           | 状态 |
| -------------------- | -------------- | ---- |
| `/`                  | 内容分析首页   | ✅   |
| `/analysis/account`  | 账号分析页面   | ✅   |
| `/analysis/keywords` | 关键词分析页面 | ✅   |
| `/dashboard`         | 数据大屏展示   | ✅   |
| `/history`           | 分析历史记录   | ✅   |
| `/auth`              | 用户认证页面   | ✅   |
| `/admin/scheduler`   | 定时任务管理   | ✅   |

#### API 路由架构

```
/api/
├── analysis/          # 分析服务
│   ├── content/      # 内容分析 API
│   ├── account/      # 账号分析 API
│   └── keyword/      # 关键词分析 API
├── auth/             # 用户认证
│   ├── login/       # 用户登录
│   ├── register/    # 用户注册
│   └── logout/      # 用户登出
├── hotlist/          # 热点数据
│   ├── xiaohongshu/ # 小红书热榜
│   └── douyin/      # 抖音热榜
├── scheduler/        # 定时任务控制
├── cache/            # 缓存管理
└── user/             # 用户相关数据
```

## 📚 API 使用示例

### 内容分析 API

```bash
POST /api/analysis/content
Content-Type: application/json

{
  "url": "https://www.xiaohongshu.com/explore/xxx",
  "platform": "xiaohongshu"
}

# 响应示例
{
  "success": true,
  "data": {
    "id": "analysis_id_xxx",
    "score": 8.5,
    "pros": ["标题吸引人", "内容质量高"],
    "cons": ["图片不够清晰"],
    "recommendation": "建议优化图片质量，增强视觉冲击力...",
    "tags": ["美食", "治愈系"],
    "platform": "xiaohongshu",
    "cached": false,
    "dataSource": "real"
  }
}
```

### 关键词分析 API

```bash
POST /api/analysis/keyword
Content-Type: application/json

{
  "keyword": "桌搭",
  "platforms": ["xiaohongshu"],
  "limit": 50
}

# 响应示例
{
  "success": true,
  "data": {
    "keyword": "桌搭",
    "platforms": ["xiaohongshu"],
    "analysis": {
      "trendScore": 85,
      "hotScore": 8,
      "recommendationLevel": "high",
      "suggestions": ["推荐使用暖色调搭配..."]
    },
    "searchStats": {
      "totalResults": 50,
      "avgLikes": 1250,
      "avgComments": 180,
      "avgCollected": 95
    },
    "topContent": [...],
    "cached": false,
    "cacheExpiresIn": "24 hours"
  }
}
```

### 热点数据 API

```bash
# 获取小红书热点数据
GET /api/hotlist/xiaohongshu?limit=10&includeItems=true

# 手动触发数据更新
POST /api/hotlist/xiaohongshu

# 定时任务控制
GET /api/scheduler          # 获取任务状态
POST /api/scheduler         # 控制任务
{
  "action": "start"         # start/stop/restart/update_now
}
```

## 🔧 开发工作流

### 日常开发

```bash
# 启动开发环境
pnpm dev

# 代码检查和格式化
pnpm lint
pnpm format

# 类型检查
npx tsc --noEmit

# 构建项目
pnpm build
```

### Git 工作流

```bash
# 创建功能分支
git checkout -b feature/new-feature

# 提交代码
git add .
git commit -m "feat: add new feature"

# 推送分支
git push origin feature/new-feature
```

## 🎯 项目特色

### 🏆 技术亮点

- **现代化全栈架构**：Next.js 14 + TypeScript + MongoDB
- **AI 深度集成**：多供应商 AI 服务，智能内容分析
- **实时数据更新**：定时任务自动同步热点数据
- **完整缓存策略**：多层级缓存管理，优化性能体验
- **Monorepo 管理**：Turborepo + pnpm 高效开发体验

### 🎨 产品特色

- **一站式分析平台**：内容、账号、关键词三维分析
- **数据可视化展示**：专业图表展示，直观数据洞察
- **免注册核心体验**：降低使用门槛，快速获得价值
- **移动端完美适配**：响应式设计，随时随地分析
- **高度可扩展性**：模块化设计，支持功能快速迭代

### 💼 应用价值

- **目标用户**：创作者、营销从业者、数据分析师
- **核心场景**：内容策划、竞品分析、趋势洞察
- **数据驱动**：基于真实平台数据的专业分析
- **效率提升**：自动化分析流程，显著节省人工成本

## 📈 项目状态

### 开发完成度

- **整体完成度**: 98% ✅
- **核心功能模块**: 8/8 完成 ✅
- **数据库模型**: 7/7 完成 ✅
- **API 接口**: 15+ 接口全部就绪 ✅
- **UI 组件库**: 统一设计系统完成 ✅
- **部署配置**: 多环境部署支持 ✅

### 功能模块状态

| 模块 | 功能       | 状态      |
| ---- | ---------- | --------- |
| 🔍   | 内容分析   | ✅ 已完成 |
| 👥   | 账号分析   | ✅ 已完成 |
| 📈   | 关键词分析 | ✅ 已完成 |
| 📊   | 热点数据   | ✅ 已完成 |
| 🕐   | 定时任务   | ✅ 已完成 |
| 📋   | 历史记录   | ✅ 已完成 |
| 🔧   | 缓存管理   | ✅ 已完成 |
| 👤   | 用户认证   | ✅ 已完成 |

## 🤝 贡献指南

1. Fork 项目到个人仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交变更 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

### 开发规范

- 遵循 [Conventional Commits](https://conventionalcommits.org/) 规范
- 确保代码通过 ESLint 和 TypeScript 检查
- 添加适当的注释和文档
- 新功能需要包含相应的测试用例

## 📄 许可证

本项目采用 MIT License - 详见 [LICENSE](LICENSE) 文件

## 👥 维护者

- **项目负责人**: [@perhapzz](https://github.com/perhapzz)
- **技术栈**: Next.js 14 + TypeScript + MongoDB + AI
- **开发周期**: 2024.01 - 2025.01 (持续更新中)

## 🔗 相关资源

- **项目仓库**: [GitHub](https://github.com/perhapzz/HotOrNot)
- **在线体验**: [访问平台](https://hotornot.vercel.app)
- **环境配置**: [ENV_CONFIG_GUIDE.md](ENV_CONFIG_GUIDE.md)
- **项目规范**: [project_rules.md](project_rules.md)
- **问题反馈**: [GitHub Issues](https://github.com/perhapzz/HotOrNot/issues)

## 🔥 快速体验

```bash
# 一键启动开发环境
git clone https://github.com/perhapzz/HotOrNot.git
cd HotOrNot
pnpm install
cp apps/web/.env.example apps/web/.env.local
# 编辑 .env.local 配置 API Keys
pnpm dev
# 访问 http://localhost:3000
```

## 🐳 Docker 部署

```bash
# 开发环境（含 MongoDB）
docker compose up -d

# 开发环境 + MongoDB 管理界面（mongo-express on :8081）
docker compose --profile debug up -d

# 生产环境
cp .env.example .env  # 编辑配置
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

**生产环境必须设置的环境变量：**
- `MONGO_ROOT_PASSWORD` — MongoDB root 密码
- `JWT_SECRET` — JWT 签名密钥
- API keys（GEMINI / OPENAI / TIKHUB）

**数据库备份/恢复：**
```bash
./scripts/backup-db.sh                    # 备份（自动保留 7 天）
./scripts/restore-db.sh backups/xxx.tar.gz  # 恢复
```

---

**🌟 如果这个项目对您有帮助，请给个 Star 支持一下！**
