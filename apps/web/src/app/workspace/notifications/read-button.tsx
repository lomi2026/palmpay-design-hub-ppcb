'use client';
import { showActionFeedback } from '@/components/workspace/action-feedback';
import { startTransition, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { invalidateWorkspaceCache } from '@/components/workspace/cache-events';
import { acknowledgeNotifications } from './actions';
export function NotificationReadButton({ id }: { id?: string }) {
  const router = useRouter(); const lock = useRef(false);
  const [pending, setPending] = useState(false); const [saved, setSaved] = useState(false); const [error, setError] = useState('');
  return <div className="relative z-20 ml-auto"><Button type="button" size="sm" variant="outline" disabled={pending || saved} onClick={async () => {
    if (lock.current) return; lock.current = true; setPending(true); setError('');
    try { const result = await acknowledgeNotifications(id); if (result.error) { setError(result.error); showActionFeedback('error', result.error); } else { showActionFeedback('success', id ? '已标记为已读' : '全部通知已标记为已读'); setSaved(true); invalidateWorkspaceCache(['/workspace/notifications']); window.dispatchEvent(new Event('workspace-notifications-changed')); startTransition(() => router.refresh()); } }
    catch { setError('标记失败，请重试。'); showActionFeedback('error', '标记失败，请重试。'); } finally { lock.current = false; setPending(false); }
  }}>{pending ? '标记中…' : saved ? '已读' : id ? '标记已读' : '全部标记已读'}</Button>{error ? <p role="alert" className="mt-1 text-xs text-destructive">{error}</p> : null}</div>;
}
