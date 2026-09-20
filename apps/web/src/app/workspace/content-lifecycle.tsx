'use client';
import { Archive, ArrowDownToLine } from 'lucide-react';
import { showActionFeedback } from '@/components/workspace/action-feedback';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { invalidateWorkspaceCache } from '@/components/workspace/cache-events';
import { useNavigationCache } from '@/components/workspace/navigation-cache';
import { useFormStatus } from 'react-dom';
import { contentLifecycleAction, type ActionState } from './submit/actions';
import { Button } from '@/components/ui/button';

const initialState: ActionState = {};

function LifecycleButtons({ canArchive, canUnpublish }: { canArchive: boolean; canUnpublish: boolean }) {
  const { pending, data } = useFormStatus();
  const operation = pending ? data?.get('operation') : null;
  return <div className="flex flex-wrap justify-start gap-3">
    {canUnpublish ? <Button data-tone="warning" variant="outline" className="h-9 rounded-[12px] border-[var(--v9-status-warning-line)] bg-[var(--v9-status-warning-bg)] px-3 text-[12px] text-[var(--v9-status-warning-text)]" disabled={pending} name="operation" type="submit" value="unpublish" aria-busy={operation === 'unpublish'} title="下架后将不再显示在目录中"><ArrowDownToLine aria-hidden="true" className="size-4" />{operation === 'unpublish' ? '下架中…' : '下架内容'}</Button> : null}
    {canArchive ? <Button variant="destructive" className="h-9 rounded-[12px] border-[var(--v9-status-danger-line)] px-3 text-[12px]" disabled={pending} name="operation" type="submit" value="archive" aria-busy={operation === 'archive'} title="归档后将不再显示在目录中"><Archive aria-hidden="true" className="size-4" />{operation === 'archive' ? '归档中…' : '归档内容'}</Button> : null}
  </div>;
}

export function ContentLifecycle({ contentId, canArchive, canUnpublish }: { contentId: string; canArchive: boolean; canUnpublish: boolean }) {
  const [state, action] = useActionState(async (previous: ActionState, data: FormData) => { const result = await contentLifecycleAction(previous, data).catch((): ActionState => ({ error: '连接中断，操作结果暂未确认。请核对状态后重试。' })); if (result.error) showActionFeedback('error', result.error); else if (result.updatedStatus) showActionFeedback('success', data.get('operation') === 'archive' ? '内容已归档' : '内容已下架'); return result; }, initialState);
  const router = useRouter();
  const begin = useNavigationCache()?.begin;
  useEffect(() => { if (state.updatedStatus) { invalidateWorkspaceCache(); begin?.('/workspace/contributions'); router.replace('/workspace/contributions'); } }, [state.updatedStatus, begin, router]);
  if (!canArchive && !canUnpublish) return null;
  return <form data-managed-cache="" action={action} className="flex flex-col items-start gap-1.5">
    <input name="inline" type="hidden" value="true" /><input name="id" type="hidden" value={contentId} />
    <LifecycleButtons canArchive={canArchive} canUnpublish={canUnpublish} />
    {state.error ? <p role="alert" className="max-w-64 text-right text-[11px] text-[var(--v9-status-danger-text)]">{state.error}</p> : null}
  </form>;
}
