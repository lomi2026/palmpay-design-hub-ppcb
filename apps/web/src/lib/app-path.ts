/** Next Link/router handle basePath; use this for native URLs, images and fetch. */
export function appPath(path: string) {
  if (!path.startsWith('/') || path.startsWith('//')) return path;
  const base = process.env.NEXT_PUBLIC_APP_BASE_PATH ?? '';
  if (!base || path === base || path.startsWith(`${base}/`)) return path;
  return `${base}${path}`;
}
