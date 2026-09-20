'use client';
import { confirmWorkspaceNavigation } from '@/components/workspace/use-unsaved-changes';

import { useNavigationCache } from './navigation-cache';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function WorkspaceSearchShortcut() {
  const router = useRouter();
  const cache = useNavigationCache();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
    if (!confirmWorkspaceNavigation()) return;
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    const href = `/workspace/search${trimmedQuery ? `?q=${encodeURIComponent(trimmedQuery)}` : ''}`;
    if (!navigator.onLine) { cache?.fail(() => { cache.begin(href); router.push(href); }); setOpen(false); return; }
    if (href === location.pathname + location.search) { cache?.cancel(); router.refresh(); } else { cache?.begin(href); router.push(href); }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          aria-label="全局搜索"
          className="mx-auto flex h-10 w-10 lg:h-9 lg:w-[450px] justify-start rounded-[12px] border-[var(--v9-line)] bg-[var(--v9-field)] px-3 lg:px-4 text-[12px] font-normal text-[var(--v9-subtle)] hover:bg-[var(--v9-soft-hover)] hover:text-[var(--v9-text)] lg:flex"
        >
          <Search className="size-4 lg:mr-2" /><span className="hidden lg:inline">搜索资产、工具、Skill、案例或项目</span>
          <kbd className="ml-auto hidden lg:inline rounded border border-[var(--v9-line)] px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="workspace-search-panel gap-0 overflow-hidden border-0 bg-popover p-0 text-popover-foreground shadow-none" showCloseButton>
        <DialogHeader className="px-6 pt-6 pb-0 pr-14">
          <DialogTitle className="text-[22px] font-semibold">搜索团队内容</DialogTitle>
          <DialogDescription className="text-[12px] text-muted-foreground">输入部分名称或多个关键词，查找资产、工具、Skill、案例和项目。</DialogDescription>
        </DialogHeader>
        <form className="p-6" onSubmit={submit}>
          <label className="sr-only" htmlFor="workspace-global-search">搜索资产、工具、Skill、案例或项目</label>
          <div className="flex gap-2">
            <Input
              autoFocus
              className="h-14 min-w-0 border-border bg-background px-4 text-base text-foreground placeholder:text-muted-foreground"
              id="workspace-global-search"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="例如：web 组件、数据 分析"
              value={query}
            />
            <Button className="h-14 shrink-0 px-5" type="submit"><Search className="size-4" />搜索</Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-2"><span className="mr-1 text-xs text-muted-foreground">试试搜索</span>{['设计组件', '数据分析', '移动端', '体验优化'].map(term => <button key={term} type="button" className="rounded-[12px] bg-muted px-3 py-2 text-xs transition hover:bg-accent" onClick={() => setQuery(term)}>{term}</button>)}</div>
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground"><span>支持部分名称 · 空格组合关键词</span><span>Enter 搜索 · Esc 关闭</span></div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
