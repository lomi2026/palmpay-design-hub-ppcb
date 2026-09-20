import { FavoritePresence } from '@/components/workspace/favorite-context';
import { CachedWorkspacePage } from '@/components/workspace/navigation-cache';
import { ContentCard } from '@/components/content-card';
import { FavoriteControl } from '@/components/workspace/engagement-controls';
import { WorkspacePageHero } from '@/components/workspace/workspace-page-hero';
import { WorkspaceEmptyState } from '@/components/workspace/workspace-empty-state';
import { authenticatedApiHeaders } from '@/lib/auth';
import { serverApiFetch } from '@/lib/api';
import type { ContentCard as ContentCardData } from '@/lib/content-types';
import { RefreshRecentOnEntry } from '../recent/refresh-on-entry';
import { PersonalTabs } from './personal-tabs';

type FavoriteItem = { createdAt: string; content: ContentCardData };
type RecentItem = { viewCount: number; lastViewedAt: string; content: ContentCardData };

async function FavoritesPage({ searchParams }: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const activeTab = (await searchParams).tab === 'recent' ? 'recent' : 'favorites';
  const headers = await authenticatedApiHeaders();
  const recent = activeTab === 'recent'
    ? await serverApiFetch<{ items: RecentItem[] }>('/api/me/recent-views', { headers })
    : null;
  const favorites = activeTab === 'favorites'
    ? await serverApiFetch<{ items: FavoriteItem[] }>('/api/me/favorites', { headers })
    : null;

  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 md:py-10">
      {recent ? <RefreshRecentOnEntry /> : null}
      <WorkspacePageHero
        eyebrow="PERSONAL SPACE"
        metric={{ value: (recent ?? favorites)!.items.length, label: recent ? '近期内容' : '已收藏内容' }}
        title="收藏与浏览"
      />
      <PersonalTabs activeTab={activeTab}>
        {recent ? <RecentList result={recent} /> : <FavoriteList result={favorites!} />}
      </PersonalTabs>
    </main>
  );
}

function FavoriteList({ result }: { result: { items: FavoriteItem[] } }) {
  return (
    <>
      {result.items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.items.map(({ content }) => (
            <FavoritePresence id={content.id} key={content.id}><div>
              <ContentCard content={content} />
              <div className="mt-2">
                <FavoriteControl contentId={content.id} active returnTo="/workspace/favorites" />
              </div>
            </div></FavoritePresence>
          ))}
        </div>
      ) : (
        <WorkspaceEmptyState>
          还没有收藏内容。浏览资产、Skill、案例或项目时可以加入收藏。
        </WorkspaceEmptyState>
      )}
    </>
  );
}

function RecentList({ result }: { result: { items: RecentItem[] } }) {
  return (
    <>
      {result.items.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {result.items.map(({ content, viewCount, lastViewedAt }) => (
            <div key={content.id}>
              <ContentCard content={content} />
              <p className="mt-2 text-xs text-white/40">
                浏览 {viewCount} 次 ·{' '}
                {new Intl.DateTimeFormat('zh-CN').format(new Date(lastViewedAt))}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <WorkspaceEmptyState>
          最近没有浏览记录。打开一项正式内容后，它会出现在这里。
        </WorkspaceEmptyState>
      )}
    </>
  );
}

export default async function CachedPage(props: Parameters<typeof FavoritesPage>[0]) {
  return <CachedWorkspacePage>{await FavoritesPage(props)}</CachedWorkspacePage>;
}
