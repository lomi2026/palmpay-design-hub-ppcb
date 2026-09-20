FROM node:24-bookworm-slim

WORKDIR /app
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/schemas/package.json packages/schemas/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile

COPY apps apps
COPY packages packages
COPY deployment deployment
RUN set -eux; \
  DATABASE_URL="postgresql://build:build@localhost:5432/build" pnpm --filter @palmpay/api build; \
  node deployment/ppcb/build.mjs; \
  node deployment/ppcb/package-runtime.mjs /out/ppcb-web; \
  node deployment/ppcb/package-api-runtime.mjs /out/ppcb-api-root; \
  mkdir -p /runtime/deployment/ppcb; \
  cp -a /out/ppcb-api-root/. /runtime/; \
  cp -a /out/ppcb-web/web-testing /runtime/web-testing; \
  cp -a /out/ppcb-web/web-production /runtime/web-production; \
  cp -a deployment/ppcb/. /runtime/deployment/ppcb/; \
  find /app -mindepth 1 -maxdepth 1 -exec rm -rf {} +; \
  cp -a /runtime/. /app/; \
  rm -rf /runtime /out /root/.cache /root/.npm /root/.local/share/pnpm/store

ENV NODE_ENV=production
ENV FILE_STORAGE_DRIVER=ppcb
EXPOSE 8080
CMD ["node", "deployment/ppcb/runtime.mjs"]
