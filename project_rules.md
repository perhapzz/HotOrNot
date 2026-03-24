# 项目开发规范

## 代码规范

### Git Commit (Conventional Commits)

```
feat: 添加关键词分析缓存机制
fix: 修复定时任务启动失败问题
docs: 更新API使用示例
refactor: 重构AI服务工厂模式
perf: 优化热点数据查询性能
test: 添加关键词分析单元测试
chore: 更新依赖版本
```

### 分支命名

```
feature/功能名称
fix/问题描述
docs/文档类型
```

### 包导入

```typescript
// ✅ 使用包命名空间
import { Platform } from '@hotornot/shared';
import { Button } from '@hotornot/ui';
import { createAIProvider } from '@hotornot/ai';
import { connectDatabase } from '@hotornot/database';

// ❌ 不要跨包相对路径导入
import { Platform } from '../../../packages/shared/src/types';
```

### TypeScript

- 开启 strict 模式
- 避免 `any`，用 `unknown` 替代
- API 响应统一用 `ApiResponse<T>` 类型

### API 响应格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  cached?: boolean;
}
```

## 提交前检查

```bash
pnpm lint        # ESLint
pnpm build       # 类型检查 + 构建
pnpm format      # Prettier
```

## 环境变量

- 开发环境: `apps/web/.env.local`
- Docker: `.env.docker` → `.env`
- 模板: `apps/web/.env.example`
- 敏感信息不入库

## 缓存策略

| 模块 | 默认缓存时间 | 环境变量 |
|------|-------------|---------|
| 关键词分析 | 24h | `KEYWORD_ANALYSIS_CACHE_HOURS` |
| 内容分析 | 6h | `CONTENT_ANALYSIS_CACHE_HOURS` |
| 账号分析 | 12h | `ACCOUNT_ANALYSIS_CACHE_HOURS` |
| 热点数据 | 1h | `HOTLIST_DATA_CACHE_HOURS` |

## 数据库模型

7 个核心 Mongoose 模型（定义在 `packages/database/src/models/`）：

1. `ContentAnalysis` — 内容分析记录
2. `AccountAnalysis` — 账号分析记录
3. `KeywordAnalysis` — 关键词分析记录
4. `XiaohongshuHotList` — 小红书热点
5. `DouyinHotList` — 抖音热点
6. `User` — 用户
7. `UserAnalysisRecord` — 用户分析行为记录
