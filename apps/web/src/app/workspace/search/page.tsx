import { Search } from 'lucide-react';
import { ContentCard } from '@/components/content-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { authenticatedApiHeaders } from '@/lib/auth';
import { serverApiFetch } from '@/lib/api';
import type { ContentListResponse } from '@/lib/content-types';
import { SearchResultLink } from '@/components/workspace/search-result-link';
import { WorkspaceFilterForm } from '@/components/workspace/workspace-filter-form';
import { CachedWorkspacePage, WorkspaceResults } from '@/components/workspace/navigation-cache';
import { WorkspacePageHero } from '@/components/workspace/workspace-page-hero';
import { WorkspaceEmptyState } from '@/components/workspace/workspace-empty-state';

async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = '' } = await searchParams;
  const query = q.trim();
  const result = query
    ? await serverApiFetch<ContentListResponse & { searchLogId: string }>(
        `/api/search?q=${encodeURIComponent(query)}&pageSize=50`,
        { headers: await authenticatedApiHeaders() },
      )
    : null;
  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 md:py-10">
      <WorkspacePageHero eyebrow="GLOBAL SEARCH" metric={result ? { value: result.total, label: '可访问结果' } : undefined} title="用一个关键词，找到可复用的团队经验。" />
      <WorkspaceFilterForm key={query} action="/workspace/search" className="workspace-filter-bar mt-6 flex max-w-3xl gap-2">
        <Input
          name="q"
          defaultValue={query}
          placeholder="搜索资产、Skill、案例或项目"
          className="border-white/15 bg-white/[.04] text-white"
        />
        <Button type="submit">
          <Search />
          搜索
        </Button>
      </WorkspaceFilterForm>
      <WorkspaceResults>
      {result ? (
        <section className="mt-6">
          <p className="mb-6 text-sm text-white/50">
            “{query}”共找到 {result.total} 项可访问内容
          </p>
          {result.items.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {result.items.map((content) => (
                <div className="relative" key={content.id}>
                  <ContentCard content={content} />
                  <SearchResultLink searchLogId={result.searchLogId} contentId={content.id} title={content.title} href={`/workspace/${content.contentType === 'DESIGN_ASSET' ? 'design-assets' : content.contentType === 'AI_SKILL' ? 'ai-skills' : content.contentType === 'AI_CASE' ? 'ai-cases' : content.contentType === 'AI_TOOL' ? 'ai-tools' : 'ai-projects'}/${content.slug}`} />
                </div>
              ))}
            </div>
          ) : (
            <WorkspaceEmptyState>
              没有匹配内容。可以更换关键词、缩短描述，或创建新的内容需求。
            </WorkspaceEmptyState>
          )}
        </section>
      ) : (
        <WorkspaceEmptyState className="mt-6">
          输入关键词，在全部正式内容中搜索。结果会先按你的权限过滤。
        </WorkspaceEmptyState>
      )}
      </WorkspaceResults>
    </main>
  );
}

export default async function CachedPage(props: Parameters<typeof SearchPage>[0]) { return <CachedWorkspacePage>{await SearchPage(props)}</CachedWorkspacePage>; }
