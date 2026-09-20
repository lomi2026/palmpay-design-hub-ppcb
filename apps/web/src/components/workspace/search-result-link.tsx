'use client';
import { WorkspaceDataLink } from './workspace-data-link';
export function SearchResultLink({ href, title, searchLogId, contentId }: { href: string; title: string; searchLogId: string; contentId: string }) {
  return <WorkspaceDataLink href={href} aria-label={`打开 ${title}`} className="absolute inset-0 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2" onClick={() => {
    void fetch('/api/search-click', { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ searchLogId, contentId }) }).catch(() => {});
  }} />;
}
