'use client';
import { useEffect } from 'react';
import { useNavigationCache } from '@/components/workspace/navigation-cache';
import { WorkspaceDataLink } from '@/components/workspace/workspace-data-link';
export default function NotFound() {
  const cache = useNavigationCache();
  const cancel = cache?.cancel;
  const invalidate = cache?.invalidate;
  useEffect(() => { invalidate?.(); cancel?.(); }, [invalidate, cancel]);
  return <main className="px-5 py-8"><section className="workspace-page-card rounded-3xl bg-card p-6"><h1 className="text-2xl font-semibold">内容不存在或已不可访问</h1><p className="mt-3 text-muted-foreground">该内容可能已删除、下架，或当前账号没有访问权限。</p><WorkspaceDataLink className="mt-6 inline-block underline" href="/workspace">返回工作台</WorkspaceDataLink></section></main>;
}
