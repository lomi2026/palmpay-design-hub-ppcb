import { DashboardMotion, AnimatedNumber } from '@/components/workspace/dashboard-motion';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { Button } from '@/components/ui/button';
import styles from './studio-welcome.module.css';
import {
  ArrowUpRight,
  ArrowRight,
  Layers3,
  Wrench,
  Sparkles,
  Lightbulb,
  BriefcaseBusiness,
  Plus,
  Clock3,
} from 'lucide-react';
import { authenticatedApiHeaders, loadCurrentUser } from '@/lib/auth';
import { serverApiFetch } from '@/lib/api';
import { contentTypeLabel, type ContentListResponse } from '@/lib/content-types';
const routes: Record<string, string> = {
  DESIGN_ASSET: 'design-assets',
  AI_TOOL: 'ai-tools',
  AI_SKILL: 'ai-skills',
  AI_PROJECT: 'ai-projects',
  AI_CASE: 'ai-cases',
};
const entrances = [
  [Layers3, '设计资产', 'design-assets', '规范、模板与方法'],
  [Wrench, 'AI 工具', 'ai-tools', '找到顺手的工具'],
  [Sparkles, 'AI Skill', 'ai-skills', '复用成熟的工作流'],
  [Lightbulb, 'AI 项目库', 'ai-projects', '发现下一次探索'],
  [BriefcaseBusiness, 'AI 案例', 'ai-cases', '借鉴真实实践'],
] as const;
export async function StudioDashboard() {
  const headers = await authenticatedApiHeaders();
  const user = await loadCurrentUser();
  const canCreate = user?.permissions.includes('content.create');
  const [catalog, drafts] = await Promise.all([
    serverApiFetch<ContentListResponse>('/api/contents?pageSize=6', { headers }),
    canCreate
      ? serverApiFetch<{
          items: Array<{ id: string; title: string; status: string; draftVersion?: unknown }>;
        }>('/api/content-drafts', { headers })
      : Promise.resolve({ items: [] }),
  ]);
  const pending = drafts.items.filter((item) => item.status === 'DRAFT' || item.draftVersion);
  return (
    <DashboardMotion className="studio-dashboard">
      <section className={styles.welcome} aria-labelledby="workspace-welcome-title">
        <div>
          <p className={`eyebrow ${styles.eyebrow}`}>PALMPAY · DESIGN WORKSPACE</p>
          <h1 id="workspace-welcome-title" className={styles.title}>好设计，从这里继续。</h1>
          <p className={styles.description}>找到团队的方法，也留下你的下一次灵感。</p>
          <div className={styles.actions}>
            {canCreate ? (
              <Button asChild size="default">
                <Link prefetch={false} href="/workspace/submit"><Plus aria-hidden="true" />发布内容</Link>
              </Button>
            ) : null}
            <Link prefetch={false} className={styles.explore} href="/workspace/design-assets">
              探索设计资产 <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
        <div className={styles.stats}>
          <div className={styles.stat}>
            <strong><AnimatedNumber id="catalog" value={catalog.total} /></strong>
            <span>可用内容</span>
          </div>
          {canCreate ? (
            <Link prefetch={false} data-clickable-card="" className={styles.stat} href={pending.length === 1 && pending[0] ? `/workspace/submit/${pending[0].id}` : '#dashboard-drafts'} aria-label={`${pending.length} 项待完善草稿，继续创作`}>
              <strong><AnimatedNumber id="drafts" value={pending.length} /></strong>
              <span>待完善草稿 <ArrowUpRight size={14} aria-hidden="true" /></span>
            </Link>
          ) : null}
        </div>
      </section>
      <section className="studio-entry-grid">
        {entrances.map(([Icon, title, path, description]) => (
          <Link prefetch={false} href={`/workspace/${path}`} key={path}>
            <div>
              <Icon size={20} />
              <ArrowUpRight size={14} />
            </div>
            <h2>{title}</h2>
            <p>{description}</p>
          </Link>
        ))}
      </section>
      <div className="studio-work-grid">
        <section className="studio-panel">
          <header>
            <div>
              <p className="eyebrow">发现与复用</p>
              <h2>团队最近更新</h2>
            </div>
            <Link prefetch={false} href="/workspace/search" aria-label="浏览全部内容">
              <ArrowUpRight size={20} />
            </Link>
          </header>
          <div className="studio-update-list">
            {catalog.items.map((item) => (
              <Link prefetch={false} href={`/workspace/${routes[item.contentType]}/${item.slug}`} key={item.id}>
                <span className="studio-type-icon">
                  {item.contentType === 'AI_SKILL' ? (
                    <Sparkles size={18} />
                  ) : item.contentType === 'AI_TOOL' ? (
                    <Wrench size={18} />
                  ) : (
                    <Layers3 size={18} />
                  )}
                </span>
                <div>
                  <h3>{item.title}</h3>
                  <p>
                    {contentTypeLabel(item.contentType)} · {item.owner.name}
                  </p>
                </div>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
        </section>
        <section id="dashboard-drafts" className="studio-panel studio-drafts scroll-mt-24">
          <header>
            <div>
              <p className="eyebrow">继续创作</p>
              <h2>把想法补完整</h2>
            </div>
            <Clock3 size={20} />
          </header>
          {pending.length ? (
            pending.slice(0, 4).map((item) => (
              <Link prefetch={false}
                className="studio-draft-item"
                href={`/workspace/submit/${item.id}`}
                key={item.id}
              >
                <div>
                  <h3>{item.title}</h3>
                  <p>继续编辑草稿</p>
                </div>
                <ArrowRight size={16} />
              </Link>
            ))
          ) : (
            <div className="studio-empty">
              <Sparkles size={28} />
              <h3>留下一份值得复用的经验</h3>
              <p>从一个工具、一套方法或一次实践开始。</p>
              {canCreate ? (
                <Link prefetch={false} href="/workspace/submit">
                  创建第一份内容 <ArrowRight size={15} />
                </Link>
              ) : null}
            </div>
          )}
          <Link prefetch={false} className="studio-all" href="/workspace/contributions">
            查看我的贡献 <ArrowUpRight size={16} />
          </Link>
        </section>
      </div>
    </DashboardMotion>
  );
}
