'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { filterWorkspaceWarmRoutes } from './workspace-route-policy';

type WorkspaceRouteWarmerProps = {
  canAnalyze: boolean;
  canCreate: boolean;
  canManage: boolean;
};

/**
 * Route policy excludes all data-backed workspace destinations. Keep the
 * scheduler compatible with future static destinations without warming live data.
 */
export function WorkspaceRouteWarmer({
  canAnalyze,
  canCreate,
  canManage,
}: WorkspaceRouteWarmerProps) {
  const router = useRouter();
  const routes = useMemo(() => {
    const nextRoutes = [
      '/workspace',
      '/workspace/favorites',
      '/workspace/favorites?tab=recent',
      '/workspace/notifications',
      '/workspace/design-assets',
      '/workspace/ai-skills',
      '/workspace/ai-projects',
      '/workspace/ai-cases',
    ];

    if (canCreate) nextRoutes.push('/workspace/contributions', '/workspace/submit');
    if (canAnalyze) nextRoutes.push('/workspace/overview', '/workspace/insights');
    if (canManage) {
      nextRoutes.push(
        '/workspace/admin',
        '/workspace/admin?tab=taxonomy',
        '/workspace/admin?tab=teams',
        '/workspace/admin?tab=users',
        '/workspace/admin?tab=roles',
        '/workspace/admin?tab=audit',
        '/workspace/admin?tab=settings',
      );
    }

    return filterWorkspaceWarmRoutes(nextRoutes);
  }, [canAnalyze, canCreate, canManage]);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: number | undefined;
    let routeIndex = 0;

    const warmNext = () => {
      if (cancelled || routeIndex >= routes.length) return;
      const route = routes[routeIndex];
      if (!route) return;
      router.prefetch(route);
      routeIndex += 1;
      // Pace background reads so they never compete with the page the user is
      // actively viewing, while still warming the compact workspace quickly.
      timeoutId = window.setTimeout(warmNext, 120);
    };

    // Do not compete with the initial route hydration or the first interaction.
    timeoutId = window.setTimeout(warmNext, 500);
    return () => {
      cancelled = true;
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [router, routes]);

  return null;
}
