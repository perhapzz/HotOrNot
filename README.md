# HotOrNot

AI-powered content analysis platform for Chinese social media (Xiaohongshu, Douyin). Helps creators discover viral content patterns and improve their strategy.

## Features

- **Content Analysis** — Analyze individual posts with AI scoring and improvement suggestions
- **Account Analysis** — Profile insights, posting patterns, and content preferences
- **Keyword Analysis** — Trend discovery, hot score ranking, and top creator identification
- **Hot List Dashboard** — Real-time trending topics from Xiaohongshu and Douyin
- **Scheduled Updates** — Auto-sync trending data every 3 hours

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Database**: MongoDB + Mongoose
- **AI**: OpenAI GPT-4 / Google Gemini (multi-provider)
- **Data Source**: TikHub API
- **Monorepo**: Turborepo + pnpm

## Project Structure

```
├── apps/web/          # Next.js web application
├── packages/
│   ├── shared/        # Types, constants, utilities
│   ├── ui/            # UI component library
│   ├── ai/            # AI provider abstraction
│   └── database/      # Mongoose models & connection
├── docker/            # Docker & mongo init scripts
└── scripts/           # Dev & migration scripts
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Configure environment
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your API keys

# Start dev server
pnpm dev
# → http://localhost:3000
```

### Required Environment Variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `GEMINI_API_KEY` or `OPENAI_API_KEY` | AI provider key (at least one) |
| `TIKHUB_API_KEY` | TikHub API for trending data |

See [`apps/web/.env.example`](apps/web/.env.example) for the full list.

## Docker

```bash
cp .env.docker .env
# Edit .env with real API keys
docker-compose up -d
```

Production: `docker-compose -f docker-compose.prod.yml up -d`

See [`ENV_CONFIG_GUIDE.md`](ENV_CONFIG_GUIDE.md) for details.

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/analysis/content` | POST | Analyze a content URL |
| `/api/analysis/account` | POST | Analyze a creator account |
| `/api/analysis/keyword` | POST | Analyze a keyword trend |
| `/api/hotlist/xiaohongshu` | GET/POST | Xiaohongshu trending |
| `/api/hotlist/douyin` | GET/POST | Douyin trending |
| `/api/scheduler` | GET/POST | Scheduler status & control |
| `/api/auth/login` | POST | User login |
| `/api/auth/register` | POST | User registration |

## Development

```bash
pnpm dev        # Start all packages in dev mode
pnpm build      # Build everything
pnpm lint       # Lint all packages
pnpm format     # Format with Prettier
```

## License

MIT
