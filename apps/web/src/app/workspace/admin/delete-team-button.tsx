'use client';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AdminEditForm } from './admin-edit-form';
import { AdminSubmitButton } from './admin-submit-button';
import { deleteTeamAction } from './actions';

export function DeleteTeamButton({ organizationId, teamId, name }: { organizationId: string; teamId: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return <Dialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}>
    <DialogTrigger asChild><Button type="button" aria-label={`删除团队 ${name}`} size="default" variant="outline" className="h-10 w-12 shrink-0 border-border bg-transparent px-0 text-xs text-foreground">删除</Button></DialogTrigger>
    <DialogContent showCloseButton={!saving}><DialogTitle>删除团队</DialogTitle><DialogDescription>确认删除“{name}”？有关联成员、内容或项目时无法删除。</DialogDescription>
      <AdminEditForm onSuccess={close} action={async data => { setSaving(true); try { return await deleteTeamAction(data); } finally { setSaving(false); } }} onSubmit={event => event.stopPropagation()} className="mt-4 flex justify-end gap-3">
        <input name="organizationId" type="hidden" value={organizationId} /><input name="teamId" type="hidden" value={teamId} />
        <Button type="button" variant="outline" disabled={saving} onClick={close}>取消</Button><AdminSubmitButton variant="destructive" pendingLabel="删除中…">确认删除</AdminSubmitButton>
      </AdminEditForm>
    </DialogContent>
  </Dialog>;
}
