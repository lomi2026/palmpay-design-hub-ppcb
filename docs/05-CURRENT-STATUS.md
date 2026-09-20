## 2026-09-20 最小发布流程与启动数据保护已在本地完成

- 新增 [一页发布检查卡](20-PPCB-RELEASE-CHECKLIST.md)，同步 15、19 和部署 README：普通更新使用成功基线、一次测试构建、同镜像晋级；日常不重读全部历史、不重复执行同一候选的有效检查，无新数据库需求不导入业务数据。
- `runtime-seed` 不再调用历史内容或封面导入；目标组织已存在时跳过基础初始化，避免重置内容、分类和角色授权。空环境用数据库锁与事务只初始化一次基础配置，不带入历史内容。迁移账本逻辑未改，无新增模型或 migration。
- Dockerfile 恢复上次成功的单阶段单次 COPY 方案；`.dockerignore` 移除会排除 migration.sql 的宽泛规则，同时保留环境文件、备份、缓存排除并排除静态项目页。未为缩短构建尝试新的缓存结构。
- 验证：API 构建、类型检查、Lint、差异检查通过；API 109 项中 94 通过、0 失败、15 项身份 E2E 因未设置其 DATABASE_URL 跳过，不计为通过。新增 2 项真实本地 PostgreSQL 回归均通过：testing/production schema 并发空库初始化只执行一次；修改内容/版本/归档状态/分类及撤销角色授权后，连续启动两次全部数据库行保持一致。
- 实际组装运行目录验证：testing 和 production 模式各完成首次启动、再次启动，健康检查与登录页均 200；重启不重跑已应用迁移，未提供文件服务 Token 仍正常启动。首次本地复制误解引用了软链接，按 Dockerfile 的保留软链接方式重组后通过，不属于平台失败。一次性数据库与测试进程已清理。此为本机产物验证，非新的 Linux 容器或 PPCB 构建验证。Web 代码本轮未变，复用上一条 73 项测试和两套构建记录。
- 尚未上传、执行 PPCB 构建、发布或改变线上数据；当前线上旧镜像仍可能启动导入，不能直接作为数据安全的回退版本。生产前需明确可用回退/恢复措施。GitHub Pages 返回按钮仍固定到生产项目库，测试跨环境导航限制见检查卡；本轮未改静态页面。
- 下一步：获得测试发布授权后，实时核对平台与 baseRevision，冻结候选包并预检，再一次性发布测试；平台不可用或必要验收缺失时不晋级。

## 2026-09-20 PPCB 项目外链切换已在本地完成

项目详情页的“查看项目”和底部项目链接统一通过 `getProjectPageUrl` 解析：仅把旧 GitHub Pages 路径下 P01–P26、S01–S07 的链接映射到 `https://lomi2026.github.io/palmpay-design-hub-ppcb/projects/project-detail.html?id=…`。已存在的新链接、其他外链与未知编号保持原样；数据库中的来源快照保留，不执行迁移或业务数据写入。底部入口文字改为“查看项目页面”。

Web 73 项测试（含实际快照全部 33 条旧链接和边界情况）、Lint、类型检查通过；PPCB testing/production 两套生产构建均通过。本轮只准备本地候选代码，不生成发布包、不上传、不构建或发布 PPCB；下次测试发布仍须实时获取平台 baseRevision 并对候选包预检。静态项目目录继续排除在 PPCB 源码包外。

## 2026-09-20 AI 项目页面已在新 GitHub Pages 公开上线

用户明确授权将 `lomi2026/palmpay-design-hub-ppcb` 整个仓库改为公开。GitHub Pages 工作流 `35499334743` 成功，只部署 `project-pages/`；目录入口为 `https://lomi2026.github.io/palmpay-design-hub-ppcb/`，详情入口为 `projects/project-detail.html?id=P01`（支持 P01–P26、S01–S07）。

36 个线上入口/资源文件 HTTP 200 且与本地哈希一致，覆盖全部 33 个项目内容文件。浏览器确认 P01 正文正常呈现，点击“返回项目库”成功到达已登录的 PPCB 项目库（33 个项目）。其他项目已验证资源完整性，未逐一执行所有浏览器交互。本轮未改 PPCB 应用代码、数据库或部署；当前 PPCB“查看项目”仍指向原站，后续需要单独完成链接切换。新增静态目录及 GitHub 工作流均不在 PPCB 打包范围内。

本条覆盖下方“私有仓库 Pages 受阻”的历史状态；仓库及代码现为公开，PPCB 应用仍保持原有钉钉访问控制。

## 2026-09-20 33 个 AI 项目静态页面迁入私有仓库（网页托管受阻）

从原站已部署页面读取 P01–P26、S01–S07 共 33 个项目，迁入顶层 `project-pages/`，含入口、33 个内容文件、共享样式、来源哈希清单与说明，约 4.29 MB。保留原视觉和交互，返回链接指向 PPCB 生产项目库。编号、资源引用、解码及 165 个脚本语法检查通过；该目录不在 PPCB 打包白名单内。

GitHub Pages 创建返回 HTTP 422，当前套餐不支持此私有仓库。保持仓库私有，尚无新的网页入口，未修改 PPCB 现有项目链接、数据库或生产发布。下一步由用户选择可用的网页托管方案，完成浏览器验收后再替换链接。代码仓库已隔离，但现有线上“查看项目”仍依赖原 GitHub Pages，不能宣称所有外链都已隔离。

## 2026-09-20 PPCB 本地 Git 与原站隔离

本目录已从原仓库关联工作树转换为独立 Git 仓库，当前源码与发布规范作为新历史起点，远程仅配置私有仓库 `https://github.com/lomi2026/palmpay-design-hub-ppcb`。原项目 Git 远程和业务文件未修改。原分支历史、未提交补丁和关联元数据已备份于仓库外的 `PalmPay-private-backups/ppcb-git-isolation-*` 目录；原始备份不进入新仓库。本次仅做 Git 隔离与源码同步，不执行 PPCB 构建或生产发布。远程上传结果以本次任务的 GitHub 核验为准。

# 当前状态摘要（2026-09-20 文档复核）

- 最近的已记录发布：测试 `REL-MU9FSVQV-55E3034771`，生产 `REL-MU9GI4EH-EADA266DB3`；生产由同一测试镜像晋级。证据见本文件下方“2026-09-20 PPCB 测试发布”及提交 `8f62513`、`9fc95c8`。此前“等待重新发布”等段落是被后续结果覆盖的历史记录。
- 已记录测试验收：中文附件持久化、封面子路径回显和迁移图片读取；生产记录：两个实例就绪、48 条内容/49 个版本/17 个标签/5 张封面导入日志、统一登录重定向。未据此认定生产登录后所有角色与写流程均已验证。
- 本次仅复核仓库和历史证据，未查询实时平台状态、未上传或发布。后续操作前重新核对平台当前版本和受管源码 revision。
- PPCB 唯一工作目录与边界见 [15-PPCB-PROJECT-CONTEXT.md](15-PPCB-PROJECT-CONTEXT.md)。已新增 [发布流程与规范](19-PPCB-RELEASE-STANDARD.md)，覆盖失败复盘、发布门槛、数据/文件回退、授权和交付记录。
- 下一次发布按新规范完成本地检查、同包预检、真实测试验收及获批的生产晋级。自动门禁尚未补齐的项目按文档人工执行；本轮未改变线上里程碑。

以下保留历史过程，不能仅按物理位置判断哪条是最终状态。

## 2026-09-20 PPCB 封面目录修复已完成完整本地存储验证，等待重新发布授权

- 修复 `ppcb-published-file-import`：默认封面根目录现在相对编译模块定位到镜像内 `/app/deployment/ppcb/content-files`，不再依赖启动进程位于 `/app`。新增回归测试，从 API 工作目录调用解析函数仍得到项目级封面目录。
- 使用新组装运行包、一次性 PostgreSQL 数据库和本地 PPCB 私有文件服务模拟完成真实启动：48 条内容先幂等导入，随后 5 次上传申请、5 个文件上传及 SHA-256 校验、5 次完成确认均成功；数据库存在 5 条 READY 附件及 5 个内容封面关联，`/healthz` 返回 testing/ok。模拟服务、运行进程和临时数据库均已清理。
- API 完整测试 104 项：89 通过、15 项按环境设计跳过、0 失败；API 构建与 Lint 通过。当前修复仅在本地分支，未重新上传、未触发 PPCB 构建，也未提交 PPCB Issue。

## 2026-09-20 PPCB 单阶段镜像构建成功，测试实例因封面路径错误停止

- 经用户明确授权，源码包 `palmpay-design-hub-ppcb-5805e5b.zip`（9,508,324 字节，SHA-256 `c8f3449e93cc127deab47a1b96d7c8710d614d9931e0c2f49a6e70dd646efe6d`）通过 13 个分片上传、平台合并校验和预检；上传会话为 `UPLOAD-MU99FEPV-5098844BAA`，源码版本为 `REV-MU99HAAU-9D26C5398E`。
- 单阶段规避在 PPCB 真实构建环境生效：`COPY . .`、依赖安装、API 和两套 Next.js 编译、运行时组装及镜像推送全部成功，不再出现 `/workspace/src/package.json` 缺失。构建 `BUILD-MU99HAAU-62F927AA65`（操作 `OP-MU99HAAU-3C02FF5DE1`）以 large 档在 6 分 54 秒内成功，镜像大小约 118.7 MB。
- 新测试发布 `REL-MU99QEDW-38A938AAC7` 的两个 Pod 在启动时完成 48 条内容、49 个版本和 17 个标签的幂等导入，随后导入 5 个封面时从 `/app/apps/api/deployment/ppcb/content-files` 读取文件；实际文件位于 `/app/deployment/ppcb/content-files`，因此均以 `ENOENT` 退出并进入 `CrashLoopBackOff`。截至最后查询，平台发布操作 `OP-MU99QEDW-6783AC3DAF` 仍在等待，新版本未切流；原测试发布 `REL-MU55VOKM-791F9CE9F6` 与生产发布 `REL-MU6L9329-23EF8B846F` 均保持 `PUBLIC_READY`。
- 按用户要求，发现明确失败后停止，不修改代码、不重新上传、不重新构建、不提交 PPCB Issue。生产数据库和生产文件存储未变化；测试数据库已写入幂等内容记录，但 5 个封面尚未进入 PPCB 私有存储。

## 2026-09-20 PPCB 构建上下文本地规避已验证，等待重新发布授权

- 将 PPCB Dockerfile 从复用基础层的多阶段构建改为单阶段：只复制一次完整受 `.dockerignore` 保护的源码；依赖安装、两套 Next.js 子路径构建、API 构建、运行时追踪打包和开发文件清理在同一镜像层完成。该方案不再在阶段切换后单独读取 `/workspace/src/package.json`，针对连续三次相同 Kaniko 构建上下文失败做最小规避。
- 本地 Node.js 24 验证通过：API 构建与 Lint、Web 类型检查与 Lint、testing/production 两套 Next.js 构建均成功；组装后的运行目录为 88 MB，含 4,206 个文件，0 个断链、0 个环境文件/证书/私钥，且无多余 `ppcb/ppcb` 目录。
- 使用一次性 PostgreSQL 数据库和 PPCB testing schema 启动实际组装产物，数据库迁移、幂等基础数据与 48 条内容导入、API、testing Web 及统一入口全部启动成功；`/healthz` 返回 `200 {status: ok, environment: testing}`，测试登录页返回 200。临时数据库已删除。当前修改仅在本地分支，未上传、未触发新构建，也未修改测试/生产环境。

## 2026-09-20 PPCB 私有存储版测试构建再次因平台构建上下文失败（已停止）

- 用户明确授权后，修正版源码包通过新会话 `UPLOAD-MU98QDS7-ABF7E65574` 完成 13 个连续分片上传；平台确认 9,533,610 字节及 SHA-256 `df55361a827c0fa6a88a2b8aed60c100b4a5a85dfbea3f8fd8e298dffb43ac05`。预检通过，只有 localhost、系统包安装和在线依赖安装三项非阻断提示。
- 测试构建 `BUILD-MU98SAG2-B7C194A1C0`（操作 `OP-MU98SAG2-EF97C36A64`，源码版本 `REV-MU98SAG2-6DDFF857D6`）在约 5 分钟后失败。平台已完成 Node.js 24 基础阶段和 OpenSSL 安装，但进入下一阶段时报告 `lstat /workspace/src/package.json: no such file or directory`，随后达到 Job 重试上限；错误与 2026-09-18 的平台构建上下文失败一致。
- 按用户要求，本次失败后立即停止，不重新上传、不重新构建、不提交 PPCB Issue。现有测试发布 `REL-MU55VOKM-791F9CE9F6` 与生产发布 `REL-MU6L9329-23EF8B846F` 均保持 `PUBLIC_READY`；未写入测试/生产数据库，未导入 48 条内容或 5 个封面，未切换 PPCB 私有文件存储，也未停用 R2。

## 2026-09-20 PPCB 私有存储版重新上传完成，预检因示例环境文件停止

- 用户在前次失败后重新明确授权一次测试发布。平台实时健康为 `HEALTHY`，最新受管源码仍为 `REV-MU6QF7KD-9EE0329055`；本地候选应用提交仍为 `8c9b8a4`。
- 修正前次末段重复的分片计算后，新会话 `UPLOAD-MU982VOR-5E3E659430` 以 13 个连续分片完整上传 9,520,309 字节源码包，平台确认 SHA-256 `b2ed53be9e2dbdc24b44113ce1a7d6c7d2d6c7cbf3a3a0d5974d2768cc688123` 并进入 `UPLOADED`。
- PPCB 预检未通过，唯一阻断项是根目录 `.env.example` 被平台按 `.env`/凭证文件拒绝；另有 localhost、系统包和在线依赖安装三项非阻断提示。未开始源码构建或测试发布，测试/生产数据库与现有生产版本均未变化，也未提交 PPCB Issue。
- 已在本地生成去除 `.env.example` 的修正版 `/private/tmp/palmpay-design-hub-ppcb-8c9b8a4-no-env.zip`，9,533,610 字节，SHA-256 `df55361a827c0fa6a88a2b8aed60c100b4a5a85dfbea3f8fd8e298dffb43ac05`；根目录、Dockerfile及敏感文件排除检查通过。按用户失败即停止的约定，等待新的明确授权后才能再次上传。

## 2026-09-18 PPCB 私有存储版源码分片上传在合并阶段停止

- 用户确认发布后，基于本地提交 `8c9b8a4` 生成 9,520,309 字节源码包，SHA-256 为 `b2ed53be9e2dbdc24b44113ce1a7d6c7d2d6c7cbf3a3a0d5974d2768cc688123`；包内根目录、Dockerfile 与敏感文件排除检查通过。
- 上传会话 `UPLOAD-MU6SO9AC-58CE6B7038` 的 15 个分片均成功提交，但首次合并与校验返回错误，未生成可预检的上传包。随后再次查询合并结果被自动审批拒绝，原因是用户此前要求失败后停止、不要重复尝试。
- 本次没有进入源码预检、构建或测试发布，没有修改 PPCB 测试/生产数据库、运行实例或生产版本，也没有提交 PPCB Issue。当前需向用户说明后取得新的明确重试授权，才能创建新的上传会话。

## 2026-09-18 PPCB 私有文件存储替换已在本地完成，尚未上传

- PPCB 测试环境文件能力已实时确认可用：后端使用平台注入的运行时 Token 申请单对象上传地址、完成确认和短时效下载地址；Bucket 保持私有，无需 R2/OSS Access Key。PPCB 镜像固定使用 `FILE_STORAGE_DRIVER=ppcb`，本地开发仍使用本地文件目录，原托管环境的 R2 适配器暂时保留用于上线验收期间回退。
- 本地数据库的 48 条已发布内容共引用 5 个 READY 封面文件，没有其他正文附件或案例证据附件。5 个文件已按原始 ID、大小和 SHA-256 打包，运行时会在内容导入后幂等上传到目标环境的 PPCB 私有 OSS 并重新关联封面；重复启动不会重复迁移。
- 新增 PPCB 文件上传、完成确认和受限下载适配及迁移测试；API 103/103、Web 70/70 测试，以及双方构建、Lint、类型检查均通过。可移植运行时验证为 95 MB，其中 5.2 MB 是 5 个真实封面；314 个依赖软链接均为包内相对路径且无断链。当前本机 API 与生产模式网页健康检查均为 200；未上传 PPCB、未触发测试/生产构建、未修改线上数据、未停用原 R2，也未提交 PPCB Issue。

## 2026-09-18 PPCB 82 MB 手动提交包内置 48 条内容自动导入

- 按用户最新决定，将已经过两次本地幂等验证的 48 条已发布内容快照直接纳入 PPCB 优化运行时：33 个 AI 项目、2 个设计资产、4 个 AI 工具、6 个 AI Skill、3 个 AI 案例；不包含附件、R2 对象、行为记录或其他历史用户。
- 运行时在完成数据库迁移和基础数据初始化后自动执行内容导入，不再依赖 Portal 中额外填写 `IMPORT_PUBLISHED_CONTENT`。导入仍按 `(organization_id, email)` 复用 `lomi2026@126.com` 的现有用户 ID，并按稳定业务键 upsert 内容及其版本、详情、分类和标签，因此同一版本重新启动不会重复创建记录。
- 本次只准备用户可手动重新提交的源码包；未上传 PPCB、未触发构建或发布、未修改现有测试/生产数据库，也未提交新的 PPCB Issue。

## 2026-09-18 PPCB 内容迁移测试构建失败（已停止）

- 已将内容迁移开关调整为平台允许的普通配置 `IMPORT_PUBLISHED_CONTENT=true`，API 构建与 Lint 通过；源码包 `palmpay-ppcb-import-config.zip` 为 1,773,639 字节，SHA-256 为 `894984bd71c6de1a3f52ffbc6323d3b9ef2217657bcf2101d0eaa7caab21b27c`，PPCB 上传和预检通过。
- 测试构建 `BUILD-MU6QF7KC-5B46B6C4A8`（operation `OP-MU6QF7KD-75B0BDDCB4`，revision `REV-MU6QF7KD-9EE0329055`）于源码构建阶段失败。平台已正确下载并解压 1.7 MB 包、识别 Dockerfile、拉取 Node 24 镜像并安装 OpenSSL，随后 Kaniko 报 `lstat /workspace/src/package.json: no such file or directory`；本地归档已确认根目录存在 `package.json`。
- 按用户要求，本次失败后停止：不重新上传、不重新构建、不提交新的 PPCB Issue。现有测试发布 `REL-MU55VOKM-791F9CE9F6` 与生产发布 `REL-MU6L9329-23EF8B846F` 均保持 `PUBLIC_READY`，48 条内容未进入 PPCB 测试或生产数据库，R2 与附件未改动。

## 2026-09-18 PPCB 内容迁移已完成本地幂等验证，等待独立测试构建授权

- 用户授权导入本机 `palmpay_design_hub` 的全部 48 条已发布内容：33 个 AI 项目、2 个设计资产、4 个 AI 工具、6 个 AI Skill、3 个 AI 案例；范围包含版本、详情、分类和标签，不包含附件、R2、行为记录或其他历史用户。
- PPCB 已明确：`data:read` 不能读取应用生产库的 `users`，PPCB-1031 不应批准。迁移源码改为按 `(organization_id, email)` 幂等 upsert Owner，再使用实际返回的用户 ID 写入角色、内容和版本外键，因此不再依赖 MCP 读取内部 UUID。
- 新建本地隔离 schema 后应用全部 11 项迁移。第一次导入先复用已有 Owner，完整写入 48 条内容、49 个版本、17 个标签和 75 个标签关联；第二次运行保持相同数量。五类详情数量为 33/2/4/6/3，48 个内容外键均指向 Owner，Owner 管理员角色存在。API 类型构建和运行时追踪打包均通过，快照已确认进入运行时包。
- 迁移由普通运行时配置 `IMPORT_PUBLISHED_CONTENT=true` 显式开启；默认不开启。待用户授权新的 PPCB 测试构建后，只在测试环境启用并验收，再决定是否以同一不可变镜像发布生产并开启生产导入。当前未上传、不重试此前失败的构建，未修改 PPCB 测试/生产内容、R2 或附件。

## 2026-09-18 PPCB 生产登录基线已直接修复（待真实钉钉验证）

- 用户明确授权后，未重新构建或切换镜像，直接向生产 schema `app_palmpay_design_hub_builder` 写入运行所缺少的幂等基础配置：1 个组织、1 个团队、3 个系统角色、12 个权限、18 条角色权限关系及 4 个内容分类。现有代码会在下一次成功的 PPCB Owner 登录时自动创建应用用户并授予管理员角色。
- 这项修复不导入历史内容、AI 项目或附件，不写入测试 schema，不触碰 R2，且生产 Deployment 保持 2/2 Ready。PPCB 内部测试环境 `/healthz` 返回 200；PPCB 的该工具只支持 testing，无法模拟生产钉钉身份，仍须由 Owner 在生产入口完成一次真实登录验证。

## 2026-09-18 PPCB 测试登录修复构建失败（已停止）

- 用户授权的一次测试环境构建 `BUILD-MU6MIO9F-0E70F1F08E` 已于 2026-09-18 15:27（中国标准时间）失败。平台在 Docker 构建阶段报错：`lstat /workspace/src/package.json: no such file or directory`，随后 Job 达到重试上限；失败发生在应用编译和发布之前。
- 因此没有生成新的测试发布，现有测试发布 `REL-MU55VOKM-791F9CE9F6` 与生产发布 `REL-MU6L9329-23EF8B846F` 均未变更。构建失败时没有写入测试或生产数据库，也没有迁移 AI 项目、历史内容、附件或调整 R2；之后的生产登录基线直接修复见上方记录。
- 按用户“失败后不重复上传”的明确要求，本次停止在此，不重新上传、不重新构建，也不向 PPCB 提交问题；等待用户确认后再决定是否处理源码包构建上下文问题。

## 2026-09-18 PPCB 生产登录阻塞修复已就绪（未上传）

- 已核实 PPCB 的 Owner 网关权限和生产实例均正常；登录后的 401 不是未授权，也不需要在 Portal 填写 `PPCB_INTERNAL_SECRET`。运行时会为 Web/API 生成同一临时内部校验值，Portal Secret 页面不应配置此项。
- 根因是原测试镜像在生产 schema 只执行迁移、跳过 `runtime-seed`：新生产库没有组织、角色和权限基线，导致钉钉网关身份无法解析为应用用户，随后被重定向到应用的登录页。
- 本地修复 `deployment/ppcb/runtime.mjs`：生产与测试均运行幂等的基础 seed；`runtime-seed` 中的 v9-1 AI 项目导入仍只在 `test_app_*` schema 执行，因此生产不会导入 AI 项目、历史内容或附件。`node --check`、API Prisma 生成和 TypeScript 构建通过。根据用户“失败后不重复上传”的要求，尚未上传或触发任何新的 PPCB 构建。

## 2026-09-17 PPCB runtime image optimization ready for isolated testing

- The PPCB-only deployment now uses a multi-stage Node.js 24 image. Both Next.js environments run from standalone outputs with one shared dependency tree; the API runtime is packaged from actual entry-point traces instead of the 946 MB development workspace. Local assembled runtime files are 82 MB (66 MB Web plus 17 MB API, with shared files counted once), compared with the previous 612 MB platform image before base-image overhead.
- Container startup no longer invokes pnpm, tsx or the Prisma CLI. A compiled migration runner preserves Prisma's `_prisma_migrations` checksums and serialization, and a compiled idempotent seed runs under a PostgreSQL advisory transaction lock. An isolated local schema applied all 11 migrations twice safely, passed Prisma's official migration-status check, produced the expected organization/team/role/permission/category counts, and was removed afterward.
- The exact assembled runtime completed migration, testing defaults, API startup, standalone Web startup, gateway routing and `/healthz` with HTTP 200. Both testing and production app subpaths returned 200. API 99/99 real-database tests, Web 70/70 tests, type checks, builds and lints pass; the initial API integration attempt failed only because local Postgres.app was stopped, then passed after the existing local service was started.
- PPCB live health was HEALTHY before this retry. The first optimized-source build `BUILD-MU57QDHX-80A13952E5` compiled both Web applications and the traced API package, but timed out while downloading Debian packages for a second OpenSSL install in the runtime stage. The Dockerfile now uses one Node.js 24 + OpenSSL base stage shared by both build and runtime stages, so the retry performs that download once. That retry, `BUILD-MU5B3JRL-F05C710592`, failed before application compilation because the platform build context could not find `/workspace/src/package.json`, although the uploaded archive was locally validated with that root manifest. The previous 612 MB image remains the current `PUBLIC_READY` testing runtime (`REL-MU55VOKM-791F9CE9F6`); production, source-data import, attachment import, PPCB private-OSS cutover and R2 shutdown remain untouched. No PPCB issue was submitted; per the user's instruction, obtain confirmation before another platform-facing corrective attempt.
- The user-authorized historical backup was restored successfully into the disposable local database `palmpay_ppcb_import_20260917`: 30 tables and 460 rows. Direct testing import is intentionally paused before writing rows: PPCB testing has its own seeded organization/team/user UUIDs, while the backup has different UUIDs under the same organization code. Blindly importing raw IDs would either violate unique keys or make records inaccessible to the PPCB test Owner. The current MCP token is also denied the `data:read` scope required to inspect the target mapping. No PPCB testing rows, production rows, R2 objects or secrets were changed.
- The user narrowed the data goal to the AI project library only. The backup contains 33 `AI_PROJECT` rows with codes `P01`–`P26` and `S01`–`S07`, exactly matching the checked-in v9-1 project importer. A PPCB testing-only, idempotent seed now creates those 33 normalized projects using the test schema's own organization/team/Owner IDs, so it avoids the unavailable `data:read` mapping path and imports none of the other historical records. A fresh disposable PostgreSQL schema applied all 11 migrations; the first seed created 33 projects, 33 project details and one category, and the second seed created none. This source change is local only until a future testing source build succeeds.

## 2026-09-17 PPCB latest-baseline merge and isolated testing release

- The PPCB deployment branch now merges the latest verified application baseline `193f8ea` while retaining the Node.js 24 runtime, PPCB gateway identity/RBAC adapter, isolated schema handling, application subpath routing and `/healthz` contract. The merge does not include the primary checkout's uncommitted status-document edit.
- Local verification after conflict resolution passes on Node.js 24.18.0: Web 70/70, typecheck, Lint and the testing-base-path production build; API 99/99 with 15 real PostgreSQL integration cases and zero skips, API Lint, and migration deploy through all 11 migrations. The PPCB build script produced both testing and production subpath artifacts. The first API run's single upload failure was a local callback URL mismatch; rerunning with the test server's declared port passed without a source change.
- PPCB-1028 is already resolved by Portal v0.14.87, and the platform has successfully built the previous Node.js 24 source. Its subsequent testing release failed after build while the new pods remained `ContainerCreating`; the old diagnostics were cleaned before they could identify a cause. Per the user's latest instruction, no new platform issue may be submitted without first presenting the evidence and obtaining confirmation.
- Fresh source `REV-MU53QCN0-94CC037B4D` (SHA-256 `705065ca62adbae3ee69419a331dec42400d8519248b4f6c158a22dca32e5836`) passed preflight. Build `BUILD-MU53QCN0-30253B8D24` succeeded on Node.js 24/large in 19m05s. Testing release `REL-MU54F174-6ED06CB506` failed before readiness: each 612 MB image pull took 46-54 seconds, containers then applied all 11 migrations and reached `prisma:seed`, but the release controller killed them 2-4 seconds after startup; `/healthz` on port 8080 consequently returned connection refused. The testing schema is reachable with 30 tables. No new PPCB issue, retry, production promotion, source-data import, attachment import, private-OSS cutover or R2 shutdown has occurred; the user must confirm the next corrective action first.

## 2026-09-16 本轮界面与管理优化已上线

版本 `5d8277b9048ffbe1e847828f115afd4b3ca2bcc8` 已同步 main 与 codex/v1-project-handoff。Vercel Production `6481012165`、Render API `6480998961` 均成功。正式 API 健康 200，授权目录接口返回真实浏览次数，正式项目页返回 200 并展示筛选与浏览统计。发布包含 tags.content_types 兼容迁移；未复制本地业务数据。此条覆盖下方本轮未发布记录。

## 2026-09-16 本轮界面与管理优化发布准备

用户已授权上线。本轮包含详情页与目录样式统一、浏览次数、上传即保存、菜单与离开提醒修复、管理编辑与标签适用类型。前后端生产构建与 Lint 通过，Web 69 项、API 77 项非数据库测试及本地数据库 15 项集成测试通过。数据库新增 tags.content_types 为带默认空数组的兼容字段；发布不复制本地业务数据。

## 2026-09-16 目录卡片浏览次数（本地，未发布）

五类内容目录卡片及 Skill/案例列表、项目推荐卡与列表显示累计浏览次数。目录接口对已获权限的当前页内容批量汇总 RecentView.viewCount，无新增数据表；无记录返回 0。前后端构建、Lint、统计与详情授权读取测试通过，五类目录浏览器确认显示真实数值。本轮未发布。

## 2026-09-16 详情视觉与菜单规范统一（本地，未发布）

设计资产、AI 工具、Skill、案例共用详情布局：28px/700 主标题、灰色基础信息卡、24px 模块间距与正文分区；保留各类原始字段和动作，三类新增适配页桌面与 390px 手机无横向溢出，构建与 Lint 通过。详情操作栏统一 36px 高、12px 圆角与 1px 描边，项目详情管理操作收纳更多菜单，支持外部点击和 Esc 关闭。项目页移除渐变，整理概要与灰色信息卡，分区间距 24px/16px。下拉已按用户确认接入常规 12px/10px、紧凑状态 8px/8px 和 4px 内留白，旧圆角层覆盖已修正，常规实测通过。本地预览以独立构建目录切换，避免覆盖运行中文件。本轮未发布。

## 2026-09-16 线上目录复制到本地

按用户授权只读获取正式环境已发布目录，将 4 个 AI 工具和 2 个设计资产经本地正式草稿、文件上传及发布接口导入。保留正文、分类、资源链接与封面，映射到本地账号及团队，body.importSource 记录线上内容 ID/slug/发布时间；不复制线上未发布草稿或行为统计，不修改线上业务内容。原有 8 个本地设计资产保留，目前工具 4 项、资产 10 项。逐项核对正文及封面访问通过，浏览器列表显示正常。

## 2026-09-16 用户编辑与详情入口文案（本地，未发布）

用户管理增加编辑弹窗，支持姓名、邮箱、归属团队修改；角色仍在角色权限页维护。后端在原事务内校验同组织邮箱重复及团队可用性并记录审计。删除使用描边按钮，排列于保存前同一行，保留确认与禁止自删规则。AI Skill、AI 案例、AI 项目推荐卡片入口统一为“查看详情”。API 构建、前端生产构建、双方 Lint、8 项身份服务测试及 69 项前端回归通过；本地浏览器验证预填、保存姓名/邮箱/清空团队、弹窗关闭、删除排列和三页文案；临时测试用户已删除。本地 3002 已更新。

## 2026-09-16 Skill 与案例展示切换（本地，未发布）

AI Skill、AI 案例在筛选栏加入与 AI 工具一致的网格/列表图标切换。列表保留详情入口、收藏、标题摘要、负责人及案例指标；视图写入 URL，切换保留已应用筛选，提交筛选保留视图。生产构建、Lint 通过，浏览器验证两页切换、组合筛选及手机无溢出。本地 3002 已更新。

## 2026-09-16 内容管理平铺筛选（本地，未发布）

按最新截图要求将内容类型、发布状态下拉框改为平铺分类按钮，点击直接提交筛选并保留组合条件；关键词搜索单独保留。生产构建、Lint 和浏览器按钮组合筛选验证通过，本地 3002 已更新。

## 2026-09-16 管理内容筛选与团队操作排列（本地，未发布）

内容管理新增标题/摘要搜索、五类内容类型及发布状态筛选，复用既有后端全量分页筛选；分页保留条件、重新筛选回第一页，支持重置和空结果说明。团队删除按钮移到保存左侧同排，保留描边样式并改用确认弹窗，避免嵌套表单。构建、Lint、69 项前端回归通过；浏览器验证按钮顺序/对齐、确认框、组合筛选返回 6 项 AI Skill、关键词空结果及无整页刷新。本地预览已更新。

## 2026-09-16 分类标签列表筛选（本地，未发布）

分类面板增加全部及五类适用页面筛选；标签面板增加全部、通用、指定页面筛选。客户端即时筛选，不触发接口请求，保留被隐藏行的未保存编辑；显示数量及无结果状态。构建、Lint、浏览器分类/标签切换和手机无溢出检查通过，本地 3002 已更新。

## 2026-09-16 分类标签新增弹窗与适用页面（本地，未发布）

分类/标签面板统一团队管理的标题、说明与右侧新增按钮，新增表单迁入管理弹窗。标签增加适用页面（通用或五类内容多选），列表显示范围，新增默认停用；发布选择、目录筛选和后端新增关联校验按范围约束，历史关联保留。新增增量迁移 20260916093000_tag_content_types，已仅应用本地数据库；线上尚未迁移/发布，发布时需前后端及迁移配套。

前后端构建、Lint、Web 69 项和相关 API 13 项回归通过。本地浏览器验证分类和标签创建、指定范围空选拦截、成功关闭弹窗并刷新列表、标签仅在指定内容类型可选、手机无横向溢出；临时分类标签已删除。本地 3002/3011 已更新。

## 2026-09-16 后端操作反馈修复（本地，未发布）

修复局部更新后缺少成功反馈、提示随页面销毁的问题。工作台持久布局统一结果提示，覆盖收藏、草稿创建/编辑/手动保存/预览/发布、删除/下架/归档、管理保存、封面和附件上传/移除、使用记录、关联及通知标记；下载准备与复制也有明确结果。成功在服务确认后显示 5 秒，失败可手动关闭，保存/收藏重试成功替换旧错误；自动保存成功仅就地反馈，失败保持明确提示。增加客户端请求中断兜底，保留输入及收藏回滚。管理提示由真实提交触发，避免缓存重挂载重复提示。明暗色使用语义色，移动端无横向溢出。

Web 69 项回归、Lint 和生产构建通过。本地真实操作验证收藏确认、断网失败持久提示及回滚、跨菜单提示保留、手动保存、静默自动保存、发布后跨页成功提示、管理保存与焦点保留；已检查深色桌面和浅色手机截图，临时内容/团队已清理。无数据库与权限变更，尚未发布。

## 2026-09-16 全平台交互性能优化已上线

功能版本 `9765b877b1628cb2fe9e7d061c1c807f3f3097d2` 已同步 main 与 codex/v1-project-handoff。Vercel Production `6477207417`、Render API `6477181084` 均部署成功，正式 API 健康检查正常，无数据库迁移。

发布前最终 Web 68 项测试通过；此前前后端构建、Lint、API 26 项回归及本地流程验收通过。线上授权账号只读验收：菜单与详情首次在 80ms 检查点显示骨架，重复访问显示缓存；实际请求结束后地址正确、仅一个可见内容区；目录筛选更新 URL 且保留同一文档。80ms 为界面检查点，不代表接口耗时。未修改线上业务内容，编辑/上传/发布等写流程沿用本地回归结果，交由用户线上验收。本条覆盖以下同轮未发布记录。

## 2026-09-16 全平台交互性能优化（本地完成，未发布）

按用户“所有问题都需要优化”补齐完整清单：局部 Tab/筛选、五类详情辅助统计独立加载与缓存、收藏乐观反馈/失败回滚、搜索点击非阻塞、新建/编辑离开保护、自动保存修订号、预览/发布防重及确认回执、管理行保存与焦点保护、删除后局部移除、封面/附件直传进度与局部更新、使用/关联/通知局部反馈、缓存竞态和跨标签页校准、后台并行读取与耗时记录。新增草稿单附件添加/移除接口及文件完成幂等，沿用既有组织/编辑/文件权限，无数据库迁移。完整逐项结果与边界见 docs/18-INTERACTION-PERFORMANCE-PLAN.md。

前后端构建与 Lint、Web 68 项测试、相关 API 26 项回归通过。已在本地慢网和临时数据上验证编辑、上传、收藏回滚、发布、删除、连续切换、管理保存与移动端；临时内容/团队已清理。本地预览 3002、API 3011 已更新，尚未提交推送或上线。线上真实延迟仍需部署后测量，不把本地 3–15ms 界面反馈当作线上接口完成时间。

## 2026-09-16 交互性能第一批优化（本地，未发布）

五类详情、管理与收藏/浏览 Tab、六页目录/贡献筛选统一缓存导航；筛选避免整文档重载。修正缓存分享链接、重复数字动效及最近浏览重复刷新；管理保存/发布确认后通知缓存失效，自动保存仅清理相关页面，增加在途响应失效代次检查。生产构建、Lint、64 项测试通过。本地慢网详情首次骨架/重复缓存验证通过，筛选保留文档及 URL，最终仅一个内容区。尚未上线；局部 Tab 骨架、收藏乐观更新、编辑离开保护等剩余范围见 docs/18-INTERACTION-PERFORMANCE-PLAN.md，不将本批视为全平台性能整改完成。

## 2026-09-16 详情导航与全平台交互审查（本地）

五类目录详情已接入卡片导航缓存并补充内容不可访问处理，本地模拟 600ms 延迟：首次点击 80ms 内骨架、再次点击缓存、最终详情正确。构建、Lint、64 项测试通过，未发布。全平台源码审查与分阶段方案见 docs/18-INTERACTION-PERFORMANCE-PLAN.md；重点先修正整页缓存与真实路由、副作用及写入失效的边界，再统一 Tab、筛选和写入体验。此审查不等于全流程线上性能验收。

## 2026-09-16 缓存导航已上线

功能版本 `bb68d81167d2152e39987b9db572972cb49801fc` 已同步 main 与 codex/v1-project-handoff；Vercel Production `6474540687`、Render `6474532618` 均成功，API 健康返回 200。正式域名授权登录后的只读浏览器验收通过：首次进入洞察，80ms 检查点已显示目标菜单与骨架；返回设计资产及再次进入洞察，80ms 内显示缓存、无骨架；等待真实请求完成后 URL 正确且仅一个可见内容区。该时间表示缓存/占位呈现，不表示后端请求完成；部署期间曾有一次后台请求超过 3.5 秒，稳定后等待实际导航完成复测通过。未修改线上业务内容。本条覆盖下方同轮未发布记录。

## 2026-09-16 会话缓存与即时菜单切换（本地）

主菜单已接入即时目标选中态、首次骨架与已访问页面内容缓存；真实页面数据仍 no-store 请求，响应后更新。缓存 5 分钟/最多 20 页，按账号组织权限和 URL 查询隔离，提交写表单清空；新增只读会话范围校验用于刷新失败处理。用户最新方案替代此前不显示 loading 的决定。

Web 构建、Lint、64 项测试及差异检查通过。模拟 700ms 网络延迟，首次点击 80ms 内显示目标骨架，再次访问 80ms 内显示缓存且没有骨架；请求结束后仅一个可见页面。模拟表单提交（未写业务数据）后缓存失效，桌面左右 40px、手机无横向溢出。测试覆盖会话范围随账号/组织/权限变化以及失效会话与服务失败。尚未发布，尚无线上性能对比；超过有效期、刷新浏览器或提交修改后可能再次显示骨架。

## 2026-09-16 数字动效与筛选修正已上线

功能版本 `3e3f5c27b6cabcc98ccf7f671d34b7a4d37cdeac` 已同步 main 与 codex/v1-project-handoff。Vercel Production `6474360988`、Render `6474344606` 均成功。包含四页统计数字 1 秒动画、取消菜单 loading、六页浅色筛选白底及项目库 24px/12px 间距。生产构建、Lint、62 项 Web 测试及差异检查通过。用户明确授权线上测试登录后，项目库、设计资产、洞察页面只读 HTTP 验收均为 200，正式域名已加载白底规则与数字组件，API 健康 200；未修改线上业务数据。本条覆盖下方对应未发布记录。

## 2026-09-16 筛选栏与项目间距（本地）

修复组件状态层覆盖筛选白底：六页筛选栏在浅色模式覆盖字段变量为白色；项目库标题上下间距为 24px/12px。构建含类型检查通过，本地预览已更新，未上线。

## 2026-09-16 AI 项目库数字动效（本地）

项目探索组合五项统计接入共用 1 秒匀速数字动画；保留减少动态效果及重复访问不重播规则。未发布。


## 2026-09-16 加载动效调整（替代首版加载占位）

按用户最新要求，移除菜单加载图标及三页 loading 占位，导航等待期间保留当前内容。数字改为 1000ms 匀速整数递增，避免小数字在缓出曲线下过早抵达目标；保留重复访问不重播、减少动态效果和最终值准确性。本地预览更新，未发布。
## 2026-09-16 菜单加载体验首版（本地）

三页路由级加载占位、菜单 pending 反馈、短内容淡入及数字过渡已实现，关闭三页普通内容链接预取。保留实时数据与接口权限，未修改托管或上线。构建含类型检查、62 项 Web 测试、Lint 通过；本地慢网络测试点击 80ms 内出现 pending，统计结果正确；390px 无横向溢出、减少动态效果时动画为 0。当前属于感知等待优化，不声称线上接口耗时降低；聚合数据尚未拆为逐卡独立加载。

## 2026-09-16 组件统一与管理交互已发布

功能版本 `60d8e142503a8244ed4315a06b7ae5cdd33cdc7d` 已同步 main 与 codex/v1-project-handoff；Vercel Production `6473946238`、Render API `6473931413` 均成功。包含全平台圆角/交互状态、暗黑分层、桌面左右 40px、管理控件与保存交互、指标跳转，以及 AI Skill、AI 案例和我的贡献统一卡片悬浮。贡献卡片本地浏览器实测悬浮上移 3px、圆角 16px。

发布前前后端构建、Lint、62 项 Web 测试、7 项用户管理回归及差异检查通过。线上首页 200，统一样式资源已生效；API 健康 200，未登录 /api/me 为 401。自动审批拒绝创建线上测试登录会话，故本轮登录后线上页面验收未执行；不将本地验收当作线上验收。线上沿用原数据库及附件，未覆盖业务数据。

## 2026-09-16 AI Skill 与 AI 案例卡片收藏（本地）

两个目录卡片复用现有 FavoriteControl、收藏上下文及正式 API，支持收藏/取消收藏，并与收藏列表同步。AI Skill 改为独立整卡详情链接，收藏按钮作为同级交互位于链接之上，避免表单嵌套在链接中；AI 案例沿用相同模式。构建（含类型检查）、62 项 Web 测试、Lint 与差异检查通过。浏览器实测两类内容收藏/取消、刷新持久化、收藏列表、详情独立点击及手机明暗布局通过；测试收藏状态已还原。本地 3002 预览已更新，未发布线上。

## 2026-09-16 全平台暗黑分层与可读性调整（本地）

- 按用户最新确认，全平台暗黑画布/主卡片/嵌套表面改为 #181818/#262626/#363636；浮层与输入使用第三层，悬浮使用 #404040。信息容器采用固定背景，辅助文字提亮，暗黑小字至少 12px、紧凑段落 13px，去除装饰网格；保留原布局、卡片无描边及控件焦点规则。浅色配色和字号保持现状。
- Web 生产构建（含类型检查）、62 项测试、源码 Lint 与差异检查通过。独立 Chrome 使用真实本地数据检查 14 条主要路由及多种宽度，共 40 个页面/主题/视口组合无横向溢出；暗黑检查覆盖 390/1280/1440/1536 CSS 像素宽度。总览、首页、工作台、发布页截图已查看，暗黑文本抽查未见低于 12px；已修正选中项目菜单数量的反色文字对比。截图及对比度检查位于 `/private/tmp/palmpay-dark-qa/`，不是 Windows 实机验收，也不代表全站无障碍认证。
- 浏览器验收发现原本地数据库账号仅有成员权限。用户明确批准后，为 `lomi2026@126.com` 添加现有组织范围 admin 角色，保留原角色，并在同一事务写入 `user.role.assign` 审计。数据库连接已限定为 127.0.0.1 的 `palmpay_design_hub`，未改动线上权限；本地价值总览、洞察和管理中心已可访问。
- 本地预览已更新到 `http://127.0.0.1:3002/workspace/overview`，配套 API 仍为 3011。下一步由用户在目标显示器确认视觉效果；本轮未提交、推送或发布线上。

## 2026-09-16 当前主工作目录已同步并启动本地环境

- `/Users/a1/Documents/plampay-design-intelligence` 已从 `6dcf38a` 快进同步到 GitHub 两个发布分支共同的最新提交 `45f12d3`；对应本轮已发布功能版本为 `0c26616`。正式域名只读检查返回 200。
- 当前目录的本地生产预览为 `http://127.0.0.1:3002/`，工作台为 `/workspace`；配套最新 API 为 `http://127.0.0.1:3011`，连接原本地 `palmpay_design_hub` PostgreSQL。其他工作目录的服务保留。代码同步未复制或覆盖线上数据库及附件。
- 本地 10 项迁移已全部应用，无需执行迁移。前后端构建及前端构建内类型检查通过，Web 62 项测试、API 11 项定向回归通过；API 健康、现有账号认证、未登录 401、首页/登录/工作台/资产/工具页面 HTTP 检查通过。未新增浏览器视觉验收。
- 同步前两份未提交文档（本状态文档与机器交接文档，含备份及 PPCB 记录）已完整保存于 Git stash，标记为 `preserve local handoff docs before 2026-09-16 sync`。这些旧文档没有覆盖远端最新状态；本地配置原件另存于 `/private/tmp/palmpay-sync-20260916/`，不进入 Git。

## 2026-09-16 本轮修复已发布

功能版本 0c266161ef0d5ad41c7d7d2c5732311447bbbb9f 已同步 GitHub main 与 codex/v1-project-handoff。Vercel Production 6471507852、Render API 6471491087 均成功。包含菜单数据与图像缓存分离、归档及继续编辑重新发布、资产/工具/案例整卡详情入口、收藏悬浮样式。正式域名浏览器只读验收通过：登录、整卡链接、收藏样式、保留文档的菜单切换、no-store 实时数据接口及我的贡献。发布前前端 62 项测试、后端 12 项定向回归、构建与源码检查通过；完整归档恢复流程已在本地临时内容验证。未覆盖线上数据库；本地仍使用独立本地 API 与数据库。此条覆盖此前各阶段未上线说明。

## 2026-09-16 整卡详情入口

设计资产、AI 工具、AI 案例卡片支持全区域进入详情；资产和工具列表模式同样覆盖。使用独立原生链接覆盖卡片，收藏位于上层且不嵌套在链接内，保留键盘焦点与新标签页操作。生产构建通过，浏览器实测五种目录/视图的卡片命中区域、详情跳转与收藏独立命中通过。本地已更新，未发布。

## 2026-09-16 归档内容可继续编辑与重新发布

按最新用户要求，已归档和已下架内容在我的贡献提供“继续编辑”。有草稿时复用，没有草稿时从当前发布版本创建；编辑与自动保存保持原生命周期状态，不重新进入公开目录。正常完整度与编辑权限校验通过后发布，状态恢复 PUBLISHED、archivedAt 清空，发布版本和目录同步。此规则替代前文归档后不提供编辑入口的约定。

后端 12 项定向测试与构建、前端生产构建通过。使用临时本地内容实测发布→归档→新建编辑草稿→保存仍归档→重新发布后目录可见，archivedAt 清空；测试内容已删除。原“体验优化专项方案”保持归档，未擅自重新发布。本地预览已更新，未上线。

## 2026-09-16 带未发布草稿的归档冲突修复

实际问题是 findLifecycleContent 拒绝所有带 draftVersion 的内容，与界面允许归档已发布内容不一致。归档操作现在允许保留未发布草稿及当前发布版本，仅把 Content 状态改为 ARCHIVED；下架仍保持原有草稿校验。贡献页对归档/下架项不展示无效编辑或发布详情入口，已归档草稿不计入待完善。

后端构建和 4 项定向回归通过。实际通过本地浏览器归档用户指定的“体验优化专项方案”：成功跳转我的贡献，卡片显示已归档，API 持久化状态 ARCHIVED，未发布草稿保留，公开详情 404。未修改线上数据。本地修复尚未发布。

## 2026-09-16 恢复全本地环境与轻量菜单切换

按最新要求，3002 前端恢复连接 3001 API 与原本地 PostgreSQL，保留线上 7acab84 代码基线及后续本地修复。使用 .next-local-ready 生产预览消除开发按页编译等待；本地数据不再与线上实时同步，未覆盖任一数据库。本地开发登录清除旧测试会话，避免环境切换后的认证干扰。

菜单改为客户端局部导航，取消重复骨架屏，动态数据仍 no-store；共享收藏/项目数量通过独立轻量接口更新，不重复请求整页。封面继续使用带 Cookie 隔离的私有浏览器缓存，封面替换产生新文件 URL。搜索和详情不执行全局刷新，避免重复行为记录。前端 62 项测试、源码 Lint、最终构建通过；API 重新编译启动成功。实际本地菜单四次切换 61–109 ms，文档保持不变且无骨架屏，封面只首次传输一次。以上本地修复尚未发布。

## 2026-09-16 归档与下架状态反馈（本地）

详情生命周期操作按实际提交按钮独立显示加载提示，同时禁用重复提交。服务端等待归档/下架接口返回 ARCHIVED/UNPUBLISHED，状态不匹配或请求失败时展示错误；成功后使工作台布局缓存失效，并跳转我的贡献重新读取状态，替代旧版直接返回工作台且不失效缓存的行为。原 API 已有数据库状态更新逻辑，本次未变更业务权限与归档规则。

62 项 Web 测试、源码 Lint、生产构建及类型检查通过。真实页面拦截操作请求验证归档和下架均仅被点击按钮显示加载；归档/下架成功、错误响应及状态未改变的动作回归通过。未归档线上正式内容，本地已应用，未发布。

## 2026-09-16 菜单切换数据刷新（本地）

基于线上 7acab84 修复菜单返回时复用旧数据：动态页面缓存时间由 120 秒改为 0，静态预取保留框架要求的最小 30 秒；工作台数据路由全部禁用后台预热，桌面/移动菜单、管理分区及收藏/通知入口使用完整页面导航，每次重新读取页面和共享布局中的统计、收藏、通知及项目数量。业务 API 请求统一 no-store，封面图片缓存保持不变。有效搜索信号仍按现有近 30 天前 10 个热门关键词次数之和计算。

58 项前端测试、源码 Lint、生产构建与类型检查通过。隔离生产预览实测：离开再进入洞察 101→202，重复点击当前菜单 202→303，移动菜单返回 303→404；无后台统计预读。测试仅在隔离响应中改变数值，未修改线上业务数据。本地 3002 开发服务已应用，本轮未发布线上。

## 2026-09-15 统一视觉版本已上线

首页与工作台共用语义配色，深色卡片统一中性灰；卡片去除装饰描边，指定重点卡片和筛选组件在浅色下使用白底。功能版本 9149d2ddf120e60bf03c295d990f47d836d577d1 已同步至 GitHub main 与 codex/v1-project-handoff；Vercel Production 部署 6449523331、Render API 部署 6449512889 均成功。

正式域名 https://palmpay-design-intelligence-web.vercel.app/ 已验证首页新配色，API 健康 200、登录 201；工作台、价值总览、我的贡献、AI 工具、发布内容五页的明暗主题共 10 个组合访问通过，深色主卡片为 #181818、浅色为 #ffffff，卡片无外框描边，浅色贡献筛选输入与选择器为白底。发布前生产构建、49 项 Web 测试和源码 Lint 通过。线上沿用托管数据，未覆盖或修改业务数据。

另一台电脑拉取 main 后可继续开发；本条发布记录覆盖下方同日各阶段的“未发布线上”状态。

## 2026-09-15 深色卡片去蓝偏（本地）

统一深色语义表面与中性文字，画布/主卡片/内层/较亮表面分别为 #141414/#181818/#1c1c1c/#242424。浅色白卡、状态语义色与图表保留。生产构建、49 项测试、源码 Lint 通过；首页、工作台、目录、管理与五类详情共23条路由193个深色表面检查为中性灰，浅色白卡检查通过。3002 本地预览已更新，未发布线上。

## 2026-09-15 白色卡片与筛选背景（本地）

标注的工作台重点卡片、案例验证覆盖卡片改为 card 底色；目录、贡献、搜索、项目维度筛选在浅色下统一白底。构建、49 项测试、源码 Lint 通过；9 条路由白底检查、下拉浮层与3条深色路由检查通过。3002 预览已更新，未发布线上。

## 2026-09-15 卡片无描边统一（本地）

首页与工作台的指标、内容、管理、表单容器和详情卡片去除外框描边，基础 Card 去除装饰 ring。显式标记卡片表面，嵌套表面用 secondary 底色区分，保留输入/按钮/选中/上传的功能边界。生产构建、Web 49 项测试与源码 Lint 通过，主要目录、总览、管理、贡献和发布页面明暗外观检查完成。3002 本地预览已更新，未发布线上。

## 2026-09-15 语义颜色统一首版（本地）

已将 A 配色集中到 shadcn 语义变量，旧 --v9-* 改为兼容别名，首页基础文字/背景/边框与工作台共享样式直接使用统一变量。卡片和浮层统一底色，焦点使用 ring、发布类型选中使用 accent；保留中性灰浅色、蓝灰深色与状态色语义。Web 49 项测试、最终生产构建与源码 Lint 通过；首页、工作台、总览、贡献、发布、用户管理 12 个明暗组合和搜索浮层检查通过，别名与语义颜色在浏览器中相等，无横向溢出。本次仅更新本地 3002 预览，未部署线上。

## 2026-09-15 工作台与首页配色统一（本地）

工作台恢复原方案 A 的浅色中性灰与深色蓝灰变量，保留 B 的布局、组件和间距。首页和工作台共用主题偏好，去除 B 专用灰紫背景和青柠操作色。Web 49 项测试、生产构建、源码 Lint 通过；真实本地数据下检查首页、工作台、价值总览、我的贡献、发布内容、用户管理的明暗主题，均无横向溢出。本次尚未发布线上。

## 2026-09-14 合并版本已上线

已按用户决定合并 A 老首页与 B 工作台，移除运行时 A/B 构建选择。包含此前本地验收的直接发布、AI 工具、封面缓存、中文提示、分类标签、团队与用户管理、姓名编辑、删除后重新添加以及统一间距。前端 49 项、后端 74 项测试通过（数据库测试零跳过），生产构建和前后端源码 Lint 通过；本地浏览器验证首页进入工作台、返回首页、详情直达主题正确。代码版本 fe754312923e2d043422cd1ef8d3c456295047b8 已同步至 GitHub main 与 codex/v1-project-handoff。Vercel Production 部署 6428555069 和 Render 部署 6428545777 均成功。正式域名实测：首页 refined、工作台 studio；API 健康 200、登录 201、未登录 /api/me 为 401；AI 工具、用户管理、发布页面均为 200，用户姓名编辑入口正常。线上沿用托管数据，未以本地数据库覆盖线上。

另一台电脑请先读 README.md 的继续开发章节，拉取最新 main，勿复制旧构建文件或把本地密钥提交仓库。

## 2026-09-13 体验审视与两套本地预览

完成发布表单、预览与设计资产/AI 工具/AI Skill/AI 案例详情的共用字段结构；编辑按章节组织，关联内容按名称选择。修复预览旧缓存、发布/删除后的跳转、历史字段回填、自定义选择器自动保存、收藏状态与附件传输限制。A 保留原有中性风格并统一细节；B 提供灰紫/白色卡片、局部青柠强调的新首页与工作台，支持深浅主题和手机布局。两者共用正式 API 与组织数据。

本轮 Web 47 项、API 定向回归 26 项通过，两个生产构建及其类型检查通过，前端源码 Lint 与差异检查通过；四类内容完整流程、封面/9 MB 附件、关联、收藏、移动弹层实测通过，48 个主要页面/视口组合无横向溢出，管理七分区只读检查完成。QA 内容已软删除；历史/审计按现有规则保留。未部署线上，未改动认证、角色或数据库结构。

预览 A： http://127.0.0.1:3000/workspace ；B： http://127.0.0.1:3002/ 。详见 [体验审视报告](17-EXPERIENCE-DESIGN-REVIEW-2026-09-13.md)。

## 2026-09-12 内容删除与设计资产封面验收

作者和管理员可删除权限范围内内容，删除与审计同事务，正式列表和详情排除已删除内容。设计资产卡片已替换旧模拟缩略图为灰色占位；创建和编辑支持可选封面上传、替换、移除，封面使用版本 COVER 关联，发布时同步。图片经文件权限校验展示，不计入下载。

API 64 项测试、Web 38 项测试全部通过，无跳过；类型检查、Lint、生产构建通过。本地真实 PNG 上传、字节读取、封面发布/移除、版本隔离、非图片拒绝、作者草稿/已发布删除及管理员删除已验证。资产、提交和内容管理页面返回 200，入口及占位已生效。仅本地更新，未部署线上。

## 2026-09-12 最新决定：提交即发布（替代下文旧审核流程）

本地验收完成：API 63 项测试全部通过（含真实 PostgreSQL 集成测试，无跳过），Web 38 项测试全部通过；前后端类型检查、Lint、Web 生产构建和差异检查通过。五类内容首次发布、更新版本、目录读取、附件访问及权限边界通过；旧审核接口返回 404，审核角色和权限不存在，角色管理及提交页返回 200。迁移已应用到本地，线上尚未部署。

取消内容审核及独立发布审批，移除审核中心、审核角色、审核权限、审核待办和审核统计。具备内容编辑权限的作者或管理员可以保存草稿并提交发布；服务端完整度校验通过后，在同一事务中发布版本、详情与分类标签，立即进入原有可见范围内的目录。登录、组织隔离、内容归属及其他管理权限保持有效。

已有审核中、退回或待发布版本恢复为可编辑草稿，由作者决定何时发布，不自动公开历史内容。历史审核及审计表保留用于数据追溯，不提供审核操作或提醒。旧审核人角色移除，原角色用户按原范围转换为普通成员。AI 输出的人工复核说明属于内容字段，不是平台审批流程。

# PalmPay体验设计Hub — Current Project Status

Last Updated: 2026-09-12

## Current Phase

**Stage-one functional closure and release verification are active; desktop visual parity and mobile adaptation remain paused**

## Current Objective

On 2026-09-12, by explicit user request, AI tools became a fifth formal content type (`AI_TOOL`) with dedicated form fields, draft serialization/preview, publication projection into `ai_tool_details`, and permission-filtered catalog/detail/create/edit links. The existing independent-review and publication boundaries remain intact. Local HTTP acceptance verified creation, autosave and reload, draft exclusion from published lists, submission, independent reviewer assignment/approval, publication, detail reads and archival; the temporary acceptance record was archived. Web production build, typecheck, lint and 47 Web tests passed. API build/lint and runnable regression checks passed; 15 existing database integration suite cases were skipped in that runner, separately from the live local acceptance above. The local database `palmpay_design_hub` is now at all eight migrations, including the previously pending disabled-tag-default migration and the new AI-tool migration. No remote deployment was performed; deployment requires the migration and coordinated API/Web release.

The user-approved taxonomy linkage is locally implemented and verified on 2026-09-04. All four authoring flows now offer type-appropriate single-category and multi-tag selection; disabled options are excluded from new selection and normal catalog filter options, while existing disabled associations are retained and marked in the editor/preview. The API validates organization, status and content type and ignores untrusted nested taxonomy input. Version snapshots hold taxonomy, and publication atomically promotes reviewed associations without modifying the current published content during drafting. Administration counts real non-deleted current associations and exposes permission-gated, paginated linked-content lists. API tests pass 55/55 (15 real PostgreSQL integration checks, zero skips), Web tests pass 40/40, both builds/typechecks and lints pass. Chrome acceptance verified two-way tag saves with success notices, creation/edit persistence, historical disabled labels, preview, filter exclusion and exact association counts/lists. The temporary browser draft was soft-deleted and the tested tag restored to disabled. Local acceptance at `http://localhost:3000` now uses API `http://127.0.0.1:3001` and isolated database `palmpay_taxonomy_acceptance_20260904`; it no longer writes to the remote acceptance API. Existing localhost sessions may need a fresh email login. This previously local-only work is now released: see the production verification below. Details and API behavior: `docs/16-TAXONOMY-LINKAGE-ACCEPTANCE.md`.

On 2026-09-04 the user explicitly authorized publishing the code to `lomi2026/palmpay-design-intelligence`. Backend commit `91d96c9` deployed successfully through Render (`dep-dad18kks728c73a7ef60`). The first Vercel result was only **Preview**, not the formal domain: its success alone did not update the public application. A history-preserving release merge `d1057be` into `main` has the exact same source tree as `91d96c9` and completed Vercel **Production** deployment `6255747400`. The formal domain `https://palmpay-design-intelligence-web.vercel.app` now serves the taxonomy controls and administration/comfort fixes. Authenticated HTTP acceptance on that exact domain verified both tag statuses and rendered hidden-field values, active-only authoring options, real linked-content counts, the new submission controls, and unauthenticated admin rejection (401). The two final API writes took 361/367 ms including network; all 33 tag statuses match their pre-test values. Browser automation repeatedly timed out, so this is not claimed as a fresh browser-click replay; the prior local browser evidence remains separate. Earlier status entries calling feature-branch Vercel builds deployed must be read as Preview unless a Production deployment is explicitly identified.

Close the high-priority content-integrity, scoped-RBAC and authentication-recovery gaps found by the 2026-07-31 prelaunch audit, then execute the deployed contributor → reviewer → administrator acceptance flow. Production release merge `eb14ed8` preserves the previous `main` history while publishing the accepted `codex/v1-project-handoff` tree.

The stage-one correction release atomically projects every approved four-type `ContentVersion.body` into its formal detail table at publication; enforces `content.edit_own`, TEAM-scoped review processing and owner transfer before user disable; records restricted file downloads and blocks deletion of bound files; preserves valid sessions when the test API is cold-starting; and aligns the API Docker runtime with Node 24. On 2026-08-01 Postgres.app was started against the restored `palmpay_design_hub` database, all six Prisma migrations were confirmed current, and the full API suite passed 46/46 with all 14 PostgreSQL E2E checks actually executed (0 failed, 0 skipped). Web tests pass 20/20; typecheck, lint and the 23-page production build plus the notification-count route pass.

The latest governance correction separates reviewer assignment from review processing through a new `review.assign` permission granted only to the platform administrator role. Reviewers retain read access to the authorized pending queue but can approve, request changes or add internal notes only for records assigned to them and only from “待我审核”; the administrator receives the assignment controls and opens the complete pending queue by default.

Contributor review feedback now updates the persisted notification badge through focus-aware, recoverable background synchronization. Notification cards route to the review center, submission status or the related revision editor; change-requested submissions expose the same “按意见修改” path as My Contributions. Dashboard todos now aggregate actionable contributor, assigned-reviewer and unassigned-administrator work with stable deduplication. The data-sensitive Recent Views route is excluded from background warming and refreshes once on re-entry without disabling the global 120-second workspace route cache.

Opening an unread notification now persists it as read before redirecting to its authorized Workspace destination, then revalidates the notification list and shell so the unread badge decreases immediately and disappears at zero. The first-entry Workspace loading presentation has been restored from the temporary top progress strip to the earliest full-page skeleton pattern; routing, caching, prefetch, authorization and data-loading logic are unchanged.

The first P0 pass removes unused global client providers and eager background prefetching of every permission-visible dynamic Workspace route, restores native App Router Link prefetch behavior, and adds a Workspace content loading boundary so the persistent Sidebar and Header remain visible while only the route content changes. Local production-build, typecheck, lint and unit-test verification passes; post-deployment browser profiling and Vercel Speed Insights comparison remain open.

The follow-up P0 incident fix addresses the externally observed `/workspace` page hanging on its content skeleton: the workspace shell now treats notification and project-count badges as optional summaries, and the dashboard streams metrics, recent updates and personal todos behind separate Suspense boundaries with short timeout fallbacks. This prevents one slow Render/API/database summary request from blocking the entire dashboard content area. Moving from Render free hosting to a warm Alibaba Cloud service may reduce cold-start latency, but it is not a substitute for keeping non-critical dashboard data out of the blocking render path.

The local production contribution workflow no longer refreshes an editor route after a successful review submission. Successful submissions replace the editor with `/workspace/submissions`, and direct access to a draft URL that has already entered review is redirected to the same status page instead of falling into the Workspace error boundary. A production-browser check confirmed create → submit → submission-list navigation with the persisted review shown as pending.

The 2026-07-31 external test-login incident was traced to the cold-start path: the Render container repeated database migration, seed, identity bootstrap and all three catalog imports before starting the API, while the Vercel login action aborted after 12 seconds and reported every transport or service failure as invalid credentials. Release commit `4b5f6da` restored a migration-only API startup, kept the test login request alive for the free-instance cold-start window, and distinguished unavailable authentication infrastructure from rejected credentials. Local Web/API typecheck and lint, the Web production build, and the API test suite passed; Vercel reported a successful deployment and the Render health endpoint returned 200. The shared-code verification that existed at that time was superseded by the 2026-08-30 decision below.

By explicit user decision on 2026-08-30, the isolated external-test login no longer asks for or validates the shared test access code. Email-only login still requires a pre-provisioned active database user and issues the same short-lived HMAC-signed session, so disabled-user checks and RBAC remain authoritative; the production OIDC/SSO boundary is unchanged. The login page starts a health request when opened to wake the sleeping Render API and shows connection and form-pending feedback. After the original free PostgreSQL instance expired, the attempted paid upgrade was withdrawn and failed without becoming the accepted route. Replacement free PostgreSQL `palmpay-design-hub-test-db-v2` (`dpg-daa41qlg1s2s73c30f1g-a`) and the existing free API were deployed successfully. A one-time idempotent bootstrap applied migrations, restored the organization, roles, permissions and three test users, and imported 33 AI projects, 6 AI Skills, 4 AI cases and 8 design assets. Live API acceptance confirmed HTTP 201 passwordless session creation and HTTP 200 current-user resolution for the active administrator, member and reviewer accounts with the expected roles and permission counts; catalog counts and the P01 v9-1 detail also match the source snapshot. Routine startup has returned to migration-only mode. Vercel production deployment `6168548590` published merge `eb14ed8` successfully on 2026-08-31. Live-browser acceptance confirmed that the production login contains only the enterprise-email field, reports the test service connected, and signs `lomi2026@126.com` into the protected workspace as the platform administrator with the restored 33-project navigation and recent imported content visible. The replacement free database remains an acceptance-only route and will expire 30 days after creation.

The shared light/dark control state is synchronized with the root shadcn theme class. Token-driven primary buttons now render black-on-white in dark mode and white-on-black in light mode, while active administration tabs, review filters and catalog view toggles expose their selected state correctly. Link-backed buttons use the shadcn `asChild` contract, so their foreground tokens are no longer overridden by global anchor inheritance.

The 2026-08-31 dark-mode comfort release unifies the full Web application on one low-glare semantic palette: `#121416` for the canvas, `#15181B` / `#181B1F` / `#20242A` for layered surfaces, `#E1E5E9` for primary text and restrained cool-gray secondary text and borders. The v9 compatibility variables and the root shadcn dark tokens now resolve to the same system, and legacy direct-black/direct-white utilities are mapped into that hierarchy. Three large pure-white governance callouts were converted to semantic dark surfaces to remove abrupt luminance jumps. Web tests pass 26/26, including a dark-token regression guard; typecheck, lint, `git diff --check` and the 23-page production build pass. Commit `2ec4e52` was pushed to `codex/v1-project-handoff`, and Vercel reported the production deployment successful. Public and authenticated representative routes were audited before implementation; local visual comparison confirms the optimized palette preserves hierarchy while reducing glare. The authenticated post-deployment browser session became intermittently unavailable during final visual recapture, so the deployment result is accepted from the successful production build, automated regression coverage, Vercel status and the already completed authenticated route audit rather than claiming a fresh full interaction replay.

The 2026-09-04 administration persistence fix invalidates the prefetched `/workspace/admin` route after every taxonomy, team, user-status and user-role mutation, preventing the 120-second client router cache from restoring pre-save values. User and role changes also invalidate the Workspace layout, and role assignment no longer offers roles already held by the target user. New tags now default to `DISABLED`; migration `20260904090000_disable_tags_by_default` changed the database default and disabled every previously active tag while preserving the distinct `MERGED` state. Web tests pass 29/29; API tests pass 36/36 runnable checks with 14 PostgreSQL integration cases skipped because the local database was offline; Web/API typecheck, lint, Prisma validation, both production builds and `git diff --check` pass. Release commit `ca060ab` deployed successfully through Vercel and Render. Live API acceptance returned 33 tags, all `DISABLED`, confirming that the production migration was applied.

Follow-up browser acceptance on 2026-09-04 showed that cache invalidation alone did not fix the administration interaction: the API persisted `ACTIVE` while the visible tag select returned to `DISABLED`. The installed Radix Select subscribes to native form reset and restores its mount-time value; React automatically resets successful action forms. Category, tag, team and user edit forms now intercept reset in the capture phase, preventing both the native reset and Radix's reset listener, while creation and role-grant forms retain their intended reset behavior. Actions refresh the current view without a same-URL redirect, and selects synchronize changed server defaults. The latest local production build at `http://localhost:3000` connects to the existing external test API. Real Chrome acceptance passed two-way tag, category and team saves, with tag/category reload persistence checked and tested states restored. Web tests pass 31/31, lint and the production build/typecheck pass. User disabling and role grants were not replayed against shared test accounts. This frontend follow-up is local only; remote publication remains pending explicit approval of the GitHub push destination.

The subsequent save-feedback correction separates edit acknowledgements from route refresh: category, tag, team and user status actions now return their API result before the client refreshes the view in a separate transition. One shared accessible notice reports “保存成功”, API failures or an unconfirmed outcome; API write waits are bounded to 15 seconds and timed-out writes are not automatically retried or reported as successful. Three same-state tag saves against the warm external test API took 379/629/524 ms including network round-trip; these measurements do not establish database-only latency or rule out cold-start incidents. Real Chrome acceptance on the local production build confirmed the success notice, enabled save button and correct selected value after both enable and disable saves for “任务重组”; its original disabled status was restored. All 32 Web tests, lint and production build/typecheck pass. This correction is still local, not published.

Role grant and removal now use the same bounded acknowledgement flow instead of the old refresh-blocking actions. They report “角色授予成功” / “角色移除成功”, preserve failed selections, reset the role picker only after a confirmed grant, and show action-specific error or unconfirmed-outcome notices. Removal buttons now expose their pending state and block duplicate clicks while submitting. Five executable action tests cover authenticated scoped POST/DELETE requests, success, missing role, permission denial and interrupted connections without retries or blocking route reads. Web tests pass 37/37; lint and production build/typecheck pass. Real shared-account privileges were not changed for this regression test. The local service includes this follow-up; it is not yet published remotely.

The 2026-08-02 Workspace consistency pass centralizes repeated content-type labels, status labels/tones, page hero metrics and empty states, and moves catalog cards, filters, form controls, dashboards, review/submission flows and administration lists onto the same semantic surface, border and text hierarchy. Five representative dark-mode routes (`/workspace`, `/workspace/insights`, `/workspace/admin`, `/workspace/submit`, `/workspace/ai-skills`) were verified at 1280 px with no horizontal overflow or browser console errors. Web typecheck, lint, 24 tests and the 23-page production build pass. Release commit `8399b96` was successfully deployed by Vercel to the external test web. This changes presentation only; API, RBAC and workflow state logic are unchanged.

The next engineering objective is:

> A route or server action is not accepted merely because it exists. The next gate is a complete, deployed contributor → reviewer → administrator workflow, including real attachment download and P0 content validation. Desktop parity resumes after that gate; mobile adaptation is last.

## Approved Product Baseline

- The deployed final v9-1 website at `https://lomi2026.github.io/palmpay-design-intelligence/` is the only approved legacy code baseline.
- Older v5, v6, v8 and v9 variants are not implementation baselines.
- The deployed v9-1 public home, workspace and module pages are the approved visual, information architecture and interaction reference.
- `legacy/v9-1/` is an archival local snapshot and cannot override or narrow the deployed baseline when it is incomplete.
- v9-1 is not the production architecture.

## Completed

- v9-1 high-fidelity interaction prototype
- Public home and internal workspace product structure
- Core product positioning
- V1.0 product reconstruction blueprint
- V1.0 PRD
- Database ER model
- Frontend / backend development plan
- Design decision consolidation
- AI collaboration rules
- Codex `AGENTS.md`
- Claude `CLAUDE.md`
- pnpm workspace with formal Next.js Web and NestJS API projects
- PostgreSQL 17 development database and applied Prisma initial migration
- Organization, Team, User, Role, Permission and UserRole persistence and APIs
- Seeded system roles, role-permission matrix and default taxonomy
- Isolated development authentication adapter and current-user API
- Backend RBAC, organization isolation and disabled-user enforcement
- Frontend development login, current-user loading, protected workspace and logout
- Lint, strict type checking, integration tests and production builds
- Unified Content / ContentVersion and four content-type detail models
- Tags, file metadata, attachment relations and content relations
- Applied Phase 2 content catalog migration
- Permission-filtered published-content list and detail APIs
- Formal design-asset list, search, empty state and detail pages
- Audited deployed v9-1 source commit `bf39748` and created an idempotent AI-project migration script
- Imported 33 v9-1 AI projects (P01–P26 and S01–S07) into PostgreSQL with formal versions, categories, tags, source traceability and organization-safe visibility
- Created the `PalmPay Experience Design` umbrella team; all imported projects are initially owned by `lomi2026@126.com` per the explicit migration decision
- Formal AI project catalog list and detail pages backed by the permission-filtered API, with v9-1 project-library visual and information hierarchy
- Imported 6 v9-1 AI Skills and 4 v9-1 AI cases into PostgreSQL, retaining source traceability and their original verification states
- Formal AI Skill and AI case catalog list/detail pages backed by the permission-filtered API, using the deployed v9-1 information hierarchy
- Cloudflare R2 S3-compatible attachment adapter, protected upload intents, checksum verification, short-lived download URLs and cleanup endpoints
- Cloudflare R2 configuration guide that keeps the Bucket private and credentials out of source control
- A private Cloudflare R2 Bucket and least-privilege API credentials have been configured and accepted through a live signed-upload smoke test: direct R2 upload, server-side SHA-256 verification, short-lived signed download, content comparison and cleanup all pass. The R2 adapter was corrected to use Cloudflare-compatible `Content-Type`-only presigned uploads while retaining server-side streamed checksum verification before a file becomes `READY`; the private Bucket CORS policy also passed a `http://localhost:3000` browser-origin `PUT` preflight.
- Verified signed local-development attachment storage: upload intent, size and checksum validation, short-lived download and cleanup; files remain outside the repository on the current Mac
- Phase 3 draft API foundation: explicit team selection, draft creation, autosave, draft recovery and per-content version history, with organization and owner-or-`content.edit_all` enforcement
- v9-1-aligned workspace entry for 提交内容: content-type selector, four dedicated type-specific draft forms and shared draft editor shell backed by server actions and formal APIs
- Review workflow data migration and protected APIs for submit, reviewer assignment, approval and request-changes; the permission-gated review center supports queue, reviewer assignment and decisions, and the draft editor can submit a draft for review
- Draft attachment binding and editor controls: files are uploaded, checksum-verified, then bound to a draft version; only ready organization-scoped files that the editor can manage are restored with a draft
- Published-content editing now creates or resumes a separate editable draft version based on the immutable current published version; autosave and review of that draft never mutate or hide the published catalog version
- Approved draft versions can now be published only by `content.publish` users; the operation atomically promotes the approved version to `currentVersion`, clears the draft pointer and retains the prior published version as immutable history
- Reviewers can load a permission-gated structured comparison between a submitted version and its base version, including title, summary, structured body and attachment changes
- Permission-controlled unpublish and archive operations are available from each published content detail page; active draft, review and approved versions block lifecycle changes
- Review center now supports content preview, internal reviewer notes, traceable assignment/decision history and the required pending/handled/overdue filters; contributors have a dedicated My Submissions view
- In-app review notifications are persisted through a Prisma migration and sent on submission, assignment and decisions; users can retrieve and mark their own notifications as read
- The workspace notification badge now reads the current user’s persisted unread count rather than a static value; the notification center supports single-item and bulk read acknowledgement through the formal API.
- The workspace shell now derives the displayed role and AI-project count from the authenticated user and permission-filtered API data; it no longer uses a static member label or fixed project total.
- The workspace search affordance now supports the deployed `⌘/Ctrl + K` shortcut and opens the formal permission-filtered search page.
- Draft editor now debounces field changes into server-side autosave and exposes saving, saved and failure feedback
- Created `docs/09-V9-1-PARITY-INVENTORY.md` to track the mandatory deployed v9-1 page-by-page visual and interaction restoration gate
- v9-1 parity implementation must use shadcn/ui conventions and token-driven variants; custom replacement primitives or arbitrary component behavior changes are not permitted
- API development startup now compiles TypeScript to `dist` and watches that output before restarting Node, avoiding direct runtime loading of Prisma-generated TypeScript files
- Applied and Prisma-recorded the local `review_notifications` migration that was absent from the restored database, then applied and recorded the Phase 4/5 engagement-and-analytics migration; `prisma migrate status` now reports the local schema is up to date.
- Created `docs/10-MACHINE-TRANSFER-HANDOFF.md` with the current dirty-worktree warning, setup sequence, validation commands and next-computer Codex prompt.
- By explicit user decision, the restored `lomi2026@126.com` development identity now also holds the organization-scoped system `admin` role in addition to `member`; all 16 seeded permissions resolve through the formal RBAC model, and the bootstrap assignment is recorded in `audit_logs`.
- The personal contribution surface is now backed by a formal `GET /api/content-drafts` query scoped to the current organization and owner. It lists each owned draft, review version and published item with the correct next action, and an integration assertion confirms that even an administrator does not receive another user's items from this personal endpoint.
- The protected workspace retains a recoverable error boundary. Its former root route-level skeleton boundary was removed because Next.js displayed it on every child-menu navigation; a skeleton is now scoped only to the initial `/workspace` dashboard route group. Other menu destinations keep the current page visible until the prefetched destination is ready, avoiding repeated full-page loading flashes.
- Role-flow acceptance now uses four isolated, temporary PostgreSQL identities: member, reviewer, manager and administrator. The integration suite verifies independent reviewer assignment, request-changes, contributor revision and resubmission, approval, administrator publishing/lifecycle authority, and manager analytics-only access; all temporary test records are removed after execution.
- Phase 5.5 functional-interface acceptance is complete: all implemented formal modules are reachable through permission-aware desktop/mobile navigation or contextual actions; primary controls are functional or explicitly unavailable; dashboard values come from formal APIs; and the core member, reviewer, manager and administrator workflows have automated PostgreSQL evidence.
- Phase 6 local QA has verified Prisma schema/migration status, production builds, 12 PostgreSQL integration checks, security-boundary assertions and authorized runtime smoke paths. During this verification, the restored database was found to be missing the approved design-asset import; the existing idempotent v9-1 import script added the missing 8 assets and the formal catalog now contains 8 assets, 6 Skills, 4 cases and 33 projects.
- A safe external-test authentication adapter now issues short-lived, HMAC-signed bearer sessions only when `AUTH_MODE=test`; it first resolves the active database user and therefore preserves formal disabled-user and RBAC enforcement. In test mode, a forged development identity header is rejected. The adapter is explicitly excluded from the future production OIDC/SSO path.
- Test-environment deployment configuration is prepared for Vercel (web), Render free Docker API and isolated free PostgreSQL, and the existing private Cloudflare R2 test Bucket. A test-only idempotent bootstrap command creates the configured team plus the fixed contributor, reviewer and administrator identities with organization-scoped roles before the approved v9-1 catalog imports. The original Railway route was blocked by the account's exhausted free resource-creation quota and is retained only as a future paid-hosting fallback.
- The Render Blueprint has created the isolated PostgreSQL 17 test database and deployed the `palmpay-design-hub-api-test` API. Its public health check at `/api/health` returns `{"status":"ok"}` after the production-startup safeguard was corrected for the explicitly supported `AUTH_MODE=test` deployment path.
- The public Vercel test web at `https://palmpay-design-intelligence-web.vercel.app` is deployed from `apps/web`; production merge `eb14ed8` contains the accepted `codex/v1-project-handoff` tree without discarding the previous `main` history. Render `WEB_ORIGIN` and the private R2 test Bucket CORS policy both allow that exact HTTPS origin. The free Render plan does not offer a Shell, so recovery uses the explicit idempotent bootstrap command and routine service startup remains migration-only. A remote test-session request for `lomi2026@126.com` returns `201`.
- The idempotent test-environment bootstrap now maintains three active acceptance identities in the PalmPay Experience Design team: `lomi2026@126.com` (`member`, `manager`, `admin`), `lomi2025@126.com` (`member`) and `lomi2024@126.com` (`reviewer`). This lets the externally deployed test environment exercise contributor, reviewer and administrator separation after every redeploy.

## Validated Product Modules

- 公开首页
- 工作台
- 价值总览
- 设计资产
- AI Skill
- AI 项目库
- AI 案例
- 提交内容
- 我的贡献
- 我的提交
- 审核中心
- 数据洞察
- 管理中心
- 演示模式
- 全局搜索

## Known Legacy Limitations

- Static or compiled frontend structure
- Business data embedded in frontend
- localStorage used for part of user / favorite / submission / review simulation
- Simulated roles
- No formal enterprise authentication
- No formal PostgreSQL business database
- No real file storage
- No durable review history
- No formal audit log
- Analytics contains demo-oriented logic
- AI Skill mainly supports viewing and Prompt copy
- AI projects are exploration content, not formal pilot workflow

## In Progress

- F-01 local implementation is complete: the four dedicated editors persist the full P0 version snapshots, and publication now atomically upserts the approved snapshot into `AssetDetail`, `SkillDetail`, `CaseDetail` or `AIProjectDetail`. Draft/autosave changes cannot mutate the current published detail, and second publication updates the same formal detail row. External test-environment browser and PostgreSQL E2E verification remain required before F-01 is accepted as deployed.
- F-02 local implementation is complete: each formal published detail page renders ready attachments from its immutable current version and requests a short-lived protected download URL only after a user action. The API now records `file_download`, audits restricted downloads and rejects deletion while a file remains bound to any version or workflow record. External R2/browser and PostgreSQL E2E verification remain required before F-02 is accepted as deployed.
- F-03 local implementation is complete: all four formal published detail pages now expose a canonical copy-link action. It copies only the origin plus detail pathname, records the authorized `content_share` event and introduces no public token or visibility bypass; recipients remain subject to the normal content/RBAC checks. External test-environment browser verification remains required before F-03 is accepted as deployed.
- F-04 local implementation is complete: all four formal catalogs share URL-backed `search`, `categoryId`, `tag` and `verificationStatus` filters, which are preserved across refresh, direct links and further submissions. The server applies the verification-status filter only after existing published-content visibility rules; local integration evidence covers a combined category/tag/status query returning only the authorized matching content. External test-environment browser verification remains required before F-04 is accepted as deployed.
- F-05 local implementation is complete: the contributor can save the current draft and open a formal-detail preview before review submission. The preview has an explicit unpublished-draft banner, is served only through the existing owner/content-editor draft authorization path, and is not exposed through public routes, catalogs or search. Local integration evidence confirms author/editor access and reviewer denial. External test-environment browser verification remains required before F-05 is accepted as deployed.
- F-06 browser acceptance remains open. On 2026-07-31 Chrome exposed an existing authenticated tab at `/workspace/favorites`, confirming that the current browser session reaches the protected workspace. Page-structure, screenshot and interaction capture still time out, and one cookie scope cannot prove three independent roles. No acceptance content or files were written. Resume with responsive control plus isolated browser profiles/contexts, then perform the contributor/reviewer/administrator workflow.
- Release commit `46b988d` publishes the stage-one correction pass on `codex/v1-project-handoff`. GitHub reports a successful Vercel deployment; Render returns 200 from `/api/health`, and the new protected `/api/notifications/unread-count` route returns the expected unauthenticated 401. Because Render starts the API only after `prisma migrate deploy`, the successful new-route response also confirms the six-migration startup gate completed. Deployed three-role browser acceptance remains open.
- The user-approved functional-closure audit is complete and recorded in `docs/13-FUNCTIONAL-COMPLETENESS-AUDIT.md`. F-01 through F-05 are locally implemented; active work is deployed browser E2E evidence and external role-workflow verification. Pixel-level visual work and mobile adaptation are paused until this functional gate passes. The workspace menu/tab performance issue remains deferred and is not counted as accepted.

- The management-center tab performance defect has been corrected: each server render loads only its own authorized data (one or two endpoints rather than all eight administration datasets), then the compact finite tab set is full-prefetched into the client router cache for instant tab revisits. Current-user/auth-header reads are request-memoized across the workspace shell and page. A workspace-wide route review found no other query-tab surface that eagerly loads unrelated administration datasets.
- The external-test workspace now keeps recently visited dynamic route segments in the browser for 120 seconds. After the workspace shell becomes interactive, its finite permission-filtered navigation set and the seven management tabs are explicitly warmed through the client router; pointer or keyboard intent also invokes direct route prefetching. This makes ordinary back-and-forth navigation and admin tab revisits use the client cache rather than repeat a Vercel-to-Render read. Large catalog/detail-link sets still do not automatically prefetch all visible records. Server-side RBAC remains enforced whenever a request is required; Render free-instance cold starts remain a hosting limitation.
- The external test environment core is live: Render API/PostgreSQL, Vercel Web, test auth, exact-origin API/R2 CORS, test database initialization and the administrator session have remote evidence. Remaining delivery evidence is the browser acceptance of actual attachment upload, review and publication. Phase 5.5 delivered one permission-aware navigation model across desktop and mobile, route-aware active states, dynamic breadcrumbs, real dashboard data, personal contribution/submission surfaces and explicit unavailable-state behavior for unfinished controls.
- The administration surface is now separated into content, taxonomy, team, user, role-permission, audit and platform-settings modules. Team updates, user status changes and role assignment/removal use the protected formal APIs and retain audit logging; the platform-settings module reports the current environment boundary without presenting unavailable production integrations as active controls.
- Phase 4/5 implementation is in the working tree: the additive Prisma migration introduces persisted favorites, recent views, unified usage events, search logs and audit logs. The API provides permission-filtered PostgreSQL full-text search, search-click/no-result logging, favorites, recent views, real AI-project usage confirmation, content relations, analytics aggregates, taxonomy/content administration and audit-log endpoints. The workspace exposes global search, personal saved/recent pages, usage and relation flows, overview/insights and RBAC-gated administration pages. API strict typecheck, lint, Prisma validation/migration status and twelve PostgreSQL integration tests pass, including separate member/reviewer/manager/admin workflow coverage and input/CORS/file boundary assertions; Web typecheck, lint and production build also pass. The protected workspace correctly redirects to formal development login rather than substituting a static role.
- Phase 3 is verified functionally. The public home, workspace shell, catalog lists, submit/draft flow, notifications, my submissions, review center, login and access-denied pages have been moved onto the v9-1 dark visual language using shadcn/ui primitives while retaining the formal API and RBAC behavior.
- The mandatory v9-1 parity gate is still open: deployed/authenticated desktop first-viewport pairs for the public home, workspace and AI project library were captured on 2026-07-18. Source-informed corrections restored the public header’s constrained desktop container and the AI project portfolio’s overview/suggested-priority layer using real published records. Responsive, project-detail, interaction-state and post-deployment captures still need to be completed before acceptance. Direct deployment checks established that several archived deep links (Design Assets, submit, demo workspace and AI Skill pages) are 404 and therefore are formal-only V1 routes rather than current deployed parity targets. The test R2 Bucket is configured and live-signed-upload validated.
- The formal AI Project detail now uses the deployed project-template information hierarchy while binding every displayed signal to the persisted AIProjectDetail, ContentVersion, owner/team, priority and engagement models. It retains RBAC-gated lifecycle actions instead of copying the legacy static reset/action behavior.
- The formal AI Case detail now uses the deployed verified-practice information hierarchy while binding the before/after comparison, AI and human responsibilities, result and validation evidence to CaseDetail and ContentVersion data. Missing limits are explicitly marked as incomplete rather than presented as verified production evidence.
- The formal Design Asset detail now puts applicability and constraints ahead of implementation detail, while preserving persisted usage guidance, version, maintenance metadata, attachments, related content and engagement actions.
- The formal AI Skill detail now exposes the approved reusable-method model from `SkillDetail`: scope, input/output, Prompt, execution conditions, examples, human review, limitations, version and owner. It does not invent missing examples or limitations. Direct deployment checks confirm that the archived Skill catalog/detail filenames return 404, so these formal pages inherit the deployed workspace system instead of claiming a missing v9-1 counterpart.
- The deployed workspace desktop baseline has been checksum-verified against the matching historical source and compared side by side with an authenticated formal local workspace at `1280 x 720`. The sidebar, top bar, dashboard hero, metric, update and todo layout has received a source-informed correction pass; matching reviewer/admin test identity and the remaining page/state captures are still required for acceptance.
- The workspace Design Assets module uses 8 formally imported, source-traceable v9-1 assets instead of an empty catalog. Its header, filters, card-cover hierarchy and metadata use the deployed workspace component language with shadcn/ui composition. The historical `design-assets.html` URL is 404 on the current deployment, so it is not a separate parity blocker.
- By the latest explicit user direction, v9-1 parity remediation now continues automatically through small page/flow batches. The first resumed batch adds the required domain, value and stage filters to the real AI Project portfolio and aligns its portfolio density with the approved project-library model; the value overview, data-insights and review-center entry surfaces also now use the same high-density workspace hierarchy while retaining their live PostgreSQL metrics and actions. Web typecheck, lint and production build pass after this batch. Browser capture is now available for deployed source/formal comparisons, although the remaining desktop/mobile states and the new code’s post-deployment capture are still open.
- The continuous parity pass now also covers the formal contribution, submission and review flows; AI Skill and AI Case catalog hierarchy; personal saved/recent space; notifications; global search; relationship management; usage confirmation; login/access-denied states; shared content cards; and all administration tabs. The draft editor, attachment binding/removal, review handoff, published-detail actions and recoverable-error states now share the dense workspace hierarchy; the admin panels retain every protected server action while adding consistent operational headers, counts, empty states and responsive panels. Web typecheck, lint and the 23-route production build pass after this batch. Required desktop/mobile source-versus-rendered comparison remains open before visual acceptance.
- The local light/dark theme remediation is complete and recorded in `docs/14-THEME-AUDIT.md`. Theme selection is applied before first paint, the Workspace shell/sidebar/header now use shared semantic tokens, restored v9-1 dark utility tokens receive exact light-mode compatibility mappings, and Dialog/Sheet portals use global shadcn theme tokens. Twenty-five accessible product routes were checked in both themes on a production build, with additional light-mode search-dialog and mobile-sheet evidence. Web/API typecheck, lint and builds pass; API tests report 13 passed, 0 failed and 11 existing integration-environment skips. External Vercel deployment and post-deploy theme sampling remain open.

## Next Task

Codex should:

1. Use three isolated browser profiles/contexts, then execute F-06 contributor/reviewer/administrator evidence including upload, signed download, audit and cleanup.
2. Resume desktop-only v9-1 visual parity only after the functional acceptance gate passes; perform mobile adaptation after desktop acceptance.

## Next Milestone

**P0 functional closure and deployed workflow acceptance; then desktop v9-1 visual parity; then mobile adaptation**

Milestone definition:

- Each page with a deployed v9-1 counterpart matches the approved layout, information hierarchy, wording, density and interaction behavior.
- Screenshot comparison records the verification outcome for every counterpart page.
- Formal data, authentication, RBAC and lifecycle behavior remain intact behind the restored interface.

## Not Started

- Formal content center core catalogs (verified; real attachments remain)
- Cloudflare R2 production object storage (local development storage is verified)
- Full search (verified)
- Favorites persistence (verified)
- Usage confirmation (verified)
- Analytics event pipeline (verified)
- Value overview with real data (verified)
- Admin center (verified)
- Audit log (verified)
- AI Gateway
- Online AI Skill execution
- Figma integration
- Yuque integration
- Jira integration
- GitHub integration
- External deployment and post-deploy verification of the completed local light/dark theme remediation

## Current Blockers / Decisions Needed

The following decisions may affect later implementation:

- Enterprise SSO / OIDC provider is not yet confirmed.
- Production hosting and database provider are not yet confirmed.
- Railway cannot create the required API service for the current account because its free resource-creation quota is exhausted. The external test deployment uses the committed Render Blueprint for an isolated free Docker API and free PostgreSQL plus the Vercel web at `https://palmpay-design-intelligence-web.vercel.app`. Render's free PostgreSQL database expires after 30 days and the free API sleeps after inactivity, so this is an acceptance environment rather than a production route. The prepared configuration uses test-only signed sessions and the private `palmpay-design-hub-test` R2 Bucket; the exact Vercel origin has been added to both Render `WEB_ORIGIN` and R2 CORS.
- Cloudflare R2 is the approved production storage target. A private test Bucket, Bucket-scoped Object Read & Write Token, live signed upload/download/checksum verification, localhost browser-origin preflight and the exact external-test HTTPS origin CORS policy were completed on 2026-07-18. Local signed filesystem storage remains the fallback development adapter.
- Legacy examples contain team labels but no formal owner-user identity mapping required by the V1.0 ER model.
- The ER defines `restricted` visibility but does not define a user/group ACL entity; current catalog access is limited to the owner or `content.edit_all` users.
- PostgreSQL 17 and the restored `palmpay_design_hub` database are running through Postgres.app. On 2026-08-01 all six migrations were current and the complete 46-test API suite, including all 14 PostgreSQL E2E checks, passed with 0 failures and 0 skips.
- Release commit `46b988d` is the current pushed external-test baseline on `codex/v1-project-handoff`; its Vercel deployment is successful, and Render serves the new protected notification-count route after a healthy migration-gated startup. GitHub Pages remains enabled but serves the legacy static `main`-branch root; it is not the formal V1 deployment route. `docs/11-RELEASE-READINESS.md` records the remaining production-hosting, database, SSO, domain and CI/CD prerequisites.
- AI input data policy and approved external model boundary are not yet confirmed.
- Single-reviewer or multi-reviewer formal publishing policy is not yet confirmed.
- The mandatory v9-1 visual-parity gate cannot be accepted yet: workspace desktop now has validated source/local side-by-side evidence, but mobile, other routes and matching reviewer/admin state captures remain outstanding. `design-qa.md` records this as a blocking launch-verification issue; no route may be called 100% restored until every required state has evidence. By explicit user decision, it no longer blocks Phase 4 or Phase 5 implementation.

These unresolved items must not block repository setup, initial data model, RBAC base or an authentication adapter boundary.

## AI Responsibility

### GPT

- Product and experience decision
- PRD and IA
- Design decision updates
- Phase planning
- Product and UX review

### Claude

- Primary implementation
- Approved feature development
- Tests
- Normal implementation defect fixes

### Codex

- Project takeover
- Architecture review
- Complex implementation
- CI / test / security investigation
- Code review
- Confirmed defect fixes

## Update Rule

Update this file when:

- Phase changes
- Milestone completes
- Major blocker appears
- Architecture decision changes
- Next task changes

Do not use this file as a daily activity log.

## 2026-09-16 本地管理表单调整

用户新增已改为右上角弹窗入口，用户姓名和状态合并保存，沿用组织隔离、用户管理权限、内容转移校验及事务审计；无数据库结构迁移。标准表单控件统一 40px，管理中心编辑行顶部对齐并使用 12px 间距。本地验证后供验收，尚未发布线上。

本次验证：前后端构建及 lint 通过；前端 62 项测试、用户保存相关 7 项测试通过。浏览器确认弹窗字段、用户/团队控件高度与对齐、保存前后持久化及 390px 窄屏无横向溢出；本地 API 验证普通成员与跨组织修改返回 403。验收时临时修改的姓名已恢复。

按钮分级已按用户确认方案完成本地调整：40/36/32px，保留表单同高及 Tab 规范，新增和发布等主操作配图标。前端构建、lint、62 项测试通过；浏览器核对项目库、Skill 卡片、价值总览、管理用户/团队/分类、创建内容及新增弹窗的实际尺寸通过。尚未发布线上。

公共组件状态统一：构建、lint、62 项测试通过；浏览器验证亮暗主题下输入框/选择器错误边框同色，输入框/选择器/按钮禁用背景和透明度一致。当前修改仅在本地预览。

圆角规范完成本地优化：8px 小型元素、12px 控件、16px 普通卡片/下拉面板、24px 大区块/弹窗；清理非规范固定数值及焦点/Tab 强制样式冲突。构建、lint、62 项测试通过，浏览器验证亮暗主题普通/错误/禁用控件圆角及 Tab、弹窗、内容卡片档位。规范记录于 docs/07-COMPONENT-RADIUS.md，尚未发布线上。

## 2026-09-20 PPCB 测试发布

PPCB 测试数据库已幂等导入 48 条发布内容、49 个版本与 17 个标签。测试版本 `REL-MU9FSVQV-55E3034771` 已发布至 `https://ppcloudebase.palmpay-inc.com/apps/palmpay-design-hub-builder-test/`：两个运行实例全部就绪且无重启，平台内部 `/healthz` 与首页均返回 200。

PPCB 文件链路已改为由同一服务端请求完成上传意图创建、对象上传、完成确认和草稿绑定；同时保留平台签名请求头、使用兼容 OSS 的 ASCII 对象名，并保留原始中文文件名供界面展示。测试环境已验证中文附件上传后持久化、封面上传后通过应用子路径正确回显，以及两张迁移设计资产图片正常读取。Web lint、71 项测试和生产构建通过。验收草稿仅保留在测试数据库，不会进入内容库。

经用户明确确认，测试版本的同一不可变镜像已晋级生产，未重新构建。生产版本为 `REL-MU9GI4EH-EADA266DB3`，正式入口为 `https://ppcloudebase.palmpay-inc.com/apps/palmpay-design-hub-builder/`。两个生产实例全部就绪且无重启；启动日志确认 48 条发布内容、49 个版本、17 个标签和 5 张封面已幂等导入，钉钉统一登录重定向正常。

## 2026-09-20 PPCB 独立项目工作区

PPCB 后续开发与发布已迁移到独立 Git 工作树 `/Users/a1/Documents/PalmPay-Design-Hub-PPCB`，工作分支为 `codex/ppcb-deployment`。当前发布对话已改名为“PPCB · PalmPay 体验设计 Hub 发布与运维”，并放入同名 PPCB 侧边栏分组。快速发布打包提交已合并到该分支，`pnpm ppcb:package` 可生成约 6.7 MB 的最小源码包。长期边界、环境、发布流程和安全资源路径记录于 `docs/15-PPCB-PROJECT-CONTEXT.md`；原项目目录仅保留为原托管版本与历史基线。
