'use client';

import { useTransition, useActionState, useEffect, useRef, useState, type ComponentProps } from 'react';
import { useUnsavedChanges } from '@/components/workspace/use-unsaved-changes';
import { useRouter } from 'next/navigation';
import { invalidateWorkspaceCache } from '@/components/workspace/cache-events';
import { showAdminFeedback } from './admin-feedback';
import type { AdminSaveResult } from './admin-save-result';

type AdminEditFormProps = Omit<ComponentProps<'form'>, 'action'> & {
  action: (formData: FormData) => Promise<AdminSaveResult>;
  resetOnSuccess?: boolean;
  onSuccess?: () => void;
};

// React resets successful action forms. Radix Select listens for that native
// reset event and restores its mount-time value, even for controlled selects.
// Editing is not creation: retain the submitted fields while the action returns
// refreshed server data instead of resetting them to the pre-edit snapshot.
export function AdminEditForm({ action, resetOnSuccess = false, onSuccess, ...props }: AdminEditFormProps) {
  const router = useRouter();
  const [dirty, setDirty] = useState(false);
  const [refreshing, startTransition] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const allowReset = useRef(false);
  const lastFocus = useRef<HTMLElement | null>(null);
  const [result, formAction, pending] = useActionState<AdminSaveResult, FormData>(
    async (_previous: AdminSaveResult, formData: FormData): Promise<AdminSaveResult> => {
      try {
        const response = await action(formData);
        if (response.status === 'success') {
          setDirty(false);
          invalidateWorkspaceCache(response.refresh ? undefined : ['/workspace/admin']);
          for (const [name, value] of Object.entries(response.fields ?? {})) {
            const field = form.current?.elements.namedItem(name);
            if (field instanceof HTMLInputElement && field.type !== 'hidden' && field.value === String(formData.get(name) ?? '')) field.value = value;
          }
        }
        showAdminFeedback(response);
        return response;
      } catch {
        showAdminFeedback({ status: 'error', message: '连接中断，操作结果暂未确认。请刷新核对状态后再重试。' });
        return { status: 'error', message: '连接中断，操作结果暂未确认。请刷新核对状态后再重试。' };
      }
    },
    { status: 'idle', message: '' },
  );

  useUnsavedChanges(dirty || pending);
  useEffect(() => {
    if (result.status === 'idle') return;
    // Run after the write action has settled. A slow follow-up read must not
    // keep a successfully saved row in the form's pending state.
    if (result.status === 'success') {
      if (resetOnSuccess) {
        allowReset.current = true;
        form.current?.reset();
        allowReset.current = false;
      }
      if (result.refresh !== false) startTransition(() => router.refresh());
      onSuccess?.();
    }
  }, [result, router, resetOnSuccess, onSuccess, startTransition]);

  useEffect(() => { if (!pending && !refreshing && lastFocus.current?.isConnected) lastFocus.current.focus({ preventScroll: true }); }, [pending, refreshing]);

  return (
    <form
      {...props}
      data-managed-cache=""
      inert={pending || refreshing}
      aria-busy={pending || refreshing}
      onInput={event => { setDirty(true); props.onInput?.(event); }}
      onSubmitCapture={event => { lastFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null; props.onSubmitCapture?.(event); }}
      ref={form}
      action={formAction}
      onResetCapture={(event) => {
        if (allowReset.current) return;
        event.preventDefault();
        event.stopPropagation();
      }}
    />
  );
}
