'use client';
import { appPath } from '@/lib/app-path';
import Link from 'next/link';
import { useNavigationCache } from './navigation-cache';
import { useRouter } from 'next/navigation';
import { type ComponentProps } from 'react';

export function WorkspaceDataLink(props: ComponentProps<typeof Link>) {
  const router = useRouter();
  const cache = useNavigationCache();
  return <Link {...props} prefetch={false} onNavigate={(event) => {
    props.onNavigate?.(event);
    if (typeof props.href !== 'string') return;
    const href = props.href;
    if (!navigator.onLine) { event.preventDefault(); cache?.fail(() => { cache.begin(href); router.push(href); }); return; }
    const target = new URL(appPath(props.href), window.location.href);
    if (target.pathname === window.location.pathname && target.search === window.location.search) {
      event.preventDefault();
      cache?.cancel();
      router.refresh();
      return;
    }
    cache?.begin(props.href);
  }}>{props.children}</Link>;
}
