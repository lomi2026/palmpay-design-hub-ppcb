'use client';
export type CacheChange = { paths?: string[] };
export function invalidateWorkspaceCache(paths?: string[]) {
  const detail: CacheChange = { paths };
  window.dispatchEvent(new CustomEvent('workspace-cache-invalidate', { detail }));
  const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('workspace-cache');
  channel?.postMessage(detail);
  channel?.close();
}
