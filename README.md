# PalmPay体验设计Hub V1.0

这是 PalmPay体验设计Hub V1.0 的正式前后端产品化仓库。

## 当前状态

- 正式 Next.js Web、NestJS API、Prisma/PostgreSQL 数据模型和测试环境部署配置均已建立。
- 当前已上线方案 A 老首页 + 方案 B 工作台；部署和验证记录详见 `docs/05-CURRENT-STATUS.md`。
- `AGENTS.md` 与 `CLAUDE.md` 分别约束 Codex 和 Claude Code 的协作方式。
- `legacy/v9-1/` 是本地归档参考；若归档与已部署最终 v9-1 不一致，以已部署基线及匹配历史源码为准。

## Codex 首次接管

打开整个项目根目录后，先阅读 `AGENTS.md` 与其中要求的项目文档，再按 `docs/05-CURRENT-STATUS.md` 的 Next Task 继续。

## Important

最终 v9-1 是唯一 legacy 基线。不要混入旧版本。

## 在另一台电脑继续开发

当前界面组合为 **方案 A 老首页 + 方案 B 工作台**。所有页面同属一个应用，不再需要设置 `DESIGN_VARIANT`。

1. 安装 Node.js 24 与 pnpm 11（仓库锁定 pnpm 11.7.0）。
2. 克隆 `https://github.com/lomi2026/palmpay-design-intelligence.git` 并切换 `main`，执行 `git pull --ff-only`。
3. 在项目根目录执行 `pnpm install --frozen-lockfile`。
4. 参照 `.env.example` 配置 `apps/api/.env` 和 `apps/web/.env.local`。前端设置 `API_BASE_URL=http://127.0.0.1:3001`、`AUTH_MODE=development`；后端使用独立本地 PostgreSQL 和本地文件存储。真实凭据通过安全渠道配置，不在仓库中。
5. 在后端环境变量已加载的终端执行 `pnpm --filter @palmpay/api prisma:generate`、`pnpm --filter @palmpay/api prisma:migrate`，在全新开发库按需执行 `pnpm --filter @palmpay/api prisma:seed`。
6. 分别运行 `pnpm dev:api` 与 `pnpm dev:web`。首页是 `/`，工作台是 `/workspace`。

本地数据库和上传文件不属于代码，克隆 GitHub 不会复制它们；线上继续使用托管数据库与 R2。不要把本地 `.env`、数据库备份或上传目录加入 Git。

发布目标：Vercel 正式域名 `https://palmpay-design-intelligence-web.vercel.app`（`main`）；Render API 跟踪 `codex/v1-project-handoff`。两分支发布时保持相同代码树。后端启动先执行 Prisma migrate deploy，再启动 API；不要在每次启动重复导入示例数据。
