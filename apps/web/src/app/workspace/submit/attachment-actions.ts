'use server';

import { userError } from '@/lib/user-error';

import { createHash } from 'node:crypto';
import { authenticatedApiHeaders } from '@/lib/auth';
import { serverApiFetch } from '@/lib/api';

export type DraftAttachment = { id: string; fileId: string; file: { originalName: string; mimeType: string; sizeBytes: string } };
export type AttachmentActionState = { error?: string; savedAt?: string; attachments?: DraftAttachment[]; coverFile?: string | null };

export async function uploadDraftAttachmentAction(_: AttachmentActionState, formData: FormData): Promise<AttachmentActionState> {
  const id = String(formData.get('id') ?? '');
  const file = formData.get('file');
  if (!(file instanceof File) || !file.size) return { error: '请选择一个非空文件。' };
  if (file.size > 100 * 1024 * 1024) return { error: '单个附件不能超过 100 MB。' };
  const cover = formData.get('cover') === 'true';
  if (cover && (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024)) return { error: '请选择不超过 5 MB 的 PNG、JPG 或 WebP 图片。' };
  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const headers = await authenticatedApiHeaders();
    const intent = await serverApiFetch<{ file: { id: string }; upload: { url: string; method: string; headers: Record<string, string> } }>('/api/files/upload-intents', {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        checksumSha256: createHash('sha256').update(bytes).digest('base64'),
      }),
    });
    const uploaded = await fetch(intent.upload.url, { method: intent.upload.method, headers: intent.upload.headers, body: bytes, signal: AbortSignal.timeout(120000) });
    if (!uploaded.ok) throw new Error('文件上传未完成。');
    await serverApiFetch(`/api/files/${intent.file.id}/complete`, { method: 'POST', headers });
    if (cover) {
      await serverApiFetch(`/api/content-drafts/${encodeURIComponent(id)}/cover`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ fileId: intent.file.id }) });
    } else {
      await serverApiFetch(`/api/content-drafts/${encodeURIComponent(id)}/attachments/${encodeURIComponent(intent.file.id)}`, { method: 'POST', headers });
    }
    const updated = await serverApiFetch<{ attachments: DraftAttachment[]; coverFile: string | null }>(`/api/content-drafts/${encodeURIComponent(id)}`, { headers });
    return { savedAt: String(Date.now()), attachments: updated.attachments, coverFile: updated.coverFile };
  } catch (error) {
    return { error: userError(error, '附件上传失败。') };
  }
}

export async function removeDraftAttachmentAction(_: AttachmentActionState, formData: FormData): Promise<AttachmentActionState> {
  const id = String(formData.get('id') ?? '');
  const fileId = String(formData.get('fileId') ?? '');
  try {
    const headers = await authenticatedApiHeaders();
    await serverApiFetch(`/api/content-drafts/${encodeURIComponent(id)}/attachments/${encodeURIComponent(fileId)}`, { method: 'DELETE', headers });
    return { savedAt: String(Date.now()) };
  } catch (error) {
    return { error: userError(error, '无法移除附件。') };
  }
}

export async function removeDraftCoverAction(_: AttachmentActionState, formData: FormData): Promise<AttachmentActionState> {
  try {
    await serverApiFetch(`/api/content-drafts/${encodeURIComponent(String(formData.get('id')))}/cover`, { method: 'PATCH', headers: { ...(await authenticatedApiHeaders()), 'Content-Type': 'application/json' }, body: JSON.stringify({ fileId: null }) });
    return { savedAt: String(Date.now()) };
  } catch (error) { return { error: userError(error, '移除失败。') }; }
}

export async function prepareDraftUpload(input: { id: string; name: string; type: string; size: number; checksum: string; cover: boolean }) {
  const headers = await authenticatedApiHeaders();
  await serverApiFetch(`/api/content-drafts/${encodeURIComponent(input.id)}`, { headers });
  if (!Number.isFinite(input.size) || input.size <= 0 || input.size > (input.cover ? 5 : 100) * 1024 * 1024) throw Error('文件大小超出限制。');
  if (input.cover && !['image/png', 'image/jpeg', 'image/webp'].includes(input.type)) throw Error('不支持的封面格式。');
  return serverApiFetch<{ file: { id: string }; upload: { url: string; method: string; headers: Record<string, string> } }>('/api/files/upload-intents', {
    method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ originalName: input.name, mimeType: input.type || 'application/octet-stream', sizeBytes: input.size, checksumSha256: input.checksum }),
  });
}
export async function completeDraftUpload(id: string, fileId: string, cover: boolean): Promise<AttachmentActionState> {
  try {
    const headers = await authenticatedApiHeaders();
    await serverApiFetch(`/api/content-drafts/${encodeURIComponent(id)}`, { headers });
    await serverApiFetch(`/api/files/${encodeURIComponent(fileId)}/complete`, { method: 'POST', headers });
    if (cover) await serverApiFetch(`/api/content-drafts/${encodeURIComponent(id)}/cover`, { method: 'PATCH', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ fileId }) });
    else await serverApiFetch(`/api/content-drafts/${encodeURIComponent(id)}/attachments/${encodeURIComponent(fileId)}`, { method: 'POST', headers });
    const updated = await serverApiFetch<{ attachments: DraftAttachment[]; coverFile: string | null }>(`/api/content-drafts/${encodeURIComponent(id)}`, { headers });
    return { savedAt: String(Date.now()), attachments: updated.attachments, coverFile: updated.coverFile };
  } catch (error) { return { error: userError(error, '文件校验或绑定失败，请重试。') }; }
}
