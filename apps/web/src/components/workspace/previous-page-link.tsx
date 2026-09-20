'use client';

import { useRouter } from 'next/navigation';

export function PreviousPageLink({ fallback }: { fallback: string }) {
  const router = useRouter();
  return <a href={fallback} className="text-sm text-[var(--v9-muted)] transition hover:text-[var(--v9-text)]" onClick={(event) => {
    event.preventDefault();
    if (window.history.length > 1) router.back();
    else router.replace(fallback);
  }}>← 返回上一页面</a>;
}
