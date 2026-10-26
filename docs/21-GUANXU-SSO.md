# Hub → 观序统一登录协议 v1

状态：2026-10-26 测试候选；默认关闭，尚未生产启用。此文与观序仓库 `docs/hub-sso.md` 对应。

## 配置

Hub Web 服务端设置 `GUANXU_SSO_ENABLED=true`、`GUANXU_ORIGIN`（独立观序 HTTPS origin，无路径）、`GUANXU_SSO_SECRET`（随机 32 字节的 64 位十六进制字符串）。现有 `AUTH_MODE=ppcb`、`PPCB_PORTAL_ORIGIN` 和 `NEXT_PUBLIC_APP_BASE_PATH` 沿用。配置由 runtime 继承，禁止使用 NEXT_PUBLIC 前缀暴露密钥，不复用每次启动变化的 PPCB_INTERNAL_SECRET。

观序设置 `HUB_SSO_ENABLED=true`、`HUB_SSO_ISSUER`（本 Hub 完整应用地址，无尾斜杠）、`HUB_SSO_SECRET`（同一专用密钥）、`HUB_SESSION_SECRET`（另一独立随机密钥）。测试与生产的 issuer、观序、数据库、文件存储及密钥必须隔离。不能把测试 Hub 指向生产员工工作区。

## 登录协议

工作台提供原生链接 `/sso/guanxu`；已存 AI 工具/AI 项目引用恰为 GUANXU_ORIGIN 时，在页面输出时改走此入口，不修改内容数据库。其他外链保持不变。不要预取该路由。

Hub 先跳转观序 `/auth/hub/start` 生成浏览器 state cookie，再回 Hub `/sso/guanxu?state=...`。Hub 通过既有 `/api/me` 校验 ACTIVE 员工及 content.read 有效权限；无登录时交回钉钉入口并保留返回路径。随后签发 HS256 JWT：

- iss：PPCB_PORTAL_ORIGIN + NEXT_PUBLIC_APP_BASE_PATH
- aud：GUANXU_ORIGIN
- sub：已验证的 employeeId（ppcb: + 64 位哈希）
- org：organizationId；name：仅展示，不用于身份关联
- nonce：观序生成的 43 字符 base64url state
- iat/exp：整数秒，最多 60 秒；jti：随机 UUID

返回固定观序 `/auth/hub/callback#token=...`；token 放 fragment，不进入服务器 URL 日志。观序回调页先清除 fragment，再同源 POST，核对签名、issuer/audience、时效和浏览器 cookie，并在 D1 原子消费 jti。禁止记录回调请求体。

观序创建 15 分钟 HttpOnly/Secure/SameSite=Lax 会话，D1 只存随机会话的哈希。续期需再通过 Hub 校验；禁用员工最长 15 分钟后失效，不声称支持跨站即时退出。观序退出不注销 Hub。

## 原有数据

原 GPT 用户先从观序账号菜单发起“关联已有数据到钉钉账号”，再验证 Hub 身份。仅首次映射允许，员工或原账号已经关联其他身份时拒绝覆盖；保留原工作区、修订号和 R2 截图。Hub 员工普通登录不自动导入当前浏览器历史 IndexedDB。

## 验收与发布

本地 Web 单测/类型检查/Lint，观序 Worker/SQLite 测试，以及真实 Hub 签发函数与 Worker 联调已完成。Hub 的 Next.js 构建被执行环境系统内存接口缺失阻塞，须在正常环境补齐；真实钉钉登录、PPCB 测试发布与浏览器 cookie 链路尚未验收。

在独立测试环境先部署观序候选和迁移，再部署 Hub 测试候选、配置专用密钥；分别验证 Owner/User、过期/伪造/重放、不同员工隔离、关联冲突、原截图及原 GPT 登录。测试无误后按 `20-PPCB-RELEASE-CHECKLIST.md` 获取生产晋级确认。按同样顺序部署生产，再开启两端开关。关停开关可回到原登录；保留身份表不删除数据。应急撤销全部观序员工会话需要清空 hub_sessions，单纯换签发密钥不会撤销已签发会话。
