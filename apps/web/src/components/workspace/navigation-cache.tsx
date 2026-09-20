'use client';

import { startNavigationTiming } from './interaction-timing';
import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';

type Entry = { content: ReactNode; region?: ReactNode; time: number };
type CacheContext = { begin: (href: string) => void; register: (key: string, content: ReactNode, cacheable?: boolean) => void; registerRegion: (key: string, content: ReactNode) => void; invalidate: (paths?: string[]) => void; cancel: () => void; failed: boolean; fail: (retry: () => void) => (() => void); retry: (() => void) | null; pending: string | null; entries: Map<string, Entry> };
const AuxiliaryContext = createContext<Map<string, { value: unknown; time: number }> | null>(null);
export function useAuxiliaryCache() { return useContext(AuxiliaryContext); }
const SnapshotContext = createContext(false);
export function useIsNavigationSnapshot() { return useContext(SnapshotContext); }
const Context = createContext<CacheContext | null>(null);
const titles: Record<string, string> = {
  '/workspace': '工作台', '/workspace/overview': '价值总览', '/workspace/insights': '数据洞察',
  '/workspace/design-assets': '设计资产', '/workspace/ai-tools': 'AI 工具', '/workspace/ai-skills': 'AI Skill',
  '/workspace/ai-cases': 'AI 案例', '/workspace/ai-projects': 'AI 项目库', '/workspace/contributions': '我的贡献',
  '/workspace/search': '搜索', '/workspace/usage': '确认使用', '/workspace/related': '关联内容', '/workspace/notifications': '通知',
  '/workspace/admin': '管理中心', '/workspace/submit': '发布内容', '/workspace/favorites': '收藏与浏览',
};
function pageTitle(path: string) {
  if (titles[path]) return titles[path];
  if (/^\/workspace\/submit\/[^/]+$/.test(path)) return '编辑内容';
  const match = path.match(/^\/workspace\/(design-assets|ai-tools|ai-skills|ai-cases|ai-projects)\/[^/]+$/);
  return match ? `${titles['/workspace/' + match[1]]}详情` : undefined;
}
function keyFor(href: string) { const url = new URL(href, 'http://workspace'); url.searchParams.sort(); return url.pathname + url.search; }

export function NavigationCacheProvider({ children, scope }: { children: ReactNode; scope: string }) {
  const actualPath = usePathname();
  const finishTiming = useRef<(() => void) | null>(null);
  const router = useRouter();
  const generation = useRef(0);
  const request = useRef<{key: string; generation: number} | null>(null);

  const [auxiliary] = useState(() => new Map<string, { value: unknown; time: number }>());
  const entriesRef = useRef(new Map<string, Entry>());
  const [entries, setEntries] = useState(new Map<string, Entry>());
  const [retry, setRetry] = useState<(() => void) | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => { entriesRef.current = entries; }, [entries]);
  const begin = useCallback((href: string) => { const key = keyFor(href); finishTiming.current = startNavigationTiming(Boolean(entriesRef.current.get(key) && Date.now() - entriesRef.current.get(key)!.time < 300000)); setFailed(false); if (pageTitle(key.split('?')[0]!)) { request.current = {key, generation: generation.current}; setEntries(previous => new Map([...previous].filter(([, entry]) => Date.now() - entry.time < 5 * 60_000))); setPending(key); } }, []);
  const cancel = useCallback(() => setPending(null), []);
  const invalidate = useCallback((paths?: string[]) => {
    generation.current += 1;
    auxiliary.clear();
    setEntries(previous => paths ? new Map([...previous].filter(([key]) => !paths.some(path => key.split('?')[0] === path || (path.endsWith('/*') && key.split('?')[0]!.startsWith(path.slice(0, -1)))))) : new Map());
  }, [auxiliary]);
  const fail = useCallback((retryAction: () => void) => {
    const controller = new AbortController();
    setRetry(() => retryAction);
    setFailed(true);
    if (!navigator.onLine) { invalidate(); cancel(); return () => controller.abort(); }
    // Re-check identity/permissions before retaining stale content after a failed read.
    fetch('/api/workspace-session', {cache: 'no-store', signal: controller.signal})
      .then(async response => {
        if (controller.signal.aborted) return;
        if (response.status === 401) { invalidate(); cancel(); window.location.assign('/login'); return; }
        if (!response.ok) { invalidate(); cancel(); return; }
        const result = await response.json();
        if (result.scope !== scope) { invalidate(); cancel(); window.location.reload(); }
      }).catch(() => { if (!controller.signal.aborted) { invalidate(); cancel(); } });
    return () => controller.abort();
  }, [scope, invalidate, cancel]);
  const register = useCallback((key: string, content: ReactNode, cacheable = true) => {
    if (request.current?.key === key && request.current.generation !== generation.current) {
      request.current = {key, generation: generation.current};
      router.refresh();
      return;
    }
    if (request.current?.key === key) { finishTiming.current?.(); finishTiming.current = null; request.current = null; }
    setFailed(false);
    setEntries(previous => {
      const next = new Map(previous);
      const region = previous.get(key)?.region;
      next.delete(key); if (cacheable) next.set(key, { content, region, time: Date.now() });
      if (next.size > 20) next.delete(next.keys().next().value!);
      return next;
    });
    window.dispatchEvent(new CustomEvent('workspace-ready', { detail: key.split('?')[0] }));
    setPending(previous => previous === key ? null : previous);
  }, [router]);
  const registerRegion = useCallback((key: string, region: ReactNode) => {
    if (request.current?.key === key && request.current.generation !== generation.current) return;
    setEntries(previous => { const next = new Map(previous); const entry = next.get(key); next.set(key, { content: entry?.content, time: entry?.time ?? Date.now(), region }); return next; });
  }, []);
  useEffect(() => {
    // Mutating forms must never resurrect a previously rendered list after a write.
    const submit = (event: Event) => {
      const form = event.target;
      if (form instanceof HTMLFormElement && form.method.toLowerCase() !== 'get' && !form.hasAttribute('data-managed-cache')) { invalidate(); }
    };
    const clearPending = () => setPending(null);
    document.addEventListener('submit', submit, true);
    window.addEventListener('popstate', clearPending);
    const changed = (event: Event) => invalidate((event as CustomEvent<{paths?: string[]}>).detail?.paths);
    const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('workspace-cache');
    if (channel) channel.onmessage = event => { invalidate(event.data?.paths); };
    window.addEventListener('workspace-cache-invalidate', changed);
    return () => { document.removeEventListener('submit', submit, true); window.removeEventListener('popstate', clearPending); window.removeEventListener('workspace-cache-invalidate', changed); channel?.close(); };
  }, [invalidate]);
  return <AuxiliaryContext.Provider value={auxiliary}><Context.Provider value={{ begin, register, registerRegion, invalidate, cancel, failed, fail, retry, pending: pageTitle(actualPath) ? pending : null, entries }}>{children}</Context.Provider></AuxiliaryContext.Provider>;
}

export function useNavigationCache() { return useContext(Context); }
export function useVisibleWorkspacePath() { const cache = useContext(Context); const path = usePathname(); return cache?.pending?.split('?')[0] ?? path; }

export function CachedWorkspacePage({ children, cacheable = true }: { children: ReactNode; cacheable?: boolean }) {
  const cache = useContext(Context);
  const path = usePathname();
  const search = useSearchParams();
  const key = keyFor(path + '?' + search.toString());
  const register = cache?.register;
  useEffect(() => { register?.(key, children, cacheable); }, [key, children, register, cacheable]);
  return children;
}

export function NavigationCacheOutlet({ children }: { children: ReactNode }) {
  const cache = useContext(Context);
  const path = usePathname();
  const [publication, setPublication] = useState<{ title: string; summary: string | null; href: string; catalog: string } | null>(null);
  useEffect(() => {
    const published = (event: Event) => setPublication((event as CustomEvent).detail);
    const ready = (event: Event) => setPublication(previous => previous?.catalog === (event as CustomEvent).detail ? null : previous);
    window.addEventListener('workspace-publication', published); window.addEventListener('workspace-ready', ready);
    return () => { window.removeEventListener('workspace-publication', published); window.removeEventListener('workspace-ready', ready); };
  }, []);
  const pending = cache?.pending;
  const local = !cache?.failed && pending?.split('?')[0] === path && ['/workspace/admin', '/workspace/favorites', '/workspace/search', '/workspace/contributions', '/workspace/design-assets', '/workspace/ai-tools', '/workspace/ai-skills', '/workspace/ai-cases', '/workspace/ai-projects'].includes(path);
  const entry = pending ? cache?.entries.get(pending) : undefined;
  const fresh = Boolean(entry);
  return <>
    {cache?.failed && !pending && typeof navigator !== 'undefined' && !navigator.onLine ? <div role="alert" className="mx-10 mt-4 rounded-xl bg-muted px-4 py-3 text-sm">网络已断开，页面尚未切换。<button type="button" className="ml-3 underline" onClick={() => cache.retry?.()}>重新尝试</button></div> : null}
    {pending && fresh && cache?.failed ? <div role="alert" className="mx-10 mt-4 rounded-xl bg-muted px-4 py-3 text-sm">刷新失败，暂时显示上次内容。<button className="ml-3 underline" onClick={() => cache.retry?.()}>重试</button></div> : null}
    <div style={pending && !local && !(cache?.failed && !fresh) ? { display: 'none' } : { display: 'contents' }}>{children}</div>
    {pending && !local && !(cache?.failed && !fresh) ? fresh ? <SnapshotContext.Provider value={true}><div style={{ display: 'contents' }}>{entry?.content}</div></SnapshotContext.Provider> : <main className="px-5 py-8" aria-busy="true" aria-label="页面加载中"><section className="workspace-page-card rounded-3xl bg-card p-6"><h1 className="text-[32px] font-semibold">{pageTitle(pending.split('?')[0]!)}</h1></section><div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">{publication && publication.catalog === pending.split('?')[0] ? <article className="rounded-2xl bg-card p-6"><p className="text-sm text-muted-foreground">发布成功</p><h2 className="mt-3 text-xl font-semibold">{publication.title}</h2><p className="mt-3 text-sm">{publication.summary}</p><p className="mt-4 text-xs text-muted-foreground">正在更新目录…</p></article> : [0,1,2,3,4,5].map(index => <div key={index} className="rounded-2xl bg-card p-6 motion-safe:animate-pulse"><div className="h-3 w-24 rounded-lg bg-muted" /><div className="my-6 h-8 w-20 rounded-lg bg-muted" /><div className="h-3 w-3/4 rounded-lg bg-muted" /></div>)}</div></main> : null}
  </>;
}

// A query/tab change keeps the page header and controls mounted while only its results change.
export function WorkspaceResults({ children }: { children: ReactNode }) {
  const cache = useNavigationCache();
  const path = usePathname();
  const search = useSearchParams();
  const snapshot = useIsNavigationSnapshot();
  const key = keyFor(path + '?' + search.toString());
  const register = cache?.registerRegion;
  useEffect(() => { if (!snapshot) register?.(key, children); }, [key, children, register, snapshot]);
  const target = cache?.pending;
  if (target && target !== key && target.split('?')[0] === path) {
    const region = cache?.entries.get(target)?.region;
    return <div data-workspace-results="" aria-busy={!region}>{region ? <SnapshotContext.Provider value={true}>{region}</SnapshotContext.Provider> : <div className="mt-6 min-h-48 rounded-2xl bg-card p-6" aria-label="内容加载中"><div className="h-6 w-40 rounded bg-muted motion-safe:animate-pulse" /><div className="mt-6 h-24 rounded-xl bg-muted motion-safe:animate-pulse" /></div>}</div>;
  }
  return <div data-workspace-results="">{children}</div>;
}
