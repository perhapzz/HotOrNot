# Architecture Review — HotOrNot

**Date:** 2026-03-23  
**Scope:** Full codebase review (post P3 merge), covering PM's 8 required dimensions

---

## Dimension 1: API Layer

**Current state:** All business logic lives directly in Next.js route handlers. No service layer. Each route handler does: DB connect → input validation → business logic → response formatting → error handling.

**Risk: Medium**  
- Route handlers are 50-250 lines, mixing concerns
- Adding auth/logging/validation to each route is repetitive
- No shared error response format (each route catches differently)

**Recommendation:**
- Extract a `withApiHandler(handler, options)` wrapper that handles: DB connect, auth check, error catch, response format
- Move complex business logic into `src/services/` (e.g., `analysis-service.ts`, `hotlist-service.ts`)
- Estimated effort: 3-4h

**Must-fix:** Unified error handler wrapper  
**Nice-to-have:** Full service layer extraction

---

## Dimension 2: Database Layer

**Current state:** 11 Mongoose models in `packages/database`. Each defines schema + indexes inline. Connection managed via singleton in `utils/connection.ts`. Every API route calls `connectDatabase()`.

**Risk: Low**  
- Models are well-structured with appropriate types
- Compound indexes exist for common query patterns
- Connection pooling is handled by Mongoose defaults

**Issues found:**
- `connectDatabase()` called 45 times across API routes (should be in middleware/wrapper)
- No connection pool size configuration
- No index migration automation in CI

**Recommendation:**
- Move `connectDatabase()` into the API wrapper (see Dimension 1)
- Add `MONGODB_POOL_SIZE` env var, default 10
- Estimated effort: 1h

**Must-fix:** None  
**Nice-to-have:** Connection pool config, centralized connect

---

## Dimension 3: Authentication & Authorization 🔴

**Current state:** Custom auth using **base64-encoded JSON as "JWT"** — no cryptographic signing, no expiration validation, no secret key involved.

```ts
// Current "token" generation — NOT SECURE
function generateSimpleToken(user: any): string {
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}
```

Password hashing uses raw base64 encoding (NOT a hash function).

**Risk: HIGH**  
- Any user can forge auth tokens by base64-encoding arbitrary JSON
- Passwords stored as reversible base64 (equivalent to plaintext)
- No CSRF protection
- Admin routes have no auth check at all

**Recommendation:**
- **Immediate:** Replace with `jsonwebtoken` (JWT_SECRET signed tokens) + `bcryptjs` for passwords
- **Next phase:** Migrate to `next-auth` for proper session management
- **Admin routes:** Add role-based middleware (`requireAdmin`)
- Estimated effort: 3-4h (JWT+bcrypt), 6-8h (next-auth full migration)

**MUST-FIX — P0 SECURITY ISSUE**

---

## Dimension 4: Error Handling

**Current state:** Each API route has its own try/catch with inconsistent response shapes. Some return `{ success: false, error: "..." }`, others return raw error messages. Frontend has ErrorBoundary at root + page level.

**Risk: Medium**  
- No standardized error response schema
- Stack traces may leak in production (some routes pass `error.message` directly)
- No error codes for client-side handling

**Recommendation:**
- Define `ApiError` class with code/message/status
- Centralize in the `withApiHandler` wrapper
- Sanitize error messages in production (no stack traces)
- Estimated effort: 1-2h

**Must-fix:** Sanitize production errors  
**Nice-to-have:** Error codes + standard schema

---

## Dimension 5: Code Reuse / DRY

**Current state:** Significant duplication in two areas:

### 5a. Header/Nav duplicated across 5 pages (~40 lines × 5)
Every page contains a copy-pasted header with nav links. Adding "批量分析" required editing 5 files.

### 5b. Hotlist API routes share ~80% identical code (4 routes × 80 lines)
All follow: connect → check cache → fetch if expired → save → fallback to stale.

### 5c. Scheduler duplicates hotlist fetch logic from API routes

### 5d. Platform detection exists in two packages
- `packages/shared/UrlUtils.extractPlatform()` — URL parsing approach
- `apps/web/lib/platform-utils.detectPlatformFromUrl()` — string matching, handles more edge cases

**Recommendation:**
| Fix | Effort | Impact |
|-----|--------|--------|
| Extract `<AppHeader />` | 1h | High |
| Extract `cachedHotlistHandler()` | 1h | Medium |
| DRY scheduler ↔ API routes | 1-2h | Medium |
| Consolidate platform detection | 30min | Low |

**Must-fix:** AppHeader extraction  
**Nice-to-have:** Hotlist DRY, scheduler refactor

---

## Dimension 6: Type Safety

**Current state:** `packages/shared` exports Platform enum, ContentType enum, and analysis interfaces. Most API routes use `any` for request body parsing and some DB query results.

**Risk: Low-Medium**  
- Shared types cover the core domain (Platform, ContentType, analysis shapes)
- API request/response types are informal (no zod/joi validation schemas)
- `as any` appears in several places for Mongoose lean() results

**Recommendation:**
- Add zod schemas for API request validation (can share with frontend forms)
- Type Mongoose lean() results properly
- Estimated effort: 2-3h

**Nice-to-have:** Zod request validation

---

## Dimension 7: Environment Configuration

**Current state:** `env-validation.ts` checks for required vars at startup. `.env.example` has placeholder values. Validation uses logger (structured output).

**Risk: Low**  
- Core vars are validated
- Missing: SENTRY_DSN, notification webhook vars, i18n config

**Recommendation:**
- Add new env vars as features grow
- Consider zod-based env validation (type-safe + coercion)
- Estimated effort: 30min per feature

**Must-fix:** None currently  
**Nice-to-have:** Zod env schema

---

## Dimension 8: Frontend Architecture

**Current state:** All pages are `"use client"` components (700-930 lines each). State managed with useState/useEffect. No global state (no Redux/Zustand/Context). Components directory has 7 shared components.

**Risk: Medium**  
- Large page files hurt readability and testability
- No custom hooks — data fetching logic mixed with UI
- `packages/ui` exists but is completely unused (dead code)

**Recommendation:**
- Split pages: `useAnalysis()` hooks + sub-components (form, results, metrics)
- Decide on `packages/ui`: adopt or delete
- Consider SWR/React Query for data fetching (dedup, caching, revalidation)
- Estimated effort: 2-3h per page, 8-12h total

**Must-fix:** None blocking  
**Nice-to-have:** Hook extraction, SWR adoption

---

## Summary: Priority Matrix

| Priority | Issue | Risk | Effort | Action |
|----------|-------|------|--------|--------|
| 🔴 P0 | Auth: base64 "JWT" + plaintext passwords | HIGH | 3-4h | **MUST FIX NOW** |
| 🔴 P0 | Admin routes: no auth check | HIGH | 1h | **MUST FIX NOW** |
| 🟡 P1 | Extract `<AppHeader />` | Medium | 1h | Should fix |
| 🟡 P1 | Unified API error handling | Medium | 1-2h | Should fix |
| 🟡 P1 | Production error sanitization | Medium | 30min | Should fix |
| 🟡 P1 | DRY hotlist routes + scheduler | Medium | 2-3h | Should fix |
| 🟢 P2 | Page file splitting | Low-Med | 8-12h | Nice to have |
| 🟢 P2 | Zod request validation | Low | 2-3h | Nice to have |
| 🟢 P2 | Decide on packages/ui | Low | — | Defer |
| 🟢 P2 | Stale files cleanup | Low | 5min | Nice to have |

**Total P0 effort: ~4-5h**  
**Total P0+P1 effort: ~9-12h**

---

## Dependency Impact on P4 Tasks

- **Task 8 (User Dashboard)** and **Task 9 (Teams)** depend on auth being real — currently anyone can forge tokens
- **Task 10 (API Platform)** needs proper API key auth middleware — the `withApiHandler` wrapper would help
- **Task 6 (Sentry)** can be done independently
- **Task 4 (Docker)** — Dockerfile and compose files already exist in repo root, need review/update

**Recommendation to PM:** Fix auth (P0) before building user-facing features (Tasks 8-10). Otherwise we're building on sand.
