FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

FROM base AS builder
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json tsconfig.base.json ./
COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @cirkkl/contracts build
RUN pnpm --filter @cirkkl/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3001
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/packages/contracts/dist ./packages/contracts/dist
COPY --from=builder /app/packages/contracts/package.json ./packages/contracts/package.json
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
EXPOSE 3001
CMD ["node", "apps/api/dist/index.js"]
