'use client';

import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function AuthServiceUnavailable() {
  const router = useRouter();
  const [isRetrying, startRetry] = useTransition();

  return (
    <main className="v9-source-home grid min-h-screen place-items-center bg-[var(--v9-bg)] px-6 py-12 text-[var(--v9-text)]">
      <section data-card-surface="" className="w-full max-w-[560px] rounded-[24px] border border-[var(--v9-line)] bg-[var(--v9-panel)] p-6 shadow-2xl shadow-black/30 sm:p-10">
        <h1 className="text-[30px] font-semibold tracking-[-.045em]">认证服务暂时不可用</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--v9-muted)]">
          你的登录会话没有被判定为失效。测试服务可能正在唤醒，请稍候后重试。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            disabled={isRetrying}
            onClick={() => startRetry(() => router.refresh())}
            type="button"
          >
            <RefreshCw className={isRetrying ? 'animate-spin' : undefined} />
            {isRetrying ? '正在重试' : '重试连接'}
          </Button>
          <Button asChild variant="outline">
            <Link href="/">返回平台首页</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
