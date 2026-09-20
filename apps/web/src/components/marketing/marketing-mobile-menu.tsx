'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

import { Button } from '@/components/ui/button';

const navigation = [
  ['首页', '#home'],
  ['设计资产', '#assets'],
  ['AI Skill', '#skills'],
  ['探索项目', '/workspace/ai-projects'],
  ['AI 案例', '#cases'],
  ['业务影响', '#impact'],
] as const;

export function MarketingMobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:hidden">
      <Button type="button" variant="outline" size="icon-sm" aria-label={open ? '关闭导航菜单' : '打开导航菜单'} aria-expanded={open} onClick={() => setOpen((current) => !current)} className="size-10 rounded-[12px] border-white/[.1] bg-white/[.035] text-white hover:bg-white/[.08] hover:text-white">
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </Button>
      {open ? <nav aria-label="移动端导航" className="absolute right-4 top-[78px] z-40 grid w-[min(280px,calc(100vw-32px))] rounded-[16px] border border-white/[.16] bg-[#111113] p-2 shadow-2xl shadow-black/50">{navigation.map(([label, href]) => <Link href={href} key={label} onClick={() => setOpen(false)} className="rounded-[12px] px-3 py-3 text-[12px] text-white/65 transition hover:bg-white/[.08] hover:text-white">{label}</Link>)}</nav> : null}
    </div>
  );
}
