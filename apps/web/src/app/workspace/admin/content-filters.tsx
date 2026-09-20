'use client';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WorkspaceFilterForm } from '@/components/workspace/workspace-filter-form';
import { WorkspaceDataLink } from '@/components/workspace/workspace-data-link';
import { taxonomyPages } from './add-taxonomy-dialog';

export function ContentFilters({ type, status, search, categoryId, tagId }: { type: string; status: string; search: string; categoryId?: string; tagId?: string }) {
  const [selectedType, setType] = useState(type);
  const [selectedStatus, setStatus] = useState(status);
  const typeInput = useRef<HTMLInputElement>(null);
  const statusInput = useRef<HTMLInputElement>(null);
  const choose = (field: 'type' | 'status', value: string) => {
    const input = field === 'type' ? typeInput.current : statusInput.current;
    if (!input) return;
    input.value = value;
    if (field === 'type') setType(value); else setStatus(value);
    input.form?.requestSubmit();
  };
  return <WorkspaceFilterForm action="/workspace/admin" className="mt-4 space-y-4">
    <input name="tab" type="hidden" value="content" />
    <input ref={typeInput} name="type" type="hidden" value={selectedType} />
    <input ref={statusInput} name="status" type="hidden" value={selectedStatus} />
    {categoryId ? <input name="categoryId" type="hidden" value={categoryId} /> : null}
    {tagId ? <input name="tagId" type="hidden" value={tagId} /> : null}
    <div className="flex flex-wrap items-center gap-3"><Input aria-label="关键词" name="search" defaultValue={search} maxLength={200} placeholder="搜索标题或摘要" className="min-w-48 flex-1" /><Button type="submit" variant="outline">搜索</Button>{type || status || search || categoryId || tagId ? <Button asChild variant="ghost"><WorkspaceDataLink href="/workspace/admin?tab=content">重置</WorkspaceDataLink></Button> : null}</div>
    <div role="group" aria-label="内容类型" className="flex flex-wrap items-center gap-2"><span className="mr-2 text-xs text-muted-foreground">内容类型</span>{([['', '全部'], ...taxonomyPages] as const).map(([value, label]) => <Button key={value} type="button" size="sm" variant={selectedType === value ? 'default' : 'outline'} aria-pressed={selectedType === value} onClick={() => choose('type', value)}>{label}</Button>)}</div>
    <div role="group" aria-label="发布状态" className="flex flex-wrap items-center gap-2"><span className="mr-2 text-xs text-muted-foreground">发布状态</span>{([['', '全部'], ['DRAFT', '草稿'], ['PUBLISHED', '已发布'], ['UNPUBLISHED', '已下架'], ['ARCHIVED', '已归档']] as const).map(([value, label]) => <Button key={value} type="button" size="sm" variant={selectedStatus === value ? 'default' : 'outline'} aria-pressed={selectedStatus === value} onClick={() => choose('status', value)}>{label}</Button>)}</div>
  </WorkspaceFilterForm>;
}
