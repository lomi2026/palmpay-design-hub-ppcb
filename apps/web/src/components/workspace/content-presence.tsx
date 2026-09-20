'use client';
import { useEffect, useState, type ReactNode } from 'react';
export function ContentPresence({ id, children }: { id: string; children: ReactNode }) {
  const [removed, setRemoved] = useState(false);
  useEffect(() => {
    const changed = (event: Event) => { if ((event as CustomEvent<string>).detail === id) setRemoved(true); };
    window.addEventListener('workspace-content-removed', changed);
    return () => window.removeEventListener('workspace-content-removed', changed);
  }, [id]);
  return removed ? null : <div style={{ display: 'contents' }}>{children}</div>;
}
