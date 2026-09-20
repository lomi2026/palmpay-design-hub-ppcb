'use client';
import { useCallback, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AdminEditForm } from './admin-edit-form';
import { AdminSubmitButton } from './admin-submit-button';
import { createCategoryAction, createTagAction } from './actions';

export const taxonomyPages = [['DESIGN_ASSET', '设计资产'], ['AI_TOOL', 'AI 工具'], ['AI_SKILL', 'AI Skill'], ['AI_CASE', 'AI 案例'], ['AI_PROJECT', 'AI 项目库']] as const;
export function AddTaxonomyDialog({ kind }: { kind: 'category' | 'tag' }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scope, setScope] = useState('all');
  const [types, setTypes] = useState<string[]>([]);
  const close = useCallback(() => setOpen(false), []);
  const label = kind === 'category' ? '分类' : '标签';
  return <Dialog open={open} onOpenChange={value => { if (!saving) { setOpen(value); if (value) { setScope('all'); setTypes([]); } } }}>
    <DialogTrigger asChild><Button><Plus aria-hidden />新增{label}</Button></DialogTrigger>
    <DialogContent className="p-6 sm:max-w-xl" showCloseButton={!saving}>
      <DialogHeader><DialogTitle>新增{label}</DialogTitle><DialogDescription>{kind === 'category' ? '填写分类名称并选择适用页面。' : '填写标签名称并设置适用页面。新增标签默认停用，启用后可用于发布。'}</DialogDescription></DialogHeader>
      <AdminEditForm className="space-y-6" onSuccess={close} action={async data => {
        if (kind === 'tag' && scope === 'selected' && !types.length) return { status: 'error', message: '请至少选择一个适用页面。' };
        setSaving(true); try { return await (kind === 'category' ? createCategoryAction : createTagAction)(data); } finally { setSaving(false); }
      }}>
        <label className="grid gap-2">{label}名称<Input name="name" required maxLength={100} placeholder={`输入${label}名称`} /></label>
        {kind === 'category' ? <label className="grid gap-2">适用页面<NativeSelect name="contentType" defaultValue="DESIGN_ASSET">{taxonomyPages.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</NativeSelect></label> : <fieldset className="grid gap-3"><legend className="mb-2 text-sm">适用页面</legend>
          <div className="flex gap-4"><label className="flex items-center gap-2"><input type="radio" name="scope" value="all" checked={scope === 'all'} onChange={() => setScope('all')} />通用（全部页面）</label><label className="flex items-center gap-2"><input type="radio" name="scope" value="selected" checked={scope === 'selected'} onChange={() => setScope('selected')} />指定页面</label></div>
          {scope === 'selected' ? <div className="grid grid-cols-2 gap-3 rounded-xl border border-border p-4">{taxonomyPages.map(([value, name]) => <label className="flex items-center gap-2" key={value}><input type="checkbox" name="contentTypes" value={value} checked={types.includes(value)} onChange={event => setTypes(previous => event.target.checked ? [...previous, value] : previous.filter(type => type !== value))} />{name}</label>)}</div> : null}
        </fieldset>}
        <div className="flex justify-end gap-3"><Button type="button" variant="outline" disabled={saving} onClick={close}>取消</Button><AdminSubmitButton pendingLabel="新增中…">新增{label}</AdminSubmitButton></div>
      </AdminEditForm>
    </DialogContent>
  </Dialog>;
}
