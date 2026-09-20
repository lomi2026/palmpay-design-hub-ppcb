'use client';
import { useState } from 'react';
import { NativeSelect } from '@/components/ui/native-select';
import { Input } from '@/components/ui/input';

export function UsageProjectField({ projects }: { projects: Array<{ id: string; title: string }> }) {
  const [manual, setManual] = useState(false);
  return <div className="space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-3"><span className="text-sm">关联项目</span><div className="flex gap-4 text-sm"><label className="flex items-center gap-2"><input type="radio" name="projectMode" checked={!manual} onChange={() => setManual(false)} />选择已有项目</label><label className="flex items-center gap-2"><input type="radio" name="projectMode" checked={manual} onChange={() => setManual(true)} />手动输入项目</label></div></div>
    {manual ? <Input name="projectName" aria-label="项目名称" required maxLength={200} placeholder="输入实际使用的项目名称" /> : <NativeSelect name="projectContentId" aria-label="关联项目" defaultValue="" required containerClassName="w-full" className="h-10 w-full"><option value="">请选择已有项目</option>{projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}</NativeSelect>}
    <p className="text-xs text-muted-foreground">{manual ? '记录本次使用对应的项目名称，不会自动创建 AI 项目库条目。' : '找不到项目？切换“手动输入项目”填写名称。'}</p>
  </div>;
}
