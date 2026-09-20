'use client';
import { appPath } from '@/lib/app-path';
import { confirmWorkspaceNavigation } from '@/components/workspace/use-unsaved-changes';

import { startTransition, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { useNavigationCache } from './navigation-cache';

// Keep GET filters shareable without replacing the document and its session cache.
export function WorkspaceFilterForm({ action, children, ...props }: Omit<ComponentProps<'form'>, 'action' | 'onSubmit'> & { action: string }) {
  const router = useRouter();
  const cache = useNavigationCache();
  return <form {...props} action={action} method="get" onSubmit={event => {
    event.preventDefault();
    if (!confirmWorkspaceNavigation()) return;
    const data = new FormData(event.currentTarget, (event.nativeEvent as SubmitEvent).submitter);
    const target = new URL(appPath(action), window.location.href);
    target.search = '';
    for (const [name, value] of data) if (typeof value === 'string') target.searchParams.append(name, value);
    const href = target.pathname + target.search;
    if (!navigator.onLine) { cache?.fail(() => { cache.begin(href); router.push(href); }); return; }
    if (target.pathname === window.location.pathname && target.search === window.location.search) { cache?.cancel(); startTransition(() => router.refresh()); }
    else { cache?.begin(href); startTransition(() => router.push(href, { scroll: false })); }
  }}>{children}</form>;
}
