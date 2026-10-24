# Cirkkl Monorepo

Monorepo workspace powered by [pnpm](https://pnpm.io).

## Repository Layout

```text
├── apps/
│   ├── web/            # Next.js web application
│   └── api/            # Hono API server (@cirkkl/api)
├── packages/
│   └── contracts/      # Shared contracts & schemas (@cirkkl/contracts)
├── supabase/           # Supabase database migrations and configuration
├── pnpm-workspace.yaml # pnpm workspace definition & allowed builds
├── package.json        # Monorepo root workspace configuration
└── tsconfig.base.json  # Shared TypeScript configuration
```

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 11

### Installation

```bash
pnpm install
```

### Environment Variables

Configure environment variables by creating `.env.local` based on `.env.example`:
```bash
cp .env.example .env.local
```

Key environment variables:
- `NEXT_PUBLIC_API_URL`: Base URL for the Cirkkl API (default: `http://localhost:3001`).
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL (used for Auth and remaining direct services).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon public key.
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key.

### Development

Run the Next.js web application:
```bash
pnpm dev:web
# or
pnpm --filter web dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

Run the Hono API server:
```bash
pnpm dev:api
# or
pnpm --filter api dev
```
The API server starts on [http://localhost:3001](http://localhost:3001) with health endpoint at `/health`.

### Build & Typecheck

```bash
# Build all apps and packages
pnpm build

# Build individual apps
pnpm --filter web build
pnpm --filter api build

# Typecheck all apps and packages
pnpm typecheck

# Lint apps
pnpm lint
pnpm --filter web lint
```

## Deployment (Vercel)

For deploying `apps/web` on Vercel:
1. Set **Root Directory** to `apps/web`.
2. Enable **"Include source files outside of the Root Directory"** in the project settings.
