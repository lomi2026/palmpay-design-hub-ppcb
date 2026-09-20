'use client';

import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AdminEditForm } from './admin-edit-form';
import { AdminSubmitButton } from './admin-submit-button';
import { createUserAction } from './actions';

type Props = {
  organizationId: string;
  roles: Array<{ id: string; name: string }>;
  teams: Array<{ id: string; name: string; status: string }>;
};

export function AddUserDialog({ organizationId, roles, teams }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return (
    <Dialog open={open} onOpenChange={(value) => { if (!saving) setOpen(value); }}>
      <DialogTrigger asChild><Button><Plus aria-hidden="true" />添加用户</Button></DialogTrigger>
      <DialogContent className="p-6 sm:max-w-xl" showCloseButton={!saving}>
        <DialogHeader>
          <DialogTitle>新增用户</DialogTitle>
          <DialogDescription>创建后账号启用，所选角色在当前组织内生效。用户通过现有登录方式进入平台。</DialogDescription>
        </DialogHeader>
        <AdminEditForm action={async (data) => {
          setSaving(true);
          try { return await createUserAction(data); } finally { setSaving(false); }
        }} onSuccess={close} className="space-y-6">
          <input type="hidden" name="organizationId" value={organizationId} />
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">用户邮箱<Input type="email" name="email" required maxLength={320} placeholder="请输入登录邮箱" /></label>
            <label className="grid gap-2">用户姓名<Input name="name" required maxLength={100} placeholder="请输入姓名" /></label>
            <label className="grid gap-2">用户角色<NativeSelect fitOptions name="roleId" required defaultValue="" className="w-full"><option value="" disabled>请选择角色</option>{roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</NativeSelect></label>
            <label className="grid gap-2">归属团队<NativeSelect fitOptions name="teamId" required defaultValue="" className="w-full"><option value="" disabled>请选择团队</option>{teams.filter(team => team.status === 'ACTIVE').map(team => <option key={team.id} value={team.id}>{team.name}</option>)}</NativeSelect></label>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" disabled={saving} onClick={close}>取消</Button>
            <AdminSubmitButton pendingLabel="添加中…">添加用户</AdminSubmitButton>
          </div>
        </AdminEditForm>
      </DialogContent>
    </Dialog>
  );
}
