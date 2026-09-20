import { ContentViewCount } from '@/components/workspace/content-view-count';
import { CardDetailLink } from './card-detail-link';
import { AssetImage } from './asset-image';
import { Wrench } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { FavoriteControl } from './engagement-controls';
import { WorkspaceEmptyState } from './workspace-empty-state';
import type { ContentCard } from '@/lib/content-types';
import { cn } from '@/lib/utils';

export type AITool = ContentCard & {
  toolDetail?: { websiteUrl: string; vendor: string; platforms: string[]; scenarios: string[]; usageGuide: string; limitations: string; pricingModel: string } | null;
};

export function AIToolsCatalog({ contents, platform, view }: { contents: AITool[]; platform: string; view: 'grid' | 'list' }) {
  const items = contents.filter((item) => platform === '全部平台' || item.toolDetail?.platforms.includes(platform));
  return <section>

    {items.length ? <div className={cn('mt-6 grid gap-4', view === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1')}>
      {items.map((item) => <Card key={item.id} className="relative isolate gap-0 overflow-hidden border-[var(--v9-line)] bg-[var(--v9-panel)] py-0 shadow-none transition hover:border-[var(--v9-line-strong)]"><CardDetailLink href={`/workspace/ai-tools/${item.slug}`} title={item.title} />
        {view === 'grid' ? <div className="block border-b border-[var(--v9-line)]"><AssetImage fileId={item.coverFile?.id} title={item.title} /></div> : null}
        <CardHeader className="p-4"><div className="flex items-center justify-between"><div className="relative z-20 inline-flex"><FavoriteControl contentId={item.id} returnTo="/workspace/ai-tools" /></div></div><CardTitle className="mt-3 text-base">{item.title}</CardTitle><p className="mt-2 line-clamp-2 min-h-10 text-sm text-[var(--v9-muted)]">{item.summary}</p></CardHeader>

        <CardFooter className="catalog-card-footer mx-4 flex justify-between border-t border-[var(--v9-line)] bg-transparent px-0 py-4 text-xs text-[var(--v9-subtle)]"><div className="catalog-card-byline"><span>发布者 · {item.owner.name}</span><ContentViewCount count={item.viewCount} /></div><span>{item.toolDetail?.pricingModel}</span></CardFooter>
      </Card>)}
    </div> : <WorkspaceEmptyState className="mt-4 py-16" icon={<Wrench className="size-8" />} title="暂无符合条件的 AI 工具">工具发布后会显示在这里。</WorkspaceEmptyState>}
  </section>;
}
