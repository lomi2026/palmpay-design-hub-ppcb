import { appPath } from '@/lib/app-path';
import { ActionFeedback } from '@/components/workspace/action-feedback';
import { NavigationCacheProvider, NavigationCacheOutlet } from '@/components/workspace/navigation-cache';
import { WorkspaceDataLink } from '@/components/workspace/workspace-data-link';
import { FavoriteProvider } from '@/components/workspace/favorite-context';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { AuthServiceUnavailable } from '@/components/workspace/auth-service-unavailable';
import { optionalServerApiFetch, serverApiFetch } from '@/lib/api';
import {
  AuthenticationServiceUnavailableError,
  authenticatedApiHeaders,
  hasAuthenticationSession,
  loadCurrentUser,
  type CurrentUser,
} from '@/lib/auth';
import { WorkspaceSearchShortcut } from '@/components/workspace/workspace-search-shortcut';
import { NotificationBadge } from '@/components/workspace/notification-badge';
import { WorkspaceAccountMenu } from '@/components/workspace/workspace-account-menu';
import { V9ThemeToggle } from '@/components/marketing/v9-theme-toggle';
import {
  WorkspaceBreadcrumb,
  WorkspaceMobileNavigation,
  WorkspaceSidebarNavigation,
} from '@/components/workspace/workspace-navigation';

const roleLabels: Record<string, string> = {
  admin: '平台管理员',
  manager: '设计管理者',
  member: '设计成员',
};

function primaryRoleLabel(roleCodes: string[]) {
  const primary = ['admin', 'manager', 'member'].find((code) => roleCodes.includes(code));
  return primary ? roleLabels[primary] ?? '已认证成员' : '已认证成员';
}

export default async function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let user: CurrentUser | null;
  try {
    user = await loadCurrentUser();
  } catch (error: unknown) {
    if (error instanceof AuthenticationServiceUnavailableError) return <AuthServiceUnavailable />;
    throw error;
  }
  if (!user) {
    const hadSession = await hasAuthenticationSession();
    redirect(hadSession ? '/login?error=session-expired' : '/login');
  }
  const canAnalyze = user.permissions.includes('analytics.read');
  const canCreate = user.permissions.includes('content.create');
  const canManage = user.permissions.includes('user.manage') || user.permissions.includes('taxonomy.manage') || user.permissions.includes('content.edit_all') || user.permissions.includes('audit.read');
  const roleLabel = primaryRoleLabel(user.roles.map((role) => role.code));
  const headers = await authenticatedApiHeaders();
  const [notifications, favorites, projects] = await Promise.all([
    optionalServerApiFetch<{ unreadCount: number }>('/api/notifications/unread-count', { headers }, { unreadCount: 0 }),
    serverApiFetch<{items:Array<{content:{id:string}}>}>('/api/me/favorites',{headers}),
    optionalServerApiFetch<{ total: number }>('/api/contents?type=AI_PROJECT&pageSize=1', { headers }, { total: 0 }),
  ]);
  const navigationProps = {
    canAnalyze,
    canCreate,
    canManage,
    projectCount: projects.total,
  };

  return (
    <NavigationCacheProvider key={JSON.stringify([user.id, user.organizationId, [...user.permissions].sort()])} scope={JSON.stringify([user.id, user.organizationId, [...user.permissions].sort()])}><FavoriteProvider ids={favorites.items.map(item=>item.content.id)} projectCount={projects.total}><div className="workspace-shell v9-source-home min-h-screen bg-[var(--v9-bg)] text-[var(--v9-text)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[224px] border-r border-[var(--v9-line)] bg-[var(--v9-sidebar)] md:flex md:flex-col">
        <Link href="/" className="flex h-16 items-center gap-3 border-b border-white/[.11] px-5"><Image src={appPath('/brand/palmpay-logo.svg')} alt="PalmPay Design" width={31} height={31} className="size-[31px] object-contain" /><span className="text-[13px] font-bold">PalmPay Design</span></Link>
        <div className="flex-1 overflow-y-auto p-2.5">
          <Button asChild variant="outline" className="mb-6 h-10 w-full justify-start rounded-[12px] border-white/[.15] bg-transparent px-3 text-[13px] text-white hover:bg-white/[.06] hover:text-white"><Link href="/"><span className="mr-1">←</span> 返回平台首页</Link></Button>
          <WorkspaceSidebarNavigation {...navigationProps} />
        </div>
      </aside>
      <div className="md:pl-[224px]">
        <header className="sticky top-0 z-20 flex h-16 items-center border-b border-[var(--v9-line)] bg-[color-mix(in_srgb,var(--v9-bg)_95%,transparent)] px-4 backdrop-blur-xl md:px-8"><WorkspaceMobileNavigation {...navigationProps} /><WorkspaceBreadcrumb /><WorkspaceSearchShortcut /><div className="ml-auto flex items-center gap-2"><Button asChild variant="outline" size="icon-sm" className="size-10 rounded-[12px] border-border bg-background text-foreground hover:bg-muted hover:text-foreground"><WorkspaceDataLink href="/workspace/favorites" aria-label="收藏与浏览" title="收藏与浏览"><Heart className="size-4" /></WorkspaceDataLink></Button><V9ThemeToggle /><NotificationBadge initialUnreadCount={notifications.unreadCount} key={`notifications-${notifications.unreadCount}`} /><WorkspaceAccountMenu email={user.email} name={user.name} roleLabel={roleLabel} /></div></header>
        <NavigationCacheOutlet>{children}</NavigationCacheOutlet>
      </div>
    </div><ActionFeedback /></FavoriteProvider></NavigationCacheProvider>
  );
}
