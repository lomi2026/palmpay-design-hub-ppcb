'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useIsNavigationSnapshot, useNavigationCache } from './navigation-cache';
const decisions = new WeakMap<Event, boolean>();
export function confirmWorkspaceNavigation() {
  return window.dispatchEvent(new Event('workspace-before-navigate', { cancelable: true }));
}
export function useUnsavedChanges(dirty: boolean) {
  const pathname = usePathname();
  const ownerPath = useRef(pathname);
  const snapshot = useIsNavigationSnapshot();
  const cache = useNavigationCache();
  const current = useRef(false);
  const navigating = useRef(false);
  useEffect(() => { current.current = dirty && !snapshot && ownerPath.current === pathname; navigating.current = Boolean(cache?.pending) && !cache?.failed; }, [dirty, snapshot, pathname, cache?.pending, cache?.failed]);
  useEffect(() => {
    const confirm = (event: Event) => {
      if (decisions.has(event)) return decisions.get(event);
      if (!current.current || navigating.current) return true;
      const answer = window.confirm('还有未保存的更改或上传任务。确定离开吗？'); decisions.set(event, answer); return answer;
    };
    const unload = (event: BeforeUnloadEvent) => { if (current.current) { event.preventDefault(); event.returnValue = ''; } };
    const request = (event: Event) => { if (!confirm(event)) event.preventDefault(); };
    const click = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest('a[href]') : null;
      if (!(link instanceof HTMLAnchorElement) || link.target === '_blank' || link.hasAttribute('download') || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.href === location.href || link.hash && link.pathname === location.pathname) return;
      if (!confirm(event)) { event.preventDefault(); event.stopPropagation(); }
    };
    const url = location.href; const state = history.state;
    const pop = (event: PopStateEvent) => {
      if (current.current && !confirm(event)) { event.stopImmediatePropagation(); history.pushState(state, '', url); }
    };
    window.addEventListener('beforeunload', unload);
    window.addEventListener('workspace-before-navigate', request);
    document.addEventListener('click', click, true);
    window.addEventListener('popstate', pop, true);
    return () => { window.removeEventListener('beforeunload', unload); window.removeEventListener('workspace-before-navigate', request); document.removeEventListener('click', click, true); window.removeEventListener('popstate', pop, true); };
  }, []);
}
