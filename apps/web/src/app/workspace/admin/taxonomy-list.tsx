'use client';

import { useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { taxonomyPages } from './add-taxonomy-dialog';

type Item = { id: string; contentTypes: string[]; content: ReactNode };
export function TaxonomyList({ kind, items }: { kind: 'category' | 'tag'; items: Item[] }) {
  const [selected, setSelected] = useState('all');
  const filters = kind === 'category' ? [['all', '全部'], ...taxonomyPages] : [['all', '全部'], ['general', '通用'], ['scoped', '指定页面']];
  const matches = (item: Item) => selected === 'all' || (kind === 'category' ? item.contentTypes.includes(selected) : selected === 'general' ? !item.contentTypes.length : item.contentTypes.length > 0);
  const count = items.filter(matches).length;
  return <div className="mt-4">
    <div role="group" aria-label={kind === 'category' ? '分类适用页面' : '标签适用范围'} className="flex flex-wrap gap-2">
      {filters.map(([value, label]) => <Button key={value} type="button" size="sm" variant={selected === value ? 'default' : 'outline'} aria-pressed={selected === value} onClick={() => setSelected(value)}>{label}</Button>)}
    </div>
    <p aria-live="polite" className="mt-3 text-xs text-muted-foreground">共 {count} 项</p>
    <ul className="mt-2 divide-y divide-border">
      {items.map(item => <li key={item.id} className={matches(item) ? 'flex flex-wrap items-center gap-3 py-2 text-sm' : 'hidden'}>{item.content}</li>)}
    </ul>
    {!count ? <p className="mt-3 rounded-xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">{kind === 'category' ? '此页面类型下暂无分类。' : selected === 'scoped' ? '暂无指定页面的标签。' : selected === 'general' ? '暂无通用标签。' : '暂无标签。'}</p> : null}
  </div>;
}
