'use client';
import { showActionFeedback } from '@/components/workspace/action-feedback';
import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { removeDraftAttachmentAction, type DraftAttachment } from './attachment-actions';
import { useDraftUpload } from './use-draft-upload';
import { useUnsavedChanges } from '@/components/workspace/use-unsaved-changes';
import { invalidateWorkspaceCache } from '@/components/workspace/cache-events';
export function DraftAttachments({ contentId, attachments }: { contentId: string; attachments: DraftAttachment[] }) {
  const [items, setItems] = useState(attachments);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(false);
  const [fileName, setFileName] = useState('');
  const lock = useRef(false);
  const task = useDraftUpload();
  useUnsavedChanges(task.pending || selected);
  return <section data-card-surface="" className="mt-6 grid content-start gap-4 rounded-3xl bg-card p-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><h2 className="text-2xl font-semibold">附件与引用材料</h2><p className="text-xs text-muted-foreground">单个文件最大 100 MB</p></div>
    {items.length ? <ul className="grid gap-2">{items.map(item => <li className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm" key={item.id}><span className="min-w-0 truncate">{item.file.originalName} · {(Number(item.file.sizeBytes) / 1024 / 1024).toFixed(2)} MB</span><button className="text-xs text-muted-foreground disabled:opacity-50" disabled={Boolean(removing) || task.pending} type="button" onClick={async () => {
      if (lock.current) return; lock.current = true; setRemoving(item.fileId); setError('');
      try { const data = new FormData(); data.set('id', contentId); data.set('fileId', item.fileId); const result = await removeDraftAttachmentAction({}, data); if (result.error) { setError(result.error); showActionFeedback('error', result.error); } else { showActionFeedback('success', '附件已移除'); setItems(previous => previous.filter(value => value.fileId !== item.fileId)); invalidateWorkspaceCache(['/workspace/contributions']); } }
      catch { showActionFeedback('error', '移除失败，请核对后重试。'); setError('移除结果暂未确认，请重试。'); } finally { lock.current = false; setRemoving(null); }
    }}>{removing === item.fileId ? '移除中…' : '移除'}</button></li>)}</ul> : null}
    <form data-managed-cache="" className="flex flex-wrap items-center gap-3" onSubmit={async event => {
      event.preventDefault(); const form = event.currentTarget; const result = await task.upload(new FormData(form));
      if (result.attachments) { setItems(result.attachments); form.reset(); setSelected(false); setFileName(''); }
    }}>
      <input name="id" type="hidden" value={contentId} /><label className="attachment-upload-zone"><Upload aria-hidden="true" className="size-5" /><span>{task.pending ? task.stage : '选择图片或附件'}</span><input aria-label="选择图片或附件" className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-wait" name="file" required type="file" disabled={task.pending || Boolean(removing)} onChange={event => { const file = event.target.files?.[0]; if (file && file.size > 100 * 1024 * 1024) { setError('单个附件不能超过 100 MB。'); event.target.value = ''; setSelected(false); } else { setError(''); setSelected(Boolean(file)); setFileName(file?.name ?? ''); if (file) event.currentTarget.form?.requestSubmit(); } }} /></label>
      <p className="w-full text-xs text-muted-foreground">单个文件最大 100 MB。</p>
      {fileName ? <p className="w-full truncate text-sm">{fileName}</p> : null}
      {task.error && selected ? <button className="h-10 rounded-xl bg-primary px-4 text-sm text-primary-foreground disabled:opacity-50" disabled={task.pending || Boolean(removing) || !selected}>{task.pending ? task.stage : task.error ? '重试上传' : '上传附件'}</button> : null}
      {task.pending ? <div className="w-full space-y-2" role="status"><div className="flex justify-between text-xs"><span>{task.stage}</span><span>{task.progress !== null ? `${task.progress}%` : '处理中…'}</span></div><progress className="h-2 w-full accent-current" aria-label="文件上传进度" max={100} value={task.progress ?? undefined} /></div> : null}
    </form>
    {error || task.error ? <p role="alert" className="text-sm text-destructive">{error || task.error}</p> : null}
  </section>;
}
