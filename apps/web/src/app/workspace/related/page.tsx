import { PreviousPageLink } from '@/components/workspace/previous-page-link';
import { EngagementForm } from '@/components/workspace/engagement-form';
import { CachedWorkspacePage } from '@/components/workspace/navigation-cache';
import { RelatedPicker } from './related-picker';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { Button } from '@/components/ui/button';
import { NativeSelect } from '@/components/ui/native-select';
import { authenticatedApiHeaders, loadCurrentUser } from '@/lib/auth';
import { serverApiFetch } from '@/lib/api';
import type { ContentListResponse } from '@/lib/content-types';
import { WorkspacePageHero } from '@/components/workspace/workspace-page-hero';

type Relations = {
  outgoing: Array<{
    id: string;
    relationType: string;
    targetContent: { id: string; title: string; slug: string; contentType: string };
  }>;
  incoming: Array<{
    id: string;
    relationType: string;
    sourceContent: { id: string; title: string; slug: string; contentType: string };
  }>;
};
const moduleFor = (type: string) =>
  type === 'DESIGN_ASSET'
    ? 'design-assets'
    : type === 'AI_TOOL'
      ? 'ai-tools'
      : type === 'AI_SKILL'
      ? 'ai-skills'
      : type === 'AI_CASE'
        ? 'ai-cases'
        : 'ai-projects';

async function RelatedContentPage({
  searchParams,
}: {
  searchParams: Promise<{ contentId?: string; success?: string; error?: string }>;
}) {
  const { contentId = '', success, error } = await searchParams;
  const headers = await authenticatedApiHeaders();
  const user = await loadCurrentUser();
  const [relations, catalog] = contentId
    ? await Promise.all([
        serverApiFetch<Relations>(`/api/contents/${contentId}/relations`, { headers }),
        serverApiFetch<ContentListResponse>('/api/contents?pageSize=100', { headers }),
      ])
    : [null, { items: [], page: 1, pageSize: 100, total: 0 } satisfies ContentListResponse];
  for (let page = 2; page <= Math.ceil(catalog.total / 100); page++) {
    const next = await serverApiFetch<ContentListResponse>(`/api/contents?pageSize=100&page=${page}`, { headers });
    (catalog.items as ContentListResponse['items']).push(...next.items);
  }
  const source = catalog.items.find((item) => item.id === contentId);
  const canEdit = Boolean(
    user &&
      (user.permissions.includes('content.edit_all') ||
        (user.permissions.includes('content.edit_own') && source?.owner.id === user.id)),
  );
  return (
    <main className="mx-auto max-w-[1100px] px-5 py-8 md:px-8 md:py-10">
      <PreviousPageLink fallback={source ? `/workspace/${moduleFor(source.contentType)}/${source.slug}` : "/workspace"} />
      <div className="mt-6"><WorkspacePageHero eyebrow="CONTENT GRAPH" metric={contentId ? { value: (relations?.outgoing.length ?? 0) + (relations?.incoming.length ?? 0), label: '已有连接' } : undefined} title="关联内容" /></div>
      {success ? <p className="mt-4 rounded-xl border border-[var(--v9-status-success-line)] bg-[var(--v9-status-success-bg)] p-3 text-sm text-[var(--v9-status-success-text)]">内容关联已保存。</p> : null}
      {error ? <p className="mt-4 rounded-xl border border-[var(--v9-status-danger-line)] bg-[var(--v9-status-danger-bg)] p-3 text-sm text-[var(--v9-status-danger-text)]">请选择关联目标。</p> : null}
      {contentId ? (
        <>
          {canEdit ? <EngagementForm data-card-surface=""
            kind="relation"
            className="mt-6 grid gap-4 rounded-2xl border border-[var(--v9-line)] bg-[var(--v9-panel)] p-6 md:grid-cols-[1fr_180px_auto] md:items-end"
          >
            <input type="hidden" name="contentId" value={contentId} />
            <RelatedPicker items={catalog.items.filter(item => item.id !== contentId && item.status === 'PUBLISHED')} />
            <NativeSelect
              name="relationType"
              defaultValue="RELATED"
              className="h-9 rounded-lg border border-[var(--v9-line-strong)] bg-[var(--v9-field)] px-3 text-sm text-[var(--v9-text)]"
            >
              <option value="RELATED">相关内容</option>
              <option value="USES">使用</option>
              <option value="EVIDENCE_FOR">证据支持</option>
              <option value="DERIVED_FROM">衍生自</option>
            </NativeSelect>
            <Button type="submit">添加关联</Button>
          </EngagementForm> : null}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <section data-card-surface="" className="rounded-2xl border border-[var(--v9-line)] bg-[var(--v9-panel)] p-6">
              <h2 className="text-sm font-medium text-[var(--v9-text)]">此内容关联到</h2>
              <ul className="mt-3 space-y-2">
                {relations?.outgoing.map((relation) => (
                  <li
                    className="flex items-center justify-between gap-3 rounded-xl border border-[var(--v9-line)] bg-[var(--v9-panel-2)] p-3 text-sm"
                    key={relation.id}
                  >
                    <Link
                      className="hover:underline"
                      href={`/workspace/${moduleFor(relation.targetContent.contentType)}/${relation.targetContent.slug}`}
                    >
                      {relation.targetContent.title}
                      <span className="ml-2 text-xs text-[var(--v9-subtle)]">{relation.relationType}</span>
                    </Link>
                    {canEdit ? <EngagementForm kind="remove-relation">
                      <input type="hidden" name="contentId" value={contentId} />
                      <input type="hidden" name="relationId" value={relation.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        移除
                      </Button>
                    </EngagementForm> : null}
                  </li>
                ))}
              </ul>
            </section>
            <section data-card-surface="" className="rounded-2xl border border-[var(--v9-line)] bg-[var(--v9-panel)] p-6">
              <h2 className="text-sm font-medium text-[var(--v9-text)]">被以下内容关联</h2>
              <ul className="mt-3 space-y-2">
                {relations?.incoming.map((relation) => (
                  <li className="rounded-xl border border-[var(--v9-line)] bg-[var(--v9-panel-2)] p-3 text-sm" key={relation.id}>
                    <Link
                      className="hover:underline"
                      href={`/workspace/${moduleFor(relation.sourceContent.contentType)}/${relation.sourceContent.slug}`}
                    >
                      {relation.sourceContent.title}
                    </Link>
                    <span className="ml-2 text-xs text-[var(--v9-subtle)]">{relation.relationType}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </>
      ) : (
        <p className="mt-6 rounded-2xl border border-dashed border-[var(--v9-line-strong)] bg-[var(--v9-panel)] p-8 text-sm text-[var(--v9-muted)]">
          请从内容详情页进入关联管理。
        </p>
      )}
    </main>
  );
}

export default async function CachedPage(props: Parameters<typeof RelatedContentPage>[0]) { return <CachedWorkspacePage cacheable={false}>{await RelatedContentPage(props)}</CachedWorkspacePage>; }
