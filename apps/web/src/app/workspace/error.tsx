'use client';

import { useEffect } from 'react';
import { useNavigationCache } from '@/components/workspace/navigation-cache';
import { RotateCcw, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function WorkspaceError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const cache = useNavigationCache();
  const fail = cache?.fail;
  useEffect(() => fail?.(reset), [fail, reset]);
  return (
    <main className="grid min-h-[calc(100vh-4rem)] place-items-center bg-[var(--v9-bg)] px-5 py-12">
      <section data-card-surface="" className="w-full max-w-2xl overflow-hidden rounded-[24px] border border-[var(--v9-line)] bg-[var(--v9-panel)] p-6 text-center md:p-11">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-[var(--v9-status-warning-line)] bg-[var(--v9-status-warning-bg)] text-[var(--v9-status-warning-text)]">
          <TriangleAlert className="size-5" />
        </span>
        <h1 className="mt-6 text-[38px] font-semibold tracking-[-.055em] text-[var(--v9-text)] md:text-[52px]">页面暂时无法加载。</h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--v9-muted)]">正式数据服务可能暂时不可用。你可以安全重试当前请求；未提交的数据不会在这里被伪造或替代。</p>
        <Button type="button" onClick={reset} className="mt-6 h-11 bg-white px-5 font-semibold text-black hover:bg-white/90">
          <RotateCcw className="size-4" /> 重新加载
        </Button>
      </section>
    </main>
  );
}
