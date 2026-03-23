# Contributing to HotOrNot

感谢你对 HotOrNot 的贡献！请阅读以下指南。

## 开发流程

1. Fork 仓库
2. 创建功能分支：`git checkout -b feat/your-feature`
3. 遵循 [项目规则](project_rules.md) 编写代码
4. 确保 type-check 通过：`cd apps/web && npx tsc --noEmit`
5. 运行测试：`pnpm test`
6. 提交 PR

## Commit 规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```
feat(scope): add new feature
fix(scope): fix a bug
refactor(scope): code refactoring
docs: update documentation
chore: build/tooling changes
```

## PR 要求

- 标题遵循 Conventional Commits 格式
- 按 [PR 模板](.github/pull_request_template.md) 填写描述
- 一个 PR 一个主题
- type-check + lint 通过后再提交

## 代码规范

- TypeScript 严格模式
- 避免 `any`（除非有充分理由并注释说明）
- 组件文件 PascalCase，工具文件 camelCase
- API routes 使用 `withApiHandler` 统一错误处理
- 敏感信息不得出现在代码中

## 目录约定

| 目录 | 用途 |
|------|------|
| `apps/web/src/app/` | 页面 & API 路由 |
| `apps/web/src/components/` | UI 组件 |
| `apps/web/src/hooks/` | 自定义 React Hooks |
| `apps/web/src/lib/` | 工具函数 |
| `packages/` | 共享包（Turborepo） |

## 环境搭建

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local
# 填写 MONGODB_URI, GEMINI_API_KEY, TIKHUB_API_KEY, JWT_SECRET
pnpm dev
```

## 问题反馈

请通过 [GitHub Issues](https://github.com/perhapzz/HotOrNot/issues) 提交。
