import { CachedWorkspacePage } from '@/components/workspace/navigation-cache';
import { DashboardMotion, AnimatedNumber } from '@/components/workspace/dashboard-motion';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { CardDetailLink } from '@/components/workspace/card-detail-link';
import { redirect } from 'next/navigation';
import { ArrowDownRight, ArrowUpRight, BarChart3, SearchX } from 'lucide-react';

import { authenticatedApiHeaders, loadCurrentUser } from '@/lib/auth';
import { serverApiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { workspaceStatus, type WorkspaceStatusTone } from '@/lib/workspace-status';
import { contentTypeLabel } from '@/lib/content-types';

type Insights = {
  periodDays: number;
  contentStatus: Array<{ status: string; _count: number }>;
  typeDistribution: Array<{ contentType: string; _count: number }>;
  topSearches: Array<{ keyword: string; count: number }>;
  noResultSearches: Array<{ keyword: string; count: number }>;
  eventCounts: Array<{ eventType: string; count: number }>;
  staleContent: Array<{ id: string; title: string; updatedAt: string; contentType: string }>;
};

const contentStatusLabels: Record<string, string> = { DRAFT: '草稿', PUBLISHED: '已发布', UNPUBLISHED: '已下架', ARCHIVED: '已归档' };
const eventLabels: Record<string, string> = {
  VIEW: '浏览详情',
  FAVORITE: '收藏内容',
  USE_CONFIRMED: '确认使用',
  PROJECT_REFERENCE: '项目引用',
  SEARCH: '全局搜索',
  content_create: '创建内容',
  content_submit: '发布',
  content_view: '浏览详情',
  favorite_add: '收藏内容',
  favorite_remove: '取消收藏',
  file_download: '下载附件',
  content_share: '分享内容',
  usage_confirmed: '确认使用',
  project_referenced: '项目引用',
  search_submit: '全局搜索',
};
const contentTypeTones: Record<string, WorkspaceStatusTone> = { DESIGN_ASSET: 'info', AI_SKILL: 'accent', AI_CASE: 'success', AI_PROJECT: 'warning' };
const eventTones: Record<string, WorkspaceStatusTone> = { VIEW: 'neutral', FAVORITE: 'accent', USE_CONFIRMED: 'success', PROJECT_REFERENCE: 'warning', SEARCH: 'info', content_create: 'accent', content_submit: 'info', content_view: 'neutral', favorite_add: 'accent', file_download: 'info', content_share: 'neutral', usage_confirmed: 'success', project_referenced: 'warning', search_submit: 'info' };

function MetricList({
  title,
  href,
  id,
  rowHref,
  items,
  label,
  tone = () => 'neutral',
}: {
  title: string;
  href: string;
  id?: string;
  rowHref?: (key: string) => string;
  items: Array<{ key: string; count: number }>;
  label: (key: string) => string;
  tone?: (key: string) => WorkspaceStatusTone;
}) {
  const maximum = Math.max(1, ...items.map((item) => item.count));
  return (
    <section id={id} data-clickable-card="" data-card-surface="" className="relative isolate scroll-mt-28 rounded-[16px] border border-white/[.1] bg-[#111112] p-6 sm:p-6">
      <CardDetailLink href={href} title={title} /><h2 className="text-[20px] font-semibold tracking-[-.035em] text-white">{title}</h2>
      <div className="mt-6 space-y-4">
        {items.length ? items.map((item) => <div key={item.key}><div className="flex items-center justify-between gap-3 text-[12px]"><span className="truncate text-white/62">{rowHref ? <Link className="relative z-20 hover:underline" href={rowHref(item.key)} prefetch={false}>{label(item.key)}</Link> : label(item.key)}</span><strong className="shrink-0 text-white">{item.count}</strong></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[.09]"><div className="h-full rounded-full" style={{ backgroundColor: `var(--v9-status-${tone(item.key)}-text)`, width: `${Math.max(8, (item.count / maximum) * 100)}%` }} /></div></div>) : <p className="rounded-xl border border-dashed border-white/[.12] px-4 py-5 text-[12px] text-white/45">统计周期内暂无数据。</p>}
      </div>
    </section>
  );
}

async function InsightsPage() {
  const user = await loadCurrentUser();
  if (!user?.permissions.includes('analytics.read')) redirect('/unauthorized');
  const insights = await serverApiFetch<Insights>('/api/analytics/insights', {
    headers: await authenticatedApiHeaders(),
  });
  const noResultTotal = insights.noResultSearches.reduce((sum, item) => sum + item.count, 0);
  const topSearchTotal = insights.topSearches.reduce((sum, item) => sum + item.count, 0);
  const contentTotal = insights.typeDistribution.reduce((sum, item) => sum + item._count, 0);

  const contentHref = user.permissions.includes('content.edit_all') ? '/workspace/admin?tab=content' : '/workspace/search';

  return (
    <DashboardMotion className="mx-auto min-h-full w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section data-card-surface="" className="workspace-page-card flex flex-col justify-between gap-6 rounded-3xl bg-card p-6 md:flex-row md:items-end">
        <div><h1 className="mt-3 text-[34px] font-semibold tracking-[-.055em] text-white sm:text-[44px]">数据洞察</h1><p className="mt-3 max-w-3xl text-sm leading-7 text-white/55">从内容分布、搜索需求和使用行为中发现团队需要的能力，为设计资产与 AI 实践的持续完善提供依据。</p></div>
        <Badge className="h-7 w-fit rounded-full border-white/[.12] bg-white/[.035] px-3 text-[11px] text-white/65" variant="outline">正式行为事件 · {insights.periodDays} 天</Badge>
      </section>

      <section className="content-metric-cards mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article data-clickable-card="" data-card-surface="" className="relative isolate rounded-[16px] border border-white/[.1] bg-white/[.03] p-6"><CardDetailLink href={contentHref} title="正式目录内容" /><span className="grid size-9 place-items-center rounded-xl bg-white/[.06]"><BarChart3 className="size-4 text-white/70" /></span><strong className="mt-6 block text-[37px] font-semibold leading-none tracking-[-.06em] text-white"><AnimatedNumber id="contentTotal" value={contentTotal} /></strong><p className="mt-2 text-[13px] font-medium text-white">正式目录内容</p><p className="mt-1 text-[11px] text-white/45">按当前内容类型分布汇总</p></article>
        <article data-clickable-card="" data-card-surface="" className="relative isolate rounded-[16px] border border-white/[.1] bg-white/[.03] p-6"><CardDetailLink href="#top-searches" title="有效搜索信号" /><span className="grid size-9 place-items-center rounded-xl bg-white/[.06]"><ArrowUpRight className="size-4 text-white/70" /></span><strong className="mt-6 block text-[37px] font-semibold leading-none tracking-[-.06em] text-white"><AnimatedNumber id="topSearchTotal" value={topSearchTotal} /></strong><p className="mt-2 text-[13px] font-medium text-white">有效搜索信号</p><p className="mt-1 text-[11px] text-white/45">可用于发现高频能力需求</p></article>
        <article data-clickable-card="" data-card-surface="" className="relative isolate rounded-[16px] border border-white/[.1] bg-white/[.03] p-6"><CardDetailLink href="#no-result-searches" title="无结果搜索" /><span className="grid size-9 place-items-center rounded-xl bg-white/[.06]"><SearchX className="size-4 text-white/70" /></span><strong className="mt-6 block text-[37px] font-semibold leading-none tracking-[-.06em] text-white"><AnimatedNumber id="noResultTotal" value={noResultTotal} /></strong><p className="mt-2 text-[13px] font-medium text-white">无结果搜索</p><p className="mt-1 text-[11px] text-white/45">提示目录和标签可能存在缺口</p></article>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <MetricList href={contentHref} items={insights.contentStatus.map((item) => ({ key: item.status, count: item._count }))} label={(key) => contentStatusLabels[key] ?? key} title="内容状态分布" tone={(key) => workspaceStatus(key).tone} />
        <MetricList rowHref={(key) => `/workspace/${({ DESIGN_ASSET: 'design-assets', AI_TOOL: 'ai-tools', AI_SKILL: 'ai-skills', AI_CASE: 'ai-cases', AI_PROJECT: 'ai-projects' } as Record<string, string>)[key] ?? 'search'}`} href="/workspace/search" items={insights.typeDistribution.map((item) => ({ key: item.contentType, count: item._count }))} label={contentTypeLabel} title="内容类型覆盖" tone={(key) => contentTypeTones[key] ?? 'neutral'} />
        <MetricList rowHref={(key) => `/workspace/search?q=${encodeURIComponent(key)}`} id="top-searches" href="/workspace/search" items={insights.topSearches.map((item) => ({ key: item.keyword, count: item.count }))} label={(key) => key} title="团队最常搜索什么" />
        <MetricList rowHref={(key) => /favorite|FAVORITE/.test(key) ? '/workspace/favorites' : /project|PROJECT/.test(key) ? '/workspace/ai-projects' : /view|VIEW/.test(key) ? '/workspace/favorites?tab=recent' : /usage|USE/.test(key) ? '/workspace/usage' : '/workspace/search'} id="core-behavior" href="/workspace/favorites" items={insights.eventCounts.map((item) => ({ key: item.eventType, count: item.count }))} label={(key) => eventLabels[key] ?? key} title="核心行为信号" tone={(key) => eventTones[key] ?? 'neutral'} />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,.95fr)]">
        <section id="no-result-searches" data-clickable-card="" data-card-surface="" className="relative isolate scroll-mt-28 rounded-[24px] border border-white/[.1] bg-[#111112] p-6 sm:p-6"><div className="flex items-start gap-3"><CardDetailLink href="/workspace/search" title="搜索内容" /><SearchX className="mt-0.5 size-4 shrink-0 text-white/70" /><div><h2 className="text-[21px] font-semibold tracking-[-.035em] text-white">用户想找、但当前没有命中的能力</h2></div></div>{insights.noResultSearches.length ? <ul className="mt-6 divide-y divide-white/[.1] border-y border-white/[.1]">{insights.noResultSearches.map((item) => <li className="flex items-center justify-between gap-4 py-3.5 text-[13px]" key={item.keyword}><Link className="relative z-20 text-white/70 hover:underline" href={`/workspace/search?q=${encodeURIComponent(item.keyword)}`} prefetch={false}>{item.keyword}</Link><Badge className="rounded-full border-white/[.12] bg-white/[.035] text-[10px] text-white/65" variant="outline">{item.count} 次</Badge></li>)}</ul> : <p className="mt-6 rounded-xl border border-dashed border-white/[.12] px-4 py-5 text-[12px] text-white/45">当前周期内没有记录到无结果搜索。</p>}</section>
      </section>

      <section data-clickable-card="" data-card-surface="" className="relative isolate mt-6 rounded-[24px] border border-white/[.1] bg-[#111112] p-6 sm:p-6"><CardDetailLink href={contentHref} title="管理长期未更新内容" /><h2 className="text-[21px] font-semibold tracking-[-.035em] text-white">长期未更新内容</h2>{insights.staleContent.length ? <ul className="mt-6 divide-y divide-white/[.1] border-y border-white/[.1]">{insights.staleContent.map((item) => <li className="flex flex-col justify-between gap-2 py-3.5 text-[13px] sm:flex-row sm:items-center" key={item.id}><div><Link className="relative z-20 font-medium text-white hover:underline" href={`/workspace/search?q=${encodeURIComponent(item.title)}`} prefetch={false}>{item.title}</Link><span className="ml-2 text-[11px] text-white/45">{contentTypeLabel(item.contentType)}</span></div><time className="text-[11px] text-white/45">最后更新：{new Intl.DateTimeFormat('zh-CN').format(new Date(item.updatedAt))}</time></li>)}</ul> : <p className="mt-6 rounded-xl border border-dashed border-white/[.12] px-4 py-5 text-[12px] text-white/45">暂无需要关注的长期未更新内容。</p>}</section>
    </DashboardMotion>
  );
}

export default async function CachedPage() {
  return <CachedWorkspacePage>{await InsightsPage()}</CachedWorkspacePage>;
}
