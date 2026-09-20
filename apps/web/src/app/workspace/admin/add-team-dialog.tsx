'use client';

import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AdminEditForm } from './admin-edit-form';
import { AdminSubmitButton } from './admin-submit-button';
import { createTeamAction } from './actions';

type Props = {
  organizationId: string;
  users: Array<{ id: string; name: string; status: string }>;
};

export function AddTeamDialog({ organizationId, users }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <Dialog open={open} onOpenChange={(value) => { if (!saving) setOpen(value); }}>
      <DialogTrigger asChild><Button><Plus aria-hidden="true" />新增团队</Button></DialogTrigger>
      <DialogContent className="p-6 sm:max-w-xl" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>新增团队</DialogTitle>
          <DialogDescription>填写团队名称，可选择一位负责人。</DialogDescription>
        </DialogHeader>
        <AdminEditForm action={async (data) => {
          setSaving(true);
          try { return await createTeamAction(data); } finally { setSaving(false); }
        }} onSuccess={close} className="space-y-6">
          <input type="hidden" name="organizationId" value={organizationId} />
          <div className="grid gap-4">
            <label className="grid gap-2">团队名称<Input name="name" required maxLength={100} placeholder="输入新团队名称" /></label>
            <label className="grid gap-2">负责人<NativeSelect fitOptions name="ownerId" defaultValue="" className="w-full"><option value="">暂不指定</option>{users.filter(user => user.status === 'ACTIVE').map(user => <option key={user.id} value={user.id}>{user.name}</option>)}</NativeSelect></label>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" disabled={saving} onClick={close}>取消</Button>
            <AdminSubmitButton pendingLabel="新增中…">新增团队</AdminSubmitButton>
          </div>
        </AdminEditForm>
      </DialogContent>
    </Dialog>
  );
}
