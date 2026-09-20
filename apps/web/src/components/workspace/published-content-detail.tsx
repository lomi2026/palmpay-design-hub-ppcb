import { ManagementMenu } from '@/components/workspace/management-menu';
import { DeleteContentButton } from './delete-content-button';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ExternalLink, MoreHorizontal } from 'lucide-react';
import { authenticatedApiHeaders, loadCurrentUser } from '@/lib/auth';
import { ApiError, serverApiFetch } from '@/lib/api';
import {
  contentTypeLabel,
  type ContentCard,
  type ContentType,
  type PublishedAttachment,
} from '@/lib/content-types';
import { contentBody, readableValue } from '@/lib/content-editor-schema';
import { ContentSections } from './content-sections';
import { FavoriteControl, ContentEngagementLinks } from './engagement-controls';
import { PublishedEdit } from '@/app/workspace/published-edit';
import { ContentLifecycle } from '@/app/workspace/content-lifecycle';
import { PublishedAttachments } from './published-attachments';
import { UsageSummary } from './usage-summary';
import { AssetImage } from './asset-image';
import { Button } from '@/components/ui/button';

type Detail = ContentCard & {
  attachments: PublishedAttachment[];
  currentVersion: { versionNumber?: number; versionLabel: string | null; body: unknown } | null;
};
export async function PublishedContentDetail({
  slug,
  type,
  route,
}: {
  slug: string;
  type: ContentType;
  route: string;
}) {
  const headers = await authenticatedApiHeaders();
  let content: Detail;
  try {
    content = await serverApiFetch<Detail>(`/api/contents/${encodeURIComponent(slug)}`, {
      headers,
    });
  } catch (error) {
    if (error instanceof ApiError && [403, 404].includes(error.status)) notFound();
    throw error;
  }
  if (content.contentType !== type) notFound();
  const user = await loadCurrentUser();
  const canEdit = Boolean(
    user?.permissions.includes('content.edit_all') ||
    (user?.id === content.owner.id && user.permissions.includes('content.edit_own')),
  );
  const canArchive = user?.permissions.includes('content.archive') ?? false;
  const canUnpublish = user?.permissions.includes('content.unpublish') ?? false;
  const body = contentBody(content as unknown as Record<string, unknown>);
  const externalUrl = (value: unknown) => {
    const candidate = Array.isArray(value) ? value.find((item) => safeExternalUrl(item)) : value;
    return safeExternalUrl(candidate);
  };
  const safeExternalUrl = (value: unknown) => {
    const url = readableValue(value);
    if (!url) return null;
    try {
      const parsed = new URL(url);
      return ['http:', 'https:'].includes(parsed.protocol) && !parsed.username && !parsed.password ? url : null;
    } catch {
      return null;
    }
  };
  const toolUrl = externalUrl(body.websiteUrl);
  const assetUrl = externalUrl(body.resourceLinks);
  const caseUrl = externalUrl(body.caseUrl) ?? externalUrl((body.source as Record<string, unknown> | undefined)?.baselineUrl);
  return (
    <main className="detail-page unified-detail-page" data-content-type={type}>
      <Link className="back-link" href={`/workspace/${route}`}>
        <ArrowLeft size={15} />
        返回{contentTypeLabel(type)}
      </Link>
      <header className="detail-hero">
        <div className="detail-intro">
          <div className="detail-identity">
            <span className="content-kind">{contentTypeLabel(type)}</span>
            {content.category && content.category.name !== contentTypeLabel(type) ? (
              <span>{content.category.name}</span>
            ) : null}
          </div>
          <h1>{content.title}</h1>
          {content.summary ? <p className="detail-summary">{content.summary}</p> : null}
          <div className="detail-toolbar">
            {type === 'AI_TOOL' && toolUrl ? (
              <Button asChild>
                <a href={toolUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={15} aria-hidden="true" />
                  打开工具
                </a>
              </Button>
            ) : null}
            {type === 'DESIGN_ASSET' && assetUrl ? (
              <Button asChild>
                <a href={assetUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={15} aria-hidden="true" />
                  打开链接
                </a>
              </Button>
            ) : null}
            {type === 'AI_CASE' && caseUrl ? (
              <Button asChild>
                <a href={caseUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink size={15} aria-hidden="true" />
                  打开案例
                </a>
              </Button>
            ) : null}
            <FavoriteControl size="md" contentId={content.id} returnTo={`/workspace/${route}/${slug}`} />
            <ContentEngagementLinks contentId={content.id} canonicalPath={`/workspace/${route}/${encodeURIComponent(content.slug)}`} />
            {canEdit ? <PublishedEdit contentId={content.id} /> : null}
            {canEdit || canArchive || canUnpublish ? (
              <ManagementMenu>
                <summary aria-label="更多管理操作">
                  <MoreHorizontal size={18} />
                </summary>
                <div>
                  <p>内容管理</p>
                  <div className="flex items-start gap-3">
                  <ContentLifecycle
                    contentId={content.id}
                    canArchive={canArchive}
                    canUnpublish={canUnpublish}
                  />
                  {canEdit ? <DeleteContentButton filled contentId={content.id} title={content.title} redirectTo={`/workspace/${route}`} className="h-9 px-3 text-[12px]" /> : null}
                  </div>
                </div>
              </ManagementMenu>
            ) : null}
          </div>
        </div>
        {content.coverFile && ['DESIGN_ASSET', 'AI_TOOL'].includes(type) ? (
          <div className="detail-cover">
            <AssetImage fileId={content.coverFile.id} title={content.title} />
          </div>
        ) : null}
        <dl className="detail-metadata">
          {[
            ['发布者', content.owner.name],
            ['维护团队', content.team.name],
            [
              '内容版本',
              content.currentVersion?.versionLabel ??
                `v${content.currentVersion?.versionNumber ?? 1}`,
            ],
            ['最后更新', new Date(content.updatedAt).toLocaleDateString('zh-CN')],
          ].map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <UsageSummary key={content.id} contentId={content.id} />
      </header>
      <ContentSections type={type} body={body} />
      <div className="detail-attachments">
        <PublishedAttachments attachments={content.attachments ?? []} />
      </div>
    </main>
  );
}
