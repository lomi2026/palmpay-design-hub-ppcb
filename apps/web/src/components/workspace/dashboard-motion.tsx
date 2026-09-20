'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { useIsNavigationSnapshot } from './navigation-cache';
import { usePathname } from 'next/navigation';

const visited = new Set<string>();
const counted = new Set<string>();

export function DashboardMotion({ children, className }: { children: ReactNode; className?: string }) {
  const root = useRef<HTMLElement>(null);
  const path = usePathname();
  const snapshot = useIsNavigationSnapshot();
  useEffect(() => {
    if (snapshot) return;
    if (visited.has(path)) return;
    visited.add(path);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const animations = Array.from(root.current?.children ?? []).map((element, index) =>
      element.animate([{ opacity: 0.5 }, { opacity: 1 }], {
        duration: 240, delay: Math.min(index * 35, 105), easing: 'ease-out',
      }),
    );
    return () => animations.forEach(animation => animation.cancel());
  }, [path, snapshot]);
  return <main ref={root} className={className}>{children}</main>;
}

export function AnimatedNumber({ value, id }: { value: number; id: string }) {
  const node = useRef<HTMLSpanElement>(null);
  const path = usePathname();
  const snapshot = useIsNavigationSnapshot();
  useEffect(() => {
    if (snapshot) return;
    const key = `${path}:${id}`;
    const element = node.current;
    if (!element || counted.has(key) || matchMedia('(prefers-reduced-motion: reduce)').matches || value === 0) return;
    counted.add(key);
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / 1000);
      element.textContent = String(Math.floor(value * progress));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(frame); element.textContent = String(value); };
  }, [path, id, value, snapshot]);
  return <span className="tabular-nums"><span className="sr-only">{value}</span><span ref={node} aria-hidden="true">{value}</span></span>;
}
