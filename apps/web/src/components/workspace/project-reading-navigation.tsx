'use client';

import { ListTree } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

type ReadingItem = {
  id: string;
  label: string;
};

export function ProjectReadingNavigation({ items }: { items: ReadingItem[] }) {
  const [progress, setProgress] = useState(0);
  const [activeId, setActiveId] = useState(items[0]?.id ?? '');

  useEffect(() => {
    let frame: number | undefined;
    const updateProgress = () => {
      if (frame) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const available = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        setProgress(Math.min(100, Math.max(0, (window.scrollY / available) * 100)));
      });
    };

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((left, right) => left.boundingClientRect.top - right.boundingClientRect.top);
      if (visible[0]) setActiveId(visible[0].target.id);
    }, { rootMargin: '-18% 0px -68% 0px', threshold: [0, 1] });

    items.forEach((item) => {
      const heading = document.getElementById(item.id);
      if (heading) observer.observe(heading);
    });
    updateProgress();
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('scroll', updateProgress);
      window.removeEventListener('resize', updateProgress);
    };
  }, [items]);

  function scrollTo(item: ReadingItem) {
    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (!items.length) return null;

  return (
    <>
      <div aria-hidden="true" className="fixed inset-x-0 top-0 z-50 h-0.5 pointer-events-none">
        <span className="block h-full bg-primary transition-[width] duration-100" style={{ width: `${progress}%` }} />
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-3 right-3 z-30 h-10 rounded-[12px] border-border bg-background/95 px-3.5 text-[12px] font-semibold text-foreground shadow-[0_14px_38px_rgba(0,0,0,.32)] backdrop-blur hover:bg-muted hover:text-foreground md:bottom-[22px] md:right-[22px]"
            size="sm"
            type="button"
            variant="outline"
          >
            <ListTree className="size-3.5" />
            目录
          </Button>
        </SheetTrigger>
        <SheetContent className="w-[min(340px,calc(100vw-32px))] border-border bg-background p-0 sm:right-4 sm:top-4 sm:bottom-4 sm:h-auto sm:rounded-[24px]" side="right">
          <SheetHeader className="border-b border-border pr-14">
            <SheetTitle className="text-[18px]">内容目录</SheetTitle>
            <SheetDescription>点击章节快速定位，内容仍以当前正式版本为准。</SheetDescription>
          </SheetHeader>
          <nav aria-label="项目详情章节" className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
            {items.map((item, index) => (
              <SheetClose asChild key={item.id}>
                <button
                  className={`grid w-full grid-cols-[28px_minmax(0,1fr)] gap-2 rounded-[12px] px-3 py-2.5 text-left text-[12px] font-semibold leading-5 transition ${activeId === item.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                  onClick={() => scrollTo(item)}
                  type="button"
                >
                  <span className="pt-0.5 text-[10px] tracking-[.08em] opacity-70">{String(index + 1).padStart(2, '0')}</span>
                  <span>{item.label}</span>
                </button>
              </SheetClose>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
