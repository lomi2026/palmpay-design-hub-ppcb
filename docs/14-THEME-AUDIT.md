# PalmPay Design Intelligence Hub 亮色 / 暗色主题审计

审计日期：2026-07-18

基线：当前工作树的 Next.js production build

验收地址：`http://localhost:3002`

约束：未修改页面信息架构、文案、业务流程、尺寸体系或批准的视觉层级。

## 结论

本轮修复了全站主题初始化、Workspace Shell、旧 v9-1 深色工具类兼容、主按钮前景色、反色信息卡，以及 Portal 弹窗/侧滑面板五类根因。25 条可访问产品路由分别在亮色和暗色下完成 production browser 检查；公开首页、登录、无权限、全部 Workspace 一级页面、四类目录和代表性详情页均未再出现前景与背景近似同色的可见文字。草稿编辑与预览路由当前测试数据均处于审核中，因此按正式状态机重定向到“我的提交”；其共享编辑器、表单、附件、预览和错误边界已纳入静态主题边界检查及 production build。

这是一轮主题一致性与可读性修复，不等同于完整 WCAG 无障碍认证。

## 根因排序

1. `globals.css` 使用 `[class*='text-white']` 等子串选择器改写亮色主题。它会误命中 `hover:text-white`，导致黑色主按钮仍使用黑色文字。
2. Workspace 旧 v9-1 页面仍包含大量硬编码深色背景、白色文字和白色边框；其中 Sidebar 的 `#0a0a0a` 没有亮色映射，造成亮色内容配黑色侧栏。
3. 主题只在 `V9ThemeToggle` 挂载后写入页面节点，首屏、登录、无权限和错误页没有统一的 pre-paint 主题入口。
4. Dialog 与 Sheet 通过 Portal 渲染到 Workspace 作用域之外，继承不到 `.v9-source-home` 的兼容规则。
5. 详情页和状态页使用包含深色十六进制值的渐变背景，普通 `background-color` 映射无法覆盖。

## 页面与组件问题清单

| 页面 / 路由 | 修复前问题 | 修复结果 |
| --- | --- | --- |
| 公开首页 `/` | 亮色主 CTA 黑底黑字；切换后依赖组件挂载 | 主 CTA 使用语义前景/背景；首屏读取已保存主题 |
| 登录 `/login` | 固定暗色背景、表单和按钮 | 登录容器、输入框、按钮跟随全局主题 |
| 无权限 `/unauthorized`、全局错误 | 固定暗色卡片，亮色主题不生效 | 接入统一 v9 主题变量 |
| Workspace Shell（所有 `/workspace/*`） | 亮色侧栏仍为黑色；Header、用户菜单边界混色 | Sidebar、Header、Breadcrumb、通知、账户菜单统一语义变量 |
| 工作台 `/workspace` | 亮色“提交内容/进入资产库”黑底黑字；暗色指标数字不可见 | 两种主题下主按钮、Hero、指标和列表均可读 |
| 收藏、最近、通知、贡献 | 共享卡片、徽标、空状态保留暗色值 | 精确兼容背景、文字、边框和状态色 |
| 设计资产目录与详情 | 封面、详情 Hero、操作按钮、渐变在亮色下混用暗色 | 列表、详情、操作、反色区域与背景渐变跟随主题 |
| AI Skill 目录与详情 | 同上；详情渐变与字段卡固定暗色 | 两种主题下目录、详情和字段卡可读 |
| AI 项目目录与详情 | 筛选状态、反色摘要卡、阅读目录混色 | 列表、详情、状态按钮及右侧目录跟随主题 |
| AI 案例目录与详情 | 卡片、对比区域和操作状态混色 | 两种主题下信息层级与状态可读 |
| 提交内容 `/workspace/submit` | 亮色内容类型选中态、字段区和创建按钮对比异常 | 选中态、输入控件、底部主按钮恢复正确反色 |
| 我的提交、审核中心 | 状态卡、筛选按钮、审核动作在亮色下仍用暗色值 | 卡片、筛选、表单和动作按钮统一主题映射 |
| 价值总览、数据洞察 | 亮色反色治理卡白底白字；暗色指标值对比异常 | 反色卡在亮色保持黑底白字；其他指标按主题显示 |
| 管理中心全部 Tab | 共享管理面板、按钮、输入和状态徽标混色 | 继承统一 Workspace 主题边界 |
| 搜索、使用确认、关联内容 | 表单、空状态和按钮混色 | 亮/暗两种主题 production 检查通过 |
| 全局搜索 Dialog | Portal 固定暗色，亮色输入和文字不一致 | 使用 shadcn `background/foreground/popover` tokens |
| 移动端导航 Sheet | Portal 固定黑底白字 | Sheet primitive 与导航内容均使用全局主题 tokens |
| 项目详情阅读目录 Sheet | 悬浮按钮与右侧目录固定暗色 | 悬浮入口、面板、选中态随主题切换 |

## Production 路由检查

亮色与暗色均检查：

- `/`、`/login`、`/unauthorized`
- `/workspace`
- `/workspace/favorites`、`/workspace/recent`、`/workspace/notifications`、`/workspace/contributions`
- `/workspace/design-assets`、`/workspace/design-assets/design-asset-a1`
- `/workspace/ai-skills`、`/workspace/ai-skills/ai-skill-s1`
- `/workspace/ai-projects`、`/workspace/ai-projects/ai-project-s05`
- `/workspace/ai-cases`、`/workspace/ai-cases/ai-case-c1`
- `/workspace/submit`、`/workspace/submissions`、`/workspace/reviews`
- `/workspace/overview`、`/workspace/insights`、`/workspace/admin`、`/workspace/search`
- `/workspace/usage?contentId=...`、`/workspace/related?contentId=...`

额外状态检查：

- 亮色全局搜索 Dialog
- 390 × 844 亮色移动端导航 Sheet
- 亮色/暗色 Workspace 主按钮与指标值
- 亮色数据洞察反色 Governance 卡
- 亮色设计资产详情渐变背景和操作按钮

## 验证

- Web typecheck：通过
- Web lint：通过
- Web production build：通过，29 条 App Router 路由完成构建
- API typecheck：通过
- API lint：通过
- API build：通过
- API tests：13 通过、0 失败、11 个需要数据库集成环境的测试按既有条件跳过
- 浏览器路由检查：25 条可访问产品路由 × 2 个主题，无页面错误提示
- 近似同色防线：production DOM 可见文字扫描未发现对比比值低于 2.2 的样本；该阈值用于定位本轮“文字看不到”缺陷，不代表 WCAG 认证

## 截图证据

- 修复前：`docs/theme-audit/screenshots/before/`
- 修复后：`docs/theme-audit/screenshots/after/`
- 关键证据包括工作台亮/暗、数据洞察亮/暗、提交页、详情页、搜索弹窗、移动端 Sheet 和公开首页 CTA。

## 仍未解决

- 未在本轮创建或修改业务草稿来强行进入草稿编辑/预览状态；当前现有草稿均处于审核中，正式路由会重定向到“我的提交”。
- 本地验收通过不等于线上已发布；Vercel 仍需在用户验收后部署当前提交，并再次做线上缓存与主题持久化抽查。
- 本轮没有扩大到视觉改版、信息架构、文案或业务功能调整。

## 2026-08-02 组件一致性跟进

在不调整信息架构、业务流程、权限和状态机的前提下，正式 Workspace 又完成一轮跨页面组件收口：

- 新增统一的状态映射与状态徽标，内容、审核、验证、账号和 AI 项目阶段不再由页面分别维护文字与颜色。
- 新增统一空状态，并将收藏、最近浏览、通知、搜索、目录、提交和审核列表迁移到同一组件。
- 我的贡献、我的提交和审核中心使用同一页面 Hero 与指标组件；目录页共用标题、搜索、筛选、卡片和元数据层级。
- 输入框、文本域、原生选择框、禁用态、焦点态和深色表面统一到 v9 语义变量；低透明度文字、边框和硬编码深色背景增加精确兼容映射。
- 数据洞察中的机器状态码和事件码改为面向用户的中文标签，并使用克制的语义色区分状态与数据系列。

验证结果：Web typecheck、lint、24 项测试、production build 与 `git diff --check` 均通过；本地 production 浏览器检查 `/workspace`、`/workspace/insights`、`/workspace/admin`、`/workspace/submit`、`/workspace/ai-skills`，未发现横向溢出、控制台错误或警告。线上 Vercel 尚未部署本轮变更。

## 2026-08-31 暗黑舒适度优化

用户在当前线上暗黑模式中明确反馈长时间观看疲劳。六类代表页面的重新审计确认，问题来自近纯黑背景、近纯白大标题、透明白辅助文字、密集网格，以及数据洞察、价值总览和项目详情中的大面积纯白信息卡同时存在。

本轮将暗黑主题收口到新的集中式低眩光语义色板：页面 `#121416`、侧栏 `#0F1113`、一级表面 `#15181B`、卡片 `#181B1F`、字段/抬升表面 `#20242A`、主文字 `#E1E5E9`。全局 shadcn Token 与 v9 兼容 Token 使用同一组暗黑基础值；直接的近黑背景、近白文字、页面渐变和网格通过暗黑兼容映射进入语义层级。

数据洞察、价值总览和 AI 项目详情的三处大面积反色信息卡改为共享暗面板；主要按钮仍保留紧凑的高对比浅色操作态。网格线与光晕降低，页面结构、文案、密度、RBAC 和业务流程保持不变。

新增暗黑 Token 回归测试。Web 测试 26/26、typecheck、lint、production build 与 `git diff --check` 通过；本地生产首页已完成改前/改后截图对比。线上部署与登录后代表页面回归在发布步骤完成后记录到项目状态。
