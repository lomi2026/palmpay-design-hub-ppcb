'use client';
import { appPath } from '@/lib/app-path';
import { showActionFeedback } from './action-feedback';

import { useFavoriteIds, useFavoriteActions } from './favorite-context';
import { Copy, Heart, Link2, NotebookPen } from 'lucide-react';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';

import { Button } from '@/components/ui/button';
import { recordContentShareAction } from '@/app/workspace/engagement-actions';

export function FavoriteControl({
  contentId,
  size = 'sm',
}: {
  contentId: string;
  returnTo: string;
  active?: boolean;
  size?: 'sm' | 'md';
}) {
  const favoriteIds = useFavoriteIds();
  const favorites = useFavoriteActions();
  const change = favorites?.changes[contentId];
  const isActive = change?.active ?? favoriteIds.includes(contentId);
  const pending = change?.pending ?? false;
  return <div className="shrink-0">
    <Button type="button" variant="outline" size={size} disabled={pending || !favorites} aria-pressed={isActive} aria-busy={pending} className="favorite-control rounded-[12px] px-3 text-[12px]" onClick={() => void favorites?.toggle(contentId, isActive)}>
      <Heart className={isActive ? 'fill-current' : ''} />{pending ? (isActive ? '收藏中…' : '取消中…') : isActive ? '取消收藏' : '收藏'}
    </Button>
    {change?.error ? <p role="alert" className="mt-1 max-w-48 text-xs text-destructive">{change.error}</p> : null}
  </div>;
}

export function ContentEngagementLinks({ contentId, canonicalPath }: { contentId: string; canonicalPath: string }) {
  return (
    <div className="flex flex-wrap gap-2" aria-label="内容协作操作">
      <Button
        asChild
        variant="outline"
        size="md"
        className="h-9 rounded-[12px] border-white/[.14] bg-black/[.16] px-3 text-[12px] text-white/85 hover:bg-white/[.08] hover:text-white"
      >
        <Link href={`/workspace/usage?contentId=${contentId}`}>
          <NotebookPen />
          确认使用
        </Link>
      </Button>
      <Button
        asChild
        variant="outline"
        size="md"
        className="h-9 rounded-[12px] border-white/[.14] bg-black/[.16] px-3 text-[12px] text-white/85 hover:bg-white/[.08] hover:text-white"
      >
        <Link href={`/workspace/related?contentId=${contentId}`}>
          <Link2 />
          关联内容
        </Link>
      </Button>
      <ContentShareButton contentId={contentId} canonicalPath={canonicalPath} />
    </div>
  );
}

function ContentShareButton({ contentId, canonicalPath }: { contentId: string; canonicalPath: string }) {
  const pathname = canonicalPath;

  async function copyCanonicalLink() {
    const link = `${window.location.origin}${appPath(pathname)}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      const input = document.createElement('textarea');
      input.value = link;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      const copiedWithFallback = document.execCommand('copy');
      input.remove();
      if (!copiedWithFallback) { showActionFeedback('error', '复制失败，请重试。'); return; }
    }
    showActionFeedback('success', '链接已复制');
    try {
      await recordContentShareAction(contentId, pathname);
    } catch {
      // Sharing remains useful even if analytics is temporarily unavailable.
    }
  }

  return <Button aria-label="复制链接" className="h-9 rounded-[12px] border-white/[.14] bg-black/[.16] px-3 text-[12px] text-white/85 hover:bg-white/[.08] hover:text-white" onClick={copyCanonicalLink} type="button" variant="outline"><Copy />复制链接</Button>;
}
