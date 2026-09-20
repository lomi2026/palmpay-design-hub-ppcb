import { EngagementForm } from '@/components/workspace/engagement-form';
import { CachedWorkspacePage } from '@/components/workspace/navigation-cache';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { UsageProjectField } from './usage-project-field';
import { authenticatedApiHeaders } from '@/lib/auth';
import { serverApiFetch } from '@/lib/api';
import type { ContentListResponse } from '@/lib/content-types';
import { WorkspacePageHero } from '@/components/workspace/workspace-page-hero';

async function UsagePage({
  searchParams,
}: {
  searchParams: Promise<{ contentId?: string; success?: string; error?: string }>;
}) {
  const { contentId = '', success, error } = await searchParams;
  const projects = await serverApiFetch<ContentListResponse>(
    '/api/contents?type=AI_PROJECT&pageSize=100',
    { headers: await authenticatedApiHeaders() },
  );
  return (
    <main className="mx-auto max-w-[960px] px-5 py-8 md:px-8 md:py-10">
      <Link href="/workspace" className="text-sm text-[var(--v9-muted)] transition hover:text-[var(--v9-text)]">
        ← 返回工作台
      </Link>
      <div className="mt-6"><WorkspacePageHero eyebrow="REAL PROJECT REUSE" metric={{ value: projects.total, label: '可关联项目' }} title="记录使用" /></div>
      {success ? (
        <p className="mt-6 rounded-lg border border-[var(--v9-status-success-line)] bg-[var(--v9-status-success-bg)] p-3 text-sm text-[var(--v9-status-success-text)]">
          已记录本次使用及关联项目。
        </p>
      ) : null}
      {error ? (
        <p className="mt-6 rounded-lg border border-[var(--v9-status-danger-line)] bg-[var(--v9-status-danger-bg)] p-3 text-sm text-[var(--v9-status-danger-text)]">
          请选择项目，或手动填写项目名称后再提交。
        </p>
      ) : null}
      <EngagementForm data-card-surface=""
        kind="usage"
        className="mt-6 space-y-5 rounded-2xl border border-[var(--v9-line)] bg-[var(--v9-panel)] p-6 md:p-6"
      >
        <input type="hidden" name="contentId" value={contentId} />
        <UsageProjectField projects={projects.items.map(project => ({ id: project.id, title: project.title }))} />
        <div>
          <label className="text-sm">使用说明（可选）</label>
          <Input
            name="note"
            maxLength={1000}
            placeholder="记录应用场景、产出或后续验证计划"
            className="mt-2"
          />
        </div>
        <Button className="mt-4 bg-white text-black hover:bg-white/85" type="submit">确认使用并关联项目</Button>
      </EngagementForm>
    </main>
  );
}

export default async function CachedPage(props: Parameters<typeof UsagePage>[0]) { return <CachedWorkspacePage cacheable={false}>{await UsagePage(props)}</CachedWorkspacePage>; }
