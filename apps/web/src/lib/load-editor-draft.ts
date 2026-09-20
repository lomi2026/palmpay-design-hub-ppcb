import { authenticatedApiHeaders } from './auth';
import { serverApiFetch, ApiError } from './api';
import { contentBody } from './content-editor-schema';
import type { Draft } from '@/app/workspace/submit/draft-editor';
export async function loadEditorDraft(id: string): Promise<Draft> {
  const headers = await authenticatedApiHeaders();
  const draft = await serverApiFetch<Draft & { slug: string }>(
    `/api/content-drafts/${encodeURIComponent(id)}`,
    { headers },
  );
  const body = draft.draftVersion?.body as Record<string, unknown> | undefined;
  if (body?.source && draft.status === 'PUBLISHED') {
    try {
      const published = await serverApiFetch<Record<string, unknown>>(
        `/api/contents/${encodeURIComponent(draft.slug)}`,
        { headers },
      );
      if (draft.draftVersion)
        draft.draftVersion = {
          ...draft.draftVersion,
          body: { ...contentBody(published), ...body },
        };
    } catch (error) {
      if (!(error instanceof ApiError && error.status === 404)) throw error;
    }
  }
  return draft;
}
