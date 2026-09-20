FROM node:24-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY . .

RUN pnpm install --frozen-lockfile
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build?schema=public" pnpm --filter @palmpay/api build

ENV NODE_ENV=production

WORKDIR /app/apps/api

EXPOSE 3001

CMD ["pnpm", "run", "start:deploy"]
