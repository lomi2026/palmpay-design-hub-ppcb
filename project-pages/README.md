# AI 项目独立静态页面

从已部署的 v9-1 页面迁移 P01–P26、S01–S07，共 33 个项目。页面模板由 `projects/project-detail.html?id=P01` 按编号加载 `assets/` 中对应内容；并非 33 个互不依赖的 HTML 入口。保留原页面视觉与交互，返回链接调整为 PPCB 生产 AI 项目库。

## 当前状态

源码存放在私有仓库 `lomi2026/palmpay-design-hub-ppcb`。2026-09-20 请求启用 GitHub Pages 返回 HTTP 422：当前套餐不支持此私有仓库的 Pages。网站尚未部署，没有可用的新公开网址；PPCB 数据库及“查看项目”的原链接尚未替换。

后续需使用支持私有源码的网页托管，或由用户选择套餐/独立公开页面仓库方案。不得把整个 PPCB 主仓库改成公开来绕过限制。确认托管后，只部署本目录，逐项浏览器验收后再调整 PPCB 链接。

## 发布包隔离

`deployment/ppcb/create-source-archive.sh` 只收录 Dockerfile、.dockerignore、package.json、pnpm 锁文件/workspace、apps、packages、deployment/ppcb；不会收录顶层 `project-pages/`。本次文件增加 GitHub 仓库大小，不增加 PPCB 源码包或镜像大小。

## 验证

- 33 个编号无遗漏，源文件 SHA-256 记录在 migration-manifest.json。
- 每个内容成功解码，165 个内嵌 JavaScript 代码块语法检查通过。
- HTML 引用资源齐全，无 CSS 外部 URL 依赖；项目内返回链接均指向 PPCB。
- 未做新托管环境浏览器验收，不宣称页面已上线。
- 原静态页面填写/重置等功能沿用浏览器本地存储；换域名不会自动迁移原浏览器中的填写内容，也不代表正式 Hub 数据库功能。
