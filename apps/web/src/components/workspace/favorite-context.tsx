'use client';
import { showActionFeedback } from '@/components/workspace/action-feedback';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { favoriteAction } from '@/app/workspace/engagement-actions';
import { invalidateWorkspaceCache } from './cache-events';
type Snapshot = { ids: string[]; projectCount: number };
type Change = { active: boolean; pending: boolean; error?: string };
const FavoriteContext = createContext<string[]>([]);
const FavoriteActions = createContext<{ changes: Record<string, Change>; toggle: (id: string, active: boolean) => Promise<void> } | null>(null);
const ProjectCountContext = createContext<number | undefined>(undefined);
export function FavoriteProvider({ ids, projectCount, children }: { ids: string[]; projectCount: number; children: React.ReactNode }) {
  const pathname = usePathname();
  const generation = useRef(0);
  const locks = useRef(new Set<string>());
  const [refresh, setRefresh] = useState(0);
  const [changes, setChanges] = useState<Record<string, Change>>({});
  const [live, setLive] = useState<Snapshot>({ ids, projectCount });
  useEffect(() => {
    const controller = new AbortController();
    const version = generation.current;
    fetch('/api/workspace-live-data', { cache: 'no-store', signal: controller.signal })
      .then(async response => { if (!response.ok) throw Error('Unavailable'); return response.json() as Promise<Snapshot>; })
      .then(data => { if (!controller.signal.aborted && generation.current === version) { setLive(data); setChanges(previous => Object.fromEntries(Object.entries(previous).map(([id, value]) => [id, value.pending ? value : { active: data.ids.includes(id), pending: false }]))); } })
      .catch(() => {});
    return () => controller.abort();
  }, [pathname, ids, projectCount, refresh]);
  useEffect(() => {
    const changed = () => { generation.current += 1; setRefresh(value => value + 1); };
    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('workspace-cache');
    if (channel) channel.onmessage = changed;
    window.addEventListener('workspace-cache-invalidate', changed);
    return () => { channel?.close(); window.removeEventListener('workspace-cache-invalidate', changed); };
  }, []);
  const toggle = useCallback(async (id: string, active: boolean) => {
    if (locks.current.has(id)) return;
    locks.current.add(id); generation.current += 1;
    setChanges(previous => ({ ...previous, [id]: { active: !active, pending: true } }));
    const data = new FormData(); data.set('contentId', id); data.set('active', String(active));
    try {
      const result = await favoriteAction(data);
      if (result.error) throw Error(result.error);
      setChanges(previous => ({ ...previous, [id]: { active: !active, pending: false } }));
      showActionFeedback('success', active ? '已取消收藏' : '收藏成功', `favorite:${id}`);
      invalidateWorkspaceCache(['/workspace', '/workspace/favorites', '/workspace/overview']);
    } catch {
      showActionFeedback('error', '收藏状态更新失败，请重试。', `favorite:${id}`);
      setChanges(previous => ({ ...previous, [id]: { active, pending: false, error: '收藏状态更新失败，请重试。' } }));
    } finally { generation.current += 1; locks.current.delete(id); }
  }, []);
  const favoriteIds = new Set(live.ids);
  for (const [id, value] of Object.entries(changes)) { if (value.active) favoriteIds.add(id); else favoriteIds.delete(id); }
  return <ProjectCountContext.Provider value={live.projectCount}><FavoriteActions.Provider value={{ changes, toggle }}><FavoriteContext.Provider value={[...favoriteIds]}>{children}</FavoriteContext.Provider></FavoriteActions.Provider></ProjectCountContext.Provider>;
}
export function useFavoriteIds() { return useContext(FavoriteContext); }
export function useFavoriteActions() { return useContext(FavoriteActions); }
export function useWorkspaceProjectCount(fallback: number) { return useContext(ProjectCountContext) ?? fallback; }
export function FavoritePresence({ id, children }: { id: string; children: React.ReactNode }) {
  const actions = useFavoriteActions();
  const change = actions?.changes[id];
  return change && !change.pending && !change.error && !change.active ? <p className="rounded-2xl bg-card p-6 text-sm text-muted-foreground">已取消收藏</p> : <>{children}</>;
}
