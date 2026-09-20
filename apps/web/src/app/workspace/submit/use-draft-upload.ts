'use client';
import { showActionFeedback } from '@/components/workspace/action-feedback';
import { userError } from '@/lib/user-error';
import { useRef, useState } from 'react';
import { uploadDraftAttachmentAction, type AttachmentActionState } from './attachment-actions';
import { invalidateWorkspaceCache } from '@/components/workspace/cache-events';
export function useDraftUpload() {
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [stage, setStage] = useState('');
  const [error, setError] = useState('');
  const lock = useRef(false);
  async function upload(data: FormData): Promise<AttachmentActionState> {
    if (lock.current) return {};
    const file = data.get('file'); const id = String(data.get('id') ?? ''); const cover = data.get('cover') === 'true';
    if (!(file instanceof File) || !file.size || file.size > (cover ? 5 : 100) * 1024 * 1024) { setError('请选择大小符合限制的文件。'); return {}; }
    window.dispatchEvent(new CustomEvent('workspace-upload', { detail: { id, pending: true } }));
    lock.current = true; setPending(true); setError(''); setProgress(null);
    try {
      // Keep PPCB create, transfer, completion and draft binding in one server
      // action. This prevents a multi-replica deployment from splitting the
      // storage handshake across separate requests while retaining the 108 MB
      // server-action limit configured for the 100 MB product limit.
      setStage('上传并校验文件…');
      const result = await uploadDraftAttachmentAction({}, data);
      if (result.error) throw Error(result.error);
      showActionFeedback('success', cover ? '封面保存成功' : '附件上传成功');
      setStage('已保存'); invalidateWorkspaceCache(['/workspace/contributions', '/workspace/submit']);
      return result;
    } catch (reason) { const message = userError(reason, '上传失败，请重试。'); setError(message); showActionFeedback('error', message); setStage(''); return { error: message }; }
    finally { lock.current = false; setPending(false); window.dispatchEvent(new CustomEvent('workspace-upload', { detail: { id, pending: false } })); }
  }
  return { upload, pending, progress, stage, error };
}
