import { CachedWorkspacePage, WorkspaceResults } from '@/components/workspace/navigation-cache';
import { CatalogPageHeader } from '@/components/workspace/catalog-page-header';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { Grid2X2, LayoutList, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { CatalogFilterControls } from '@/components/workspace/catalog-filter-controls';
import { AIToolsCatalog } from '@/components/workspace/ai-tools-catalog';
import { serverApiFetch } from '@/lib/api';
import { authenticatedApiHeaders, loadCurrentUser } from '@/lib/auth';
import type { ContentListResponse } from '@/lib/content-types';
import { cn } from '@/lib/utils';

const platforms = ['全部平台', 'Web', 'Mobile', '全平台'] as const;

type Platform = (typeof platforms)[number];
type View = 'grid' | 'list';

function isPlatform(value: string | undefined): value is Platform {
  return platforms.includes(value as Platform);
}

async function AIToolsPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string;
    categoryId?: string;
    tag?: string;
    platform?: string;
    view?: string;
  }>;
}) {
  const user = await loadCurrentUser();
  const canCreate = user?.permissions.includes('content.create') ?? false;
  const params = await searchParams;
  const search = params.search ?? '';
  const { categoryId, tag } = params;
  const platform: Platform = isPlatform(params.platform) ? params.platform : '全部平台';
  const view: View = params.view === 'list' ? 'list' : 'grid';
  const filters = { search: search.trim() || undefined, categoryId, tag, platform, view };
  const apiFilters = { search: filters.search, categoryId, tag };
  const query = new URLSearchParams({ type: 'AI_TOOL', pageSize: '100' });
  for (const [key, value] of Object.entries(apiFilters)) if (value) query.set(key, value);
  const baseQuery = new URLSearchParams({ type: 'AI_TOOL', pageSize: '100' });
  const [contents, filterSource] = await Promise.all([
    serverApiFetch<ContentListResponse>(`/api/contents?${query}`, { headers: await authenticatedApiHeaders() }),
    serverApiFetch<ContentListResponse>(`/api/contents?${baseQuery}`, { headers: await authenticatedApiHeaders() }),
  ]);

  function viewHref(nextView: View) {
    const next = new URLSearchParams();
    if (filters.search) next.set('search', filters.search);
    if (categoryId) next.set('categoryId', categoryId);
    if (tag) next.set('tag', tag);

    if (platform !== '全部平台') next.set('platform', platform);
    if (nextView !== 'grid') next.set('view', nextView);
    const suffix = next.toString();
    return suffix ? `/workspace/ai-tools?${suffix}` : '/workspace/ai-tools';
  }

  const selectClass = 'h-10 min-w-32 rounded-lg border border-[var(--v9-line-strong)] bg-[var(--v9-field)] px-3 text-xs text-[var(--v9-text)] outline-none focus-visible:border-[var(--v9-text)] focus-visible:ring-3 focus-visible:ring-[var(--v9-soft-hover)]';

  return (
    <main className="mx-auto w-full max-w-[1440px] px-5 py-8 md:px-8 md:py-10">
      <CatalogPageHeader title="AI 工具" description="发现适合设计工作流的 AI 工具，了解适用场景与使用方式，提升团队工作效率。" count={`${contents.total} 个已发布工具`} createHref={canCreate ? "/workspace/submit?type=AI_TOOL" : undefined} createLabel="新增工具" />
      <CatalogFilterControls
        contents={filterSource.items}
        extraControls={(
          <>
            <label>
              <span className="sr-only">平台</span>
              <NativeSelect className={selectClass} defaultValue={platform} name="platform">
                {platforms.map((item) => <option key={item} value={item}>{item}</option>)}
              </NativeSelect>
            </label>
            <input name="view" type="hidden" value={view} />
            <div aria-label="视图切换" className="filter-view-switch flex h-10 items-center rounded-lg border border-[var(--v9-line-strong)] bg-[var(--v9-field)] p-1">
              <Button asChild size="icon-xs" variant="ghost">
                <Link aria-label="卡片视图" aria-pressed={view === 'grid'} className={cn('size-7 rounded-md p-0', view === 'grid' ? 'bg-[var(--v9-soft-hover)] text-[var(--v9-text)]' : 'text-[var(--v9-muted)]')} href={viewHref('grid')}><Grid2X2 /></Link>
              </Button>
              <Button asChild size="icon-xs" variant="ghost">
                <Link aria-label="列表视图" aria-pressed={view === 'list'} className={cn('size-7 rounded-md p-0', view === 'list' ? 'bg-[var(--v9-soft-hover)] text-[var(--v9-text)]' : 'text-[var(--v9-muted)]')} href={viewHref('list')}><LayoutList /></Link>
              </Button>
            </div>
          </>
        )}
        filters={filters}
        pathname="/workspace/ai-tools"
        searchPlaceholder="搜索工具名称、场景或描述"
      />
      <WorkspaceResults>
      <AIToolsCatalog contents={contents.items} platform={platform} view={view} />
      </WorkspaceResults>
    </main>
  );
}

export default async function CachedPage(props: Parameters<typeof AIToolsPage>[0]) {
  return <CachedWorkspacePage>{await AIToolsPage(props)}</CachedWorkspacePage>;
}
