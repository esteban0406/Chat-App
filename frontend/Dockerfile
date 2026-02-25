# =============================================================
# Stage: base — pnpm + Node foundation shared by all stages
# =============================================================
FROM node:20-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Disable telemetry in all stages
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

WORKDIR /app

# =============================================================
# Stage: development
# - Full devDependencies for HMR (next dev).
# - In docker-compose, ./frontend is bind-mounted over /app.
#   An anonymous volume on /app/node_modules prevents the host
#   from overwriting the container's compiled native modules.
# =============================================================
FROM base AS development

ENV NODE_ENV=development

COPY pnpm-lock.yaml ./
RUN pnpm fetch

COPY package.json ./
RUN pnpm install --offline --frozen-lockfile

COPY . .

EXPOSE 3000
CMD ["pnpm", "run", "dev"]

# =============================================================
# Stage: build — run `next build`
# NEXT_PUBLIC_* env vars are baked in at build time via ARG.
# =============================================================
FROM base AS build

ARG NEXT_PUBLIC_BACKEND_URL
ENV NEXT_PUBLIC_BACKEND_URL=$NEXT_PUBLIC_BACKEND_URL

COPY pnpm-lock.yaml ./
RUN pnpm fetch

COPY package.json ./
RUN pnpm install --offline --frozen-lockfile

COPY . .
RUN pnpm run build

# =============================================================
# Stage: prod-deps — production-only node_modules
# Runs in parallel with build to speed up the pipeline.
# =============================================================
FROM base AS prod-deps

COPY pnpm-lock.yaml ./
RUN pnpm fetch

COPY package.json ./
RUN pnpm install --offline --frozen-lockfile --prod

# =============================================================
# Stage: production — minimal Alpine image, non-root user
#
# TIP: Add `output: 'standalone'` to next.config.ts for a
# significantly smaller image (no node_modules copy needed).
# See: https://nextjs.org/docs/app/api-reference/config/next-config-js/output
# =============================================================
FROM node:20-alpine AS production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001 -G nodejs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

COPY --from=prod-deps --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=build     --chown=nextjs:nodejs /app/.next        ./.next
COPY --from=build     --chown=nextjs:nodejs /app/public       ./public
COPY --from=build     --chown=nextjs:nodejs /app/package.json ./package.json

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000',(r)=>process.exit(r.statusCode<400?0:1)).on('error',()=>process.exit(1))"

CMD ["node_modules/.bin/next", "start"]
