'use client';

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, X } from 'lucide-react';

type Notice = { id: number; key?: string; status: 'success' | 'error'; message: string };
const eventName = 'workspace-action-feedback';
let sequence = 0;
/** Only report success after the server has acknowledged the operation. */
export function showActionFeedback(status: Notice['status'], message: string, key?: string) {
  window.dispatchEvent(new CustomEvent<Notice>(eventName, { detail: { id: ++sequence, status, message, key } }));
}

function FeedbackNotice({ notice, dismiss }: { notice: Notice; dismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (notice.status === 'error' || paused) return;
    const timer = setTimeout(() => dismiss(notice.id), 5000);
    return () => clearTimeout(timer);
  }, [notice, paused, dismiss]);
  const success = notice.status === 'success';
  const Icon = success ? CheckCircle2 : CircleAlert;
  return <div role={success ? 'status' : 'alert'} aria-atomic="true" data-action-feedback={notice.status}
    onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}
    className="pointer-events-auto flex items-start gap-3 rounded-xl border border-border bg-popover px-4 py-3 text-sm text-popover-foreground shadow-lg">
    <Icon aria-hidden className={`mt-0.5 size-4 shrink-0 ${success ? 'text-[var(--v9-status-success-text)]' : 'text-[var(--v9-status-danger-text)]'}`} />
    <span className="min-w-0 flex-1 break-words">{notice.message}</span>
    <button type="button" aria-label="关闭操作提示" onClick={() => dismiss(notice.id)} className="shrink-0 rounded-md p-1 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><X aria-hidden className="size-4" /></button>
  </div>;
}

// Mounted once in the persistent layout, outside cached page snapshots and dialogs.
export function ActionFeedback() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const dismiss = useCallback((id: number) => setNotices(previous => previous.filter(item => item.id !== id)), []);
  useEffect(() => {
    const receive = (event: Event) => {
      const notice = (event as CustomEvent<Notice>).detail;
      setNotices(previous => [...previous.filter(item => notice.key ? item.key !== notice.key : item.message !== notice.message), notice].slice(-5));
    };
    window.addEventListener(eventName, receive);
    return () => window.removeEventListener(eventName, receive);
  }, []);
  return <div aria-label="操作结果" className="pointer-events-none fixed right-4 top-20 z-[100] grid w-[min(420px,calc(100vw-32px))] gap-2">
    {notices.map(notice => <FeedbackNotice key={notice.id} notice={notice} dismiss={dismiss} />)}
  </div>;
}
