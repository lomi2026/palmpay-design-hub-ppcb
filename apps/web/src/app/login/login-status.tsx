'use client';

import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ServiceStatus = 'connecting' | 'ready' | 'slow';

export function LoginServiceStatus() {
  const [status, setStatus] = useState<ServiceStatus>('connecting');

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 65_000);
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3001';

    fetch(`${apiBaseUrl}/api/health`, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then((response) => setStatus(response.ok ? 'ready' : 'slow'))
      .catch(() => setStatus('slow'))
      .finally(() => window.clearTimeout(timeout));

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, []);

  const message = {
    connecting: '正在检查服务连接…',
    ready: '服务连接正常，请输入邮箱登录。',
    slow: '测试服务连接较慢；点击登录后会继续等待，请稍候。',
  }[status];

  return (
    <p aria-live="polite" className="mt-5 rounded-xl border border-white/10 bg-white/[.035] px-3 py-2 text-xs leading-5 text-white/55">
      {message}
    </p>
  );
}

export function LoginSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-disabled={pending}
      aria-busy={pending}
      className="h-11 w-full bg-white text-black hover:bg-white/85 disabled:opacity-75"
      disabled={pending}
      type="submit"
    >
      {pending ? <LoaderCircle aria-hidden="true" className="size-4 shrink-0 animate-spin motion-reduce:animate-none" /> : null}
      <span role="status" aria-live="polite">{pending ? '正在登录，请稍候…' : '继续'}</span>
    </Button>
  );
}
