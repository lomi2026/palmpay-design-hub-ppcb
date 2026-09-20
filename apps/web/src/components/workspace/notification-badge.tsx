'use client';
import { appPath } from '@/lib/app-path';
import { WorkspaceDataLink } from './workspace-data-link';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useEffect, useState } from 'react';

import {
  NOTIFICATION_SYNC_INITIAL_DELAY_MS,
  NOTIFICATION_SYNC_INTERVAL_MS,
  notificationRetryDelay,
} from './notification-sync';

type NotificationCountResponse = { unreadCount: number };

export function NotificationBadge({ initialUnreadCount }: { initialUnreadCount: number }) {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  useEffect(() => {
    let active = true;
    let inFlight = false;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let controller: AbortController | null = null;

    function clearTimer() {
      if (timer) clearTimeout(timer);
      timer = null;
    }

    function schedule(delay: number) {
      clearTimer();
      timer = setTimeout(() => void sync(), delay);
    }

    async function sync() {
      if (!active || inFlight || document.visibilityState === 'hidden') return;
      inFlight = true;
      clearTimer();
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 75_000);

      try {
        const response = await fetch(appPath('/api/workspace-notification-count'), {
          cache: 'no-store',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`Notification count request failed with ${response.status}`);
        const result = await response.json() as NotificationCountResponse;
        if (!Number.isInteger(result.unreadCount) || result.unreadCount < 0) {
          throw new Error('Notification count response is invalid.');
        }
        if (!active) return;
        setUnreadCount(result.unreadCount);
        failures = 0;
        schedule(NOTIFICATION_SYNC_INTERVAL_MS);
      } catch {
        if (!active) return;
        failures += 1;
        schedule(notificationRetryDelay(failures));
      } finally {
        clearTimeout(timeout);
        controller = null;
        inFlight = false;
      }
    }

    schedule(NOTIFICATION_SYNC_INITIAL_DELAY_MS);

    const refreshWhenVisible = () => {
      if (document.visibilityState !== 'visible') {
        clearTimer();
        return;
      }
      void sync();
    };
    window.addEventListener('focus', refreshWhenVisible);
    window.addEventListener('workspace-notifications-changed', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      active = false;
      clearTimer();
      controller?.abort();
      window.removeEventListener('focus', refreshWhenVisible);
      window.removeEventListener('workspace-notifications-changed', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [pathname]);

  return (
    <WorkspaceDataLink
      href="/workspace/notifications"
      aria-label={unreadCount ? `通知中心，${unreadCount} 条未读通知` : '通知中心'}
      className="relative grid size-10 place-items-center rounded-[12px] border border-border bg-background text-foreground hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50"
    >
      <Bell className="size-4" />
      {unreadCount ? (
        <span className="absolute -right-1 -top-1 grid min-w-4 place-items-center rounded-full bg-[var(--v9-strong)] px-1 py-0.5 text-[9px] font-bold leading-none text-[var(--v9-strong-foreground)]">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      ) : null}
    </WorkspaceDataLink>
  );
}
