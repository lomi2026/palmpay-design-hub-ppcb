import { Grid2X2, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkspaceDataLink } from './workspace-data-link';
export function CatalogViewSwitch({ pathname, view, filters }: { pathname: string; view: 'grid' | 'list'; filters: Record<string, string | undefined> }) {
  return <><input name="view" type="hidden" value={view} /><div aria-label="视图切换" className="filter-view-switch flex h-10 items-center rounded-lg border border-[var(--v9-line-strong)] bg-[var(--v9-field)] p-1">{(['grid', 'list'] as const).map(value => {
    const query = new URLSearchParams(); for (const [key, item] of Object.entries(filters)) if (item) query.set(key, item); query.set('view', value);
    const Icon = value === 'grid' ? Grid2X2 : LayoutList;
    return <Button asChild size="icon-xs" variant="ghost" key={value}><WorkspaceDataLink scroll={false} aria-label={value === 'grid' ? '卡片视图' : '列表视图'} aria-pressed={view === value} className={`size-7 rounded-md p-0 ${view === value ? 'bg-[var(--v9-soft-hover)] text-[var(--v9-text)]' : 'text-[var(--v9-muted)]'}`} href={`${pathname}?${query}`}><Icon /></WorkspaceDataLink></Button>;
  })}</div></>;
}
