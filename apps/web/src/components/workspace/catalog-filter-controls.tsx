import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { WorkspaceFilterForm } from '@/components/workspace/workspace-filter-form';
import type { ReactNode } from 'react';
import type { ContentCard } from '@/lib/content-types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';

type Filters = {
  search?: string;
  categoryId?: string;
  tag?: string;
  verificationStatus?: string;
  platform?: string;
  view?: string;
};

export function CatalogFilterControls({
  pathname,
  contents,
  filters,
  searchPlaceholder,
  extraControls,
}: {
  pathname: string;
  contents: ContentCard[];
  filters: Filters;
  searchPlaceholder?: string;
  extraControls?: ReactNode;
}) {
  const categories = Array.from(
    new Map(contents.filter((item) => item.category?.status === 'ACTIVE').map((item) => [item.category!.id, item.category!])).values(),
  );
  const tags = Array.from(
    new Map(contents.flatMap((item) => item.tags.filter(({ tag }) => tag.status === 'ACTIVE' && (!tag.contentTypes?.length || tag.contentTypes.includes(item.contentType))).map(({ tag }) => [tag.normalizedName, tag] as const))).values(),
  );
  const hasFilters = Boolean(
    filters.categoryId ||
    filters.tag ||
    (filters.platform && filters.platform !== '全部平台') ||
    (filters.view && filters.view !== 'grid'),
  );

  const selectClass = 'h-10 min-w-32 rounded-lg border border-[var(--v9-line-strong)] bg-[var(--v9-field)] px-3 text-xs text-[var(--v9-text)] outline-none focus-visible:border-[var(--v9-text)] focus-visible:ring-3 focus-visible:ring-[var(--v9-soft-hover)]';

  return <WorkspaceFilterForm key={JSON.stringify(filters)} action={pathname} className="workspace-filter-bar mt-6 flex flex-wrap items-center gap-3" method="get">
    {searchPlaceholder ? <label className="min-w-60 flex-1"><span className="sr-only">搜索</span><Input className="h-10 w-full text-xs" defaultValue={filters.search ?? ''} name="search" placeholder={searchPlaceholder} type="search" /></label> : filters.search ? <input name="search" type="hidden" value={filters.search} /> : null}
    <label><span className="sr-only">分类</span><NativeSelect className={selectClass} defaultValue={filters.categoryId ?? ''} name="categoryId"><option value="">全部分类</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</NativeSelect></label>
    <label><span className="sr-only">标签</span><NativeSelect className={selectClass} defaultValue={filters.tag ?? ''} name="tag"><option value="">全部标签</option>{tags.map((tag) => <option key={tag.id} value={tag.normalizedName}>{tag.name}</option>)}</NativeSelect></label>
    {extraControls}
    <Button className="h-10 px-4 text-xs" size="sm" type="submit" variant="outline">应用筛选</Button>
    {hasFilters ? <Button asChild className="h-10 px-3 text-xs text-[var(--v9-muted)] hover:bg-[var(--v9-soft-hover)] hover:text-[var(--v9-text)]" size="sm" variant="ghost"><Link href={filters.search ? `${pathname}?search=${encodeURIComponent(filters.search)}` : pathname}>清除</Link></Button> : null}
  </WorkspaceFilterForm>;
}
