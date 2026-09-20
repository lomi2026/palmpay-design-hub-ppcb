'use client';
import { showActionFeedback } from '@/components/workspace/action-feedback';

import { useNavigationCache } from '@/components/workspace/navigation-cache';
import { useUnsavedChanges } from '@/components/workspace/use-unsaved-changes';
import { invalidateWorkspaceCache } from '@/components/workspace/cache-events';
import { Eye, Save, Send } from 'lucide-react';

import { useActionState, useEffect, useRef, useState } from 'react';
import {
  autosaveDraftAction,
  publishDraftAction,
  saveDraftForPreviewAction,
  type ActionState,
} from './actions';
import { useRouter } from 'next/navigation';
import { ContentTypeFields } from './content-type-fields';
import { DraftCover } from './draft-cover';
import { DraftAttachments } from './draft-attachments';
import { DeleteContentButton } from '@/components/workspace/delete-content-button';
import { Button } from '@/components/ui/button';
import { missingEditorFields } from '@/lib/content-editor-schema';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  TaxonomyFields,
  type TaxonomyOptions,
  type TaxonomySelection,
} from '@/components/workspace/taxonomy-fields';

export type Draft = {
  coverFile: string | null;
  taxonomy: TaxonomySelection;
  taxonomyOptions: TaxonomyOptions;
  id: string;
  status: string;
  contentType: 'DESIGN_ASSET' | 'AI_SKILL' | 'AI_CASE' | 'AI_PROJECT' | 'AI_TOOL';
  title: string;
  summary: string | null;
  draftVersion: {
    title: string;
    summary: string | null;
    body: unknown;
    changeSummary: string | null;
    versionNumber: number;
    versionStatus: string;
  } | null;
  attachments: Array<{
    id: string;
    fileId: string;
    file: { originalName: string; mimeType: string; sizeBytes: string };
  }>;
};

const initialState: ActionState = {};

export function DraftEditor({ draft }: { draft: Draft }) {
  const cache = useNavigationCache();
  const [uploads, setUploads] = useState(0);
  useEffect(() => {
    const changed = (event: Event) => { const detail = (event as CustomEvent<{ id: string; pending: boolean }>).detail; if (detail.id === draft.id) setUploads(value => Math.max(0, value + (detail.pending ? 1 : -1))); };
    window.addEventListener('workspace-upload', changed);
    return () => window.removeEventListener('workspace-upload', changed);
  }, [draft.id]);
  const [dirty, setDirty] = useState(false);
  const revision = useRef(0);
  const revisionInput = useRef<HTMLInputElement>(null);
  const [state, action, pending] = useActionState(async (previous: ActionState, data: FormData) => {
    const result = await autosaveDraftAction(previous, data).catch((): ActionState => ({ error: '连接中断，操作结果暂未确认。请核对状态后重试。' }));
    if (result.error) showActionFeedback('error', result.error, `draft:${draft.id}`);
    else if (result.savedAt && data.get('__manualSave') === 'true') showActionFeedback('success', '草稿保存成功', `draft:${draft.id}`);
    if (result.savedAt) {
      if (Number(data.get('__editRevision')) === revision.current) setDirty(false);
      invalidateWorkspaceCache(['/workspace', '/workspace/contributions', '/workspace/submit']);
    }
    return result;
  }, initialState);
  const [validation, setValidation] = useState<string[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const router = useRouter();
  const [publishState, publishAction, publishing] = useActionState(
    async (previous: ActionState, data: FormData) => {
      const result = await publishDraftAction(previous, data).catch((): ActionState => ({ error: '连接中断，操作结果暂未确认。请核对状态后重试。' }));
      if (result.error) showActionFeedback('error', result.error, `draft:${draft.id}`);
      else if (result.publishedHref) showActionFeedback('success', '内容发布成功', `draft:${draft.id}`);
      if (result.publishedHref) { setDirty(false); invalidateWorkspaceCache(); if (result.publication) window.dispatchEvent(new CustomEvent('workspace-publication', { detail: result.publication })); cache?.begin(result.publishedHref); }
      return result;
    },
    initialState,
  );
  useEffect(() => {
    if (publishState.publishedHref) {
      router.replace(publishState.publishedHref);
    }
  }, [publishState.publishedHref, router]);
  const [previewState, previewAction, previewing] = useActionState(async (previous: ActionState, data: FormData) => {
    const result = await saveDraftForPreviewAction(previous, data).catch((): ActionState => ({ error: '连接中断，操作结果暂未确认。请核对状态后重试。' }));
    if (result.error) showActionFeedback('error', result.error, `draft:${draft.id}`);
    else if (result.previewHref) showActionFeedback('success', '草稿已保存，正在打开预览', `draft:${draft.id}`);
    if (result.previewHref) { setDirty(false); invalidateWorkspaceCache(['/workspace', '/workspace/contributions', '/workspace/submit']); }
    return result;
  }, initialState);
  useEffect(() => { if (previewState.previewHref) router.push(previewState.previewHref); }, [previewState.previewHref, router]);
  const published = Boolean(publishState.publishedHref);
  useUnsavedChanges(!published && (dirty || pending || publishing || previewing));
  const scheduleAutosave = () => {
    revision.current += 1;
    if (revisionInput.current) revisionInput.current.value = String(revision.current);
    setDirty(true);
    setValidation([]);
    if (publishing || previewing) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => formRef.current?.requestSubmit(), 900);
  };
  const clearScheduledSave = () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  };
  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    },
    [],
  );
  return (
    <div className="composer-workspace">
      <form data-card-surface="" data-managed-cache=""
        id={`content-editor-${draft.id}`}
        inert={publishing || published || previewing}
        action={action}
        onResetCapture={(event) => {
          event.preventDefault();
          event.stopPropagation();
        }}
        className="composer-editor mt-6 grid gap-6 rounded-[24px] border border-white/[.1] bg-[#111] p-6 md:p-8"
        onInput={scheduleAutosave}
        onSubmit={(event) => {
          clearScheduledSave();
          const submitter = (event.nativeEvent as SubmitEvent)
            .submitter as HTMLButtonElement | null;
          if (submitter?.dataset.preview) invalidateWorkspaceCache(['/workspace', '/workspace/contributions', '/workspace/submit']);
          if (submitter?.dataset.publish) {
            const missing = missingEditorFields(
              draft.contentType,
              new FormData(event.currentTarget),
            );
            setValidation(missing.map((field) => field.label));
            if (missing.length) { event.preventDefault(); showActionFeedback('error', '请补充必填信息后再发布。', `draft:${draft.id}`); }
          }
        }}
        ref={formRef}
      >
        <input name="__managedCache" type="hidden" value="true" />
        <input ref={revisionInput} name="__editRevision" type="hidden" defaultValue="0" />
        <input name="id" type="hidden" value={draft.id} />
        <input name="contentType" type="hidden" value={draft.contentType} />
        <div className="composer-basics-heading flex flex-wrap items-end justify-between gap-4 border-b border-white/[.1] pb-5">
          <div>
            <h2 className="text-[28px] font-semibold tracking-[-.045em] text-white">
              完善内容说明
            </h2>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)]">
          <label className="grid gap-2 text-sm font-medium text-white/75">
            标题
            <Input
              className="h-12 border-white/[.14] bg-black/25 text-base text-white"
              defaultValue={draft.draftVersion?.title ?? draft.title}
              name="title"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-white/75">
            本次修改说明
            <Input
              className="h-12 border-white/[.14] bg-black/25 text-white placeholder:text-white/35"
              defaultValue={draft.draftVersion?.changeSummary ?? ''}
              name="changeSummary"
              placeholder="例如：补充使用步骤"
            />
          </label>
        </div>
        <label className="grid gap-2 text-sm font-medium text-white/75">
          摘要
          <Textarea
            className="min-h-28 border-white/[.14] bg-black/25 text-white"
            defaultValue={draft.draftVersion?.summary ?? draft.summary ?? ''}
            name="summary"
          />
        </label>
        <details className="composer-taxonomy">
          <summary>
            分类与标签 <span>帮助团队找到你的内容 · 选填</span>
          </summary>
          <TaxonomyFields
            options={draft.taxonomyOptions}
            initialSelection={draft.taxonomy}
            contentType={draft.contentType}
            onChange={scheduleAutosave}
          />
        </details>
        <ContentTypeFields
          onChange={scheduleAutosave}
          body={draft.draftVersion?.body as Record<string, unknown> | undefined}
          contentType={draft.contentType}
        />
        {validation.length ? (
          <div className="publish-validation" role="alert">
            <strong>还差一点就可以发布</strong>
            <p>请补充：{validation.join('、')}。草稿可以随时保存。</p>
          </div>
        ) : null}
        {state.error || publishState.error ? (
          <p role="alert" className="text-sm text-destructive">
            {publishState.error || state.error}
          </p>
        ) : null}
      </form>
      <div className={`composer-files ${['DESIGN_ASSET', 'AI_TOOL'].includes(draft.contentType) ? 'composer-files-paired' : ''}`}>
      {['DESIGN_ASSET', 'AI_TOOL'].includes(draft.contentType) ? (
        <DraftCover id={draft.id} fileId={draft.coverFile} />
      ) : null}
      <DraftAttachments attachments={draft.attachments} contentId={draft.id} />
      </div>

      {previewState.error ? <p role="alert" className="mt-4 text-sm text-destructive">{previewState.error}</p> : null}
      {uploads > 0 ? <p role="status" className="mt-4 text-sm text-muted-foreground">文件正在处理，完成后可预览或发布；你可以继续编辑文字。</p> : null}
      <div className="composer-actions flex flex-wrap items-center justify-between gap-4 border-t border-white/[.1] pt-5">
        <p aria-live="polite" className="text-xs text-white/40">
          草稿 v{draft.draftVersion?.versionNumber ?? 1} ·{' '}
          {pending ? '自动保存中…' : state.error ? '保存失败，请重试' : dirty ? '有未保存更改' : state.savedAt ? `已保存 ${state.savedAt}` : '输入后将自动保存'}
        </p>
        <div className="flex flex-wrap gap-2">
          <DeleteContentButton
            filled
            contentId={draft.id}
            title={draft.draftVersion?.title ?? draft.title}
            redirectTo="/workspace/contributions"
            disabled={pending || publishing || published || previewing || uploads > 0}
            className="h-10 px-4"
            onOpen={clearScheduledSave}
          />
          <Button
            className="h-10 px-4"
            form={`content-editor-${draft.id}`}
            data-preview="true"
            disabled={pending || publishing || published || previewing || uploads > 0}
            formAction={previewAction}
            type="submit"
            variant="outline"
          >
            <Eye aria-hidden="true" />
            {previewing ? '正在保存并打开…' : '预览草稿'}
          </Button>
          <Button
            name="__manualSave" value="true" variant="outline" size="default" className="h-10 px-5"
            form={`content-editor-${draft.id}`}
            disabled={pending || publishing || previewing}
            type="submit"
          >
            <Save aria-hidden="true" />
            {pending ? '保存中…' : '保存草稿'}
          </Button>
          <Button
            className="h-10 px-5"
            disabled={pending || publishing || previewing || uploads > 0}
            form={`content-editor-${draft.id}`}
            data-publish="true"
            formAction={publishAction}
            type="submit"
          >
            <Send aria-hidden="true" />
            {published ? '发布成功，正在打开…' : publishing ? '发布中…' : '发布内容'}
          </Button>
        </div>
      </div>
    </div>
  );
}
