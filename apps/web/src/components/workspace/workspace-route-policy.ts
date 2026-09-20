/** Data-backed workspace pages must not be read before the user enters them. */
export function shouldPrefetchWorkspaceRoute(href: string) {
  const pathname = href.split('?')[0] ?? '';
  return pathname !== '/workspace' && !pathname.startsWith('/workspace/');
}

export function filterWorkspaceWarmRoutes(routes: string[]) {
  return routes.filter(shouldPrefetchWorkspaceRoute);
}
