# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim

# Prisma needs openssl; ca-certificates for HTTPS calls (Neon, Resend, Meta, imgbb...)
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@9.0.0 --activate

WORKDIR /app

# Install deps first (cached as long as manifests / lockfile don't change)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY apps/web/package.json apps/web/
COPY packages/db/package.json packages/db/
COPY packages/utils/package.json packages/utils/
RUN pnpm install --frozen-lockfile

# Copy the source
COPY . .

# Build. The production .env is mounted only for this step (never stored in the image)
# as apps/web/.env.production, so Next.js inlines NEXT_PUBLIC_* values and can reach
# the DB during build if a page needs it.
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN --mount=type=secret,id=app_env,target=/app/apps/web/.env.production \
    pnpm -w --filter @shoestore/db db:generate-schemas \
 && pnpm turbo run build --filter=web...

EXPOSE 3001
CMD ["pnpm", "--filter", "web", "start"]
