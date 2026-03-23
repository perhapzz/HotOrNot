# Sentry Alert Rules — Recommended Configuration

## Error Alerts

### 1. High-Volume Errors
- **Condition**: When an issue is seen more than 50 times in 1 hour
- **Action**: Notify via email + Slack
- **Priority**: P1

### 2. New Issues
- **Condition**: First seen error
- **Action**: Notify via email
- **Priority**: P2

### 3. Auth Failures Spike
- **Condition**: Events with tag `api.path:/api/auth/*` > 100 in 15 min
- **Action**: Notify immediately (possible brute force)
- **Priority**: P0

### 4. AI Service Errors
- **Condition**: Events with tag `analysisType:*` > 10 in 5 min
- **Action**: Notify via Slack (AI service may be down)
- **Priority**: P1

## Performance Alerts

### 5. Slow API Response
- **Condition**: P95 transaction duration > 5s for `/api/analysis/*`
- **Action**: Notify via Slack
- **Priority**: P2

### 6. High Error Rate
- **Condition**: Error rate > 5% for any transaction
- **Action**: Notify via email + Slack
- **Priority**: P1

## Custom Tags Available

| Tag | Description |
|-----|-------------|
| `userId` | Authenticated user ID |
| `api.path` | API endpoint path |
| `api.method` | HTTP method |
| `analysisType` | content / keyword / account |

## Setup

1. Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` in `.env`
2. Set `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` for source maps
3. Configure alerts in Sentry dashboard > Alerts > Create Rule
