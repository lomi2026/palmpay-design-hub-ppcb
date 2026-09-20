import { loadEditorDraft } from '@/lib/load-editor-draft';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ApiError } from '@/lib/api';
import { DraftPreviewContent } from '@/components/workspace/draft-preview-content';


async function getDraft(id: string) {
  try {
    return await loadEditorDraft(id);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    if (error instanceof ApiError && error.status === 409) redirect('/workspace/submissions');
    throw error;
  }
}

export default async function DraftPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const draft = await getDraft(id);
  return <><div className="mx-auto max-w-[1232px] px-5 pt-6 md:px-8"><Link className="inline-flex items-center gap-2 text-[12px] text-white/55 transition hover:text-white" href={`/workspace/submit/${id}`}><ArrowLeft className="size-4" />返回编辑草稿</Link></div><DraftPreviewContent draft={draft} /></>;
}
