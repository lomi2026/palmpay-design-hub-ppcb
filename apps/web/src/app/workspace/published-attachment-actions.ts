'use server';

import { userError } from '@/lib/user-error';

import { authenticatedApiHeaders } from '@/lib/auth';
import { serverApiFetch } from '@/lib/api';

export type DownloadAttachmentState = { error?: string; url?: string };

export async function downloadPublishedAttachmentAction(
  _: DownloadAttachmentState,
  formData: FormData,
): Promise<DownloadAttachmentState> {
  const fileId = String(formData.get('fileId') ?? '');
  if (!fileId) return { error: '未找到待下载的附件。' };
  try {
    const download = await serverApiFetch<{ url: string }>(`/api/files/${encodeURIComponent(fileId)}/download`, {
      headers: await authenticatedApiHeaders(),
    });
    return { url: download.url };
  } catch (error) {
    return { error: userError(error, '无法生成附件下载链接。') };
  }
}
