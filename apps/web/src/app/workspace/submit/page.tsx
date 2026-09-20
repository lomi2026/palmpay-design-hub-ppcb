import { CachedWorkspacePage } from '@/components/workspace/navigation-cache';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { serverApiFetch } from '@/lib/api';
import { authenticatedApiHeaders } from '@/lib/auth';
import { CreateDraftForm } from './create-draft-form';
import type { TaxonomyOptions } from '@/components/workspace/taxonomy-fields';

type TeamResponse = { items: Array<{ id: string; name: string; code: string }> };
type ContentType = 'DESIGN_ASSET' | 'AI_SKILL' | 'AI_CASE' | 'AI_PROJECT' | 'AI_TOOL';

const contentTypes = new Set<ContentType>(['DESIGN_ASSET', 'AI_SKILL', 'AI_CASE', 'AI_PROJECT', 'AI_TOOL']);

async function SubmitContentPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const headers = await authenticatedApiHeaders();
  const [teams, taxonomy] = await Promise.all([
    serverApiFetch<TeamResponse>('/api/content-draft-teams', { headers }),
    serverApiFetch<TaxonomyOptions>('/api/content-drafts/taxonomy', { headers }),
  ]);
  const initialContentType = type && contentTypes.has(type as ContentType) ? type as ContentType : undefined;
  return <main className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 md:py-10"><header className="workspace-page-card flex flex-wrap items-end justify-between gap-4 border-b border-white/[.1] pb-7"><div><h1 className="text-[34px] font-semibold tracking-[-.055em] text-white">发布内容</h1><p className="mt-3 text-sm leading-6 text-[var(--v9-copy)]">分享设计资产、AI 工具与实践经验，让团队发现并复用你的成果。</p></div><Link className="text-sm text-white/55 transition hover:text-white" href="/workspace">返回工作台 →</Link></header><CreateDraftForm initialContentType={initialContentType} teams={teams.items} taxonomy={taxonomy} /></main>;
}

export default async function CachedPage(props: Parameters<typeof SubmitContentPage>[0]) {
  return <CachedWorkspacePage>{await SubmitContentPage(props)}</CachedWorkspacePage>;
}
