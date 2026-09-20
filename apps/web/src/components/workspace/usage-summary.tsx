'use client';
import { useEffect, useState } from 'react';
import { useIsNavigationSnapshot, useAuxiliaryCache } from './navigation-cache';
type Summary = { usageCount: number; projectReferences: number; favoriteCount: number };
export function UsageSummary({ summary, contentId }: { summary?: Summary; contentId?: string }) {
  const cache = useAuxiliaryCache();
  const [data, setData] = useState(() => { const entry = contentId ? cache?.get(contentId) : undefined; return summary ?? (entry && Date.now() - entry.time < 300000 ? entry.value as Summary : undefined); });
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const snapshot = useIsNavigationSnapshot();
  useEffect(() => {
    if (snapshot) return;
    const changed = () => setAttempt(value => value + 1);
    window.addEventListener('workspace-cache-invalidate', changed);
    return () => window.removeEventListener('workspace-cache-invalidate', changed);
  }, [snapshot]);
  useEffect(() => {
    if (!contentId || snapshot) return;
    const controller = new AbortController();
    fetch(`/api/content-usage/${encodeURIComponent(contentId)}`, { cache: 'no-store', signal: controller.signal })
      .then(async response => { if (!response.ok) throw Error(); return response.json() as Promise<Summary>; })
      .then(result => { if (!controller.signal.aborted) { setData(result); cache?.set(contentId, { value: result, time: Date.now() }); if (cache && cache.size > 40) cache.delete(cache.keys().next().value!); setError(false); } })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [contentId, snapshot, attempt, cache]);
  return <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/45" aria-live="polite">
    {data ? <><span>有效使用 {data.usageCount}</span><span>项目引用 {data.projectReferences}</span><span>收藏 {data.favoriteCount}</span></> : error ? null : <span aria-label="统计加载中" className="h-4 w-48 rounded bg-muted motion-safe:animate-pulse" />}
    {error ? <button type="button" onClick={() => { setError(false); setAttempt(value => value + 1); }}>统计暂时不可用，点击重试</button> : null}
  </div>;
}
