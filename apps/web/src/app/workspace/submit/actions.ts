'use server';

import { userError } from '@/lib/user-error';

import { authenticatedApiHeaders } from '@/lib/auth';
import { serverApiFetch } from '@/lib/api';
import { uploadDraftAttachmentAction } from './attachment-actions';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export type ActionState = { error?: string; id?: string; savedAt?: string; publishedHref?: string; previewHref?: string; updatedStatus?: string; publication?: { title: string; summary: string | null; href: string; catalog: string } };

function optionalText(value: FormDataEntryValue | null) {
  const result = typeof value === 'string' ? value.trim() : '';
  return result || undefined;
}

function lines(formData: FormData, key: string) {
  const value = optionalText(formData.get(key));
  return value ? value.split('\n').map((item) => item.trim()).filter(Boolean) : [];
}

function structuredBody(contentType: string, formData: FormData) {
  const text = (key: string) => optionalText(formData.get(key));
  if (contentType === 'AI_TOOL') return { websiteUrl: text('websiteUrl'), vendor: text('vendor'), platforms: lines(formData, 'platforms'), scenarios: lines(formData, 'scenarios'), usageGuide: text('usageGuide'), limitations: text('limitations'), pricingModel: text('pricingModel') };
  if (contentType === 'DESIGN_ASSET') return { assetType: text('assetType'), platforms: lines(formData, 'platforms'), scenarios: lines(formData, 'scenarios'), unsuitableScenarios: lines(formData, 'unsuitableScenarios'), problemStatement: text('problemStatement'), usageGuide: text('usageGuide'), resourceLinks: lines(formData, 'resourceLinks'), relatedAssetIds: lines(formData, 'relatedAssetIds') };
  if (contentType === 'AI_SKILL') return { goal: text('goal'), scenarios: lines(formData, 'scenarios'), unsuitableScenarios: lines(formData, 'unsuitableScenarios'), applicableRoles: lines(formData, 'applicableRoles'), inputRequirements: text('inputRequirements'), outputSchema: text('outputSchema'), promptTemplate: text('promptTemplate'), executionSteps: text('executionSteps'), exampleInput: text('exampleInput'), exampleOutput: text('exampleOutput'), humanReviewRules: text('humanReviewRules'), limitations: text('limitations'), recommendedModels: lines(formData, 'recommendedModels'), dataSecurityLevel: text('dataSecurityLevel'), promptVersion: text('promptVersion') };
  if (contentType === 'AI_CASE') return { caseUrl: text('caseUrl'), background: text('background'), originalProblem: text('originalProblem'), originalProcess: text('originalProcess'), aiIntervention: text('aiIntervention'), aiResponsibilities: text('aiResponsibilities'), humanResponsibilities: text('humanResponsibilities'), resultSummary: text('resultSummary'), beforeAfterComparison: text('beforeAfterComparison'), sampleSize: text('sampleSize'), validationMethod: text('validationMethod'), dataResult: text('dataResult'), limitations: text('limitations'), reusableConclusion: text('reusableConclusion'), relatedSkillContentId: text('relatedSkillContentId'), relatedProjectContentId: text('relatedProjectContentId') };
  return { projectCode: text('projectCode'), domain: text('domain'), targetValue: text('targetValue'), projectStage: text('projectStage'), priority: text('priority'), problemStatement: text('problemStatement'), solutionHypothesis: text('solutionHypothesis'), expectedOutcome: text('expectedOutcome'), riskLevel: text('riskLevel'), evaluationResult: text('evaluationResult'), relatedSkillIds: lines(formData, 'relatedSkillIds'), relatedCaseIds: lines(formData, 'relatedCaseIds'), convertedProjectRef: text('convertedProjectRef') };
}

function draftUpdate(formData: FormData) {
  return {
    title: formData.get('title'),
    summary: optionalText(formData.get('summary')),
    changeSummary: optionalText(formData.get('changeSummary')),
    categoryId: optionalText(formData.get('categoryId')) ?? null,
    tagIds: formData.getAll('tagIds'),
    body: structuredBody(String(formData.get('contentType') ?? ''), formData),
  };
}

export async function createDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const teamId = String(formData.get('teamId') ?? '').trim();
    if (!teamId) return { error: '请先选择归属团队。' };
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(teamId)) return { error: '归属团队信息无效，请重新选择团队后重试。' };
    const draft = await serverApiFetch<{ id: string }>('/api/content-drafts', {
      method: 'POST',
      headers: { ...(await authenticatedApiHeaders()), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contentType: formData.get('contentType'),
        teamId,
        categoryId: optionalText(formData.get('categoryId')),
        tagIds: formData.getAll('tagIds'),
        title: formData.get('title'),
        summary: optionalText(formData.get('summary')),
        body: structuredBody(String(formData.get('contentType') ?? ''), formData),
      }),
    });
    const cover = formData.get('coverImage');
    if (['DESIGN_ASSET', 'AI_TOOL'].includes(String(formData.get('contentType'))) && cover instanceof File && cover.size) {
      const data = new FormData(); data.set('id', draft.id); data.set('cover', 'true'); data.set('file', cover);
      const uploaded = await uploadDraftAttachmentAction({}, data);
      if (uploaded.error) return { id: draft.id, error: `草稿已保存，封面上传失败：${uploaded.error}。请进入草稿重试。` };
    }
    return { id: draft.id };
  } catch (error) {
    return { error: userError(error, '无法创建草稿。') };
  }
}

export async function createPublishedEditDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get('id') ?? '');
  let draftId = '';
  try {
    const draft = await serverApiFetch<{ id: string }>(`/api/content-drafts/${id}/from-published`, {
      method: 'POST',
      headers: await authenticatedApiHeaders(),
    });
    draftId = draft.id;
  } catch (error) {
    return { error: userError(error, '无法创建编辑草稿。') };
  }
  if (formData.get('__managedCache') === 'true') return { id: draftId };
  redirect(`/workspace/submit/${encodeURIComponent(draftId)}`);
}

export async function autosaveDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get('id') ?? '');
  try {
    await serverApiFetch(`/api/content-drafts/${id}`, {
      method: 'PATCH',
      headers: { ...(await authenticatedApiHeaders()), 'Content-Type': 'application/json' },
      body: JSON.stringify(draftUpdate(formData)),
    });
    return { savedAt: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) };
  } catch (error) {
    return { error: userError(error, '自动保存失败。') };
  }
}

export async function saveAndPreviewDraftAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  if (!id) return;
  await serverApiFetch(`/api/content-drafts/${id}`, {
    method: 'PATCH',
    headers: { ...(await authenticatedApiHeaders()), 'Content-Type': 'application/json' },
    body: JSON.stringify(draftUpdate(formData)),
  });
  revalidatePath(`/workspace/submit/${encodeURIComponent(id)}`);
  redirect(`/workspace/submit/${encodeURIComponent(id)}/preview`);
}

export async function contentLifecycleAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const id = String(formData.get('id') ?? '').trim();
  const operation = String(formData.get('operation') ?? '');
  if (!id || !new Set(['unpublish', 'archive']).has(operation)) return { error: '无效的内容生命周期操作。' };
  try {
    const updated = await serverApiFetch<{ status: string }>(`/api/content-drafts/${encodeURIComponent(id)}/${operation}`, {
      method: 'POST',
      headers: await authenticatedApiHeaders(),
    });
    if (updated.status !== (operation === 'archive' ? 'ARCHIVED' : 'UNPUBLISHED')) {
      return { error: '内容状态尚未更新成功，请刷新后重试。' };
    }
  } catch (error) {
    return { error: userError(error, '内容状态更新失败。') };
  }
  if (formData.get('inline') === 'true') return { updatedStatus: operation === 'archive' ? 'ARCHIVED' : 'UNPUBLISHED' };
  revalidatePath('/workspace', 'layout');
  redirect('/workspace/contributions');
}

export async function publishDraftAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let publishedHref = '';
  let publication: ActionState['publication'];
  try {
    const id = String(formData.get('id') ?? '');
    const published = await serverApiFetch<{ contentType: string; title?: string; summary?: string | null; slug?: string }>(`/api/content-drafts/${encodeURIComponent(id)}/publish`, {
      method: 'POST',
      headers: { ...(await authenticatedApiHeaders()), 'Content-Type': 'application/json' },
      body: JSON.stringify(draftUpdate(formData)),
    });
    const segments: Record<string, string> = { DESIGN_ASSET: 'design-assets', AI_SKILL: 'ai-skills', AI_CASE: 'ai-cases', AI_PROJECT: 'ai-projects', AI_TOOL: 'ai-tools' };
    publishedHref = `/workspace/${segments[published.contentType] ?? 'contributions'}`;
    if (published.title && published.slug) publication = { title: published.title, summary: published.summary ?? null, href: `${publishedHref}/${encodeURIComponent(published.slug)}`, catalog: publishedHref };
  } catch (error) {
    return { error: userError(error, '发布失败，请重试。') };
  }
  if (formData.get('__managedCache') !== 'true') revalidatePath('/workspace', 'layout');
  return { publishedHref, ...(publication ? { publication } : {}) };
}

export async function saveDraftForPreviewAction(previous: ActionState, formData: FormData): Promise<ActionState> {
  const result = await autosaveDraftAction(previous, formData);
  if (result.error) return result;
  return { ...result, previewHref: `/workspace/submit/${encodeURIComponent(String(formData.get('id')))}/preview` };
}
