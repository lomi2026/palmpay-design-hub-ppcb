# PalmPay 体验设计 Hub · PPCB 项目上下文

## 项目边界

- 独立项目目录：`/Users/a1/Documents/PalmPay-Design-Hub-PPCB`
- 工作分支：`codex/ppcb-deployment`
- 独立 GitHub 仓库：`https://github.com/lomi2026/palmpay-design-hub-ppcb`（2026-09-20 经用户授权改为公开）
- 本目录使用独立 `.git`，不再与原项目共享 Git 配置、分支或远程；`origin` 仅指向上述新仓库。
- GitHub 用于源码版本管理；PPCB 仍通过源码包发布，平台受管 GitLab 关联不因 GitHub 推送自动改变。
- PPCB 应用 ID：`palmpay-design-hub-builder`
- 本对话任务 ID：`01a0a393-883d-7153-bf5b-d97cd0893312`
- Codex 侧边栏分组：`PalmPay 体验设计 Hub · PPCB`

该目录是 PPCB 版本后续开发、测试、迁移、发布和运维的唯一工作目录。`/Users/a1/Documents/plampay-design-intelligence` 保留为原托管版本与历史代码基线，不应直接用于 PPCB 发布。视觉与信息架构仍以最终 v9-1 网站为批准基线，但运行架构以本目录的 Next.js、NestJS、Prisma、PostgreSQL 和 PPCB 托管能力为准。

## 最近记录的线上状态（2026-09-20，操作前实时复核）

- 测试入口：`https://ppcloudebase.palmpay-inc.com/apps/palmpay-design-hub-builder-test/`
- 测试版本：`REL-MU9FSVQV-55E3034771`
- 生产入口：`https://ppcloudebase.palmpay-inc.com/apps/palmpay-design-hub-builder/`
- 生产版本：`REL-MU9GI4EH-EADA266DB3`
- 生产版本直接晋级自已验收测试镜像，没有重新构建。
- 测试与生产均使用独立 PostgreSQL schema、钉钉统一登录和 `app_managed` 授权。
- PPCB 环境使用平台私有 OSS 文件能力；PPCB 运行不需要原 Cloudflare R2 凭据。

上次生产启动日志确认执行了历史导入：48 条发布内容、49 个版本、17 个标签和 5 张封面。两个生产实例全部就绪且无重启。测试环境已完成中文附件上传、封面上传与回显、迁移图片读取验收。

## 发布流程

日常从 [一页发布检查卡](20-PPCB-RELEASE-CHECKLIST.md) 执行；特殊变更、失败处置和记录模板查 [完整规范](19-PPCB-RELEASE-STANDARD.md) 对应章节，无须每次重读历史复盘。下列步骤为摘要。

1. 在本目录完成代码修改和本地验收。
2. 提交准确的已验证代码。
3. 运行 `pnpm ppcb:package` 生成最小源码包。
4. 基于 PPCB 最新 revision 预检并发布独立测试环境。
5. 在真实测试入口验收登录、权限、核心页面、附件与封面上传、下载和图片回显。
6. 取得用户明确确认后，把同一不可变测试镜像晋级生产；生产晋级不重新构建。

历史最小源码包约 6.7 MB，实际大小以候选包为准；33 个静态项目页面不在 PPCB 打包白名单内。Dockerfile 已恢复上次成功的单阶段、单次 COPY、安装/构建/清理同层方案；不再为依赖缓存改变构建方式。

本地候选已取消普通启动中的内容/封面导入：已有组织不重新 seed，空环境仅一次性创建基础配置。没有新结构迁移时，只检查迁移账本，不重跑旧 SQL。此行为尚未发布，当前线上旧镜像仍可能在重启时导入；旧镜像不作为无条件安全的回退版本。

## 文件与数据安全

- 原始备份保留在 `/Users/a1/Documents/PalmPay-private-backups/PalmPay-backup-20260915-140540.tar.gz`，不得加入 Git 或发布源码包。
- 不把 `.env`、数据库、附件导出、Token、密钥、Cookie、签名 URL、依赖目录或构建缓存加入仓库。
- 源码包生成脚本只打包已提交的运行文件，并在已跟踪发布文件存在未提交修改时拒绝打包。未跟踪文件检查及包内敏感材料扫描必须另行执行，不能只依赖脚本。
- 测试验收草稿只留在测试数据库，不进入生产内容库。

## 后续工作约定

- 后续涉及 PPCB 的任务从本目录开始，不再从原项目目录发布。
- 新修改先在本地验收，再一次性发布测试；发现问题先排查应用代码并与用户确认，不自动提交 PPCB 平台问题。
- 生产数据和测试数据保持环境隔离；不得把测试草稿晋级或复制到生产。
- `docs/05-CURRENT-STATUS.md` 记录最新发布与验证状态，本文件记录长期边界和路由信息。
