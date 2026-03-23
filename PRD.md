# 📄 HotOrNot 产品需求文档 (PRD)

**版本**: v1.0  
**日期**: 2026-03-23  
**作者**: PM Agent  
**状态**: 已发布

---

## 1. 产品概述

### 1.1 产品定位

**HotOrNot** 是一个 AI 驱动的多平台内容分析平台，帮助内容创作者和社媒营销人员通过数据洞察发现「爆款密码」，提升内容创作效果。

### 1.2 核心价值主张

> 用 AI 替代「凭感觉做内容」，让每一篇内容都有数据支撑。

- **降低门槛**：无需数据分析经验，输入链接即出报告
- **节省时间**：自动化分析替代人工刷榜和手动统计
- **提升效果**：基于爆文特征的可执行建议

### 1.3 目标用户

| 用户角色 | 描述 | 核心需求 | 优先级 |
|---|---|---|---|
| 小红书/抖音创作者 | 个人博主、KOL | 了解内容好坏、找到爆款选题 | P0 |
| 社媒营销从业者 | MCN机构、品牌方运营 | 竞品监控、趋势分析、批量分析 | P0 |
| 数据分析师 | 内容研究、行业报告 | 关键词趋势、平台对比数据 | P1 |
| 新手创作者 | 想入行但不知道做什么内容 | 热点发现、选题灵感 | P1 |

---

## 2. 功能需求

### 2.1 核心功能（已完成 ✅）

#### F1: 内容分析

**用户故事**: 作为创作者，我想分析一篇已发布的内容，了解它的优缺点和改进方向。

| 项 | 说明 |
|---|---|
| 输入 | 内容 URL（小红书/抖音链接） |
| 处理 | URL 解析 → 内容抓取 → AI 评分 + 分析 |
| 输出 | 1-10 分评分、优缺点列表、改进建议、推荐标签 |
| 缓存 | 6小时，支持强制刷新 |
| 限制 | 需有效链接，平台需在支持范围内 |

#### F2: 账号分析

**用户故事**: 作为运营人员，我想全面了解一个创作者账号的表现和特征。

| 项 | 说明 |
|---|---|
| 输入 | 创作者主页 URL |
| 处理 | 账号信息获取 → 内容偏好聚类 → 发布规律分析 → AI 建议 |
| 输出 | 内容偏好、发布时间规律、互动趋势、选题建议 |
| 缓存 | 12小时 |

#### F3: 关键词分析

**用户故事**: 作为创作者，我想知道某个话题的热度和竞争情况，判断是否值得做。

| 项 | 说明 |
|---|---|
| 输入 | 关键词 + 目标平台 |
| 处理 | TikHub 搜索 → 数据聚合 → AI 趋势分析 |
| 输出 | 热度评分、趋势方向、竞争度、头部创作者、创作建议 |
| 缓存 | 24小时 |

#### F4: 热点数据大屏

**用户故事**: 作为创作者，我想实时了解小红书和抖音上正在火什么。

| 项 | 说明 |
|---|---|
| 数据源 | TikHub API（小红书热榜 + 抖音热榜） |
| 更新频率 | 每3小时自动同步 |
| 展示 | 双平台热榜、趋势图表、词云 |
| 管理 | /admin/scheduler 可控制定时任务 |

#### F5: 用户系统

- 注册/登录（JWT + HTTP-only Cookie）
- 分析历史记录（/history 页面）
- 免注册可使用核心功能

#### F6: 缓存管理

- 四级缓存策略（关键词24h、内容6h、账号12h、热榜1h）
- 环境变量可配置
- /api/cache/config 状态查询

---

### 2.2 待完成功能

#### P0 — 上线前必须

| ID | 功能 | 描述 | 验收标准 |
|---|---|---|---|
| F7 | 环境变量安全审计 | 确保 .env 无硬编码密钥，Docker 镜像不泄露 Keys | 通过安全扫描，无密钥泄露 |
| F8 | API 限流 | 公开 API 添加 rate-limit，admin 路由鉴权保护 | 单 IP 15分钟内 ≤100 次请求 |
| F9 | 错误边界 | 前端全局 ErrorBoundary + API 统一错误格式 | 任何异常不出现白屏 |

#### P1 — 高优先级

| ID | 功能 | 描述 | 验收标准 |
|---|---|---|---|
| F10 | CI/CD 流水线 | GitHub Actions: lint → type-check → build → deploy | PR 合并前自动检查通过 |
| F11 | 基础测试 | AI 分析 API + 认证流程 + 热榜解析的单元/集成测试 | 核心路径覆盖率 ≥60% |
| F12 | 管理后台完善 | 补充缓存管理 UI、用户管理页面 | admin 可查看/管理所有用户和缓存状态 |
| F13 | SEO 优化 | 各页面添加 Next.js 14 metadata export | 搜索引擎可正确索引所有页面 |

#### P2 — 中优先级

| ID | 功能 | 描述 | 验收标准 |
|---|---|---|---|
| F14 | 性能优化 | React.Suspense + loading.tsx + 图表懒加载 | LCP < 2.5s，FID < 100ms |
| F15 | 日志 & 监控 | 接入 Sentry + 结构化日志 | 线上错误 5 分钟内告警 |
| F16 | 数据库索引复查 | 高频查询确认有复合索引 | 慢查询 < 100ms |
| F17 | 移动端打磨 | Dashboard 图表小屏适配、导航交互优化 | 375px 宽度下无溢出 |

#### P3 — Nice to Have

| ID | 功能 | 描述 |
|---|---|---|
| F18 | 国际化 (i18n) | 英文版界面 |
| F19 | 更多平台 | B站、微博热榜接入 |
| F20 | 订阅支付 | Stripe / 微信支付对接 Pro/Enterprise |
| F21 | 推送通知 | 热点变动邮件/钉钉/飞书通知 |
| F22 | 数据导出 | Excel/PDF 报告生成 |
| F23 | 批量分析 | 多链接/多关键词批量提交 |

---

## 3. 技术架构

### 3.1 系统架构

```
┌──────────────────────────────────────────────┐
│                  用户端                       │
│  浏览器 (Desktop / Mobile)                    │
└─────────────────┬────────────────────────────┘
                  │
┌─────────────────▼────────────────────────────┐
│            Next.js 14 App Router              │
│  ┌─────────┐ ┌──────────┐ ┌───────────┐     │
│  │  Pages  │ │ API Routes│ │ Scheduler │     │
│  └────┬────┘ └─────┬────┘ └─────┬─────┘     │
│       │            │             │            │
│  ┌────▼────────────▼─────────────▼──────┐    │
│  │          Shared Packages              │    │
│  │  @hotornot/shared | ui | ai | database│    │
│  └────┬──────────────┬──────────────┬───┘    │
└───────┼──────────────┼──────────────┼────────┘
        │              │              │
   ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
   │ MongoDB │   │ OpenAI  │   │ TikHub  │
   │         │   │ Gemini  │   │  API    │
   └─────────┘   └─────────┘   └─────────┘
```

### 3.2 技术栈

| 层级 | 技术 | 版本 |
|---|---|---|
| 前端 | Next.js 14 + React 18 + Tailwind CSS | 14.1.0 |
| 语言 | TypeScript | 5.3.3 |
| 数据库 | MongoDB + Mongoose | 8.1.1 |
| AI | OpenAI GPT-4 + Google Gemini | 多版本 |
| 数据源 | TikHub API | 实时 |
| 认证 | JWT + bcryptjs | - |
| 构建 | Turborepo + pnpm | 8.15.6 |
| 部署 | Docker + Docker Compose | - |

### 3.3 Monorepo 结构

```
HotOrNot/
├── packages/
│   ├── shared/     # 类型、常量、工具
│   ├── ui/         # UI 组件库
│   ├── ai/         # AI 服务抽象层
│   └── database/   # 7 个 Mongoose 模型
├── apps/
│   └── web/        # Next.js 主应用
├── scripts/        # 开发/部署脚本
└── docker/         # 容器化配置
```

---

## 4. 数据模型

### 4.1 核心模型（7个）

| 模型 | 用途 | 关键字段 |
|---|---|---|
| ContentAnalysis | 内容分析结果 | url, platform, score, pros, cons, recommendation |
| AccountAnalysis | 账号分析结果 | url, profile, analysis, fetchedAt |
| KeywordAnalysis | 关键词分析结果 | keyword, platforms, trendScore, hotScore, topContent |
| XiaohongshuHotList | 小红书热榜 | items[], fetchedAt |
| DouyinHotList | 抖音热榜 | word_list[], trending_list[], fetchedAt |
| User | 用户 | username, email, password(hashed) |
| UserAnalysisRecord | 用户行为记录 | userId, analysisType, resultId, dataQuality |

---

## 5. API 接口

### 5.1 接口清单

| 方法 | 路径 | 功能 | 认证 |
|---|---|---|---|
| POST | /api/analysis/content | 内容分析 | 可选 |
| POST | /api/analysis/account | 账号分析 | 可选 |
| POST | /api/analysis/keyword | 关键词分析 | 可选 |
| GET | /api/hotlist/xiaohongshu | 小红书热榜 | 否 |
| POST | /api/hotlist/xiaohongshu | 触发小红书更新 | 是(admin) |
| GET | /api/hotlist/douyin | 抖音热榜 | 否 |
| POST | /api/hotlist/douyin | 触发抖音更新 | 是(admin) |
| POST | /api/auth/register | 注册 | 否 |
| POST | /api/auth/login | 登录 | 否 |
| POST | /api/auth/logout | 登出 | 是 |
| GET | /api/scheduler | 任务状态 | 是(admin) |
| POST | /api/scheduler | 任务控制 | 是(admin) |
| GET | /api/cache/config | 缓存状态 | 是(admin) |
| GET | /api/user/history | 分析历史 | 是 |

### 5.2 统一响应格式

```typescript
{
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  cached?: boolean;
  cacheExpiresIn?: string;
}
```

---

## 6. 页面路由

| 路径 | 页面 | 说明 |
|---|---|---|
| `/` | 内容分析首页 | 核心入口，输入链接即分析 |
| `/analysis/account` | 账号分析 | 创作者账号深度洞察 |
| `/analysis/keywords` | 关键词分析 | 热点趋势发现 |
| `/dashboard` | 数据大屏 | 双平台实时热榜 |
| `/history` | 分析历史 | 用户历史记录回溯 |
| `/auth` | 登录注册 | 用户认证 |
| `/admin/scheduler` | 任务管理 | 定时任务控制台 |

---

## 7. 商业模式

### 7.1 订阅分级

| 级别 | 价格 | 功能 |
|---|---|---|
| Free | 免费 | 每日 5 次分析，基础热榜查看 |
| Pro | ¥49/月 | 无限分析，历史导出，API 调用 |
| Enterprise | ¥299/月 | 团队协作，批量分析，专属支持 |

### 7.2 关键指标 (KPI)

| 指标 | 目标 | 衡量方式 |
|---|---|---|
| DAU | 首月 500+ | 分析请求去重 |
| 注册转化率 | >15% | 注册用户 / 访客 |
| Pro 转化率 | >5% | 付费用户 / 注册用户 |
| 分析满意度 | >4.0/5 | 用户反馈 |
| 页面加载 | <2.5s LCP | Web Vitals |

---

## 8. 非功能需求

| 类别 | 要求 |
|---|---|
| 性能 | API 响应 < 3s（AI 分析除外），LCP < 2.5s |
| 可用性 | 99.5% uptime |
| 安全 | JWT 认证，密码 bcrypt 加密，IP 哈希化，API 限流 |
| 可扩展 | `/api/hotlist/{platform}` 架构支持新平台接入 |
| 兼容性 | Chrome/Safari/Firefox 最新2个版本，iOS/Android 移动端 |
| 数据 | 热榜每3小时更新，分析缓存按类型配置 |

---

## 9. 里程碑

| 阶段 | 时间 | 目标 |
|---|---|---|
| **Phase 1** ✅ | 2024.01 - 2024.08 | 核心功能完成（内容/账号/关键词分析 + 用户系统） |
| **Phase 2** ✅ | 2024.08 - 2025.01 | 热榜数据（小红书+抖音）+ 缓存系统 + Docker 部署 |
| **Phase 3** 🔄 | 2025.01 - 现在 | 工程化加固（P0 安全 + CI/CD + 测试） |
| **Phase 4** 📋 | 计划中 | 商业化（支付 + 团队功能 + 更多平台） |

---

## 10. 风险与依赖

| 风险 | 影响 | 缓解措施 |
|---|---|---|
| TikHub API 变更/下线 | 热榜和搜索数据断供 | 预留多数据源切换能力 |
| AI API 成本上升 | 利润空间压缩 | 缓存策略 + 多供应商切换 |
| 平台反爬加强 | 内容抓取失败率上升 | 降级到 mock 数据 + 用户手动输入 |
| MongoDB 性能瓶颈 | 高并发下响应变慢 | 索引优化 + 读写分离 |

---

## 附录

- **仓库**: https://github.com/perhapzz/HotOrNot
- **在线体验**: https://hotornot.vercel.app
- **环境配置**: [ENV_CONFIG_GUIDE.md](ENV_CONFIG_GUIDE.md)
- **开发规范**: [project_rules.md](project_rules.md)

---

*PRD v1.0 — 2026-03-23 · PM Agent*
