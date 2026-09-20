'use client';
import { useEffect, useRef, type ReactNode } from 'react';

export function ManagementMenu({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      const menu = ref.current;
      if (menu?.open && event.target instanceof Node && !menu.contains(event.target)) menu.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || document.querySelector('[role="dialog"]')) return;
      if (ref.current?.open) { ref.current.open = false; ref.current.querySelector('summary')?.focus(); }
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', closeOutside); document.removeEventListener('keydown', escape); };
  }, []);
  return <details ref={ref} className="management-menu">{children}</details>;
}
