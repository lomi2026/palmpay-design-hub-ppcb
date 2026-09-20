import { serverApiFetch } from './api';
import { authenticatedApiHeaders } from './auth';
import type { ContentListResponse, ContentType } from './content-types';
export type ContentReference = { id: string; title: string; href: string };
const routes: Record<ContentType, string> = {
  DESIGN_ASSET: 'design-assets',
  AI_TOOL: 'ai-tools',
  AI_SKILL: 'ai-skills',
  AI_CASE: 'ai-cases',
  AI_PROJECT: 'ai-projects',
};
export function referenceType(name: string): ContentType {
  return name.toLowerCase().includes('skill')
    ? 'AI_SKILL'
    : name.toLowerCase().includes('case')
      ? 'AI_CASE'
      : name.toLowerCase().includes('project')
        ? 'AI_PROJECT'
        : 'DESIGN_ASSET';
}
export async function listContentReferences(type: ContentType): Promise<ContentReference[]> {
  const headers = await authenticatedApiHeaders();
  const items: ContentReference[] = [];
  let page = 1;
  while (true) {
    const result = await serverApiFetch<ContentListResponse>(
      `/api/contents?type=${type}&pageSize=100&page=${page}`,
      { headers },
    );
    items.push(
      ...result.items.map((item) => ({
        id: item.id,
        title: item.title,
        href: `/workspace/${routes[item.contentType]}/${encodeURIComponent(item.slug)}`,
      })),
    );
    if (!result.items.length || page * result.pageSize >= result.total) break;
    page++;
  }
  return items;
}
export async function resolveContentReferences(
  body: Record<string, unknown>,
): Promise<ContentReference[]> {
  const entries = Object.entries(body).filter(
    ([key, value]) =>
      key.startsWith('related') &&
      (Array.isArray(value) ? value.length : typeof value === 'string' && value.trim()),
  );
  const types = [...new Set(entries.map(([key]) => referenceType(key)))];
  const ids = new Set(
    entries.flatMap(([, value]) => (Array.isArray(value) ? value : String(value).split('\n'))),
  );
  return (await Promise.all(types.map(listContentReferences)))
    .flat()
    .filter((item) => ids.has(item.id));
}
