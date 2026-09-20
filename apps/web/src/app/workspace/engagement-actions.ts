'use server';

import { redirect } from 'next/navigation';
import { authenticatedApiHeaders } from '@/lib/auth';
import { serverApiFetch } from '@/lib/api';

async function request(path: string, init: RequestInit) {
  return serverApiFetch(path, {
    ...init,
    headers: { ...(await authenticatedApiHeaders()), ...init.headers },
  });
}

export async function favoriteAction(formData: FormData) {
  const contentId = String(formData.get('contentId') ?? '');
  const active = formData.get('active') === 'true';
  if (!contentId) return { error: '缺少内容标识。' };
  try {
    await request(`/api/contents/${encodeURIComponent(contentId)}/favorite`, { method: active ? 'DELETE' : 'POST' });
    return { active: !active };
  } catch { return { error: '收藏状态更新失败，请重试。' }; }
}

export async function searchResultAction(formData: FormData) {
  const searchLogId = String(formData.get('searchLogId') ?? '');
  const contentId = String(formData.get('contentId') ?? '');
  const href = String(formData.get('href') ?? '/workspace/search');
  if (searchLogId && contentId)
    await request(`/api/search/${searchLogId}/click`, {
      method: 'PATCH',
      body: JSON.stringify({ contentId }),
      headers: { 'Content-Type': 'application/json' },
    });
  redirect(href);
}

export async function usageConfirmationAction(formData: FormData) {
  const contentId = String(formData.get('contentId') ?? '');
  const projectContentId = String(formData.get('projectContentId') ?? '');
  const projectName = String(formData.get('projectName') ?? '').trim();
  const note = String(formData.get('note') ?? '');
  if (!contentId || (!projectContentId && !projectName))
    redirect(`/workspace/usage?contentId=${encodeURIComponent(contentId)}&error=missing-project`);
  await request(`/api/contents/${contentId}/usage-confirmations`, {
    method: 'POST',
    body: JSON.stringify({
      ...(projectContentId ? { projectContentId } : { projectName }),
      note,
      sourcePage: `/workspace/usage?contentId=${contentId}`,
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  redirect(`/workspace/usage?contentId=${encodeURIComponent(contentId)}&success=1`);
}

export async function createRelationAction(formData: FormData) {
  const contentId = String(formData.get('contentId') ?? '');
  const targetContentId = String(formData.get('targetContentId') ?? '');
  const relationType = String(formData.get('relationType') ?? 'RELATED');
  if (!contentId || !targetContentId)
    redirect(`/workspace/related?contentId=${encodeURIComponent(contentId)}&error=missing-target`);
  await request(`/api/contents/${contentId}/relations`, {
    method: 'POST',
    body: JSON.stringify({ targetContentId, relationType }),
    headers: { 'Content-Type': 'application/json' },
  });
  redirect(`/workspace/related?contentId=${encodeURIComponent(contentId)}&success=1`);
}

export async function removeRelationAction(formData: FormData) {
  const contentId = String(formData.get('contentId') ?? '');
  const relationId = String(formData.get('relationId') ?? '');
  if (contentId && relationId)
    await request(`/api/contents/${contentId}/relations/${relationId}`, { method: 'DELETE' });
  redirect(`/workspace/related?contentId=${encodeURIComponent(contentId)}`);
}

export async function recordContentShareAction(contentId: string, sourcePage: string) {
  if (!contentId) return;
  await request('/api/events', {
    method: 'POST',
    body: JSON.stringify({ eventType: 'content_share', contentId, sourcePage }),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function saveEngagementAction(kind: 'usage' | 'relation' | 'remove-relation', data: FormData): Promise<{ error?: string; success?: boolean }> {
  const id = String(data.get('contentId') ?? '');
  if (!id) return { error: '请选择内容。' };
  try {
    if (kind === 'usage') {
      const projectContentId = String(data.get('projectContentId') ?? ''); const projectName = String(data.get('projectName') ?? '').trim();
      if (!projectContentId && !projectName) return { error: '请选择项目或填写项目名称。' };
      await request(`/api/contents/${encodeURIComponent(id)}/usage-confirmations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...(projectContentId ? { projectContentId } : { projectName }), note: String(data.get('note') ?? ''), sourcePage: '/workspace/usage' }) });
    } else if (kind === 'relation') {
      const targetContentId = String(data.get('targetContentId') ?? ''); if (!targetContentId) return { error: '请选择关联内容。' };
      await request(`/api/contents/${encodeURIComponent(id)}/relations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ targetContentId, relationType: String(data.get('relationType') ?? 'RELATED') }) });
    } else if (kind === 'remove-relation') {
      const relationId = String(data.get('relationId') ?? ''); if (!relationId) return { error: '缺少关联标识。' };
      await request(`/api/contents/${encodeURIComponent(id)}/relations/${encodeURIComponent(relationId)}`, { method: 'DELETE' });
    } else return { error: '无效的操作。' };
    return { success: true };
  } catch { return { error: '操作未完成，请检查连接后重试。' }; }
}
