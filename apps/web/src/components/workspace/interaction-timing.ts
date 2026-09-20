'use client';
let sequence = 0;
export function startNavigationTiming(cached: boolean) {
  const id = ++sequence;
  const start = `workspace-navigation-${id}`;
  performance.mark(start);
  requestAnimationFrame(() => {
    if (!performance.getEntriesByName(start).length) return;
    performance.measure('workspace:feedback', { start, detail: { cached } });
    if (cached) performance.measure('workspace:cached-content', { start });
  });
  return () => {
    performance.measure('workspace:fresh-content', { start, detail: { cached } });
    performance.clearMarks(start);
    for (const name of ['workspace:feedback', 'workspace:cached-content', 'workspace:fresh-content']) {
      if (performance.getEntriesByName(name).length > 100) performance.clearMeasures(name);
    }
  };
}
