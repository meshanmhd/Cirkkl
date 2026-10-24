<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Cirkkl Monorepo Workspace Guide

## Structure
- `apps/web`: Next.js frontend application (`@cirkkl/web`). Path aliases configured with `@/*` pointing to `apps/web/*`.
- `apps/api`: Hono API server (`@cirkkl/api`) providing REST endpoints such as `GET /health`.
- `packages/contracts`: Shared TypeScript data schemas and contracts (`@cirkkl/contracts`).
- `supabase/`: Database migrations and configuration at repo root.
- `tsconfig.base.json`: Base TypeScript configuration extended by all packages.

## Workspace Rules
- Use `pnpm` exclusively as the package manager.
- Workspace packages are referenced with `workspace:*`.
- `apps/web` must not import from `apps/api`.
- Direct imports from `@supabase/*` outside of `apps/web/utils/supabase/**` and `apps/web/lib/auth/**` are restricted.

## Commands
- Install: `pnpm install`
- Dev Web: `pnpm dev:web` (or `pnpm --filter web dev`)
- Dev API: `pnpm dev:api` (or `pnpm --filter api dev`)
- Build: `pnpm build` (or `pnpm --filter web build`)
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint` (or `pnpm --filter web lint`)
