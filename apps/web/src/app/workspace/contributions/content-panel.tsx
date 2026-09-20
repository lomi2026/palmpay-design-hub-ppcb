import { ContentPresence } from '@/components/workspace/content-presence';
import { WorkspaceResults } from '@/components/workspace/navigation-cache';
import { PublishedEdit } from '../published-edit';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { WorkspaceFilterForm } from '@/components/workspace/workspace-filter-form';
import { DeleteContentButton } from '@/components/workspace/delete-content-button';
import { redirect } from 'next/navigation';
import { ArrowRight, FilePenLine, Plus } from 'lucide-react';

import { filterContributions, type ContributionFilters } from './filters';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { WorkspaceEmptyState } from '@/components/workspace/workspace-empty-state';
import { WorkspaceStatusBadge } from '@/components/workspace/workspace-status-badge';
import { authenticatedApiHeaders, loadCurrentUser } from '@/lib/auth';
import { serverApiFetch } from '@/lib/api';
import { contentTypeLabel } from '@/lib/content-types';

type VersionSummary = {
  id: string;
  versionNumber: number;
  versionStatus: string;
  versionLabel: string | null;
};

type Contribution = {
  id: string;
  contentType: string;
  title: string;
  slug: string;
  summary: string | null;
  status: string;
  verificationStatus: string;
  updatedAt: string;
  category: { id: string; name: string } | null;
  team: { id: string; name: string };
  currentVersion: VersionSummary | null;
  draftVersion: VersionSummary | null;
};

const detailSegments: Record<string, string> = {
  DESIGN_ASSET: 'design-assets',
  AI_SKILL: 'ai-skills',
  AI_CASE: 'ai-cases',
  AI_PROJECT: 'ai-projects',
  AI_TOOL: 'ai-tools',
};

function contributionAction(item: Contribution) {
  if (item.status === 'ARCHIVED' || item.status === 'UNPUBLISHED') return null;
  const draftStatus = item.draftVersion?.versionStatus;
  if (draftStatus === 'DRAFT') {
    return { href: `/workspace/submit/${item.id}`, label: '编辑', icon: FilePenLine };
  }
  if (item.currentVersion && detailSegments[item.contentType]) {
    return { href: `/workspace/${detailSegments[item.contentType]}/${item.slug}`, label: '查看详情', icon: ArrowRight };
  }
  return null;
}

export async function MyContentPanel({ filters = {} }: { filters?: ContributionFilters }) {
  const user = await loadCurrentUser();
  if (!user) redirect('/login');
  if (!user.permissions.includes('content.create')) {
    return <main className="px-5 py-8 md:px-8 md:py-10"><h1 className="text-3xl font-semibold tracking-[-0.045em] text-white">我的贡献</h1><p className="mt-3 text-sm text-white/55">此页面仅对拥有内容创建权限的成员开放。</p></main>;
  }

  const contributions = await serverApiFetch<{ items: Contribution[]; total: number }>('/api/content-drafts', {
    headers: await authenticatedApiHeaders(),
  });
  const visible = filterContributions(contributions.items, filters);
  const categories = Array.from(new Map(contributions.items.flatMap((item) => item.category ? [[item.category.id, item.category] as const] : [])).values());
  const filtered = Boolean(filters.search?.trim() || filters.categoryId || filters.status);
  const drafts = contributions.items.filter((item) => ['DRAFT', 'PUBLISHED'].includes(item.status) && (item.draftVersion?.versionStatus ?? item.status) === 'DRAFT').length;
  const published = contributions.items.filter((item) => item.status === 'PUBLISHED').length;

  return (
    <div className="contributions-panel">
      <header className="workspace-page-card !bg-[var(--v9-panel)] rounded-3xl shadow-none !p-6 flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0"><h1 className="text-[32px] font-semibold leading-10 tracking-[-.045em]">我的贡献</h1><p className="mt-3 text-sm leading-6 text-[var(--v9-copy)]">管理你创建的内容，继续完善草稿，查看和维护已发布的成果。</p></div>
        <div className="grid grid-cols-3 gap-4 shrink-0 w-full sm:w-[312px]">
          {[[drafts, '待完善'], [published, '已发布']].map(([value, label]) => <div key={label as string} className="flex h-24 flex-col justify-center rounded-2xl bg-[var(--v9-soft)] px-4"><span className="text-[28px] font-semibold leading-8">{value}</span><span className="mt-2 text-xs text-muted-foreground">{label}</span></div>)}
          <Link href="/workspace/submit" className="flex h-24 flex-col items-center justify-center gap-2 rounded-2xl bg-[var(--v9-text)] text-[var(--v9-panel)] transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-4"><Plus className="size-6" /><span className="text-xs font-semibold">新建内容</span></Link>
        </div>
      </header>

      <WorkspaceFilterForm key={JSON.stringify(filters)} action="/workspace/contributions" method="get" className="workspace-filter-bar mt-6 flex flex-wrap items-center gap-2">
        <label className="min-w-52 flex-1"><span className="sr-only">搜索内容</span><Input name="search" type="search" defaultValue={filters.search ?? ''} placeholder="搜索标题或摘要" className="h-10" /></label>
        <NativeSelect aria-label="分类" name="categoryId" defaultValue={filters.categoryId ?? ''} className="h-10 min-w-36"><option value="">全部分类</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}<option value="uncategorized">未分类</option></NativeSelect>
        <NativeSelect aria-label="发布状态" name="status" defaultValue={filters.status ?? ''} className="h-10 min-w-36"><option value="">全部发布状态</option><option value="DRAFT">草稿</option><option value="PUBLISHED">已发布</option><option value="UNPUBLISHED">已下架</option><option value="ARCHIVED">已归档</option></NativeSelect>
        <Button type="submit" variant="outline" className="h-10">应用筛选</Button>{filtered ? <Button asChild variant="ghost" className="h-10"><Link href="/workspace/contributions">清除</Link></Button> : null}
      </WorkspaceFilterForm>
      <WorkspaceResults>
      <div className="mt-4 flex items-center justify-between text-sm text-white/45">
        <span>共 {visible.length} 项{filtered ? `，全部 ${contributions.total} 项` : '个人内容'}</span>
        {user.permissions.includes('content.edit_all') ? <Link href="/workspace/admin?tab=content" className="text-white/70 hover:text-white">管理全部内容 →</Link> : null}
      </div>

      {visible.length ? (
        <div className="mt-4 grid gap-4">
          {visible.map((item) => {
            const action = contributionAction(item);
            const permittedAction =
              action?.href.startsWith('/workspace/submit/') &&
              !user.permissions.includes('content.edit_own') &&
              !user.permissions.includes('content.edit_all')
                ? null
                : action;
            const effectiveStatus = item.status;
            const versionNumber = item.draftVersion?.versionNumber ?? item.currentVersion?.versionNumber;
            return (
              <ContentPresence id={item.id} key={item.id}><Card data-clickable-card className="border-white/[.1] bg-[#111112] py-0 shadow-none">
                <CardContent className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] tracking-[0.1em] text-white/40">
                      <span>{contentTypeLabel(item.contentType)}</span>
                      <span>·</span>
                      <span>{item.team.name}</span>
                      {versionNumber ? <span>· V{versionNumber}</span> : null}
                    </div>
                    <h2 className="mt-2 truncate text-lg font-semibold text-white">{item.title}</h2>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/50">{item.summary || '暂未填写摘要。'}</p>
                    <p className="mt-3 text-xs text-white/35">更新于 {new Date(item.updatedAt).toLocaleString('zh-CN')}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
                    <WorkspaceStatusBadge status={effectiveStatus} />{item.status === 'PUBLISHED' && item.draftVersion ? <span className="text-xs text-muted-foreground">有未发布修改</span> : null}
                    <div className="flex flex-wrap items-center gap-3">
                    {['ARCHIVED', 'UNPUBLISHED'].includes(item.status) && (user.permissions.includes('content.edit_own') || user.permissions.includes('content.edit_all')) ? <PublishedEdit contentId={item.id} label="编辑" /> : null}
                    {permittedAction ? (
                      <Button asChild variant="outline" size="sm" className="border-white/15 bg-transparent text-white hover:bg-white/[0.07] hover:text-white">
                        <Link href={permittedAction.href}><permittedAction.icon className="size-4" /> {permittedAction.label}</Link>
                      </Button>
                    ) : null}
                    {user.permissions.includes('content.edit_own') || user.permissions.includes('content.edit_all') ? <DeleteContentButton neutral contentId={item.id} title={item.title} /> : null}
                    </div>
                  </div>
                </CardContent>
              </Card></ContentPresence>
            );
          })}
        </div>
      ) : (
        <WorkspaceEmptyState className="mt-6" icon={<FilePenLine className="size-8" />} title={filtered ? '没有符合条件的内容' : '还没有个人贡献'}>
          <p>{filtered ? '试试其他关键词或清除筛选。' : '从设计资产、AI Skill、案例、工具或项目开始创建内容。'}</p>
          <Button asChild className="mt-6"><Link href={filtered ? '/workspace/contributions' : '/workspace/submit'}>{filtered ? '清除筛选' : '创建第一项内容'}</Link></Button>
        </WorkspaceEmptyState>
      )}
      </WorkspaceResults>
    </div>
  );
}
