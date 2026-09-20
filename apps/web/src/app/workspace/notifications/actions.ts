'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { serverApiFetch } from '@/lib/api';
import { authenticatedApiHeaders } from '@/lib/auth';
import { safeNotificationTarget } from './notification-open';

async function request(path: string, init: RequestInit) {
  return serverApiFetch(path, {
    ...init,
    headers: { ...(await authenticatedApiHeaders()), ...init.headers },
  });
}

function refreshNotifications() {
  revalidatePath('/workspace', 'layout');
  revalidatePath('/workspace/notifications');
}

export async function markNotificationReadAction(formData: FormData) {
  const notificationId = String(formData.get('notificationId') ?? '');
  if (!notificationId) return;
  await request(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
  });
  refreshNotifications();
}

export async function markAllNotificationsReadAction() {
  await request('/api/notifications/read-all', { method: 'PATCH' });
  refreshNotifications();
}

export async function openNotificationAction(formData: FormData) {
  const notificationId = String(formData.get('notificationId') ?? '');
  const target = safeNotificationTarget(formData.get('target'));
  if (!notificationId) redirect('/workspace/notifications');

  await request(`/api/notifications/${encodeURIComponent(notificationId)}/read`, {
    method: 'PATCH',
  });
  refreshNotifications();
  redirect(target);
}

export async function acknowledgeNotifications(notificationId?: string): Promise<{ error?: string; success?: boolean }> {
  try {
    await request(notificationId ? `/api/notifications/${encodeURIComponent(notificationId)}/read` : '/api/notifications/read-all', { method: 'PATCH' });
    return { success: true };
  } catch { return { error: '标记失败，请重试。' }; }
}
