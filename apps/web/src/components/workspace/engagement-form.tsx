'use client';
import { showActionFeedback } from '@/components/workspace/action-feedback';
import { startTransition, useActionState, type ComponentProps } from 'react';
import { useRouter } from 'next/navigation';
import { saveEngagementAction } from '@/app/workspace/engagement-actions';
import { invalidateWorkspaceCache } from './cache-events';
export function EngagementForm({ kind, children, ...props }: Omit<ComponentProps<'form'>, 'action'> & { kind: 'usage' | 'relation' | 'remove-relation' }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(async (_previous: { error?: string; success?: boolean }, data: FormData) => {
    try {
      const result = await saveEngagementAction(kind, data);
      if (result.error) showActionFeedback('error', result.error);
      else if (result.success) showActionFeedback('success', kind === 'usage' ? '使用记录保存成功' : kind === 'relation' ? '内容关联成功' : '关联已移除');
      if (result.success) { invalidateWorkspaceCache(['/workspace', '/workspace/overview', '/workspace/insights', '/workspace/related']); if (kind !== 'usage') startTransition(() => router.refresh()); }
      return result;
    } catch { showActionFeedback('error', '操作结果暂未确认，请刷新核对后重试。'); return { error: '操作结果暂未确认，请刷新核对后重试。' }; }
  }, {});
  return <form {...props} data-managed-cache="" action={action} onResetCapture={event => event.preventDefault()}>
    <fieldset className="contents" disabled={pending}>{children}</fieldset>
    <p role={state.error ? 'alert' : 'status'} className={state.error ? 'mt-3 text-sm text-destructive' : 'mt-3 text-sm text-muted-foreground'}>{pending ? '正在保存…' : state.error ?? (state.success ? '操作成功' : '')}</p>
  </form>;
}
