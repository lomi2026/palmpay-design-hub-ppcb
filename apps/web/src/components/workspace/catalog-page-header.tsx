import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function CatalogPageHeader({ title, description, count, createHref, createLabel }: {
  eyebrow?: string; title: string; description?: string; search?: string;
  searchId?: string; searchPlaceholder?: string; count: string; source?: string;
  filterParams?: Record<string, string | undefined>; createHref?: string; createLabel?: string;
}) {
  return <header className="workspace-page-card !p-6 grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-stretch rounded-3xl bg-[var(--v9-panel)] shadow-none">
    <div><h1 className="text-[32px] font-semibold leading-10 tracking-[-.045em]">{title}</h1>{description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-[var(--v9-copy)]">{description}</p> : null}</div>
    <div className="flex flex-col items-start justify-between gap-4 sm:items-end">{createHref ? <Button asChild className="h-10"><Link href={createHref}><Plus className="size-4" />{createLabel}</Link></Button> : null}<span className="text-sm text-muted-foreground">{count}</span></div>
  </header>;
}
