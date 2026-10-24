@AGENTS.md

# Cirkkl Workspace Instructions

- `apps/web`: Next.js web application (`@cirkkl/web`, zero dependency on Supabase)
- `apps/api`: Hono API service (`@cirkkl/api`)
- `packages/contracts`: Shared schemas and types (`@cirkkl/contracts`)
- `supabase`: Database migrations at repo root (backend only)

## Common Commands
- `pnpm install`: Install all workspace dependencies
- `pnpm dev:web`: Run Next.js web application in development mode
- `pnpm dev:api`: Run Hono API server in development mode
- `pnpm build`: Build all packages and applications
- `pnpm typecheck`: Run TypeScript type checking across all workspace packages
- `pnpm lint`: Run ESLint checks
