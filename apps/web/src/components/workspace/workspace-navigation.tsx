'use client';

import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { WorkspaceDataLink } from './workspace-data-link';
import { useWorkspaceProjectCount } from './favorite-context';
import { useVisibleWorkspacePath } from './navigation-cache';
import { type MouseEventHandler } from 'react';
import {
  BarChart3,
  BriefcaseBusiness,
  ChartNoAxesCombined,
  FilePenLine,
  Layers3,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Send,
  Settings,
  Sparkles,
  Wrench,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type NavigationCapabilities = {
  canAnalyze: boolean;
  canCreate: boolean;
  canManage: boolean;
};

type NavigationProps = NavigationCapabilities & {
  projectCount: number;
};

type NavigationItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string | number;
};

function navigationGroups({
  canAnalyze,
  canCreate,
  canManage,
  projectCount,
}: NavigationProps): Array<{ label: string; items: NavigationItem[] }> {
  return [
    {
      label: '价值与数据',
      items: canAnalyze
        ? [
            { href: '/workspace/overview', label: '价值总览', icon: BarChart3 },
            { href: '/workspace/insights', label: '数据洞察', icon: ChartNoAxesCombined },
          ]
        : [],
    },
    {
      label: '知识与能力',
      items: [
        { href: '/workspace/design-assets', label: '设计资产', icon: Layers3 },
        { href: '/workspace/ai-tools', label: 'AI 工具', icon: Wrench },
        { href: '/workspace/ai-skills', label: 'AI Skill', icon: Sparkles },
        { href: '/workspace/ai-cases', label: 'AI 案例', icon: BriefcaseBusiness },
        { href: '/workspace/ai-projects', label: 'AI 项目库', icon: Lightbulb, badge: projectCount },
      ],
    },
    {
      label: '个人空间',
      items: [
        { href: '/workspace', label: '工作台', icon: LayoutDashboard },
        ...(canCreate ? [{ href: '/workspace/contributions', label: '我的贡献', icon: FilePenLine }] : []),
        ...(canCreate ? [{ href: '/workspace/submit', label: '发布内容', icon: Send }] : []),
      ],
    },
    {
      label: '平台管理',
      items: canManage ? [{ href: '/workspace/admin', label: '管理中心', icon: Settings }] : [],
    },
  ].filter((group) => group.items.length > 0);
}

function isActive(pathname: string, href: string) {
  return href === '/workspace' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function WorkspaceNavigationLink({
  active,
  item,
  onClick,
}: {
  active: boolean;
  item: NavigationItem;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}) {
  return (
    <WorkspaceDataLink
      href={item.href}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={cn(
        'flex h-10 items-center gap-3 rounded-[12px] px-3 text-[13px] transition',
        active
          ? 'bg-[var(--v9-soft-hover)] font-semibold text-[var(--v9-text)]'
          : 'text-[var(--v9-muted)] hover:bg-[var(--v9-soft)] hover:text-[var(--v9-text)]',
      )}
    >
      <item.icon className="size-4" />
      {item.label}
      {item.badge !== undefined ? (
        <Badge variant="outline" className="ml-auto border-[var(--v9-line)] px-1.5 text-[10px] text-[var(--v9-muted)]">
          {item.badge}
        </Badge>
      ) : null}
    </WorkspaceDataLink>
  );
}

function NavigationLinks({ closeOnNavigate = false, ...props }: NavigationProps & { closeOnNavigate?: boolean }) {
  const pathname = useVisibleWorkspacePath();
  const projectCount = useWorkspaceProjectCount(props.projectCount);
  return (
    <div className="space-y-6">
      {navigationGroups({ ...props, projectCount }).map((group) => (
        <section key={group.label}>
          <p className="mb-2 px-2 text-[11px] text-[var(--v9-subtle)]">{group.label}</p>
          <nav className="space-y-1" aria-label={group.label}>
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const link = <WorkspaceNavigationLink active={active} item={item} />;
              return closeOnNavigate ? <SheetClose asChild key={item.href}>{link}</SheetClose> : <div key={item.href}>{link}</div>;
            })}
          </nav>
        </section>
      ))}
    </div>
  );
}

export function WorkspaceSidebarNavigation(props: NavigationProps) {
  return <NavigationLinks {...props} />;
}

export function WorkspaceMobileNavigation(props: NavigationProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon-sm" className="mr-2 size-9 border-[var(--v9-line)] bg-transparent text-[var(--v9-text)] hover:bg-[var(--v9-soft)] hover:text-[var(--v9-text)] md:hidden" aria-label="打开工作台菜单">
          <Menu className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="gap-0 p-0">
        <SheetHeader className="border-b border-border pr-14">
          <SheetTitle>PalmPay 体验设计中心</SheetTitle>
          <SheetDescription>工作台导航</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-3">
          <NavigationLinks {...props} closeOnNavigate />
        </div>
      </SheetContent>
    </Sheet>
  );
}

const routeLabels: Array<[string, string]> = [
  ['/workspace/design-assets', '设计资产'],
  ['/workspace/ai-skills', 'AI Skill'],
  ['/workspace/ai-cases', 'AI 案例'],
  ['/workspace/ai-projects', 'AI 项目库'],
  ['/workspace/ai-tools', 'AI 工具'],
  ['/workspace/favorites', '收藏与浏览'],
  ['/workspace/recent', '收藏与浏览'],
  ['/workspace/notifications', '通知中心'],
  ['/workspace/contributions', '我的贡献'],
  ['/workspace/submissions', '我的贡献'],
  ['/workspace/submit', '发布内容'],
  ['/workspace/overview', '价值总览'],
  ['/workspace/insights', '数据洞察'],
  ['/workspace/admin', '管理中心'],
  ['/workspace/search', '全局搜索'],
];

export function WorkspaceBreadcrumb() {
  const pathname = useVisibleWorkspacePath();
  const label = pathname === '/workspace'
    ? '工作台'
    : routeLabels.find(([href]) => pathname === href || pathname.startsWith(`${href}/`))?.[1] ?? '工作台';
  return (
    <div className="hidden items-center gap-2 text-[13px] text-[var(--v9-muted)] md:flex">
      <span>PalmPay UX</span>
      <span>›</span>
      {pathname === '/workspace/notifications' ? (
        <>
          <Link className="hover:text-[var(--v9-text)]" href="/workspace">工作台</Link>
          <span>›</span>
        </>
      ) : null}
      <strong className="font-semibold text-[var(--v9-text)]">{label}</strong>
    </div>
  );
}
