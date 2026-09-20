import { Eye } from 'lucide-react';

export function ContentViewCount({ count }: { count?: number }) {
  return <span className="inline-flex shrink-0 items-center gap-1 text-xs text-[var(--v9-subtle)]" title="累计浏览次数"><Eye aria-hidden="true" className="size-3.5" /><span>{count === undefined ? '—' : count.toLocaleString('zh-CN')} 次浏览</span></span>;
}
