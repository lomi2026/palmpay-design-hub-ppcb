# PalmPay Design Intelligence Hub — 换机交接提示

更新时间：2026-07-17

## 最重要：当前本地提交尚未进入远端

- 当前分支：`codex/v1-project-handoff`
- 远端最后已推送提交：`52a106e feat: complete phase 3 workflows and v9-1 migration groundwork`
- 当前本地最新提交：`6a40432 feat: complete phase 4 and phase 5 workflows`
- 本地分支当前领先远端 1 个提交；该提交包含已验证的 Phase 4、Phase 5、详情页、工作台修复和本交接文档。

因此，换机前必须选择其中一种方式：

1. 在当前电脑恢复 GitHub 授权并推送 `6a40432`；或
2. 完整复制整个工作区（包含 `.git`）到新电脑，再从新电脑推送本地提交。

不要在新电脑只克隆远端分支后假定这些工作已存在；那会缺少本地领先的提交。不要使用 `git reset --hard`、`git checkout --` 或删除当前工作区来“清理”。

## 给下一位 Codex 的启动提示

将下面内容原样发送给下一位 Codex：

```text
接管 PalmPay Design Intelligence Hub，仓库为 https://github.com/lomi2026/palmpay-design-intelligence.git，分支为 codex/v1-project-handoff。

先执行 git status，保留全部已有改动，绝不重做已完成模块。必须先阅读 AGENTS.md 及：
- docs/00-PROJECT-CONTEXT.md
- docs/01-V1.0-PRD.md
- docs/02-DATABASE-ER.md
- docs/03-DEVELOPMENT-PLAN.md
- docs/04-DESIGN-DECISIONS.md
- docs/05-CURRENT-STATUS.md
- docs/06-AI-COLLABORATION-RULES.md
- docs/09-V9-1-PARITY-INVENTORY.md
- design-qa.md
- docs/10-MACHINE-TRANSFER-HANDOFF.md

已完成并验证：Phase 1、2、3、4、5；PostgreSQL/Prisma 本机迁移；v9-1 AI 项目、Skill、案例和设计资产正式数据迁移；草稿、自动保存、版本、审核、发布、通知、附件；权限过滤搜索、收藏、最近浏览、使用确认、内容关联、统一事件、价值总览、数据洞察、内容/分类/标签/用户角色管理、审计日志。

Phase 4/5、详情页与工作台改动已包含在本地提交 `6a40432`，但尚未推送。先确认该提交和工作区状态，再恢复 GitHub 认证并推送；不要重做这些模块。

最高优先级：继续最终 v9-1 视觉验收。当前已部署且必须对照的页面是公开首页、workspace.html、projects/index.html、projects/project-detail.html。设计资产、AI Skill、提交等归档深链已被直接验证为 GitHub Pages 404，它们是 formal-only 页面，不应拿归档快照冒充部署对照。

不得使用 localStorage 作为正式业务数据源；不得伪造管理员/审核人身份；不得删除/修改 Cloudflare R2 适配器；不得提交 .env、数据库 dump、R2 密钥或本机附件。沿用 Next.js + NestJS + PostgreSQL + Prisma + shadcn/ui。每次代码改动后运行适用的 typecheck、lint、测试、build、Prisma 迁移状态和 git diff --check；更新 docs/05-CURRENT-STATUS.md。
```

## 当前实现状态

### 已完成且已验证

- Phase 1–5 的正式功能已包含在当前本地提交中。
- Phase 4/5 数据模型与迁移：收藏、最近浏览、统一事件、搜索日志、审计日志。
- API：权限过滤 PostgreSQL 搜索、搜索点击/无结果日志、收藏、最近浏览、真实项目使用确认、内容关联、分析聚合、分类/标签/内容/用户角色管理、审计日志。
- 前端：全局搜索、收藏、最近浏览、使用确认、关联内容、价值总览、数据洞察、管理中心。
- 通知：持久化未读数、单条/全部标记已读、顶部动态未读徽标。
- 工作台：真实 RBAC 角色文案、权限过滤的 AI 项目数、`⌘/Ctrl + K` 打开正式搜索页。
- AI 项目、AI 案例、AI Skill、设计资产详情页均使用正式数据库字段；不以静态内容伪造结果、限制或权限。
- 首页已恢复部署首页的主要桌面结构；本地公开首页已实际加载验证。

### 当前验证记录

- API：typecheck、lint、Prisma validate、`prisma migrate status` 通过。
- API：10 项 PostgreSQL 集成测试通过。
- Web：typecheck、lint、production build 通过。
- `git diff --check` 通过。
- 本机已验证的公开首页为 `http://localhost:3100/`；新电脑上 Next.js 默认会尝试 `http://localhost:3000/`，端口冲突时使用终端显示的实际地址。
- 工作台按正式认证保护；未登录访问应跳转登录页，不得改成静态管理员或审核人页面。

## 尚未推送的本地提交范围

至少包括：

- `apps/api/prisma/migrations/20260717100000_phase_4_5_engagement_analytics/`
- `apps/api/src/engagement/`、`apps/api/src/governance/`
- Phase 4/5 的 Prisma、内容、身份、审核和 API 集成测试更新
- `apps/web/src/app/workspace/{admin,search,favorites,recent,usage,related,overview,insights}/`
- 工作台通知 actions、搜索快捷键、动态角色/计数
- AI 项目/案例/Skill/设计资产详情和首页视觉改进
- `docs/05-CURRENT-STATUS.md`、`docs/09-V9-1-PARITY-INVENTORY.md`、`design-qa.md`

换机后先运行 `git status -sb` 和 `git log -1 --oneline`，确认 `6a40432` 仍在当前分支，再继续工作或推送。

## 新电脑本地启动

### 1. 基础环境

- Node.js `>=24`
- pnpm `>=11`（项目锁定 `pnpm@11.7.0`）
- PostgreSQL（本地开发使用 PostgreSQL 17）

```bash
pnpm install
```

### 2. 环境变量

- 将根目录 `.env.example` 的非敏感模板复制到 `apps/api/.env`，填入**新电脑自己的** PostgreSQL 连接信息。
- 创建 `apps/web/.env.local`，至少配置：

```dotenv
API_BASE_URL="http://localhost:3001"
NEXT_PUBLIC_API_BASE_URL="http://localhost:3001"
```

- 不要复制、提交或粘贴旧电脑的 `.env`、R2 凭据、附件目录或数据库 dump 到仓库。

### 3. 数据库

如果需要保留旧电脑的本地业务记录，请通过受控、加密的私有渠道迁移数据库备份；该备份不应加入 Git。

如果可以从正式迁移和 v9-1 导入数据重建本地库：

```bash
cd apps/api
pnpm exec prisma migrate deploy
pnpm prisma:seed
pnpm prisma:import:v9-1-projects
pnpm prisma:import:v9-1-ai-catalog
pnpm prisma:import:v9-1-design-assets
pnpm exec prisma migrate status
```

导入脚本是面向已批准 v9-1 内容的正式数据库导入；不要导入 legacy 的 localStorage 用户、收藏、审核模拟或 demo 指标作为生产事实。

### 4. 启动服务

分别在两个终端运行：

```bash
pnpm dev:api
pnpm dev:web
```

- API 默认：`http://localhost:3001/api`
- API 文档：`http://localhost:3001/api/docs`
- Web 默认：`http://localhost:3000`（端口冲突时使用终端显示的实际地址）

开发登录仅用于本地隔离的认证适配器。使用获批准的活动开发账户，不要在浏览器自动输入或猜测个人邮箱，也不要创建假管理员/审核人仅为匹配静态原型。

## 下一步顺序

1. 恢复 GitHub CLI 授权并推送本地提交 `6a40432`；推送后再开始新改动。
2. 完成 v9-1 对照验收：
   - 公开首页：桌面、390px 移动端、关键交互状态。
   - 工作台：桌面、移动端、真实成员与获批准审核/管理角色状态。
   - AI 项目库与项目详情：桌面、移动端、真实正式数据状态。
3. 完成全量浅色主题令牌迁移。当前深色模式为默认且稳定；不要只切换图标或根 class 就声称已支持浅色主题。
4. 后续才处理生产 R2 启用、企业 SSO/OIDC、生产托管与数据库提供商决策、AI Gateway 和外部集成。

## v9-1 对照范围的关键事实

- 部署基线：`https://lomi2026.github.io/palmpay-design-intelligence/`
- 已确认可访问：`index.html`、`workspace.html`、`projects/index.html`、`projects/project-detail.html`。
- 已确认 404：`design-assets.html`、`upload-asset.html`、`design-intelligence-hub-demo.html`、`ai-skill-toolkit.html`、`skill-detail-component-governance.html`。
- 因此，`legacy/v9-1/` 中这些 404 页面只能作历史研究，不能覆盖部署基线，也不能作为最终像素验收证据。

## 必跑验证命令

```bash
pnpm --filter @palmpay/api typecheck
pnpm --filter @palmpay/api lint

# 需要 apps/api/.env 内有效的 DATABASE_URL
cd apps/api && pnpm prisma:validate
cd apps/api && pnpm exec prisma migrate status
cd apps/api && pnpm test

pnpm --filter @palmpay/web typecheck
pnpm --filter @palmpay/web lint
pnpm --filter @palmpay/web build
git diff --check
```

## 不可违反的规则

- 只以部署 v9-1 和匹配历史源码作为视觉/交互基线；不要混入旧版本。
- 不重写已工作的模块，只做最小且架构一致的修改。
- 正式业务数据必须来自 NestJS API + PostgreSQL/Prisma；禁止 localStorage 充当正式数据源。
- 继续使用 Next.js + NestJS + PostgreSQL + Prisma + shadcn/ui。
- Cloudflare R2 适配器保留，生产启用暂缓；不提交 R2 凭据。
- 不提交 `.env`、数据库 dump、R2 密钥或本机附件。
- 不为视觉原型伪造管理员、审核人、收藏或统计状态；RBAC 和真实数据优先。
- 对阶段、里程碑、阻塞或下一步的事实变化，更新 `docs/05-CURRENT-STATUS.md`。
