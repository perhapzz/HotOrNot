# 🧭 项目开发规范 - HotOrNot 智能内容分析平台

## 📋 项目概述

**项目名称**: HotOrNot - 智能内容分析平台  
**技术架构**: Next.js 14 + TypeScript + MongoDB + AI  
**开发模式**: Turborepo Monorepo  
**当前状态**: 98% 完成，生产就绪 ✅

## 🏗️ 项目结构

### Monorepo 架构图

```
HotOrNot/
├── 📦 packages/                    # 共享包目录
│   ├── shared/                    # ✅ 通用类型、常量、工具
│   │   └── src/
│   │       ├── constants/         # 平台枚举、配置常量
│   │       ├── types/            # TypeScript 类型定义
│   │       ├── schemas/          # Zod 数据校验模式
│   │       └── utils/            # 工具函数库
│   ├── ui/                       # ✅ UI 组件库
│   │   └── src/components/       # Button、Card、Modal、Layout
│   ├── ai/                       # ✅ AI 服务抽象层
│   │   └── src/
│   │       ├── providers/        # OpenAI、Gemini 实现
│   │       ├── factory.ts        # AI 供应商工厂
│   │       └── types/            # AI 接口定义
│   └── database/                 # ✅ 数据库操作层
│       └── src/
│           ├── models/           # 7个核心 Mongoose 模型
│           ├── utils/            # 数据库连接与工具
│           └── migrations/       # 数据迁移脚本
├── 🖥️ apps/
│   └── web/                      # ✅ Next.js 14 主应用
│       ├── src/app/              # App Router 结构
│       │   ├── 🔌 api/           # API 路由层
│       │   │   ├── analysis/     # 分析服务 API
│       │   │   ├── auth/         # 用户认证 API
│       │   │   ├── hotlist/      # 热点数据 API
│       │   │   ├── scheduler/    # 定时任务 API
│       │   │   ├── cache/        # 缓存管理 API
│       │   │   └── user/         # 用户数据 API
│       │   ├── 📱 页面路由/
│       │   │   ├── auth/         # 登录注册页面
│       │   │   ├── analysis/     # 分析功能页面
│       │   │   ├── dashboard/    # 数据大屏
│       │   │   ├── history/      # 历史记录
│       │   │   └── admin/        # 管理后台
│       │   └── 📄 layout.tsx     # 根布局组件
│       └── lib/                  # 应用工具库
│           ├── scheduler.ts      # 定时任务调度器
│           ├── cache-manager.ts  # 缓存管理器
│           ├── init-server.ts    # 服务初始化
│           └── *-parser.ts       # 数据解析器
├── 🛠️ scripts/                  # ✅ 开发部署脚本
├── 🐳 docker/                   # ✅ 容器化配置
├── 📝 配置文件/
│   ├── .env.docker              # Docker 环境模板
│   ├── apps/web/.env.example    # Web 应用环境模板
│   ├── turbo.json               # Turborepo 配置
│   ├── pnpm-workspace.yaml      # PNPM 工作区配置
│   └── package.json             # 根项目依赖
└── 📚 文档/
    ├── README.md                # 项目主文档
    ├── project_rules.md         # 开发规范 (本文件)
    ├── ENV_CONFIG_GUIDE.md      # 环境配置指南
    └── KEYWORD_ANALYSIS_UPDATE.md # 功能更新日志
```

## 🔧 核心功能模块

### 1. 🔍 内容分析服务 (Content Analysis)

**功能描述**: 深度分析单个内容链接，提供 AI 智能评分与改进建议

**核心流程**:

```mermaid
graph LR
    A[用户输入链接] → B[平台识别] → C[数据获取] → D[AI 分析] → E[返回结果]
    E → F[缓存存储]
```

**技术实现**:

- **API 路由**: `/api/analysis/content`
- **数据模型**: `ContentAnalysis` (packages/database)
- **AI 供应商**: OpenAI GPT-4 / Google Gemini
- **缓存策略**: 6小时有效期
- **支持平台**: 小红书、抖音

**输出格式**:

```typescript
{
  id: string;
  score: number;           // 1-10分评分
  pros: string[];          // 优点列表
  cons: string[];          // 缺点列表
  recommendation: string;  // 改进建议
  tags: string[];          // 内容标签
  platform: Platform;     // 平台类型
  cached: boolean;         // 是否来自缓存
  dataSource: 'real' | 'mock'; // 数据来源
}
```

### 2. 👥 账号分析服务 (Account Analysis)

**功能描述**: 全面分析创作者账号，洞察内容偏好和发布规律

**分析维度**:

- 📊 内容偏好分析 (主题分布、标签聚类)
- ⏰ 发布时间规律 (最佳发布时段)
- 📈 互动数据趋势 (点赞、评论、收藏走势)
- 🎯 选题方向建议 (基于历史表现)

**技术实现**:

- **API 路由**: `/api/analysis/account`
- **数据模型**: `AccountAnalysis` (packages/database)
- **缓存策略**: 12小时有效期
- **数据处理**: 聚类算法 + 时序分析

### 3. 📈 关键词分析服务 (Keyword Analysis)

**功能描述**: 发现热门趋势关键词，挖掘爆文共性特征

**分析能力**:

- 🔥 关键词热度评分 (1-10分)
- 📊 互动数据统计 (平均点赞、评论、收藏)
- 👑 头部创作者识别 (该关键词下的顶级创作者)
- 💡 创作建议生成 (基于爆文特征分析)

**技术实现**:

- **API 路由**: `/api/analysis/keyword`
- **数据来源**: TikHub API + AI 分析
- **数据模型**: `KeywordAnalysis` (packages/database)
- **缓存策略**: 24小时有效期 (趋势相对稳定)

### 4. 📊 热点数据服务 (Hot List)

**功能描述**: 实时获取和展示小红书、抖音平台热榜数据

**数据源配置**:

- **小红书热榜**: TikHub API - 小红书热点数据
- **抖音热榜**: TikHub API - 抖音热点数据
- **更新频率**: 每3小时自动更新
- **数据存储**: MongoDB 持久化

**API 接口**:

```typescript
// 获取热点数据
GET /api/hotlist/{platform}?limit=10&includeItems=true

// 手动触发更新
POST /api/hotlist/{platform}

// 响应格式
{
  success: boolean;
  data: {
    items: HotListItem[];
    lastUpdated: Date;
    nextUpdate: Date;
  }
}
```

### 5. 🕐 定时任务系统 (Scheduler)

**功能描述**: 自动化热点数据更新和任务调度管理

**核心特性**:

- ⚙️ 自动启动控制 (环境变量 `AUTO_START_SCHEDULER`)
- 📋 任务状态监控 (运行状态、下次执行时间)
- 🎛️ Web 管理界面 (`/admin/scheduler`)
- 🔄 手动控制支持 (启动/停止/重启/立即执行)

**配置选项**:

```env
AUTO_START_SCHEDULER=all    # prod/dev/all/none
```

**管理 API**:

```typescript
// 获取任务状态
GET /api/scheduler

// 控制任务
POST /api/scheduler
{
  "action": "start" | "stop" | "restart" | "update_now"
}
```

### 6. 📋 用户分析记录系统 (User Analysis Records)

**功能描述**: 记录和管理用户的所有分析行为

**记录维度**:

- 🆔 用户会话追踪 (登录用户 + 访客)
- 📝 分析行为记录 (类型、时间、结果ID)
- 📊 使用统计分析 (频次、偏好、趋势)
- 🔗 分享和历史管理

**技术实现**:

- **数据模型**: `UserAnalysisRecord` (packages/database)
- **会话管理**: JWT + HTTP-only Cookie
- **隐私保护**: IP 哈希化存储

### 7. 🔧 统一缓存管理系统 (Cache Manager)

**功能描述**: 统一管理所有分析功能和热点数据的缓存

**缓存策略配置**:

```env
KEYWORD_ANALYSIS_CACHE_HOURS=24    # 关键词分析缓存
CONTENT_ANALYSIS_CACHE_HOURS=6     # 内容分析缓存
ACCOUNT_ANALYSIS_CACHE_HOURS=12    # 账号分析缓存
HOTLIST_DATA_CACHE_HOURS=1         # 热点数据缓存
```

**技术实现**:

- **管理器**: `apps/web/src/lib/cache-manager.ts`
- **缓存逻辑**: 基于 `fetchedAt` 时间戳检查
- **强制刷新**: 支持 `?refresh=true` 参数
- **状态监控**: 缓存命中率、剩余有效时间

### 8. 👤 用户认证系统 (Authentication)

**功能描述**: 安全的用户注册、登录和会话管理

**认证机制**:

- 🔐 JWT Token + HTTP-only Cookie
- 🔒 密码加密存储 (bcryptjs)
- 🚪 无感刷新机制
- 📱 支持免注册使用核心功能

**API 接口**:

```typescript
POST / api / auth / register; // 用户注册
POST / api / auth / login; // 用户登录
POST / api / auth / logout; // 用户登出
```

## ⚙️ 技术架构详解

### 技术选型对比

| 技术领域     | 选择方案              | 版本   | 替代方案           | 选择理由                       |
| ------------ | --------------------- | ------ | ------------------ | ------------------------------ |
| **前端框架** | Next.js 14            | 14.1.0 | Nuxt.js, Remix     | App Router, 最佳SEO, React生态 |
| **UI框架**   | Tailwind CSS          | 3.4.1  | Ant Design, MUI    | 原子化CSS, 高度可定制          |
| **状态管理** | Zustand + React Hooks | 4.5.0  | Redux, Recoil      | 轻量级, 学习成本低             |
| **数据库**   | MongoDB + Mongoose    | 8.1.1  | PostgreSQL, Prisma | 文档型, 灵活Schema             |
| **AI服务**   | OpenAI + Gemini       | 多版本 | Claude, 文心一言   | API稳定, 多供应商策略          |
| **包管理**   | pnpm + Turborepo      | 8.15.6 | npm, yarn          | 磁盘节省, 构建性能             |
| **类型系统** | TypeScript            | 5.3.3  | JavaScript         | 类型安全, 开发体验             |

### 数据库模型设计

#### 7个核心 Mongoose 模型

1. **ContentAnalysis** - 内容分析记录

```typescript
{
  _id: ObjectId;
  url: string;
  platform: Platform;
  score: number;
  pros: string[];
  cons: string[];
  recommendation: string;
  tags: string[];
  fetchedAt: Date;
  userId?: ObjectId;
  sessionId?: string;
}
```

2. **AccountAnalysis** - 账号分析记录

```typescript
{
  _id: ObjectId;
  url: string;
  platform: Platform;
  profile: {
    username: string;
    followers: number;
    description: string;
  };
  analysis: {
    contentPreferences: string[];
    postingTimes: Array<{hour: number, count: number}>;
    recommendations: string[];
  };
  fetchedAt: Date;
}
```

3. **KeywordAnalysis** - 关键词分析记录

```typescript
{
  _id: ObjectId;
  keyword: string;
  platforms: Platform[];
  analysis: {
    trendScore: number;
    hotScore: number;
    recommendationLevel: 'high' | 'medium' | 'low';
    suggestions: string[];
  };
  searchStats: {
    totalResults: number;
    avgLikes: number;
    avgComments: number;
    avgCollected: number;
    topAuthors: Array<{name: string, count: number}>;
  };
  topContent: ContentItem[];
  fetchedAt: Date;
}
```

4. **XiaohongshuHotList** / **DouyinHotList** - 平台热点数据

```typescript
{
  _id: ObjectId;
  items: Array<{
    id: string;
    title: string;
    score: string;
    type: string;
    rank: number;
    trend?: "up" | "down" | "stable";
  }>;
  fetchedAt: Date;
  source: "tikhub";
}
```

5. **User** - 用户管理

```typescript
{
  _id: ObjectId;
  username: string;
  email: string;
  password: string; // bcrypt hashed
  createdAt: Date;
  lastLoginAt: Date;
  analysisCount: number;
}
```

6. **UserAnalysisRecord** - 用户分析行为记录

```typescript
{
  _id: ObjectId;
  userId?: ObjectId;
  sessionId?: string;
  ipHash?: string;
  analysisType: 'content' | 'account' | 'keyword';
  targetUrl?: string;
  targetKeyword?: string;
  resultId: ObjectId;
  status: 'pending' | 'completed' | 'failed';
  dataQuality: 'real' | 'cached' | 'mock';
  performanceMs: number;
  createdAt: Date;
  isPublic: boolean;
  shareToken?: string;
}
```

### API 路由架构

#### 统一响应格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  cached?: boolean;
  cacheExpiresIn?: string;
}
```

#### 路由分组策略

```
/api/
├── 🔍 analysis/           # 分析服务
│   ├── content/          # POST - 内容分析
│   ├── account/          # POST - 账号分析
│   └── keyword/          # POST - 关键词分析
├── 🔐 auth/              # 用户认证
│   ├── register/         # POST - 用户注册
│   ├── login/           # POST - 用户登录
│   └── logout/          # POST - 用户登出
├── 📊 hotlist/           # 热点数据
│   ├── xiaohongshu/     # GET/POST - 小红书热榜
│   └── douyin/          # GET/POST - 抖音热榜
├── 🕐 scheduler/         # GET/POST - 定时任务控制
├── 🔧 cache/             # 缓存管理
│   └── config/          # GET - 缓存配置状态
├── 👤 user/              # 用户相关数据
│   ├── history/         # GET - 分析历史
│   └── analysis/        # GET - 具体分析结果
└── 🛠️ admin/            # 管理功能
    ├── init/            # POST - 系统初始化
    └── migrate-*/       # POST - 数据迁移
```

## 🔄 开发工作流规范

### Git 工作流

#### 分支命名规范

```bash
# 功能开发
feature/功能名称          # feature/keyword-analysis
feature/优化项目          # feature/optimize-caching

# 问题修复
fix/问题描述             # fix/scheduler-error
hotfix/紧急修复          # hotfix/api-timeout

# 文档更新
docs/文档类型            # docs/readme-update

# 样式调整
style/样式描述           # style/mobile-responsive
```

#### 提交信息规范 (Conventional Commits)

```bash
# 功能添加
feat: 添加关键词分析缓存机制
feat(api): 支持批量关键词分析

# 问题修复
fix: 修复定时任务启动失败问题
fix(cache): 解决缓存过期时间计算错误

# 文档更新
docs: 更新API使用示例
docs(readme): 完善Docker部署指南

# 样式调整
style: 优化移动端响应式布局
style(ui): 统一按钮组件样式

# 重构代码
refactor: 重构AI服务工厂模式
refactor(db): 优化数据库连接管理

# 性能优化
perf: 优化热点数据查询性能
perf(cache): 改进缓存命中策略

# 测试相关
test: 添加关键词分析单元测试
test(e2e): 完善用户认证流程测试
```

### 代码质量标准

#### ESLint 配置标准

```javascript
// .eslintrc.js
module.exports = {
  extends: ["next/core-web-vitals", "@typescript-eslint/recommended"],
  rules: {
    "no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error",
    "no-console": process.env.NODE_ENV === "production" ? "error" : "warn",
  },
};
```

#### TypeScript 严格模式

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### 代码格式化 (Prettier)

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### 开发环境检查清单

#### 启动前检查

- [ ] Node.js >= 18 已安装
- [ ] pnpm >= 8 已安装
- [ ] MongoDB 服务已启动
- [ ] 环境变量已正确配置
- [ ] API Keys 已申请并填入

#### 代码提交前检查

```bash
# 类型检查
pnpm type-check

# 代码规范检查
pnpm lint

# 代码格式化
pnpm format

# 构建测试
pnpm build
```

## 🚀 部署配置规范

### 环境变量管理

#### 开发环境 (`apps/web/.env.local`)

```env
# 基础配置
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 数据库 (本地)
MONGODB_URI=mongodb://localhost:27017/hotornot
DATABASE_URL=mongodb://localhost:27017/hotornot

# API服务
TIKHUB_API_KEY=your_tikhub_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# 功能开关
USE_REAL_ANALYSIS=true
ALLOW_FALLBACK_DATA=false
AUTO_START_SCHEDULER=all

# 缓存配置
KEYWORD_ANALYSIS_CACHE_HOURS=24
CONTENT_ANALYSIS_CACHE_HOURS=6
ACCOUNT_ANALYSIS_CACHE_HOURS=12
HOTLIST_DATA_CACHE_HOURS=1
```

#### Docker 环境 (`.env.docker` → `.env`)

```env
# 数据库 (Docker容器)
MONGODB_URI=mongodb://admin:password123@mongodb:27017/hotornot?authSource=admin
DATABASE_URL=mongodb://admin:password123@mongodb:27017/hotornot?authSource=admin

# Docker构建配置
SKIP_DATABASE_CONNECTION=false

# 其他配置同开发环境
```

#### 生产环境配置原则

- ✅ 使用环境变量注入，避免文件配置
- ✅ API Keys 使用密钥管理服务
- ✅ 数据库连接使用连接池
- ✅ 启用生产优化 (`NODE_ENV=production`)

### Docker 部署配置

#### 开发环境 (`docker-compose.yml`)

```yaml
version: "3.8"
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
    depends_on:
      - mongodb

  mongodb:
    image: mongo:latest
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password123
```

#### 生产环境 (`docker-compose.prod.yml`)

```yaml
version: "3.8"
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 📚 开发最佳实践

### Monorepo 包管理

#### 包依赖管理

```json
// apps/web/package.json
{
  "dependencies": {
    "@hotornot/shared": "workspace:*",
    "@hotornot/ui": "workspace:*",
    "@hotornot/ai": "workspace:*",
    "@hotornot/database": "workspace:*"
  }
}
```

#### 包导入规范

```typescript
// ✅ 推荐: 使用包命名空间
import { Platform, ApiResponse } from "@hotornot/shared";
import { Button, Card } from "@hotornot/ui";
import { createAIProvider } from "@hotornot/ai";
import { connectDatabase } from "@hotornot/database";

// ❌ 避免: 相对路径导入跨包
import { Platform } from "../../../packages/shared/src/types";
```

#### Turborepo 缓存策略

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    }
  }
}
```

### 性能优化策略

#### 缓存分层架构

```typescript
// 四层缓存策略
1. 浏览器缓存 (静态资源)
2. CDN缓存 (API响应)
3. 应用缓存 (内存缓存)
4. 数据库缓存 (查询结果)
```

#### 数据库优化

```javascript
// 索引策略
ContentAnalysis.index({ url: 1, platform: 1 });
KeywordAnalysis.index({ keyword: 1, platforms: 1 });
UserAnalysisRecord.index({ userId: 1, createdAt: -1 });

// 查询优化
const analyses = await ContentAnalysis.find({ userId })
  .select("url score fetchedAt") // 只选择必要字段
  .sort({ fetchedAt: -1 })
  .limit(20)
  .lean(); // 返回普通对象而非Mongoose文档
```

#### 代码分割策略

```typescript
// 路由级代码分割
const AccountAnalysisPage = dynamic(
  () => import('./analysis/account/page'),
  { loading: () => <LoadingSpinner /> }
);

// 组件级懒加载
const HeavyChart = lazy(() => import('./components/HeavyChart'));
```

### 错误处理规范

#### API 错误处理模式

```typescript
// 统一错误处理器
export async function handleApiError(
  error: any,
  context: string,
): Promise<ApiResponse<null>> {
  console.error(`[${context}] API Error:`, error);

  if (error.name === "ValidationError") {
    return {
      success: false,
      error: "Invalid input parameters",
      message: error.message,
    };
  }

  if (error.code === "ECONNREFUSED") {
    return {
      success: false,
      error: "External service unavailable",
      message: "Please try again later",
    };
  }

  return {
    success: false,
    error: "Internal server error",
    message: "An unexpected error occurred",
  };
}
```

#### 前端错误边界

```typescript
// 错误边界组件
export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);

    // 发送错误报告到监控服务
    if (process.env.NODE_ENV === 'production') {
      reportError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### 安全最佳实践

#### API 安全策略

```typescript
// 输入验证 (Zod)
const createAnalysisSchema = z.object({
  url: z.string().url().max(2000),
  platform: z.enum(["xiaohongshu", "douyin"]),
  options: z
    .object({
      refresh: z.boolean().optional(),
    })
    .optional(),
});

// 速率限制
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 每IP最多100次请求
  message: "Too many requests from this IP",
});

// JWT验证
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch (error) {
    return null;
  }
}
```

#### 数据脱敏

```typescript
// 用户数据脱敏
export function sanitizeUser(user: User): PublicUser {
  return {
    id: user._id.toString(),
    username: user.username,
    createdAt: user.createdAt,
    // 排除敏感字段: email, password, lastLoginAt
  };
}

// IP地址哈希化
export function hashIP(ip: string): string {
  return crypto
    .createHash("sha256")
    .update(ip + process.env.IP_HASH_SALT!)
    .digest("hex")
    .substring(0, 16);
}
```

## 📖 文档维护规范

### README 文档结构

```markdown
# 项目标题

## 项目简介

## 核心功能

## 技术架构

## 开发环境设置

## Docker部署

## 核心包说明

## API使用示例

## 开发工作流

## 项目特色

## 项目状态

## 贡献指南

## 许可证和维护者
```

### API 文档格式

````typescript
/**
 * 内容分析 API
 *
 * @route POST /api/analysis/content
 * @param {string} url - 内容链接
 * @param {Platform} platform - 平台类型
 * @returns {ApiResponse<ContentAnalysis>} 分析结果
 *
 * @example
 * ```bash
 * curl -X POST http://localhost:3000/api/analysis/content \
 *   -H "Content-Type: application/json" \
 *   -d '{"url": "https://www.xiaohongshu.com/explore/xxx", "platform": "xiaohongshu"}'
 * ```
 *
 * @example Response
 * ```json
 * {
 *   "success": true,
 *   "data": {
 *     "id": "analysis_xxx",
 *     "score": 8.5,
 *     "pros": ["标题吸引人", "内容质量高"],
 *     "cons": ["图片不够清晰"],
 *     "recommendation": "建议优化图片质量..."
 *   }
 * }
 * ```
 */
````

### 版本更新日志

```markdown
# CHANGELOG

## [v1.2.0] - 2025-01-10

### ✨ 新增功能

- 关键词分析支持批量处理
- 添加缓存状态监控面板

### 🐛 问题修复

- 修复定时任务在Docker环境下启动失败
- 解决缓存过期时间计算错误

### 🔧 优化改进

- 优化数据库查询性能
- 改进移动端响应式布局

### 📚 文档更新

- 完善API使用示例
- 更新Docker部署指南
```

## 🎯 项目里程碑

### 已完成功能模块 (98%)

- [x] **内容分析服务** - 智能评分与建议 ✅
- [x] **账号分析服务** - 创作者洞察分析 ✅
- [x] **关键词分析服务** - 趋势热度分析 ✅
- [x] **热点数据服务** - 双平台实时热榜 ✅
- [x] **定时任务系统** - 自动化数据更新 ✅
- [x] **用户认证系统** - JWT安全认证 ✅
- [x] **缓存管理系统** - 统一缓存策略 ✅
- [x] **用户记录系统** - 行为追踪分析 ✅

### 技术债务和优化计划 (2%)

- [ ] **单元测试覆盖** - Jest + React Testing Library
- [ ] **E2E测试集成** - Playwright 自动化测试
- [ ] **性能监控** - Web Vitals + 自定义指标
- [ ] **错误监控** - Sentry 集成
- [ ] **日志系统** - 结构化日志记录

### 未来功能规划

- [ ] **多语言支持** - i18n 国际化
- [ ] **数据导出** - Excel/PDF 报告生成
- [ ] **团队协作** - 多用户团队管理
- [ ] **API开放** - 第三方集成支持
- [ ] **移动应用** - React Native 跨平台

---

## 📞 技术支持

### 开发团队联系方式

- **项目负责人**: [@perhapzz](https://github.com/perhapzz)
- **技术讨论**: [GitHub Issues](https://github.com/perhapzz/HotOrNot/issues)
- **功能建议**: [GitHub Discussions](https://github.com/perhapzz/HotOrNot/discussions)

### 开发环境问题排查

1. **依赖安装失败**: 清理 `node_modules` 后重新安装
2. **数据库连接错误**: 检查 MongoDB 服务状态
3. **API调用失败**: 验证环境变量配置
4. **构建失败**: 检查 TypeScript 类型错误
5. **Docker启动失败**: 查看容器日志排查问题

**保持这个规范文档的及时更新，确保团队开发的一致性和项目的可维护性。**
