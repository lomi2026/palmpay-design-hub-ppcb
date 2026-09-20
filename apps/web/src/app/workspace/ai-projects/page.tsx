import { CachedWorkspacePage, WorkspaceResults } from '@/components/workspace/navigation-cache';
import { CatalogPageHeader } from '@/components/workspace/catalog-page-header';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { ArrowRight } from 'lucide-react';
import { serverApiFetch } from '@/lib/api';
import { authenticatedApiHeaders, loadCurrentUser } from '@/lib/auth';
import type { AIProjectCard } from '@/lib/ai-projects';
import type { ContentListResponse } from '@/lib/content-types';
import { AIProjectPortfolio } from '@/components/workspace/ai-project-portfolio';
import { CatalogFilterControls } from '@/components/workspace/catalog-filter-controls';

type AIProjectListResponse = Omit<ContentListResponse, 'items'> & { items: AIProjectCard[] };

async function AIProjectsPage({ searchParams }: { searchParams: Promise<{ search?: string; categoryId?: string; tag?: string; verificationStatus?: string }> }) {
  const { search = '', categoryId, tag } = await searchParams;
  const filters = { search: search.trim() || undefined, categoryId, tag };
  const currentUser = await loadCurrentUser();
  const canCreate = currentUser?.permissions.includes('content.create') ?? false;
  const query = new URLSearchParams({ type: 'AI_PROJECT', pageSize: '100' });
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  const baseQuery = new URLSearchParams({ type: 'AI_PROJECT', pageSize: '100' });
  const [projects, filterSource] = await Promise.all([
    serverApiFetch<AIProjectListResponse>(`/api/contents?${query}`, { headers: await authenticatedApiHeaders() }),
    serverApiFetch<AIProjectListResponse>(`/api/contents?${baseQuery}`, { headers: await authenticatedApiHeaders() }),
  ]);

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 md:py-10">
      <CatalogPageHeader title="AI 项目库" description="围绕设计生产、增长运营、风险治理与组织能力沉淀的探索项目。项目状态与优先级需在真实试点中验证。" count={`${projects.total} 个已发布项目`} createHref={canCreate ? '/workspace/submit?type=AI_PROJECT' : undefined} createLabel="新增项目" />
      <CatalogFilterControls contents={filterSource.items} filters={filters} pathname="/workspace/ai-projects" searchPlaceholder="搜索项目编号、名称或摘要" />
      <WorkspaceResults>
      {projects.items.length ? (
        <AIProjectPortfolio projects={projects.items} />
      ) : <section className="mt-6 rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-16 text-center"><h2 className="text-base font-medium text-white">没有找到可访问的 AI 项目</h2><p className="mt-2 text-sm text-white/45">{search ? '请尝试缩短关键词或清除搜索条件。' : '项目发布后会显示在这里。'}</p></section>}
      </WorkspaceResults>
    </main>
  );
}

export default async function CachedPage(props: Parameters<typeof AIProjectsPage>[0]) {
  return <CachedWorkspacePage>{await AIProjectsPage(props)}</CachedWorkspacePage>;
}
