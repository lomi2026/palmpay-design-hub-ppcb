import { CachedWorkspacePage } from '@/components/workspace/navigation-cache';
import { loadEditorDraft } from '@/lib/load-editor-draft';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { redirect } from 'next/navigation';
import { ApiError } from '@/lib/api';
import { contentTypeLabel } from '@/lib/content-types';
import { DraftEditor, type Draft } from '../draft-editor';


export default async function DraftPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let draft: Draft;
  try {
    draft = await loadEditorDraft(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) redirect('/workspace/submissions');
    throw error;
  }
  return <CachedWorkspacePage cacheable={false}><main className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 md:py-10"><header className="editor-page-heading"><div><p className="eyebrow">{contentTypeLabel(draft.contentType)} · 草稿 v{draft.draftVersion?.versionNumber ?? 1}</p><h1>编辑内容</h1><p>先写清楚如何使用，预览确认后即可发布。</p></div><Link href="/workspace/contributions">返回我的贡献 →</Link></header><DraftEditor key={draft.id} draft={draft} /></main></CachedWorkspacePage>;
}
