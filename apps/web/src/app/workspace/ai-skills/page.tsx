import { ContentViewCount } from '@/components/workspace/content-view-count';
import { CatalogViewSwitch } from '@/components/workspace/catalog-view-switch';
import { KnowledgeList } from '@/components/workspace/knowledge-list';
import { CachedWorkspacePage, WorkspaceResults } from '@/components/workspace/navigation-cache';
import { CardDetailLink } from '@/components/workspace/card-detail-link';
import { FavoriteControl } from '@/components/workspace/engagement-controls';
import { ArrowRight } from 'lucide-react';
import { serverApiFetch } from '@/lib/api';
import { authenticatedApiHeaders, loadCurrentUser } from '@/lib/auth';
import type { ContentCard, ContentListResponse } from '@/lib/content-types';
import { CatalogPageHeader } from '@/components/workspace/catalog-page-header';
import { CatalogFilterControls } from '@/components/workspace/catalog-filter-controls';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspaceEmptyState } from '@/components/workspace/workspace-empty-state';

type SkillCard = ContentCard & { skillDetail?: { applicableRoles: string[] } | null };
type SkillListResponse = Omit<ContentListResponse, 'items'> & { items: SkillCard[] };

async function AISkillsPage({ searchParams }: { searchParams: Promise<{ search?: string; categoryId?: string; tag?: string; verificationStatus?: string; view?: string }> }) {
  const { search = '', categoryId, tag, view: requestedView } = await searchParams;
  const view = requestedView === 'list' ? 'list' : 'grid';
  const filters = { search: search.trim() || undefined, categoryId, tag };
  const query = new URLSearchParams({ type: 'AI_SKILL', pageSize: '100' });
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  const baseQuery = new URLSearchParams({ type: 'AI_SKILL', pageSize: '100' });
  const [skills, filterSource, currentUser] = await Promise.all([
    serverApiFetch<SkillListResponse>(`/api/contents?${query}`, { headers: await authenticatedApiHeaders() }),
    serverApiFetch<SkillListResponse>(`/api/contents?${baseQuery}`, { headers: await authenticatedApiHeaders() }),
    loadCurrentUser(),
  ]);
  const canCreate = currentUser?.permissions.includes('content.create');

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 md:py-10">
      <CatalogPageHeader createHref={canCreate ? "/workspace/submit?type=AI_SKILL" : undefined} createLabel="新增Skill" eyebrow="AI CAPABILITIES" title="AI Skill" description="面向体验设计工作流的可复用 AI 方法。使用前需遵循输入边界并进行人工复核。" search={search} searchId="skill-search" searchPlaceholder="搜索名称或用途" count={`${skills.total} 个已发布 Skill`} filterParams={{ categoryId, tag }} />
      <WorkspaceResults>
      <CatalogFilterControls contents={filterSource.items} filters={filters} extraControls={<CatalogViewSwitch pathname="/workspace/ai-skills" view={view} filters={filters} />} pathname="/workspace/ai-skills" searchPlaceholder="搜索名称或用途" />
      {skills.items.length ? (view === 'list' ? <KnowledgeList items={skills.items} pathname="/workspace/ai-skills" /> : (
        <section className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {skills.items.map((skill) => (
            <Card key={skill.id} className="group relative isolate h-full min-h-60 border border-[var(--v9-line)] bg-[var(--v9-panel)] py-5 shadow-none transition">
                <CardDetailLink href={`/workspace/ai-skills/${skill.slug}`} title={skill.title} />
                <CardHeader>
                  <div className="relative z-20 inline-flex w-fit"><FavoriteControl contentId={skill.id} returnTo="/workspace/ai-skills" /></div>

                  <CardTitle className="mt-4 text-[19px] leading-7 text-[var(--v9-text)] transition">{skill.title}</CardTitle>
                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--v9-copy)]">{skill.summary ?? '暂无说明'}</p>
                </CardHeader>

                <CardFooter className="catalog-card-footer mt-auto justify-between border-[var(--v9-line)] bg-transparent px-5 pt-5 text-xs text-[var(--v9-subtle)]"><div className="catalog-card-byline"><span>发布者 · {skill.owner.name}</span><ContentViewCount count={skill.viewCount} /></div><span className="inline-flex items-center gap-1 text-[var(--v9-copy)] transition">查看详情 <ArrowRight className="size-3" /></span></CardFooter>
              </Card>
          ))}
        </section>
      )) : <WorkspaceEmptyState className="mt-6 py-16 text-center">没有找到可访问的 AI Skill。</WorkspaceEmptyState>}
      </WorkspaceResults>
    </main>
  );
}

export default async function CachedPage(props: Parameters<typeof AISkillsPage>[0]) {
  return <CachedWorkspacePage>{await AISkillsPage(props)}</CachedWorkspacePage>;
}
