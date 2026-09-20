'use client';

import { FilePenLine } from 'lucide-react';

import { useActionState, useEffect } from 'react';
import { createPublishedEditDraftAction, type ActionState } from './submit/actions';
import { showActionFeedback } from '@/components/workspace/action-feedback';
import { invalidateWorkspaceCache } from '@/components/workspace/cache-events';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const initialState: ActionState = {};

export function PublishedEdit({ contentId, label = '编辑内容' }: { contentId: string; label?: string }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(async (previous: ActionState, data: FormData) => {
    const result = await createPublishedEditDraftAction(previous, data).catch((): ActionState => ({ error: '无法打开编辑草稿，请重试。' }));
    if (result.error) showActionFeedback('error', result.error);
    else if (result.id) { invalidateWorkspaceCache(['/workspace', '/workspace/contributions', '/workspace/submit']); showActionFeedback('success', '编辑草稿已准备好'); }
    return result;
  }, initialState);
  useEffect(() => { if (state.id) router.push(`/workspace/submit/${encodeURIComponent(state.id)}`); }, [state.id, router]);

  return (
    <form data-managed-cache="" action={action} className="flex flex-col items-start gap-1.5">
      <input name="__managedCache" type="hidden" value="true" /><input name="id" type="hidden" value={contentId} />
      <Button
        title="创建或继续编辑草稿，重新发布前保持当前内容状态"
        variant="outline"
        className="h-9 rounded-[12px] border-white/[.14] bg-black/[.16] px-3 text-[12px] text-white/85 hover:bg-white/[.08] hover:text-white"
        disabled={pending}
        type="submit"
      >
        <FilePenLine aria-hidden="true" className="size-4" />
        {pending ? '创建草稿中…' : label}
      </Button>
      {state.error ? <p role="alert" className="max-w-64 text-right text-xs text-destructive">{state.error}</p> : null}
    </form>
  );
}
