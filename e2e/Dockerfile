# =============================================================
# E2E test runner — Playwright browsers are pre-installed in
# the official image; we only need to install npm packages.
# Pin the image tag to the exact @playwright/test version.
# =============================================================
FROM mcr.microsoft.com/playwright:v1.58.2-noble

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
# Browsers are already in the image — skip re-download
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

WORKDIR /app

COPY pnpm-lock.yaml ./
RUN pnpm fetch

COPY package.json ./
RUN pnpm install --offline --frozen-lockfile

COPY . .

CMD ["pnpm", "run", "test"]
