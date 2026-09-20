# Cloudflare Pages 部署说明

这个目录已经是可直接部署的静态站点，并且首页加入了显眼的验收标记：

- `DEPLOY TEST`
- `2026-07-03 15:00 CST`

如果你部署成功，线上首页首屏必须能直接看到这段黄色标记。

## 方式 1：后台上传

1. 打开 Cloudflare Pages 项目 `palmpay-ux`
2. 进入 `Deployments`
3. 新建 `Production` 部署
4. 上传当前目录内容，或者上传同目录生成的 zip 包

## 方式 2：Wrangler 正式部署

在当前目录执行：

```bash
npx wrangler pages deploy . --project-name palmpay-ux
```

如果需要明确发到生产环境，可用：

```bash
npx wrangler pages deploy . --project-name palmpay-ux --branch main
```

## 目录说明

- `index.html`：站点首页，已加入部署验收标记
- `assets/`：图片和视频资源
- 其他 `*.html`：二级页面
- `_headers`：Cloudflare Pages 响应头配置
- `wrangler.toml`：Wrangler 配置

## 已处理问题

- 已补齐 `design-intelligence-hub-demo.html`，避免首页按钮跳转 404
- 已加入可视化部署标记，方便确认线上是否切到了新版本
