'use client';

import { FilePenLine } from 'lucide-react';
import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AdminEditForm } from './admin-edit-form';
import { AdminSubmitButton } from './admin-submit-button';
import { updateUserAction } from './actions';

type Member = { id: string; name: string; email: string; status: string; primaryTeam: { id: string; name: string } | null; userRoles: Array<{ role: { name: string } }> };
export function EditUserDialog({ organizationId, member, teams }: { organizationId: string; member: Member; teams: Array<{ id: string; name: string; status: string }> }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  return <Dialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}>
    <DialogTrigger asChild><Button type="button" variant="outline"><FilePenLine aria-hidden="true" className="size-4" />编辑</Button></DialogTrigger>
    <DialogContent className="p-6 sm:max-w-xl" showCloseButton={!saving}>
      <DialogHeader><DialogTitle>编辑用户</DialogTitle><DialogDescription>修改用户基本信息和归属团队。邮箱用于现有邮箱登录方式，请确认填写正确。</DialogDescription></DialogHeader>
      <AdminEditForm onSubmit={event => event.stopPropagation()} onSuccess={close} className="space-y-6" action={async data => { setSaving(true); try { return await updateUserAction(data); } finally { setSaving(false); } }}>
        <input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="userId" value={member.id} /><input type="hidden" name="status" value={member.status} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2">用户邮箱<Input name="email" type="email" required maxLength={320} defaultValue={member.email} /></label>
          <label className="grid gap-2">用户姓名<Input name="name" required maxLength={100} defaultValue={member.name} /></label>
          <div className="grid gap-2"><span>用户角色</span><p className="text-sm text-muted-foreground">{member.userRoles.map(item => item.role.name).join('、') || '暂无角色'}</p><p className="text-xs text-muted-foreground">请在“角色权限”中调整。</p></div>
          <label className="grid gap-2">归属团队<NativeSelect name="teamId" defaultValue={member.primaryTeam?.id ?? ''}><option value="">暂不分配</option>{teams.filter(team => team.status === 'ACTIVE' || team.id === member.primaryTeam?.id).map(team => <option key={team.id} value={team.id}>{team.name}{team.status === 'ACTIVE' ? '' : '（已停用）'}</option>)}</NativeSelect></label>
        </div>
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={saving} onClick={close}>取消</Button><AdminSubmitButton>保存</AdminSubmitButton></div>
      </AdminEditForm>
    </DialogContent>
  </Dialog>;
}
