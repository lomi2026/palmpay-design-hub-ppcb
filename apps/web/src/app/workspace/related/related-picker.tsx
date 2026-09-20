"use client";

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';

const types = [['DESIGN_ASSET', '设计资产'], ['AI_TOOL', 'AI 工具'], ['AI_SKILL', 'AI Skill'], ['AI_PROJECT', 'AI 项目库'], ['AI_CASE', 'AI 案例']];
export function RelatedPicker({ items }: { items: Array<{ id: string; title: string; contentType: string }> }) {
  const [type, setType] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState('');
  const words = query.normalize('NFKC').toLowerCase().trim().split(/\s+/).filter(Boolean);
  const matches = items.filter(item => (!type || item.contentType === type) && words.every(word => item.title.normalize('NFKC').toLowerCase().includes(word)));
  return <div className="min-w-0 space-y-3">
    <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
      <label className="grid gap-2 text-sm font-medium">内容类型<NativeSelect value={type} onChange={e => { setType(e.target.value); setSelected(''); }} className="w-full"><option value="">全部类型（可不选）</option>{types.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</NativeSelect></label>
      <label className="grid gap-2 text-sm font-medium">查找已发布内容<Input value={query} onChange={e => { setQuery(e.target.value); setSelected(''); }} placeholder="手动输入内容名称或关键词" /></label>
    </div>
    <label className="grid gap-2 text-sm font-medium">关联内容<NativeSelect name="targetContentId" required value={selected} onChange={e => setSelected(e.target.value)} className="w-full"><option value="">{matches.length ? '请选择要关联的内容' : '暂无匹配的已发布内容'}</option>{matches.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</NativeSelect></label>
    <p className="text-xs text-muted-foreground">可先选择类型，再选择内容；也可直接输入关键词查找，共 {matches.length} 项。选择后点击添加关联。</p>
  </div>;
}
