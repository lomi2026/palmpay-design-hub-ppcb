import { Button } from '@/components/ui/button';
import { ManagementMenu } from '@/components/workspace/management-menu';
import { CachedWorkspacePage } from '@/components/workspace/navigation-cache';
import { DeleteContentButton } from '@/components/workspace/delete-content-button';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ExternalLink, MoreHorizontal } from 'lucide-react';
import { ApiError, serverApiFetch } from '@/lib/api';
import {
  getImportedProjectBody,
  getProjectPageUrl,
  stageLabels,
  verificationLabels,
  type AIProjectDetail,
} from '@/lib/ai-projects';
import { authenticatedApiHeaders, loadCurrentUser } from '@/lib/auth';
import { PublishedEdit } from '../../published-edit';
import { ContentLifecycle } from '../../content-lifecycle';
import {
  ContentEngagementLinks,
  FavoriteControl,
} from '@/components/workspace/engagement-controls';
import { UsageSummary } from '@/components/workspace/usage-summary';
import { PublishedAttachments } from '@/components/workspace/published-attachments';
import { ProjectReadingNavigation } from '@/components/workspace/project-reading-navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-4 py-3 text-sm">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="text-neutral-200">{value ?? '暂无'}</dd>
    </div>
  );
}

async function AIProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { slug } = await params;
  const { from } = await searchParams;
  let project: AIProjectDetail;
  try {
    project = await serverApiFetch<AIProjectDetail>(`/api/contents/${encodeURIComponent(slug)}`, {
      headers: await authenticatedApiHeaders(),
    });
  } catch (error: unknown) {
    if (error instanceof ApiError && [403, 404].includes(error.status)) notFound();
    throw error;
  }
  const currentUser = await loadCurrentUser();
  const canEdit =
    (currentUser?.id === project.owner.id &&
      currentUser.permissions.includes('content.edit_own')) ||
    currentUser?.permissions.includes('content.edit_all');
  const canUnpublish = currentUser?.permissions.includes('content.unpublish') ?? false;
  const canArchive = currentUser?.permissions.includes('content.archive') ?? false;
  const detail = project.projectDetail;
  const body = getImportedProjectBody(project.currentVersion?.body);
  const projectPageUrl = getProjectPageUrl(body.source?.legacyProjectUrl);
  const priority = body.prioritization;
  const stage = detail ? stageLabels[detail.projectStage] : '待补充';
  const projectCode = detail?.projectCode ?? 'AI 项目';
  const projectSummary = project.summary ?? '该项目尚未补充摘要。';
  const projectSignals = [
    ['项目领域', detail?.domain ?? project.category?.name ?? '待分类'],
    ['目标价值', detail?.targetValue ?? '待补充'],
    ['项目阶段', stage],
    ['风险等级', detail?.riskLevel ?? '待评估'],
  ];
  const projectOutcomes = [
    ['要解决的问题', detail?.problemStatement ?? projectSummary],
    ['方案假设', detail?.solutionHypothesis ?? '尚未补充方案假设。'],
    ['预期结果', detail?.expectedOutcome ?? '尚未补充预期结果。'],
    ['下一步验证', body.nextStep ?? '尚未补充下一步验证计划。'],
  ];

  return (
    <main className="min-h-full bg-[var(--v9-bg)] px-3 py-3 md:px-[22px] md:py-[22px]">
      <div className="mx-auto max-w-[1460px]">
        <Link className="inline-flex items-center gap-2 text-[12px] text-white/55 transition hover:text-white" href={from === 'home' ? '/#projects' : '/workspace/ai-projects'}><ArrowLeft className="size-4" />{from === 'home' ? '返回首页项目组合' : '返回 AI 项目库'}</Link>

        <section data-card-surface="" className="project-detail-intro mt-6 rounded-[24px] bg-[var(--v9-panel)]">
          <div className="block">
            <div className="p-5 md:p-6">
              <p className="flex items-center gap-2 text-[12px] font-bold tracking-[.16em] text-white/50"><span className="size-1.5 rounded-full bg-white" />{projectCode}</p>
              <div className="mt-3"><h1 className="max-w-[1000px] break-words text-[44px] font-semibold leading-[.98] tracking-[-.065em] text-white md:text-[clamp(46px,6.2vw,86px)]">{project.title}</h1><p className="mt-3 max-w-[960px] text-sm leading-7 text-[var(--v9-copy)]">{projectSummary}</p><div className="detail-toolbar mt-6 w-full">{projectPageUrl ? <Button asChild><a href={projectPageUrl} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true" />查看项目</a></Button> : null}<FavoriteControl size="md" contentId={project.id} returnTo={`/workspace/ai-projects/${project.slug}`} /><ContentEngagementLinks contentId={project.id} canonicalPath={`/workspace/ai-projects/${encodeURIComponent(project.slug)}`} />{canEdit ? <PublishedEdit contentId={project.id} /> : null}{canEdit || canArchive || canUnpublish ? <ManagementMenu><summary aria-label="更多管理操作"><MoreHorizontal size={18} /></summary><div><p>内容管理</p><div className="flex items-start gap-3"><ContentLifecycle canArchive={canArchive} canUnpublish={canUnpublish} contentId={project.id} />{canEdit ? <DeleteContentButton filled contentId={project.id} title={project.title} redirectTo="/workspace/ai-projects" className="h-9 px-3 text-[12px]" /> : null}</div></div></ManagementMenu> : null}</div></div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-[16px] bg-[var(--v9-soft)] p-4"><small className="block text-[11px] font-bold text-white/45">当前阶段</small><strong className="mt-1.5 block text-[16px] leading-6 text-white">{stage}</strong></div><div className="rounded-[16px] bg-[var(--v9-soft)] p-4"><small className="block text-[11px] font-bold text-white/45">验证状态</small><strong className="mt-1.5 block text-[16px] leading-6 text-white">{verificationLabels[project.verificationStatus] ?? project.verificationStatus}</strong></div><div className="rounded-[16px] bg-[var(--v9-soft)] p-4"><small className="block text-[11px] font-bold text-white/45">建议团队</small><strong className="mt-1.5 block text-[16px] leading-6 text-white">{detail?.suggestedOwnerTeam?.name ?? project.team.name}</strong></div></div>
              <div className="mt-6 grid gap-4 border-t border-[var(--v9-line)] pt-5 sm:grid-cols-3">{projectOutcomes.map(([label, value]) => <div key={label} className={label === '下一步验证' ? 'sm:col-span-3 rounded-xl bg-[var(--v9-soft)] p-4' : 'min-w-0'}><h2 className="text-sm font-semibold text-[var(--v9-text)]">{label}</h2><p className="mt-2 text-sm leading-6 text-[var(--v9-copy)]">{value}</p></div>)}</div><UsageSummary key={project.id} contentId={project.id} />
            </div>

          </div>
        </section>

        <section className="mt-6"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><h2 className="scroll-mt-28 text-[30px] font-semibold tracking-[-.045em] text-white md:text-[50px]" id="management-summary">一页看懂项目探索状态</h2><p className="max-w-[680px] text-[14px] leading-6 text-white/50">所有指标、风险和下一步都来自正式内容版本与 AI 项目详情数据，不使用静态原型身份或业务状态。</p></div><div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]"><div data-card-surface="" className="grid gap-4 rounded-[24px] border border-white/[.1] bg-[#111] p-6 sm:grid-cols-2 md:p-[26px]">{projectSignals.map(([label,value]) => <div data-card-surface="" className="rounded-2xl border border-white/[.1] bg-[#171717] p-[18px]" key={label}><p className="text-[11px] font-bold tracking-[.08em] text-white/45">{label}</p><strong className="mt-3 block text-[24px] tracking-[-.04em] text-white">{value}</strong></div>)}</div><Card className="border-[var(--v9-line)] bg-[var(--v9-panel)] py-0 text-[var(--v9-text)] shadow-none"><CardContent className="flex h-full min-h-[260px] flex-col justify-between p-6"><div><p className="text-[11px] font-bold tracking-[.12em] text-[var(--v9-copy)]">探索假设</p><h3 className="mt-4 text-[30px] font-semibold leading-[1.05] tracking-[-.045em]">{detail?.solutionHypothesis ?? '通过可验证的探索，形成可复用的设计判断。'}</h3></div><p className="border-t border-[var(--v9-line)] pt-4 text-[13px] font-semibold text-[var(--v9-muted)]">{detail?.expectedOutcome ?? body.nextStep ?? '待补充下一步验证计划。'}</p></CardContent></Card></div></section>

        <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]"><Card className="border-white/[.1] bg-[#111] py-0 shadow-none"><CardContent className="p-6 md:p-[26px]"><h2 className="scroll-mt-28 text-[30px] font-semibold tracking-[-.045em] text-white" id="project-context">项目管理信息</h2><dl className="mt-6 divide-y divide-white/[.1] border-y border-white/[.1]"><DetailRow label="项目编号" value={projectCode} /><DetailRow label="项目领域" value={detail?.domain ?? project.category?.name} /><DetailRow label="目标价值" value={detail?.targetValue} /><DetailRow label="建议团队" value={detail?.suggestedOwnerTeam?.name ?? project.team.name} /><DetailRow label="内容版本" value={project.currentVersion?.versionLabel ?? `v${project.currentVersion?.versionNumber ?? 1}`} /><DetailRow label="发布者" value={project.owner.name} /></dl></CardContent></Card><div className="space-y-4"><Card className="border-white/[.1] bg-[#111] py-0 shadow-none"><CardContent className="p-6"><h2 className="scroll-mt-28 text-[24px] font-semibold tracking-[-.035em] text-white" id="prioritization">优先级依据</h2><div className="mt-6 grid grid-cols-2 gap-4 text-sm"><span className="text-white/45">排序 <b className="ml-2 text-white">{priority?.rank ? `#${priority.rank}` : '待评估'}</b></span><span className="text-white/45">影响 <b className="ml-2 text-white">{priority?.impact ?? '待评估'}</b></span><span className="text-white/45">投入 <b className="ml-2 text-white">{priority?.effort ?? '待评估'}</b></span><span className="text-white/45">就绪度 <b className="ml-2 text-white">{priority?.readiness ?? '待评估'}</b></span></div><p className="mt-6 border-t border-white/[.1] pt-4 text-sm leading-6 text-white/55">{priority?.reason ?? '该项目尚未进入排序评估。'}</p></CardContent></Card><Card className="border-white/[.1] bg-[#111] py-0 shadow-none"><CardContent className="p-6"><h2 className="scroll-mt-28 text-[24px] font-semibold tracking-[-.035em] text-white" id="source-traceability">来源与追溯</h2><p className="mt-3 text-sm leading-6 text-white/55">该项目已从批准的 v9-1 项目库迁入正式内容目录，并保留版本、团队和验证状态。</p>{projectPageUrl ? <a className="mt-4 inline-flex items-center gap-2 text-sm text-white underline underline-offset-4" href={projectPageUrl} rel="noreferrer" target="_blank">查看项目页面 <ArrowRight className="size-4" /></a> : null}</CardContent></Card></div></section>
        <ProjectReadingNavigation items={[
          { id: 'management-summary', label: '一页看懂项目探索状态' },
          { id: 'project-context', label: '项目管理信息' },
          { id: 'prioritization', label: '优先级依据' },
          { id: 'source-traceability', label: '来源与追溯' },
        ]} />
        <div className="mt-4 max-w-[360px]"><PublishedAttachments attachments={project.attachments} /></div>
      </div>
    </main>
  );
}

export default async function CachedDetailPage(props: Parameters<typeof AIProjectDetailPage>[0]) {
  return <CachedWorkspacePage>{await AIProjectDetailPage(props)}</CachedWorkspacePage>;
}
