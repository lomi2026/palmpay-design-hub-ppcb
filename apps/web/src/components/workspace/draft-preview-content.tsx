import { PublishedAttachments } from './published-attachments';
import { AssetImage } from './asset-image';
import { ContentSections } from './content-sections';
import { contentTypeLabel } from '@/lib/content-types';
import type { Draft } from '@/app/workspace/submit/draft-editor';
export function DraftPreviewContent({ draft }: { draft: Draft }) {
  return (
    <main className="detail-page">
      <div className="preview-notice">草稿预览 · 仅你和有编辑权限的成员可见，尚未发布</div>
      <header className="detail-hero">
        <span className="content-kind">{contentTypeLabel(draft.contentType)}</span>
        <h1>{draft.draftVersion?.title ?? draft.title}</h1>
        <p className="detail-summary">{draft.draftVersion?.summary ?? draft.summary}</p>
        {draft.coverFile ? (
          <div className="detail-cover">
            <AssetImage fileId={draft.coverFile} title={draft.title} />
          </div>
        ) : null}
      </header>
      <ContentSections
        type={draft.contentType}
        body={(draft.draftVersion?.body ?? {}) as Record<string, unknown>}
      />
      <div className="detail-attachments">
        <PublishedAttachments
          attachments={draft.attachments.map((item) => ({
            id: item.id,
            file: { ...item.file, id: item.fileId },
          }))}
        />
      </div>
    </main>
  );
}
