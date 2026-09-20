import { ContentViewCount } from '@/components/workspace/content-view-count';
import { CatalogViewSwitch } from '@/components/workspace/catalog-view-switch';
import { KnowledgeList } from '@/components/workspace/knowledge-list';
import { CachedWorkspacePage, WorkspaceResults } from '@/components/workspace/navigation-cache';
import { FavoriteControl } from '@/components/workspace/engagement-controls';
import { CardDetailLink } from '@/components/workspace/card-detail-link';
import { ArrowRight } from 'lucide-react';
import { serverApiFetch } from '@/lib/api';
import { authenticatedApiHeaders, loadCurrentUser } from '@/lib/auth';
import type { ContentCard, ContentListResponse } from '@/lib/content-types';
import { CatalogPageHeader } from '@/components/workspace/catalog-page-header';
import { CatalogFilterControls } from '@/components/workspace/catalog-filter-controls';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspaceEmptyState } from '@/components/workspace/workspace-empty-state';

type CaseCard = ContentCard & { caseDetail?: { metricName: string | null } | null };
type CaseListResponse = Omit<ContentListResponse, 'items'> & { items: CaseCard[] };

async function AICasesPage({ searchParams }: { searchParams: Promise<{ search?: string; categoryId?: string; tag?: string; verificationStatus?: string; view?: string }> }) {
  const { search = '', categoryId, tag, view: requestedView } = await searchParams;
  const view = requestedView === 'list' ? 'list' : 'grid';
  const canCreate = (await loadCurrentUser())?.permissions.includes('content.create') ?? false;
  const filters = { search: search.trim() || undefined, categoryId, tag };
  const query = new URLSearchParams({ type: 'AI_CASE', pageSize: '100' });
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  const baseQuery = new URLSearchParams({ type: 'AI_CASE', pageSize: '100' });
  const [cases, filterSource] = await Promise.all([
    serverApiFetch<CaseListResponse>(`/api/contents?${query}`, { headers: await authenticatedApiHeaders() }),
    serverApiFetch<CaseListResponse>(`/api/contents?${baseQuery}`, { headers: await authenticatedApiHeaders() }),
  ]);
  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 md:py-10">
      <CatalogPageHeader createHref={canCreate ? "/workspace/submit?type=AI_CASE" : undefined} createLabel="新增案例" eyebrow="PRACTICE EVIDENCE" title="AI 案例" description="记录 AI 辅助设计实践中的输入、人工职责、验证方式与已观察到的结果。" search={search} searchId="case-search" searchPlaceholder="搜索案例名称或摘要" count={`${cases.total} 个已发布案例`} filterParams={{ categoryId, tag }} />
      <WorkspaceResults>
      <CatalogFilterControls contents={filterSource.items} filters={filters} extraControls={<CatalogViewSwitch pathname="/workspace/ai-cases" view={view} filters={filters} />} pathname="/workspace/ai-cases" searchPlaceholder="搜索案例名称或摘要" />
      {cases.items.length ? (view === 'list' ? <KnowledgeList items={cases.items} pathname="/workspace/ai-cases" /> : <section className="mt-6 grid gap-4 md:grid-cols-2">{cases.items.map((item) => <Card key={item.id} className="group relative isolate min-h-56 border border-[var(--v9-line)] bg-[var(--v9-panel)] py-5 shadow-none transition"><CardDetailLink href={`/workspace/ai-cases/${item.slug}`} title={item.title} /><CardHeader><div className="relative z-20 inline-flex w-fit"><FavoriteControl contentId={item.id} returnTo="/workspace/ai-cases" /></div><CardTitle className="mt-4 text-[19px] leading-7 text-[var(--v9-text)]"><span className="transition">{item.title}</span></CardTitle><p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--v9-copy)]">{item.summary ?? '暂无说明'}</p></CardHeader>{item.caseDetail?.metricName ? <CardContent className="mt-auto"><div className="border-t border-[var(--v9-line)] pt-4 text-sm text-[var(--v9-muted)]"><span className="mr-2 text-[10px] tracking-[.12em] text-[var(--v9-subtle)]">观察指标</span>{item.caseDetail?.metricName ?? '指标待验证'}</div></CardContent> : null}<CardFooter className="catalog-card-footer justify-between border-0 bg-transparent px-5 pb-5"><div className="catalog-card-byline"><span className="text-xs text-[var(--v9-subtle)]">发布者 · {item.owner.name}</span><ContentViewCount count={item.viewCount} /></div><span className="inline-flex items-center gap-1 text-sm text-[var(--v9-copy)] transition">查看详情 <ArrowRight className="size-4" /></span></CardFooter></Card>)}</section>) : <WorkspaceEmptyState className="mt-6 py-16 text-center">没有找到可访问的 AI 案例。</WorkspaceEmptyState>}
      </WorkspaceResults>
    </main>
  );
}

export default async function CachedPage(props: Parameters<typeof AICasesPage>[0]) {
  return <CachedWorkspacePage>{await AICasesPage(props)}</CachedWorkspacePage>;
}
