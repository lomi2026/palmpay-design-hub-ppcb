'use client';
import { showActionFeedback } from '@/components/workspace/action-feedback';

import { invalidateWorkspaceCache } from '@/components/workspace/cache-events';
import { useNavigationCache } from '@/components/workspace/navigation-cache';
import { useUnsavedChanges } from '@/components/workspace/use-unsaved-changes';
import { useActionState, useEffect, useState } from 'react';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { CoverPicker } from '@/components/workspace/cover-picker';
import { useRouter } from 'next/navigation';
import { Plus, BriefcaseBusiness, FileText, Layers3, Sparkles, Wrench } from 'lucide-react';

import { createDraftAction, type ActionState } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { TaxonomyFields, type TaxonomyOptions } from '@/components/workspace/taxonomy-fields';

type Team = { id: string; name: string; code: string };
type ContentType = 'DESIGN_ASSET' | 'AI_SKILL' | 'AI_CASE' | 'AI_PROJECT' | 'AI_TOOL';

const initialState: ActionState = {};

const contentTypes: Array<{ value: ContentType; label: string; description: string; icon: typeof Layers3 }> = [
  { value: 'DESIGN_ASSET', label: '设计资产', description: '沉淀可直接复用的规范、模板与方法。', icon: Layers3 },
  { value: 'AI_SKILL', label: 'AI Skill', description: '记录可复用的 AI 工作方法与判断边界。', icon: Sparkles },
  { value: 'AI_CASE', label: 'AI 案例', description: '说明 AI 如何介入、结果如何被验证。', icon: FileText },
  { value: 'AI_TOOL', label: 'AI 工具', description: '分享工具入口、适用场景与使用经验。', icon: Wrench },
  { value: 'AI_PROJECT', label: 'AI 项目', description: '建立可评估、可试点的探索方向。', icon: BriefcaseBusiness },
];

export function CreateDraftForm({
  teams,
  taxonomy,
  initialContentType = 'DESIGN_ASSET',
}: {
  teams: Team[];
  taxonomy: TaxonomyOptions;
  initialContentType?: ContentType;
}) {
  const router = useRouter();
  const begin = useNavigationCache()?.begin;
  const [dirty, setDirty] = useState(false);
  const [state, action, pending] = useActionState(async (previous: ActionState, data: FormData) => { const result = await createDraftAction(previous, data).catch((): ActionState => ({ error: '连接中断，操作结果暂未确认。请核对状态后重试。' })); if (result.error) showActionFeedback('error', result.error); else if (result.id) showActionFeedback('success', '草稿创建成功'); if (result.id) { setDirty(false); invalidateWorkspaceCache(['/workspace', '/workspace/contributions', '/workspace/submit']); } return result; }, initialState);
  useUnsavedChanges(dirty && !state.id);
  const [contentType, setContentType] = useState<ContentType>(initialContentType);
  useEffect(() => {
    if (state.id && !state.error) { begin?.(`/workspace/submit/${state.id}`); router.replace(`/workspace/submit/${state.id}`); }
  }, [router, state.id, state.error, begin]);

  return (
    <form data-managed-cache="" onInput={() => setDirty(true)} data-card-surface="" action={action} onResetCapture={(event) => { event.preventDefault(); event.stopPropagation(); }} className="composer-create mt-6 overflow-hidden rounded-[24px] border border-border bg-[var(--v9-panel)]">
      <section className="border-b border-border p-6 md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="mt-2 text-[22px] font-semibold tracking-[-.04em] text-white">内容类型</h2></div></div>
        <input name="contentType" type="hidden" value={contentType} />
        <div className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">{[...contentTypes].sort((a,b) => ['DESIGN_ASSET','AI_TOOL','AI_SKILL','AI_PROJECT','AI_CASE'].indexOf(a.value)-['DESIGN_ASSET','AI_TOOL','AI_SKILL','AI_PROJECT','AI_CASE'].indexOf(b.value)).map(({ value, label, description, icon: Icon }) => <button aria-pressed={contentType === value} className={`rounded-[16px] border p-4 text-left text-foreground transition focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${contentType === value ? 'border-ring bg-accent' : 'border-border bg-[var(--surface-subtle)] hover:border-input hover:bg-accent'}`} key={value} onClick={() => setContentType(value)} type="button"><Icon className={contentType === value ? 'size-4 text-foreground' : 'size-4 text-[var(--text-secondary)]'} /><strong className="mt-6 block text-[14px]">{label}</strong><span className="mt-1.5 block text-[11px] leading-5 text-[var(--text-description)]">{description}</span></button>)}</div>
      </section>
      <section className="grid gap-6 p-6 md:grid-cols-2 md:p-6">
        <label className="grid gap-1.5 text-sm text-white/75">归属团队<NativeSelect className="h-9 w-full rounded-lg border border-white/15 bg-black/25 px-3 text-sm text-white" containerClassName="w-full" name="teamId" required><option value="">请选择团队</option>{teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</NativeSelect></label>
        <div className="hidden md:block" />
        <label className="grid gap-1.5 text-sm text-white/75 md:col-span-2">标题<Input className="border-white/15 bg-black/25 text-white placeholder:text-white/35" name="title" placeholder="用清晰、可检索的标题说明内容" required /></label>
        <label className="grid gap-1.5 text-sm text-white/75 md:col-span-2">摘要<Textarea className="min-h-20 border-white/15 bg-black/25 text-white placeholder:text-white/35" name="summary" placeholder="说明它解决什么问题、适用于哪些场景" /></label>
        <div className="md:col-span-2"><TaxonomyFields key={contentType} options={taxonomy} contentType={contentType} /></div>
        {['DESIGN_ASSET', 'AI_TOOL'].includes(contentType) ? <div className="space-y-3 md:col-span-2"><h3 className="text-sm font-medium">封面图片 <span className="text-muted-foreground">选填</span></h3><CoverPicker name="coverImage" disabled={pending} /></div> : null}
        <p className="text-sm leading-6 text-[var(--text-description)] md:col-span-2">下一步完善使用方法和发布信息。现在只会创建私人草稿。</p>
      </section>
      {state.error ? <p role="alert" className="px-5 text-sm text-destructive md:px-6">{state.error}</p> : null}
      <div className="flex items-center justify-between border-t border-white/10 px-5 py-4 md:px-6">{state.id ? <Button asChild><Link href={`/workspace/submit/${state.id}`}>进入已保存草稿</Link></Button> : <Button className="bg-white text-black hover:bg-white/85" disabled={pending} type="submit"><Plus aria-hidden="true" />{pending ? '正在创建…' : '创建草稿并继续'}</Button>}</div>
    </form>
  );
}
