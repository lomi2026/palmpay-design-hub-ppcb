'use client';
import { showActionFeedback } from '@/components/workspace/action-feedback';

import { Download, Paperclip } from 'lucide-react';
import { useActionState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { downloadPublishedAttachmentAction, type DownloadAttachmentState } from '@/app/workspace/published-attachment-actions';
import type { PublishedAttachment } from '@/lib/content-types';

const initialState: DownloadAttachmentState = {};

function formatSize(value: string) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes)) return '';
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function AttachmentDownload({ attachment }: { attachment: PublishedAttachment }) {
  const [state, action, pending] = useActionState(async (previous: DownloadAttachmentState, data: FormData) => { const result = await downloadPublishedAttachmentAction(previous, data).catch((): DownloadAttachmentState => ({ error: '连接中断，操作结果暂未确认。请核对状态后重试。' })); if (result.error) showActionFeedback('error', result.error); else if (result.url) showActionFeedback('success', '下载链接已准备好，正在打开'); return result; }, initialState);
  useEffect(() => {
    if (!state.url) return;
    const anchor = document.createElement('a');
    anchor.href = state.url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.click();
  }, [state.url]);
  return <li className="flex items-center justify-between gap-3 rounded-xl border border-white/[.1] bg-black/20 px-3 py-2.5"><div className="min-w-0"><p className="truncate text-sm text-white/80">{attachment.file.originalName}</p><p className="mt-0.5 text-[11px] text-white/40">{attachment.file.mimeType} · {formatSize(attachment.file.sizeBytes)}</p></div><form data-managed-cache="" action={action}><input name="fileId" type="hidden" value={attachment.file.id} /><Button className="h-8 rounded-lg border-white/[.14] bg-white/[.04] px-2.5 text-xs text-white hover:bg-white/[.1]" disabled={pending} size="sm" type="submit" variant="outline"><Download />{pending ? '准备中…' : '下载'}</Button></form>{state.error ? <p role="alert" className="basis-full text-[11px] text-destructive">{state.error}</p> : null}</li>;
}

export function PublishedAttachments({ attachments }: { attachments: PublishedAttachment[] }) {
  if (!attachments.length) return null;
  return <section data-card-surface="" className="rounded-[16px] border border-white/[.1] bg-[#111] p-6"><div className="flex items-center gap-2"><Paperclip className="size-4 text-white/55" /><h2 className="text-[20px] font-semibold tracking-[-.035em] text-white">下载附件</h2></div><p className="mt-2 text-xs leading-5 text-white/45">下载链接仅在本次授权后短暂有效，不会公开文件存储地址。</p><ul className="mt-4 grid gap-2">{attachments.map((attachment) => <AttachmentDownload attachment={attachment} key={attachment.id} />)}</ul></section>;
}
