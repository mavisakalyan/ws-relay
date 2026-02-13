FROM node:20-alpine AS builder
RUN corepack enable pnpm

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json tsconfig.base.json ./

# Copy all packages and the web app
COPY packages/ packages/
COPY apps/web/ apps/web/

RUN pnpm install --frozen-lockfile
RUN pnpm turbo run build --filter=ws-relay-web

# ── Runtime ───────────────────────────────────────────────────────
FROM node:20-alpine AS runner

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app

COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD wget -qO- http://localhost:3000/ || exit 1

USER node

CMD ["node", "apps/web/server.js"]
