'use client';
import { Button } from '@/components/ui/button';
import { WorkspaceDataLink } from './workspace-data-link';
import { useNavigationCache } from './navigation-cache';
export function WorkspaceTabs({ path, active, items, label = '管理分区' }: { path: string; active: string; label?: string; items: ReadonlyArray<readonly [string, string]> }) {
  const cache = useNavigationCache();
  const selected = cache?.pending?.split('?')[0] === path ? new URL(cache.pending, 'http://workspace').searchParams.get('tab') ?? active : active;
  return <nav className="mt-6 flex flex-wrap gap-2" aria-label={label}>{items.map(([key, label]) => <Button asChild size="sm" key={key} variant={selected === key ? 'default' : 'outline'} className="!h-10 rounded-lg"><WorkspaceDataLink href={`${path}?tab=${key}`} aria-current={selected === key ? 'page' : undefined}>{label}</WorkspaceDataLink></Button>)}</nav>;
}
