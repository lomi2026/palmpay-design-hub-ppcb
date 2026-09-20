'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type TaxonomySelection = { categoryId: string | null; tagIds: string[] };
export type TaxonomyOptions = {
  categories: { id: string; name: string; status: string; contentTypes: string[] }[];
  tags: { id: string; name: string; status: string; contentTypes?: string[] }[];
};

export function TaxonomyFields({ options, contentType, initialSelection, onChange }: {
  options: TaxonomyOptions;
  contentType: string;
  initialSelection?: TaxonomySelection;
  onChange?: () => void;
}) {
  const [categoryId, setCategoryId] = useState(initialSelection?.categoryId ?? '');
  const [tagIds, setTagIds] = useState(initialSelection?.tagIds ?? []);
  const categories = options.categories.filter((category) =>
    (category.status === 'ACTIVE' && category.contentTypes.includes(contentType)) || category.id === categoryId);
  return <fieldset className="grid gap-4 rounded-xl border border-[var(--v9-line)] p-4">
    <legend className="px-1 text-sm font-medium">分类与标签</legend>
    <p className="text-xs leading-5 text-[var(--v9-muted)]">分类可选一项，标签可选多项。停用项不能新增选择；已有的停用关联可以保留或移除，不影响历史内容。</p>
    <input name="categoryId" type="hidden" value={categoryId} />
    {tagIds.map((id) => <input key={id} name="tagIds" type="hidden" value={id} />)}
    <div className="grid gap-2"><label htmlFor="content-category" className="text-sm">分类</label>
      <Select value={categoryId || '__none__'} onValueChange={(value) => { setCategoryId(value === '__none__' ? '' : value); onChange?.(); }}>
        <SelectTrigger id="content-category" className="w-full"><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="__none__">未分类</SelectItem>{categories.map((category) => <SelectItem key={category.id} value={category.id} disabled={category.status !== 'ACTIVE' || !category.contentTypes.includes(contentType)}>{category.name}{category.status !== 'ACTIVE' ? '（已停用）' : !category.contentTypes.includes(contentType) ? '（不再适用，历史关联）' : ''}</SelectItem>)}</SelectContent>
      </Select>
      {!categories.length ? <p className="text-xs text-[var(--v9-muted)]">此内容类型暂无可用分类，可先保存草稿。</p> : null}
    </div>
    <div className="grid gap-2"><span className="text-sm">标签（多选）</span><div className="flex flex-wrap gap-2">
      {options.tags.filter((tag) => (tag.status === 'ACTIVE' && (!tag.contentTypes?.length || tag.contentTypes.includes(contentType))) || tagIds.includes(tag.id)).map((tag) => {
        const selected = tagIds.includes(tag.id);
        return <Button key={tag.id} type="button" size="sm" variant={selected ? 'default' : 'outline'} aria-pressed={selected} onClick={() => { setTagIds(selected ? tagIds.filter((id) => id !== tag.id) : [...tagIds, tag.id]); onChange?.(); }}>{tag.name}{tag.status !== 'ACTIVE' ? '（已停用）' : tag.contentTypes?.length && !tag.contentTypes.includes(contentType) ? '（不再适用，历史关联）' : ''}{selected ? ' ×' : ''}</Button>;
      })}
      {!options.tags.some(tag => (tag.status === 'ACTIVE' && (!tag.contentTypes?.length || tag.contentTypes.includes(contentType))) || tagIds.includes(tag.id)) ? <p className="text-xs text-[var(--v9-muted)]">暂无可用标签，可先保存草稿。</p> : null}
    </div></div>
  </fieldset>;
}
