import { ContentViewCount } from '@/components/workspace/content-view-count';
import { ArrowRight } from 'lucide-react';
import type { ContentCard } from '@/lib/content-types';
import { CardDetailLink } from './card-detail-link';
import { FavoriteControl } from './engagement-controls';
export function KnowledgeList({ items, pathname }: { items: Array<ContentCard & { caseDetail?: { metricName: string | null } | null }>; pathname: string }) {
  return <section aria-label="内容列表" className="mt-6 grid gap-4">{items.map(item => <article key={item.id} data-card-surface="" className="relative isolate grid gap-4 rounded-2xl border border-[var(--v9-line)] bg-[var(--v9-panel)] p-5 transition md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
    <CardDetailLink href={`${pathname}/${item.slug}`} title={item.title} />
    <div className="min-w-0"><h2 className="text-base font-semibold">{item.title}</h2><p className="mt-2 line-clamp-2 text-sm text-[var(--v9-copy)]">{item.summary ?? '暂无说明'}</p><div className="mt-3 flex flex-wrap gap-4 text-xs text-[var(--v9-subtle)]"><span>发布者 · {item.owner.name}</span><ContentViewCount count={item.viewCount} />{item.caseDetail?.metricName ? <span>观察指标 · {item.caseDetail.metricName}</span> : null}</div></div>
    <div className="flex items-center justify-between gap-4"><div className="relative z-20"><FavoriteControl contentId={item.id} returnTo={pathname} /></div><ArrowRight aria-hidden className="size-4 text-[var(--v9-subtle)]" /></div>
  </article>)}</section>;
}
