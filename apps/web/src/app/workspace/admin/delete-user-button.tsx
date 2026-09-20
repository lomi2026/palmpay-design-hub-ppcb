"use client";
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { AdminEditForm } from './admin-edit-form';
import { AdminSubmitButton } from './admin-submit-button';
import { deleteUserAction } from './actions';
export function DeleteUserButton({ organizationId, userId, name }: { organizationId: string; userId: string; name: string }) {
 const [open, setOpen] = useState(false);
 return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button type="button" variant="outline" size="default" className="h-10 border-border bg-transparent text-xs text-foreground"><Trash2 className="size-4" />删除</Button></DialogTrigger><DialogContent><DialogTitle>删除用户</DialogTitle><DialogDescription>确认删除“{name}”？账号将无法登录并移出用户列表，历史内容和审计记录保留。仍负责内容或团队时，请先完成交接。</DialogDescription><AdminEditForm onSubmit={event => event.stopPropagation()} action={deleteUserAction} className="mt-4 space-y-4"><input type="hidden" name="organizationId" value={organizationId} /><input type="hidden" name="userId" value={userId} /><div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setOpen(false)}>取消</Button><AdminSubmitButton variant="destructive" pendingLabel="删除中…">确认删除</AdminSubmitButton></div></AdminEditForm></DialogContent></Dialog>;
}
