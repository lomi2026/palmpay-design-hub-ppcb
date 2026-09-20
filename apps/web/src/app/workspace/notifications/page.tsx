import { NotificationReadButton } from './read-button';
import { CachedWorkspacePage } from '@/components/workspace/navigation-cache';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Bell } from 'lucide-react';

import { authenticatedApiHeaders, loadCurrentUser } from '@/lib/auth';
import { serverApiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WorkspacePageHero } from '@/components/workspace/workspace-page-hero';
import { WorkspaceEmptyState } from '@/components/workspace/workspace-empty-state';
import {
  openNotificationAction,
} from './actions';
import { notificationTarget } from './notification-target';

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
  relatedReview: { id: string; content: { id: string } } | null;
};

async function NotificationsPage() {
  const user = await loadCurrentUser();
  if (!user) redirect('/login');
  const notifications = await serverApiFetch<{ items: Notification[]; unreadCount: number }>(
    '/api/notifications',
    { headers: await authenticatedApiHeaders() },
  );

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 md:py-10">
      <Link className="mb-6 inline-flex items-center gap-2 text-xs text-[var(--v9-muted)] transition hover:text-[var(--v9-text)]" href="/workspace">
        <ArrowLeft className="size-4" />返回工作台
      </Link>
      <WorkspacePageHero
        eyebrow="NOTIFICATIONS"
        metric={{ value: notifications.unreadCount, label: '未读通知' }}
        title="通知中心"
      >
        {notifications.unreadCount ? (
          <NotificationReadButton />
        ) : null}
      </WorkspacePageHero>

      {notifications.items.length ? (
        <div className="mt-6 grid gap-4">
          {notifications.items.map((notification) => {
            const target = notificationTarget(notification);
            return (
              <Card
                className={`relative py-4 shadow-none transition ${target ? 'hover:border-[var(--v9-line-strong)] hover:bg-[var(--v9-panel-2)]' : ''} ${notification.readAt ? 'border border-[var(--v9-line)] bg-[var(--v9-panel)]' : 'border border-[var(--v9-status-info-line)] bg-[var(--v9-status-info-bg)]'}`}
                key={notification.id}
              >
                <CardHeader className="flex flex-row items-center gap-3">
                  <span className={`grid size-8 place-items-center rounded-full ${notification.readAt ? 'bg-[var(--v9-soft)] text-[var(--v9-muted)]' : 'bg-[var(--v9-status-info-bg)] text-[var(--v9-status-info-text)] ring-1 ring-[var(--v9-status-info-line)]'}`}>
                    <Bell className="size-4" />
                  </span>
                  <div>
                    <CardTitle className="text-sm text-white">{notification.title}</CardTitle>
                    <p className="mt-1 text-xs text-white/40">
                      {new Date(notification.createdAt).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  {!notification.readAt ? (
                    <NotificationReadButton id={notification.id} />
                  ) : null}
                </CardHeader>
                <CardContent className="pl-[3.75rem] text-sm leading-6 text-white/60">
                  {notification.message}
                </CardContent>
                {target ? notification.readAt ? (
                  <Link
                    aria-label={`打开通知：${notification.title}`}
                    className="absolute inset-0 z-10 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/55"
                    href={target}
                  >
                    <span className="sr-only">打开对应内容</span>
                  </Link>
                ) : (
                  <form action={openNotificationAction} className="absolute inset-0 z-10">
                    <input name="notificationId" type="hidden" value={notification.id} />
                    <input name="target" type="hidden" value={target} />
                    <button
                      aria-label={`打开并标记已读：${notification.title}`}
                      className="absolute inset-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/55"
                      type="submit"
                    >
                      <span className="sr-only">打开对应内容并标记已读</span>
                    </button>
                  </form>
                ) : null}
              </Card>
            );
          })}
        </div>
      ) : (
        <WorkspaceEmptyState className="mt-6">暂时没有通知。</WorkspaceEmptyState>
      )}
    </main>
  );
}

export default async function CachedPage() { return <CachedWorkspacePage>{await NotificationsPage()}</CachedWorkspacePage>; }
