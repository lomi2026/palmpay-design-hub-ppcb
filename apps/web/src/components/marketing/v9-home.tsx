import { appPath } from '@/lib/app-path';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Search,
  Sparkles,
  BarChart3,
  ArrowUpRight,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarketingMobileMenu } from '@/components/marketing/marketing-mobile-menu';
import { V9MobileSection } from '@/components/marketing/v9-mobile-section';
import { V9ThemeToggle } from '@/components/marketing/v9-theme-toggle';

const featuredAssets = [
  ['组件体系', '组件规范', '更新于 2 天前', 'Web 数据表格组件规范', '统一复杂业务表格的布局、筛选、批量操作、状态与空数据表达。', '设计系统小组', '已验证 · 72% 复用', 'window'],
  ['页面模板', '页面模板', '更新于 5 天前', '业务经营看板页面模板', '帮助设计师快速建立指标层级、经营叙事和管理层决策视图。', '体验设计小组', '18 个模板', 'chart'],
  ['AI 工作流', 'AI 工作流', '更新于 1 周前', '体验策略分析 AI Skill', '将输入材料、分析维度、输出结构和设计判断整合为可复用工作流。', 'AI 设计小组', '评分 8.8', 'process'],
  ['交付体系', '交付规范', '更新于 2 周前', '设计交付检查清单', '统一状态覆盖、交互说明、验收口径与设计走查的团队标准。', '设计运营小组', '高频使用', 'checks'],
] as const;

export function V9Home() {
  return (
    <main className="v9-source-home overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-30 h-[72px] border-b border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto flex h-full w-full max-w-[1248px] items-center gap-8 px-4 md:px-0">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 md:gap-3" aria-label="返回首页">
            <Image src={appPath('/brand/palmpay-logo.svg')} alt="PalmPay Design Intelligence Hub" className="size-7 object-contain" height={28} width={28} priority />
            <span className="text-[13px] font-semibold tracking-[-.02em]">PalmPay Design</span>
          </Link>
          <nav className="hidden h-full items-center gap-1 text-[13px] text-[var(--text-secondary)] lg:flex" aria-label="主导航">
            <a className="rounded-lg bg-white/[.08] px-3 py-2 font-medium text-foreground" href="#home">首页</a>
            <a className="rounded-lg px-3 py-2 hover:bg-accent hover:text-foreground" href="#assets">设计资产</a>
            <a className="rounded-lg px-3 py-2 hover:bg-accent hover:text-foreground" href="#skills">AI Skill</a>
            <Link className="rounded-lg px-3 py-2 hover:bg-accent hover:text-foreground" href="/workspace/ai-projects">探索项目</Link>
            <a className="rounded-lg px-3 py-2 hover:bg-accent hover:text-foreground" href="#cases">AI 案例</a>
            <a className="rounded-lg px-3 py-2 hover:bg-accent hover:text-foreground" href="#impact">业务影响</a>
          </nav>
          <div className="home-header-actions ml-auto flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="hidden h-10 w-[180px] min-w-0 justify-start overflow-hidden rounded-[12px] border-border bg-white/[.035] px-3 text-[12px] font-normal text-muted-foreground hover:bg-accent hover:text-foreground md:inline-flex">
              <Link href="/workspace/search">
                <Search className="size-3.5 shrink-0" />
                <span className="min-w-0 flex-1 truncate text-left">搜索资产、Skill 或项目</span>
                <kbd className="ml-1 shrink-0 rounded border border-border px-1.5 text-[10px]">⌘K</kbd>
              </Link>
            </Button>
            <V9ThemeToggle />
            <MarketingMobileMenu />
            <Button asChild size="sm" className="hidden h-10 rounded-[12px] bg-primary px-5 text-[13px] font-bold text-primary-foreground hover:bg-primary min-[561px]:inline-flex">
              <Link href="/workspace">进入工作台 <ArrowRight className="size-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      <section id="home" className="relative min-h-[648px] overflow-hidden px-3 py-16 lg:px-6">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] bg-[size:64px_64px] opacity-80" />
        <div className="relative mx-auto grid max-w-[1232px] items-center gap-7 pt-[14px] lg:grid-cols-[510px_minmax(0,1fr)] lg:gap-[76px] lg:pt-[62px]">
          <div className="relative z-10 lg:pt-[14px]">
            <h1 className="max-w-[510px] text-[44px] font-[670] leading-[1.1] tracking-[-.06em] text-foreground sm:text-[48px] lg:text-[64px]">让设计资产被复用<br />让设计价值被衡量</h1>
            <p className="mt-[23px] max-w-[510px] text-[14px] leading-[1.72] text-muted-foreground md:mt-[30px] md:text-[17px]">汇聚设计资产、AI Skill 与经过验证的实践案例，让团队成员可以更快发现、调用、贡献并衡量设计能力。</p>
            <div className="mt-[34px] flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:gap-3">
              <Button asChild className="h-10 w-full rounded-[12px] bg-primary px-[18px] text-[13px] font-bold text-primary-foreground hover:bg-primary sm:w-auto"><a href="#assets">浏览设计资产 <ArrowRight className="size-4" /></a></Button>
              <Button asChild variant="outline" className="h-10 w-full rounded-[12px] border-border bg-white/[.035] px-[18px] text-[13px] font-bold text-foreground hover:bg-accent hover:text-foreground sm:w-auto"><Link href="/workspace/search"><Search className="size-4" /> 搜索团队能力</Link></Button>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-4 gap-y-2 text-[11px] text-muted-foreground"><span className="rounded-full border border-border bg-white/[.04] px-2.5 py-1">● 内部试运行</span><span>本页数据为原型演示数据</span><span>设计师判断 · AI 辅助执行</span></div>
          </div>
          <div data-card-surface="" className="relative min-h-[520px] overflow-hidden rounded-[24px] border border-border bg-card shadow-2xl shadow-black/40" aria-label="平台工作台预览">
            <div className="flex h-12 items-center border-b border-border px-4 text-[10px] tracking-[.2em] text-muted-foreground"><span className="mr-5 flex gap-1"><i className="size-1.5 rounded-full bg-white/35" /><i className="size-1.5 rounded-full bg-white/35" /><i className="size-1.5 rounded-full bg-white/35" /></span>设计能力工作台 <span className="ml-auto tracking-normal">● 测试运行</span></div>
            <div className="grid min-h-[468px] grid-cols-1 md:grid-cols-[142px_1fr]">
              <aside className="hidden border-r border-border p-4 text-[10px] text-muted-foreground md:block"><div className="mb-7 flex items-center gap-2 font-semibold text-foreground"><span className="grid size-6 place-items-center rounded-md bg-white text-black">P</span>PalmPay UX</div><p className="mb-3 text-[8px] tracking-[.16em]">工作区</p>{['总览','设计资产','AI Skill','案例','','贡献','价值'].map((label) => label ? <p className={`mb-1 rounded-md px-2 py-2 ${label === '总览' ? 'bg-white/[.1] text-foreground' : ''}`} key={label}>▢&nbsp;&nbsp;{label}</p> : <div className="h-5" key="gap" />)}</aside>
              <div className="p-5"><h2 className="text-[16px] font-bold">设计能力总览</h2><p className="mt-1 text-[10px] text-muted-foreground">团队资产、方法与验证实践</p><div className="mt-4 flex h-8 items-center rounded-lg border border-border px-3 text-[10px] text-muted-foreground"><Search className="mr-2 size-3" />搜索资产、Skill 或案例</div><div className="mt-3 grid grid-cols-3 gap-2">{['设计资产|24|已发布','AI Skill|12|已发布','有效复用|86|近 30 天'].map((item) => { const [label,value,meta] = item.split('|'); return <div data-card-surface="" key={label} className="rounded-xl border border-border p-3"><p className="text-[8px] tracking-[.15em] text-muted-foreground">{label}</p><strong className="mt-2 block text-[22px]">{value}</strong><em className="text-[8px] not-italic text-muted-foreground">{meta}</em></div>; })}</div><div className="mt-4 text-[10px] font-semibold">精选内容 <span className="float-right text-muted-foreground">查看全部 →</span></div><div className="mt-2 grid grid-cols-2 gap-2">{['Web 数据表格组件规范','UI 视觉走查 Skill'].map((title, index) => <div data-card-surface="" className="rounded-xl border border-border p-3" key={title}><p className="text-[8px] tracking-[.13em] text-muted-foreground">{index ? 'AI Skill' : '设计资产'}</p><strong className="mt-3 block text-[11px]">{title}</strong><p className="mt-1 text-[8px] text-muted-foreground">统一复杂业务表格的布局、状态与交付标准。</p></div>)}</div><p className="mt-5 text-[10px] font-semibold">复用趋势 <span className="float-right text-muted-foreground">近 12 周</span></p><div className="mt-4 h-px bg-gradient-to-r from-white/10 via-white/80 to-white/10" /></div>
            <div data-card-surface="" className="absolute bottom-1 -right-5 w-60 rounded-2xl border border-border bg-card p-4 shadow-2xl shadow-black/50"><p className="text-[8px] tracking-[.2em] text-muted-foreground">已验证内容覆盖率</p><strong className="mt-2 block text-[13px] leading-5">60% 已发布内容完成验证</strong><div className="mt-3 h-1 rounded-full bg-white/[.09]"><div className="h-full w-3/5 rounded-full bg-primary" /></div></div>
          </div>
          </div>
        </div>
      </section>

      <section id="impact" className="px-5 pb-[34px] pt-0 md:px-6">
        <div data-card-surface="" className="mx-auto grid max-w-[1232px] overflow-hidden rounded-[16px] border border-border bg-white/[.035] sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['设计资产', '统一口径', '24', '当前已发布内容'],
            ['AI Skill', '统一口径', '12', '当前已发布内容'],
            ['AI 案例', '统一口径', '4', '当前已发布实践案例'],
            ['有效复用', '近 30 天', '86', '被真实项目引用并确认'],
          ].map(([label, qualifier, value, description], index) => (
            <div className={`border-border p-[26px] sm:px-7 ${index % 2 === 0 ? 'sm:border-r lg:border-r' : 'sm:border-b lg:border-b-0'} ${index < 2 ? 'sm:border-b' : ''} ${index === 3 ? 'border-0' : 'lg:border-r'}`} key={label}>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground"><span>{label}</span><span>{qualifier}</span></div>
              <strong className="mt-3 block text-[34px] leading-none tracking-[-.055em] text-foreground">{value}</strong>
              <p className="mt-2 text-[10px] text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="skills" className="px-5 py-[58px] md:px-6 md:py-[72px]">
        <div className="mx-auto max-w-[1232px]">
          <div className="mb-10 max-w-[560px]">
            <h2 className="text-[34px] font-semibold tracking-[-.05em] text-foreground md:text-[42px]">高频入口，直达工作台</h2>
            <p className="mt-3 text-[14px] leading-6 text-muted-foreground">三个高频入口，让设计师、产品经理和业务伙伴快速进入正确路径。</p>
          </div>
          <div className="grid gap-[14px] md:grid-cols-3">
            {[
              ['01 / 查找', Search, '找设计资产', '搜索组件、页面模板、规范和交付机制，减少重复设计与沟通成本。', '/workspace/design-assets'],
              ['02 / 使用', Sparkles, '用 AI Skill', '调用经过设计师验证的输入约束、分析维度、输出结构和判断标准。', '/workspace/ai-skills'],
              ['03 / 验证', BarChart3, '看业务影响', '查看设计方法如何被应用、验证与复用，而不只是观看静态作品。', '/workspace/overview'],
            ].map(([index, Icon, title, body, href]) => {
              const PathIcon = Icon as typeof Search;
              return <Link data-card-surface="" key={title as string} href={href as string} className="group relative min-h-[300px] overflow-hidden rounded-[24px] border border-border bg-white/[.035] p-7 transition duration-200 hover:-translate-y-1 hover:border-border hover:bg-accent">
                <span className="absolute -right-14 -top-14 size-[150px] rounded-full border border-border after:absolute after:inset-[25px] after:rounded-full after:border after:border-border" />
                <span className="text-[11px] tracking-[.16em] text-muted-foreground">{index as string}</span>
                <span className="relative mt-[52px] grid size-[50px] place-items-center rounded-[16px] border border-border bg-white/[.06] text-foreground"><PathIcon className="size-5" /></span>
                <h3 className="relative mt-6 text-[24px] font-semibold tracking-[-.035em] text-foreground">{title as string}</h3>
                <p className="relative mt-2 max-w-[320px] text-[13px] leading-6 text-muted-foreground">{body as string}</p>
                <ArrowUpRight className="absolute bottom-6 right-6 size-5 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
              </Link>;
            })}
          </div>
        </div>
      </section>

      <section id="projects" className="px-5 pb-10 pt-[72px] md:px-6 md:pt-[96px]">
        <div className="mx-auto max-w-[1232px]">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="text-[34px] font-semibold tracking-[-.05em] text-foreground md:text-[42px]">33 个 AI 体验设计探索项目</h2>
              <p className="mt-3 text-[14px] leading-6 text-muted-foreground">从设计生产、用户增长到金融风险与组织能力，建立一套可以逐步试点、验证和复制的 AI 项目组合。</p>
            </div>
            <Link className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--text-secondary)] transition hover:text-foreground" href="/workspace/ai-projects">进入 AI 项目库 <ArrowRight className="size-4" /></Link>
          </div>
          <div data-card-surface="" className="grid overflow-hidden rounded-[16px] border border-border bg-white/[.035] sm:grid-cols-2 lg:grid-cols-4">
            {['7|战略与组织', '13|设计生产', '8|增长与运营', '5|风险与治理'].map((item, index) => {
              const [value, label] = item.split('|');
              return <div className={`p-[22px] px-6 ${index !== 3 ? 'border-b border-border lg:border-b-0 lg:border-r' : ''}`} key={label}><strong className="block text-[30px] tracking-[-.05em] text-foreground">{value}</strong><span className="mt-1.5 block text-[10px] text-muted-foreground">{label}</span></div>;
            })}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['S05 · 战略', '90 天执行计划', '通过试点完成基础建设、结果验证、标准化与复制，明确团队如何真正启动。', '组织执行', '/workspace/ai-projects/ai-project-s05?from=home'],
              ['P01 · 设计生产', 'AI 需求分析与体验策略中心', '统一吸收项目上下文，自动生成设计分析、风险识别与体验策略。', '设计生产', '/workspace/ai-projects/ai-project-p01?from=home'],
              ['P08 · 业务增长', 'AI 新用户激活助手', '基于用户状态、未完成任务与目标能力，推荐下一步最有价值的行动。', '业务增长', '/workspace/ai-projects/ai-project-p08?from=home'],
              ['P23 · 风险治理', 'AI 高风险操作体验审计', '审计资金、权限、安全和敏感操作的保护机制、可理解性与可追溯性。', '金融风险', '/workspace/ai-projects/ai-project-p23?from=home'],
            ].map(([code, title, body, category, href]) => <Link data-card-surface="" key={code} href={href!} className="group flex min-h-[260px] flex-col rounded-[16px] border border-border bg-white/[.035] p-[22px] transition hover:-translate-y-1 hover:border-border hover:bg-accent"><div className="flex items-center justify-between text-[9px] tracking-[.1em] text-muted-foreground"><span>{code}</span><ArrowUpRight className="size-3.5" /></div><h3 className="mt-11 text-[18px] font-semibold leading-[1.34] tracking-[-.025em] text-foreground">{title}</h3><p className="mt-2.5 text-[11px] leading-[1.65] text-muted-foreground">{body}</p><div className="mt-auto flex items-center justify-between border-t border-border pt-[18px] text-[9px] text-muted-foreground"><span>{category}</span><span>可立项</span></div></Link>)}
          </div>
          <div className="mt-[18px] flex flex-wrap gap-3"><Button asChild className="h-10 rounded-[12px] bg-primary px-[18px] text-[13px] font-bold text-primary-foreground hover:bg-primary"><Link href="/workspace/ai-projects">进入 AI 项目库 <ArrowRight className="size-4" /></Link></Button><Button asChild variant="outline" className="h-10 rounded-[12px] border-border bg-white/[.035] px-[18px] text-[13px] font-bold text-foreground hover:bg-accent hover:text-foreground"><Link href="/workspace/ai-projects/ai-project-s05?from=home">查看 90 天执行路线</Link></Button></div>
        </div>
      </section>

      <V9MobileSection
        className="px-5 py-20 md:px-6 md:py-24"
        header={<><div className="max-w-[560px]"><h2 className="text-[34px] font-semibold tracking-[-.05em] text-foreground md:text-[42px]">最新设计资产</h2><p className="mt-3 text-[14px] leading-6 text-muted-foreground">将组件、设计规范、品牌、AI 工作流，持续沉淀为固有设计资产。</p></div><Link className="inline-flex items-center gap-2 text-[12px] font-semibold text-[var(--text-secondary)] transition hover:text-foreground" href="/workspace/design-assets">进入完整资产库 <ArrowRight className="size-4" /></Link></>}
        headerClassName="mb-10 flex flex-wrap items-end justify-between gap-6 max-[720px]:flex-col max-[720px]:items-start"
        id="assets"
      >
          <div data-card-surface="" className="mb-[18px] flex flex-wrap items-center gap-[10px] rounded-[16px] border border-border bg-white/[.035] p-3">
            <form action={appPath('/workspace/search')} className="flex h-10 min-w-[260px] flex-1 items-center gap-2 rounded-[12px] border border-border bg-black/20 px-3 text-muted-foreground"><Search className="size-4" /><input aria-label="搜索设计资产" className="min-w-0 flex-1 bg-transparent text-[12px] text-foreground outline-none placeholder:text-muted-foreground" name="q" placeholder="搜索标题、场景或维护团队…" type="search" /></form>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="资产筛选">{['全部', '组件规范', '页面模板', 'AI 工作流', '交付规范'].map((filter, index) => <Link data-card-surface="" className={`h-[34px] rounded-[8px] border px-[11px] text-[10px] font-semibold leading-[32px] transition ${index === 0 ? 'border-border bg-white/[.1] text-foreground' : 'border-transparent text-muted-foreground hover:border-border hover:bg-accent hover:text-foreground'}`} href="/workspace/design-assets" key={filter}>{filter}</Link>)}</div>
          </div>
          <div className="grid gap-[14px] sm:grid-cols-2 lg:grid-cols-4">
            {featuredAssets.map(([chip, category, updated, title, description, team, status, visual]) => <Link data-card-surface="" key={title} href="/workspace/design-assets" className="group overflow-hidden rounded-[16px] border border-border bg-white/[.035] transition hover:-translate-y-1 hover:border-border hover:shadow-2xl hover:shadow-black/20">
              <div className="relative h-44 overflow-hidden border-b border-border bg-black/20 p-[18px]"><span className="inline-flex rounded-full border border-border bg-white/[.035] px-2 py-1 text-[8px] uppercase tracking-[.1em] text-muted-foreground">{chip}</span>
                {visual === 'window' && <div className="absolute bottom-[-12px] left-7 right-7 h-[125px] overflow-hidden rounded-t-[12px] border border-border bg-white/[.035]"><div className="flex h-[23px] items-center gap-1 border-b border-border px-2"><i className="size-1 rounded-full bg-white/30" /><i className="size-1 rounded-full bg-white/30" /><i className="size-1 rounded-full bg-white/30" /></div><div className="grid h-[102px] grid-cols-[30%_1fr]"><div className="border-r border-border p-2"><i className="mb-1.5 block h-1 rounded bg-white/[.13]" /><i className="mb-1.5 block h-1 w-3/4 rounded bg-white/[.13]" /><i className="block h-1 rounded bg-white/[.13]" /></div><div className="p-3"><i className="block h-1.5 w-1/2 rounded bg-white/[.2]" /><i className="mt-3 block h-1 w-full rounded bg-white/[.13]" /><i className="mt-1.5 block h-1 w-4/5 rounded bg-white/[.13]" /><i className="mt-1.5 block h-1 w-[90%] rounded bg-white/[.13]" /></div></div></div>}
                {visual === 'chart' && <svg className="absolute inset-x-5 bottom-4 top-12 text-[var(--text-secondary)]" preserveAspectRatio="none" viewBox="0 0 280 120"><path d="M0,104 C28,91 40,93 65,79 C94,63 110,68 138,49 C165,31 185,41 208,24 C236,4 252,19 280,4" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M0,104 C28,91 40,93 65,79 C94,63 110,68 138,49 C165,31 185,41 208,24 C236,4 252,19 280,4 L280,120 L0,120Z" fill="currentColor" opacity=".06" /></svg>}
                {visual === 'process' && <div className="absolute bottom-5 left-[22px] right-[22px] grid grid-cols-3 gap-2"><i className="h-[58px] rounded-[8px] border border-border bg-white/[.035]" /><i className="h-[58px] -translate-y-2.5 rounded-[8px] border border-border bg-white/[.06]" /><i className="h-[58px] rounded-[8px] border border-border bg-white/[.035]" /></div>}
                {visual === 'checks' && <div className="absolute inset-x-6 bottom-[22px] top-[54px] grid gap-2">{[1, 2, 3].map((number) => <i className="relative rounded-[8px] border border-border bg-white/[.035] before:absolute before:left-2 before:top-2 before:size-2 before:rounded-[3px] before:border before:border-border after:absolute after:left-6 after:top-2.5 after:h-1 after:w-[54%] after:rounded after:bg-white/[.13]" key={number} />)}</div>}
              </div>
              <div className="p-[19px]"><div className="flex items-center justify-between gap-2 text-[9px] text-muted-foreground"><span>{category}</span><span>{updated}</span></div><h3 className="mt-3 text-[16px] font-semibold leading-[1.35] tracking-[-.025em] text-foreground">{title}</h3><p className="mt-2 min-h-[52px] text-[11px] leading-[1.62] text-muted-foreground">{description}</p><div className="mt-[18px] flex items-center justify-between border-t border-border pt-[14px] text-[9px] text-muted-foreground"><span>{team}</span><b className="font-semibold text-[var(--text-secondary)]">{status}</b></div></div>
            </Link>)}
          </div>
      </V9MobileSection>

      <V9MobileSection
        className="px-5 py-[58px] md:px-6 md:py-[72px]"
        header={<div className="max-w-[560px]"><h2 className="text-[34px] font-semibold tracking-[-.05em] text-foreground md:text-[42px]">AI案例-沉淀方法与结果</h2><p className="mt-3 text-[14px] leading-6 text-muted-foreground">用完整案例展示 AI 如何介入、设计师在哪里判断，以及结果如何被验证。</p></div>}
        headerClassName="mb-10 flex flex-wrap items-end justify-between gap-6 max-[720px]:flex-col max-[720px]:items-start"
        id="cases"
      >
          <article data-card-surface="" className="grid overflow-hidden rounded-[24px] border border-border bg-white/[.035] lg:grid-cols-[1.08fr_.92fr]"><div className="border-b border-border bg-black/20 p-6 lg:border-b-0 lg:border-r lg:p-9"><div className="mb-7 flex items-center justify-between text-[9px] tracking-[.13em] text-muted-foreground"><span>前后对比</span><Badge variant="outline" className="border-border bg-white/[.04] text-[9px] text-[var(--text-secondary)]">已验证案例</Badge></div><div className="grid items-center gap-4 md:grid-cols-[1fr_36px_1fr]"><div data-card-surface="" className="rounded-2xl border border-border bg-white/[.035] p-4"><div className="flex justify-between text-[8px] text-muted-foreground"><span>传统流程</span><span>3 天</span></div><div data-card-surface="" className="mt-3 h-[205px] rounded-[12px] border border-border bg-black/20 p-3"><i className="mb-3 block h-[18px] border-b border-border" /><div className="grid grid-cols-2 gap-2"><i className="h-[67px] rounded-[8px] border border-border bg-white/[.035]" /><i className="h-[67px] rounded-[8px] border border-border bg-white/[.035]" /><i className="col-span-2 h-12 rounded-[8px] border border-border bg-white/[.035]" /></div></div></div><ArrowRight className="mx-auto size-5 text-muted-foreground" /><div data-card-surface="" className="rounded-2xl border border-border bg-white/[.035] p-4"><div className="flex justify-between text-[8px] text-muted-foreground"><span>AI 协同流程</span><span>4 小时</span></div><div data-card-surface="" className="mt-3 grid h-[205px] grid-cols-[40px_1fr] overflow-hidden rounded-[12px] border border-border bg-black/20"><div className="border-r border-border p-2">{[1,2,3,4].map((item) => <i className="my-2 block h-1.5 rounded bg-white/[.13]" key={item} />)}</div><div className="p-3"><i className="mb-3 block h-2 w-[45%] rounded bg-white/[.18]" /><div className="grid grid-cols-2 gap-2">{[1,2,3,4].map((item) => <i className="h-14 rounded-[8px] border border-border bg-white/[.035]" key={item} />)}</div></div></div></div></div></div><div className="p-7 md:p-[42px]"><Badge variant="outline" className="border-border bg-white/[.04] text-[10px] text-[var(--text-secondary)]">效率提升 · AI 精选</Badge><h3 className="mt-[18px] text-[34px] font-semibold leading-[1.12] tracking-[-.045em] text-foreground">营销活动视觉探索</h3><p className="mt-3 text-[13px] leading-[1.75] text-muted-foreground">AI 不直接替代设计判断，而是加速参考图整理、方向扩散和方案初筛；设计师负责定义边界、选择方向并形成可复用方法。</p><div className="my-7 grid gap-3">{[['01','定义输入边界','设计师确定品牌资产、参考风格和不可突破的约束。'],['02','AI 扩散与聚类','快速生成方向并按视觉语言、场景和风险进行归类。'],['03','人工筛选与沉淀','设计师完成最终选择，并把有效路径保存为下一次可调用的 Skill。']].map(([number,title,body]) => <div className="grid grid-cols-[28px_1fr] gap-3" key={number}><span className="grid size-7 place-items-center rounded-lg border border-border bg-white/[.04] text-[9px] text-muted-foreground">{number}</span><div><b className="block text-[11px] text-foreground">{title}</b><p className="mt-0.5 text-[10px] text-muted-foreground">{body}</p></div></div>)}</div><div className="grid grid-cols-3 gap-4 border-t border-border pt-[23px]">{[['3 天 → 4 小时','首轮视觉探索'],['12','验证方向数量'],['1 个 Skill','已沉淀为工作流']].map(([value,label]) => <div key={label}><strong className="block text-[22px] tracking-[-.04em] text-foreground">{value}</strong><span className="mt-1 block text-[8px] text-muted-foreground">{label}</span></div>)}</div></div></article>
      </V9MobileSection>

      <V9MobileSection
        className="px-5 py-[58px] md:px-6 md:py-[72px]"
        header={<div><h2 className="text-[34px] font-semibold tracking-[-.05em] text-foreground md:text-[42px]">从设计系统到平台机制</h2><p className="mt-3 text-[14px] leading-6 text-muted-foreground">用三个角色形成从标准、创新到质量闭环，避免资产只上传、不维护、不复用。</p></div>}
        headerClassName="mb-10 flex flex-wrap items-end justify-between gap-6 max-[720px]:flex-col max-[720px]:items-start"
        id="governance"
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_76px_1fr_76px_1fr] lg:gap-0">{[['01 / 标准化','设计系统','负责组件、模式、Token 与跨业务体验标准。','标准建立 · 资产维护 · 版本治理'],['02 / 探索','AI 设计','将实验性的 AI 产出转化为可调用、可验证的方法。','Skill 设计 · 方法验证 · 案例沉淀'],['03 / 运营','设计运营','维护内容发布、复用反馈和影响力数据。','质量维护 · 内容运营 · 价值度量']].flatMap(([index,title,body,footer], position) => [<article data-card-surface="" className="relative min-h-[210px] rounded-[16px] border border-border bg-white/[.035] p-[27px]" key={title}><span className="text-[10px] tracking-[.14em] text-muted-foreground">{index}</span><h3 className="mt-[50px] text-[21px] font-semibold tracking-[-.03em] text-foreground">{title}</h3><p className="mt-2 text-[11px] text-muted-foreground">{body}</p><footer className="absolute bottom-[22px] left-[27px] right-[27px] border-t border-border pt-3 text-[9px] text-muted-foreground">{footer}</footer></article>, position < 2 ? <div aria-hidden="true" className="hidden place-items-center lg:grid" key={`${title}-connector`}><span className="relative h-px w-full bg-white/[.16] after:absolute after:-right-px after:-top-[3px] after:size-[6px] after:rotate-45 after:border-r after:border-t after:border-border" /></div> : null])}</div>
      </V9MobileSection>

      <section className="px-5 py-20 md:px-6"><div data-card-surface="" className="relative mx-auto flex max-w-[1232px] flex-col justify-between gap-9 overflow-hidden rounded-[24px] border border-border bg-white/[.035] p-8 md:flex-row md:items-center md:p-[54px]"><span className="absolute -right-20 -top-[120px] size-[320px] rounded-full border border-border shadow-[0_0_0_40px_rgba(255,255,255,.035)]" /><div className="relative z-10 max-w-[720px]"><h2 className="text-[32px] font-semibold leading-[1.08] tracking-[-.05em] text-foreground md:text-[54px]">把一次优秀产出，变成团队下一次工作的起点</h2><p className="mt-4 text-[13px] text-muted-foreground">本版本用于验证首页信息架构、品牌表达与核心入口，不包含真实权限和后台数据。</p></div><Button asChild className="relative z-10 h-10 min-w-[154px] rounded-[12px] bg-primary px-[18px] text-[13px] font-bold text-primary-foreground hover:bg-primary"><Link href="/workspace">进入工作台 <ArrowRight className="size-4" /></Link></Button></div></section>

      <footer className="border-t border-border px-5 py-[38px] md:px-6"><div className="mx-auto flex max-w-[1232px] flex-col justify-between gap-7 text-[9px] text-muted-foreground md:flex-row md:items-center"><Link href="#home" className="flex items-center gap-3 text-foreground"><Image src={appPath('/brand/palmpay-logo.svg')} alt="PalmPay 标志" className="size-7 object-contain" height={28} width={28} /><span className="text-[12px] font-semibold">PalmPay Design</span></Link><div className="flex gap-[18px]"><span>演示数据</span><span>支持深色与浅色主题</span><span>正式工作台已启用</span></div></div></footer>
    </main>
  );
}
