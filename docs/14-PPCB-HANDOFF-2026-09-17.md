# PPCB 发布交接（2026-09-17，历史归档）

> 本文的工作目录、源码包、revision、存储方案和下一步均为历史状态，不得直接执行。当前边界见 [15-PPCB-PROJECT-CONTEXT.md](15-PPCB-PROJECT-CONTEXT.md)，发布规范见 [19-PPCB-RELEASE-STANDARD.md](19-PPCB-RELEASE-STANDARD.md)。保留正文供故障复盘。

## 可直接使用的源码包

- 文件：`/private/tmp/palmpay-ppcb-optimized-485d22d-flat.zip`
- 大小：`2,141,064` bytes（约 2.1 MB）
- SHA-256：`2ed0ddfc1e1bdf0fcae096a8ab7c6c21d1c53a9ebebf5a32c9eb5e61e427feb1`
- 已执行 `unzip -t`，并确认 zip 根目录存在 `Dockerfile`、`package.json`、`pnpm-lock.yaml` 和 `pnpm-workspace.yaml`。
- 此包不含 `.env`、依赖目录、Next.js 构建产物、`dist`、`legacy`、`docs` 或 Git 元数据。它采用无空目录的 ZIP 格式，与此前成功的 PPCB 测试源码包一致。

该包来自工作树 `/Users/a1/Documents/palmpay-ppcb-deployment` 的 PPCB 专用分支 `codex/ppcb-deployment`。应用代码已适配 PPCB：Node.js 24、PPCB 网关注入身份与权限、独立测试 schema、应用子路径路由、`/healthz`、托管 PostgreSQL 和端口 `8080`。

## 当前代码和应用状态

- 代码提交：`485d22d fix: reuse PPCB runtime base layer`
- Dockerfile 将 Node.js 24 + OpenSSL 作为 build/runtime 共用基础层，避免运行阶段重复下载 Debian OpenSSL。
- 应用 ID：`palmpay-design-hub-builder`
- 测试 URL：`https://ppcloudebase.palmpay-inc.com/apps/palmpay-design-hub-builder-test/`
- 当前可访问的测试发布：`REL-MU55VOKM-791F9CE9F6`；它是旧镜像，不包含本轮基础层优化。
- 生产环境：未发布、未改动。
- 最新平台源码 revision：`REV-MU5B3JRM-331EDF91DD`。下一次源码发布应传为 `baseRevision`。

## 本轮构建历史

1. 第一次优化构建 `BUILD-MU57QDHX-80A13952E5` 已完成 API 和两个 Web 构建，但在运行阶段第二次下载 Debian OpenSSL 时超时。
2. 随后将 Dockerfile 改为共用 OpenSSL 基础层（提交 `485d22d`）。
3. 第二次构建 `BUILD-MU5B3JRL-F05C710592` 在应用编译前失败，错误为：`lstat /workspace/src/package.json: no such file or directory`。
4. 此错误和上传包内容不一致：平台保存的旧源码包已通过 `app_download_latest_source` 回下载、SHA-256 核对和 `unzip -t`，其中根目录确有 `package.json`。
5. 本交接 ZIP 是一次受控替代封装：只改变 ZIP 归档布局并排除本机构建缓存，不改变业务代码或运行配置。

## 建议的下一步

1. 使用 `app_start_source_upload` 上传本交接 ZIP；新的 upload 会话请重新创建，不要复用旧会话。
2. 完成上传后调用 `app_preflight_uploaded_source`。预检通过后，调用 `app_publish_uploaded_source`，参数使用：
   - `applicationId: palmpay-design-hub-builder`
   - `baseRevision: REV-MU5B3JRM-331EDF91DD`
   - `buildProfile: large`
   - `targetEnvironment: testing`
   - `containerPort: 8080`
   - `healthPath: /healthz`
   - `enableDatabase: true`
3. 仅等待这一次测试构建。如再次出现相同的根目录 `package.json` 缺失，停止重复构建并先向用户汇报；用户明确要求在发生问题时先确认，且不得自行提交 PPCB Issue。
4. 测试发布成功后，使用 PPCB 的 `app_test_request` 验证健康检查、页面、权限和临时数据库 CRUD；再向用户申请明确的生产晋级确认。生产晋级会复用测试镜像，不会重新构建。

## 附件、R2 与数据迁移边界

- 当前测试版和本轮源码仍设置 `FILE_STORAGE_DRIVER=r2`，尚未改接 PPCB 私有 OSS。
- R2 凭据不能写入源码或交接文档；PPCB 生产也不会继承测试环境密钥。
- PPCB OSS 适配、旧数据库导入、9 个附件迁移、校验和核对、R2 停用均尚未执行。
- 用户提供的备份文件：`/Users/a1/Documents/PalmPay-private-backups/PalmPay-backup-20260915-140540.tar.gz`。迁移前应先清点其数据库和附件清单，保留原始 ID、关联、版本、权限和审计记录。
- 用户要求：现有线上内容和附件必须迁移；R2 在 PPCB OSS 迁移和验证成功后才能停用；现有线上服务保持不变直至验收。
