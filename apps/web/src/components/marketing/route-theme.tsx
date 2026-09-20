"use client";

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

export function RouteTheme() {
  const pathname = usePathname();
  useLayoutEffect(() => {
    const studio = pathname === '/workspace' || pathname.startsWith('/workspace/');
    const root = document.documentElement;
    root.dataset.design = studio ? 'studio' : 'refined';
    let theme = 'dark';
    try {
      const saved = localStorage.getItem('ppux-theme');
      if (saved === 'light' || saved === 'dark') theme = saved;
    } catch { /* Theme storage is optional. */ }
    root.classList.toggle('dark', theme === 'dark');
    root.style.colorScheme = theme;
    window.dispatchEvent(new Event('v9-theme-change'));
  }, [pathname]);
  return null;
}
