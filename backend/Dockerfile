# =============================================================
# Stage: base — pnpm + Node foundation shared by all stages
# =============================================================
FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

WORKDIR /app

# =============================================================
# Stage: development
# - Full devDependencies for hot-reload and Prisma codegen.
# - In docker-compose, only ./src is bind-mounted so the
#   container's node_modules are never overwritten by the host.
# =============================================================
FROM base AS development

ENV NODE_ENV=development

# pnpm fetch downloads packages into the pnpm store.
# This layer is cached as long as pnpm-lock.yaml doesn't change.
COPY pnpm-lock.yaml ./
RUN pnpm fetch

COPY package.json ./
RUN pnpm install --offline --frozen-lockfile

COPY . .
RUN pnpm prisma generate

EXPOSE 4000
CMD ["pnpm", "run", "start:dev"]

# =============================================================
# Stage: build — compile TypeScript to JS
# build script already calls: prisma generate && nest build
# =============================================================
FROM base AS build

COPY pnpm-lock.yaml ./
RUN pnpm fetch

COPY package.json ./
RUN pnpm install --offline --frozen-lockfile

COPY . .
RUN pnpm run build

# =============================================================
# Stage: prod-deps — install production-only node_modules
# Runs in parallel with build to speed up the pipeline.
# =============================================================
FROM base AS prod-deps

COPY pnpm-lock.yaml ./
RUN pnpm fetch

COPY package.json ./
RUN pnpm install --offline --frozen-lockfile --prod

# =============================================================
# Stage: production — minimal Alpine image, non-root user
# No pnpm or build tools included.
# =============================================================
FROM node:24-alpine AS production

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001 -G nodejs

ENV NODE_ENV=production

WORKDIR /app

COPY --from=prod-deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=build     --chown=nestjs:nodejs /app/dist         ./dist
COPY --from=build     --chown=nestjs:nodejs /app/prisma       ./prisma
COPY --from=build     --chown=nestjs:nodejs /app/package.json ./package.json

USER nestjs

EXPOSE 4000

# TCP-level health check — works without a dedicated /health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('net').createConnection(4000,'localhost').on('connect',()=>process.exit(0)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main"]
