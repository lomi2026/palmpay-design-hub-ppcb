'use server';

import { userError } from '@/lib/user-error';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { authenticatedApiHeaders } from '@/lib/auth';
import { serverApiFetch } from '@/lib/api';

const DELETE_RETURN_ROUTES = new Set([
  '/workspace/contributions',
  '/workspace/design-assets',
  '/workspace/ai-tools',
  '/workspace/ai-skills',
  '/workspace/ai-cases',
  '/workspace/ai-projects',
]);

export type DeleteContentState = { deleted?: boolean; error?: string };
export async function deleteContentAction(_: DeleteContentState, formData: FormData): Promise<DeleteContentState> {
  const id = String(formData.get('contentId') ?? '');
  const requestedReturnTo = String(formData.get('returnTo') ?? '');
  const returnTo = DELETE_RETURN_ROUTES.has(requestedReturnTo) ? requestedReturnTo : null;
  if (!id) return { error: '缺少内容编号。' };
  try {
    await serverApiFetch(`/api/content-drafts/${encodeURIComponent(id)}`, {
      method: 'DELETE', headers: await authenticatedApiHeaders(), signal: AbortSignal.timeout(15000),
    });

  } catch (error) {
    return { error: userError(error, '删除未完成，请刷新后重试。') };
  }
  if (formData.get('inline') === 'true') return { deleted: true };
  revalidatePath('/workspace', 'layout');
  if (returnTo) redirect(returnTo);
  return { deleted: true };
}
