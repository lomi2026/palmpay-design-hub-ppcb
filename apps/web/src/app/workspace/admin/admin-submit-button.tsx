'use client';

import { Plus, Save } from 'lucide-react';
import { useFormStatus } from 'react-dom';

import { Button } from '@/components/ui/button';
import type { ComponentProps } from 'react';

type AdminSubmitButtonProps = ComponentProps<typeof Button> & {
  pendingLabel?: string;
};

export function AdminSubmitButton({
  children,
  disabled,
  pendingLabel = '保存中…',
  ...props
}: AdminSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button {...props} aria-disabled={pending || disabled} disabled={pending || disabled} type="submit">
      {!pending && typeof children === 'string' && /^(新增|添加)/.test(children) ? <Plus aria-hidden="true" /> : !pending && children === '保存' && (!props.variant || props.variant === 'default') ? <Save aria-hidden="true" /> : null}
      {pending ? pendingLabel : children}
    </Button>
  );
}
