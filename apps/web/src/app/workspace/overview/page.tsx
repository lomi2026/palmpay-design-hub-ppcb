import { CachedWorkspacePage } from '@/components/workspace/navigation-cache';
import { DashboardMotion, AnimatedNumber } from '@/components/workspace/dashboard-motion';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { CardDetailLink } from '@/components/workspace/card-detail-link';
import { redirect } from 'next/navigation';
import { ArrowRight, BookOpenCheck, ChartNoAxesCombined, Heart, Lightbulb, MousePointer2, UsersRound } from 'lucide-react';

import { authenticatedApiHeaders, loadCurrentUser } from '@/lib/auth';
import { serverApiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';

type Overview = {
  periodDays: number;
  publishedAssets: number;
  publishedTools: number;
  publishedProjects: number;
  publishedSkills: number;
  publishedCases: number;
  effectiveUsage30d: number;
  projectReferences30d: number;
  activeUsers30d: number;
  contributors: number;
  casesWithValidationRecords: number;
  favorites: number;
};

const contentMetrics: Array<[keyof Overview, string, string, string]> = [
  ['publishedAssets', '设计资产', '被治理并进入正式目录', '/workspace/design-assets'],
  ['publishedTools', 'AI 工具', '支持设计工作流的工具', '/workspace/ai-tools'],
  ['publishedSkills', 'AI Skill', '可复用的工作方法', '/workspace/ai-skills'],
  ['publishedProjects', 'AI 项目库', '围绕团队能力的探索项目', '/workspace/ai-projects'],
  ['publishedCases', 'AI 案例', '含人工判断与验证依据', '/workspace/ai-cases'],
];

async function OverviewPage() {
  const user = await loadCurrentUser();
  if (!user?.permissions.includes('analytics.read')) redirect('/unauthorized');
  const overview = await serverApiFetch<Overview>('/api/analytics/overview', {
    headers: await authenticatedApiHeaders(),
  });
  const evidenceMetrics = [
    [MousePointer2, '有效使用', overview.effectiveUsage30d, '近 30 天被确认的使用行为', '/workspace/insights#core-behavior'],
    [Lightbulb, '项目引用', overview.projectReferences30d, '探索项目对内容的正式引用', '/workspace/ai-projects'],
    [UsersRound, '活跃成员', overview.activeUsers30d, '近 30 天产生行为的成员', user.permissions.includes('user.manage') ? '/workspace/admin?tab=users' : '/workspace/insights#core-behavior'],
    [Heart, '累计收藏', overview.favorites, '跨设备同步的个人保存', '/workspace/favorites'],
  ] as const;

  return (
    <DashboardMotion className="mx-auto min-h-full w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section data-card-surface="" className="workspace-page-card relative overflow-hidden rounded-[24px] border border-white/[.12] bg-[#111112] px-6 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-11">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:48px_48px] opacity-45" />
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_410px] xl:items-stretch">
          <div className="flex flex-col items-start xl:pt-6">

            <h1 className="mt-3 max-w-3xl text-[34px] font-semibold leading-[1.08] tracking-[-.055em] text-white sm:text-[46px]">价值总览</h1>
            <p className="mt-4 max-w-2xl text-[14px] leading-7 text-white/55">让设计资产被复用，让设计价值被衡量。从内容积累、实际使用到项目引用，了解团队设计能力带来的价值。汇集设计资产、AI 工具、Skill 与实践案例，帮助团队找到可复用的方法，将已有经验应用到新的业务问题中。结合使用确认、项目关联与案例验证记录，持续观察内容如何支持设计协作，为后续的资产完善、能力建设与项目探索提供依据。</p>
            <div className="mt-auto pt-6"><Button asChild><Link prefetch={false} href="/workspace/ai-projects">查看 AI 项目库 <ChartNoAxesCombined className="size-4" /></Link></Button></div>
          </div>
          <div data-clickable-card="" data-card-surface="" className="relative isolate rounded-[16px] border border-white/[.12] bg-black/[.24] p-6">
            <CardDetailLink href="/workspace/insights#core-behavior" title="核心复用证据" /><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-white/45">核心复用证据</p>
            <strong className="mt-3 block text-[52px] font-semibold leading-none tracking-[-.07em] text-white"><AnimatedNumber id="usage" value={overview.effectiveUsage30d} /></strong>
            <p className="mt-2 text-[13px] text-white/55">近 {overview.periodDays} 天有效使用</p>
            <div className="mt-6 h-px bg-white/[.12]" />
            <p className="mt-4 text-[12px] leading-5 text-white/45">使用确认不是浏览或收藏；仅在成员明确记录了实际复用后计入该指标。</p>
          </div>
        </div>
      </section>

      <section className="content-metric-cards mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {contentMetrics.map(([key, label, detail, href]) => (
          <article data-clickable-card="" data-card-surface="" className="relative isolate rounded-[16px] border border-white/[.1] bg-white/[.03] p-6" key={key}>
            <CardDetailLink href={href} title={label} /><p className="text-[11px] font-semibold tracking-[.1em] text-white/45">{label}</p>
            <strong className="mt-6 block text-[42px] font-semibold leading-none tracking-[-.06em] text-white"><AnimatedNumber id={key} value={overview[key]} /></strong>
            <p className="mt-3 text-[12px] text-white/48">{detail}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,.8fr)]">
        <div data-card-surface="" className="rounded-[24px] border border-white/[.1] bg-[#111112] p-6 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4"><div><h2 className="text-[25px] font-semibold tracking-[-.04em] text-white">从目录到真实使用</h2></div><Button asChild className="border-white/[.14] bg-transparent text-white hover:bg-white/[.07] hover:text-white" size="md" variant="outline"><Link prefetch={false} href="/workspace/insights">查看数据洞察 <ArrowRight className="size-3.5" /></Link></Button></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {evidenceMetrics.map(([Icon, label, value, detail, href]) => <article data-clickable-card="" data-card-surface="" className="relative isolate rounded-[16px] border border-white/[.1] bg-white/[.025] p-4" key={label}><CardDetailLink href={href} title={label} /><Icon className="size-4 text-white/70" /><strong className="mt-6 block text-[30px] font-semibold leading-none tracking-[-.05em] text-white"><AnimatedNumber id={label} value={value} /></strong><p className="mt-2 text-[13px] font-medium text-white">{label}</p><p className="mt-1 text-[11px] leading-5 text-white/45">{detail}</p></article>)}
          </div>
        </div>
        <aside data-clickable-card="" data-card-surface="" className="relative isolate flex flex-col justify-between rounded-[24px] border border-[var(--v9-line-strong)] bg-card p-6 text-[var(--v9-text)] sm:p-6">
          <div>
            <CardDetailLink href="/workspace/ai-cases" title="案例验证记录覆盖" /><BookOpenCheck className="size-5 text-[var(--v9-muted)]" />
            <h2 className="mt-8 text-[30px] font-semibold leading-[1.08] tracking-[-.05em]">案例验证记录覆盖</h2>
            <p className="mt-4 text-[13px] leading-6 text-[var(--v9-copy)]">统计当前组织已发布且未删除的 AI 案例。正式版本同时填写“验证方式”和“数据结果”即计入，不代表结果已经过独立核实。</p>
            <p className="mt-3 text-xs text-[var(--v9-subtle)]">累计数据 · 不限近 30 天</p>
          </div>
          <div className="mt-8">
            <div className="flex items-center justify-between gap-3 text-[12px]">
              <span>有验证记录 / 全部已发布案例</span>
              <strong>{overview.casesWithValidationRecords} / {overview.publishedCases}</strong>
            </div>
            <div role="progressbar" aria-label="已发布案例验证记录覆盖率" aria-valuemin={0} aria-valuemax={100} aria-valuenow={overview.publishedCases ? Math.round(overview.casesWithValidationRecords / overview.publishedCases * 100) : 0} className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--v9-soft-hover)]">
              <div className="h-full rounded-full bg-[var(--v9-muted)]" style={{ width: `${overview.publishedCases ? Math.min(100, overview.casesWithValidationRecords / overview.publishedCases * 100) : 0}%` }} />
            </div>
            {!overview.publishedCases ? <p className="mt-2 text-xs text-[var(--v9-subtle)]">暂无已发布案例</p> : null}
            <div className="mt-6 border-t border-[var(--v9-line)] pt-5">
              <div className="flex items-center justify-between text-[12px]"><span>累计内容贡献者</span><strong>{overview.contributors} 人</strong></div>
              <p className="mt-2 text-xs leading-5 text-[var(--v9-subtle)]">所有未删除内容的创建者，按账号去重，包含草稿。</p>
            </div>
          </div>
        </aside>
      </section>


    </DashboardMotion>
  );
}

export default async function CachedPage() {
  return <CachedWorkspacePage>{await OverviewPage()}</CachedWorkspacePage>;
}
