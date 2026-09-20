import { EditUserDialog } from './edit-user-dialog';
import { ContentFilters } from './content-filters';
import { DeleteTeamButton } from './delete-team-button';
import { TaxonomyList } from './taxonomy-list';
import { AddTaxonomyDialog } from './add-taxonomy-dialog';
import { ContentPresence } from '@/components/workspace/content-presence';
import { WorkspaceTabs } from '@/components/workspace/workspace-tabs';
import { CachedWorkspacePage, WorkspaceResults } from '@/components/workspace/navigation-cache';
import { AddTeamDialog } from './add-team-dialog';
import { AddUserDialog } from './add-user-dialog';
import { DeleteUserButton } from './delete-user-button';
import { DeleteContentButton } from '@/components/workspace/delete-content-button';
import { redirect } from 'next/navigation';
import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { authenticatedApiHeaders, loadCurrentUser } from '@/lib/auth';
import { serverApiFetch } from '@/lib/api';
import { contentTypeLabel } from '@/lib/content-types';
import { WorkspacePageHero } from '@/components/workspace/workspace-page-hero';
import { WorkspaceStatusBadge } from '@/components/workspace/workspace-status-badge';
import { AdminSubmitButton } from './admin-submit-button';
import { AdminEditForm } from './admin-edit-form';
import {
  assignRoleAction,
  deleteCategoryAction,
  deleteTagAction,
  removeUserRoleAction,
  updateCategoryStatusAction,
  updateTeamAction,
  updateTagStatusAction,
  updateUserAction,
  updateUserNameAction,
} from './actions';

type AdminContent = {
  items: Array<{
    id: string;
    title: string;
    slug: string;
    contentType: string;
    status: string;
    updatedAt: string;
    owner: { name: string };
  }>;
  total: number;
};
type Category = { id: string; name: string; code: string; status: string; contentTypes: string[]; usageCount: number };
type Tag = { contentTypes: string[]; id: string; name: string; status: string; usageCount: number };
type User = {
  id: string;
  name: string;
  email: string;
  status: string;
  primaryTeam: { id: string; name: string; code: string } | null;
  userRoles: Array<{ id: string; role: { id: string; name: string; code: string } }>;
};
type Role = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  rolePermissions: Array<{ permission: { id: string; code: string; name: string; module: string } }>;
};
type Organization = { id: string; name: string; code: string; status: string; settings: unknown };
type Team = {
  id: string;
  name: string;
  code: string;
  status: string;
  owner: { id: string; name: string; email: string; status: string } | null;
  _count: { members: number };
};
type Audit = {
  items: Array<{
    id: string;
    action: string;
    entityType: string;
    createdAt: string;
    actor: { name: string; email: string } | null;
  }>;
};

const adminTabs = [
  ['content', '内容管理'],
  ['taxonomy', '分类与标签'],
  ['teams', '团队管理'],
  ['users', '用户管理'],
  ['roles', '角色权限'],
  ['audit', '审计日志'],
  ['settings', '平台设置'],
] as const;

type AdminTab = (typeof adminTabs)[number][0];

function isAdminTab(value: string): value is AdminTab {
  return adminTabs.some(([key]) => key === value);
}

const modules: Record<string, string> = {
  DESIGN_ASSET: 'design-assets',
  AI_SKILL: 'ai-skills',
  AI_CASE: 'ai-cases',
  AI_PROJECT: 'ai-projects',
  AI_TOOL: 'ai-tools',
};

async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; categoryId?: string; tagId?: string; page?: string; type?: string; status?: string; search?: string }>;
}) {
  const { tab: requestedTab = 'content', categoryId, tagId, page: requestedPage, type: requestedType = '', status: requestedStatus = '', search: requestedSearch = '' } = await searchParams;
  const type = Object.hasOwn(modules, requestedType) ? requestedType : '';
  const status = ['DRAFT', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'].includes(requestedStatus) ? requestedStatus : '';
  const search = requestedSearch.trim().slice(0, 200);
  const page = Math.max(1, Number.parseInt(requestedPage ?? '1', 10) || 1);
  const contentQuery = new URLSearchParams({ pageSize: '50', page: String(page) });
  if (type) contentQuery.set('type', type);
  if (status) contentQuery.set('status', status);
  if (search) contentQuery.set('search', search);
  if (categoryId) contentQuery.set('categoryId', categoryId);
  if (tagId) contentQuery.set('tagId', tagId);
  const contentPageHref = (nextPage: number) => `/workspace/admin?tab=content&${new URLSearchParams({ ...(type ? { type } : {}), ...(status ? { status } : {}), ...(search ? { search } : {}), ...(categoryId ? { categoryId } : {}), ...(tagId ? { tagId } : {}), page: String(nextPage) })}`;
  const tab: AdminTab = isAdminTab(requestedTab) ? requestedTab : 'content';
  const user = await loadCurrentUser();
  if (
    !user ||
    !(
      user.permissions.includes('user.manage') ||
      user.permissions.includes('taxonomy.manage') ||
      user.permissions.includes('content.edit_all') ||
      user.permissions.includes('audit.read')
    )
  )
    redirect('/unauthorized');
  const headers = await authenticatedApiHeaders();
  const organizationPath = `/api/organizations/${user.organizationId}`;

  // Keep each administration section isolated: switching tabs should not wait for
  // unrelated, permission-gated API reads from the other six sections.
  let organization: Organization | null = null;
  let contents: AdminContent = { items: [], total: 0 };
  let categories: Category[] = [];
  let tags: Tag[] = [];
  let users: { items: User[] } = { items: [] };
  let teams: Team[] = [];
  let roles: Role[] = [];
  let audit: Audit = { items: [] };

  if (tab === 'content' && user.permissions.includes('content.edit_all')) {
    contents = await serverApiFetch<AdminContent>(`/api/admin/contents?${contentQuery}`, { headers });
  }
  if (tab === 'taxonomy' && user.permissions.includes('taxonomy.manage')) {
    [categories, tags] = await Promise.all([
      serverApiFetch<Category[]>('/api/admin/categories', { headers }),
      serverApiFetch<Tag[]>('/api/admin/tags', { headers }),
    ]);
  }
  if (tab === 'teams' && user.permissions.includes('user.manage')) {
    [teams, users] = await Promise.all([
      serverApiFetch<Team[]>(`${organizationPath}/teams`, { headers }),
      serverApiFetch<{ items: User[] }>(`${organizationPath}/users?pageSize=100`, { headers }),
    ]);
  }
  if (tab === 'users' && user.permissions.includes('user.manage')) {
    [users, teams, roles] = await Promise.all([
      serverApiFetch<{ items: User[] }>(`${organizationPath}/users?pageSize=100`, { headers }),
      serverApiFetch<Team[]>(`${organizationPath}/teams`, { headers }),
      serverApiFetch<Role[]>(`${organizationPath}/roles`, { headers }),
    ]);
  }
  if (tab === 'roles' && user.permissions.includes('user.manage')) {
    [roles, users] = await Promise.all([
      serverApiFetch<Role[]>(`${organizationPath}/roles`, { headers }),
      serverApiFetch<{ items: User[] }>(`${organizationPath}/users?pageSize=100`, { headers }),
    ]);
  }
  if (tab === 'audit' && user.permissions.includes('audit.read')) {
    audit = await serverApiFetch<Audit>('/api/admin/audit-logs?pageSize=100', { headers });
  }
  if (tab === 'settings') {
    organization = await serverApiFetch<Organization>(organizationPath, { headers });
  }

  const heroMetric = tab === 'content'
    ? { value: contents.total, label: '可管理内容' }
    : tab === 'taxonomy'
      ? { value: categories.length + tags.length, label: '分类与标签' }
      : tab === 'teams'
        ? { value: teams.length, label: '组织团队' }
        : tab === 'users'
          ? { value: users.items.length, label: '组织用户' }
          : tab === 'roles'
            ? { value: roles.length, label: '系统角色' }
            : tab === 'audit'
              ? { value: audit.items.length, label: '最近审计记录' }
              : { value: organization ? 1 : 0, label: '组织配置' };
  const panelClass = 'rounded-2xl border border-[var(--v9-line)] bg-[var(--v9-panel)] p-6 shadow-[0_16px_48px_rgba(0,0,0,.16)] sm:p-6';
  const controlClass = 'text-[var(--v9-text)]';
  return (
    <main className="mx-auto max-w-[1440px] px-5 py-8 md:px-8 md:py-10">
      <WorkspacePageHero eyebrow="PLATFORM ADMINISTRATION" metric={heroMetric} title="管理中心" description="内容、分类、团队、账号、权限与审计均通过正式组织范围 API 管理；页面不会绕过当前账号的授权边界。" />
      <WorkspaceTabs path="/workspace/admin" active={tab} items={adminTabs} />
      <WorkspaceResults>
      {tab === 'content' ? (
        <section className={`mt-6 ${panelClass}`}>
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[.1] pb-4">
            <div>
              <h2 className="text-lg font-medium tracking-[-.025em]">{categoryId || tagId ? '关联内容' : '全部内容'}</h2>
              {categoryId || tagId ? <p className="mt-2 text-xs text-[var(--v9-muted)]">显示当前正式关联；已发布内容尚未发布的修改不计入。<Link className="ml-2 underline" href="/workspace/admin?tab=taxonomy">返回分类与标签</Link><Link className="ml-2 underline" href="/workspace/admin?tab=content">清除筛选</Link></p> : null}
            </div>
            <span className="rounded-full border border-white/[.12] bg-black/20 px-3 py-1 text-xs text-white/55">{contents.total} 项</span>
          </div>
          <ContentFilters key={`${type}:${status}:${search}:${categoryId}:${tagId}`} type={type} status={status} search={search} categoryId={categoryId} tagId={tagId} />
          <div className="mt-4 divide-y divide-white/10">
            {contents.items.map((item) => (
              <ContentPresence id={item.id} key={item.id}><div
                className="flex flex-wrap items-start justify-between gap-3 py-3.5 text-sm"
                key={item.id}
              >
                <div>
                  {item.status === 'PUBLISHED' ? <Link
                    className="hover:underline"
                    href={`/workspace/${modules[item.contentType]}/${item.slug}`}
                  >
                    {item.title}
                  </Link> : <span>{item.title}</span>}
                  <p className="mt-1 text-xs text-white/45">
                    {contentTypeLabel(item.contentType)} · {item.owner.name}
                  </p>
                </div>
                <div className="flex items-center gap-3"><WorkspaceStatusBadge status={item.status} /><DeleteContentButton contentId={item.id} title={item.title} /></div>
              </div></ContentPresence>
            ))}
            {!contents.items.length ? <p className="py-10 text-center text-sm text-white/45">{type || status || search || categoryId || tagId ? "暂无符合筛选条件的内容。" : "当前组织范围内没有可管理的内容。"}</p> : null}
          </div>
          <nav aria-label="内容分页" className="mt-4 flex items-center justify-end gap-4 text-xs">
            {page > 1 ? <Link href={contentPageHref(page - 1)}>上一页</Link> : null}
            <span>第 {page} 页 · 共 {contents.total} 项</span>
            {page * 50 < contents.total ? <Link href={contentPageHref(page + 1)}>下一页</Link> : null}
          </nav>
        </section>
      ) : null}
      {tab === 'taxonomy' ? (
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className={panelClass}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><h2 className="text-lg font-medium tracking-[-.025em]">分类</h2><p className="mt-1 text-xs text-[var(--v9-muted)]">按内容类型管理分类，便于筛选查找。停用或删除不影响已有内容。</p></div><AddTaxonomyDialog kind="category" /></div>
            <TaxonomyList kind="category" items={categories.map(item => ({ id: item.id, contentTypes: item.contentTypes ?? [], content: <>
                  <span className="min-w-0 flex-1 basis-28" title={`${item.name} · ${item.code}`}>
                    <span className="block truncate">{item.name}</span>
                    <em className="block truncate not-italic text-xs text-white/40">{item.code}</em>
                  </span>
                  <div className="ml-auto flex shrink-0 items-center gap-[12px]">
                    <AdminEditForm action={updateCategoryStatusAction} className="flex items-center gap-3">
                      {user.permissions.includes('content.edit_all') ? <Link className="w-[72px] shrink-0 whitespace-nowrap text-right text-xs text-[var(--v9-muted)] underline" href={`/workspace/admin?tab=content&categoryId=${item.id}`}>关联 {item.usageCount} 项</Link> : <span className="w-[72px] shrink-0 whitespace-nowrap text-right text-xs">关联 {item.usageCount} 项</span>}
                      <input type="hidden" name="categoryId" value={item.id} />
                      <NativeSelect fitOptions
                        name="status"
                        defaultValue={item.status}
                        containerClassName="w-20 shrink-0"
                        className="h-7 w-full rounded border border-white/15 bg-white/[.04] px-2 text-xs text-white"
                      >
                        <option value="ACTIVE">启用</option>
                        <option value="DISABLED">停用</option>
                      </NativeSelect>
                      <AdminSubmitButton size="default" variant="outline" className="h-10 w-12 shrink-0 border-border bg-transparent px-0 text-xs">
                        保存
                      </AdminSubmitButton>
                    </AdminEditForm>
                    <AdminEditForm action={deleteCategoryAction} className="shrink-0">
                      <input type="hidden" name="categoryId" value={item.id} />
                      <AdminSubmitButton size="default" variant="outline" pendingLabel="删除中…" className="h-10 w-12 shrink-0 border-border bg-transparent px-0 text-xs text-foreground">删除</AdminSubmitButton>
                    </AdminEditForm>
                  </div>
                </> }))} />
          </div>
          <div className={panelClass}>
            <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><h2 className="text-lg font-medium tracking-[-.025em]">标签</h2><p className="mt-1 text-xs text-[var(--v9-muted)]">按适用页面管理标签，支持多选。新增标签默认停用，启用后可用于发布。</p></div><AddTaxonomyDialog kind="tag" /></div>
            <TaxonomyList kind="tag" items={tags.map(item => ({ id: item.id, contentTypes: item.contentTypes ?? [], content: <>
                  <span className="min-w-0 flex-1 basis-28" title={item.name}><span className="block truncate">{item.name}</span><span className="mt-1 block text-xs text-[var(--v9-muted)]">{item.contentTypes?.length ? item.contentTypes.map(type => ({ DESIGN_ASSET: "设计资产", AI_TOOL: "AI 工具", AI_SKILL: "AI Skill", AI_CASE: "AI 案例", AI_PROJECT: "AI 项目库" }[type] ?? type)).join("、") : "通用"}</span></span>
                  <div className="ml-auto flex shrink-0 items-center gap-[12px]">
                    <AdminEditForm action={updateTagStatusAction} className="flex items-center gap-3">
                      <input type="hidden" name="tagId" value={item.id} />
                      {user.permissions.includes('content.edit_all') ? <Link className="w-[72px] shrink-0 whitespace-nowrap text-right text-xs text-[var(--v9-muted)] underline" href={`/workspace/admin?tab=content&tagId=${item.id}`}>关联 {item.usageCount} 项</Link> : <span className="w-[72px] shrink-0 whitespace-nowrap text-right text-xs">关联 {item.usageCount} 项</span>}
                      <NativeSelect fitOptions
                        name="status"
                        defaultValue={item.status}
                        containerClassName="w-20 shrink-0"
                        className="h-7 w-full rounded border border-white/15 bg-white/[.04] px-2 text-xs text-white"
                      >
                        <option value="ACTIVE">启用</option>
                        <option value="DISABLED">停用</option>
                        <option value="MERGED">已合并</option>
                      </NativeSelect>
                      <AdminSubmitButton size="default" variant="outline" className="h-10 w-12 shrink-0 border-border bg-transparent px-0 text-xs">
                        保存
                      </AdminSubmitButton>
                    </AdminEditForm>
                    <AdminEditForm action={deleteTagAction} className="shrink-0">
                      <input type="hidden" name="tagId" value={item.id} />
                      <AdminSubmitButton size="default" variant="outline" pendingLabel="删除中…" className="h-10 w-12 shrink-0 border-border bg-transparent px-0 text-xs text-foreground">删除</AdminSubmitButton>
                    </AdminEditForm>
                  </div>
                </> }))} />
          </div>
        </section>
      ) : null}
      {tab === 'teams' ? (
        <section className={`mt-6 ${panelClass}`}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><h2 className="text-lg font-medium tracking-[-.025em]">团队管理</h2><p className="mt-1 text-xs text-white/45">新增团队，编辑名称、负责人和状态。仅无成员、内容或项目关联的团队可删除；有关联时请先调整归属，或选择停用。</p></div>
            <AddTeamDialog organizationId={user.organizationId} users={users.items} />
          </div>
          <div className="mt-4 divide-y divide-white/10">
            {teams.map((team) => (
              <div key={team.id}><AdminEditForm action={updateTeamAction} className="grid gap-3 py-4 lg:grid-cols-[minmax(0,1fr)_max-content_max-content_max-content] lg:items-start" key={team.id}>
                <div><label className="block text-xs leading-[1.6] text-white/45" htmlFor={`team-name-${team.id}`}>团队名称</label><Input id={`team-name-${team.id}`} name="name" defaultValue={team.name} required className="mt-2 max-w-[600px] border-white/15 bg-white/[.04] text-white" /><p className="mt-1 text-xs text-white/35">{team._count.members} 名成员</p></div>
                <div><label className="block text-xs leading-[1.6] text-white/45" htmlFor={`team-owner-${team.id}`}>负责人</label><NativeSelect fitOptions id={`team-owner-${team.id}`} name="ownerId" defaultValue={team.owner?.id ?? ''} className="h-9 w-full rounded-lg border border-white/15 bg-[#111] px-2 text-sm text-white" containerClassName="mt-2 w-full">{team.owner ? null : <option value="">暂未指定</option>}{users.items.filter((member) => member.status === 'ACTIVE').map((member) => <option value={member.id} key={member.id}>{member.name}</option>)}</NativeSelect></div>
                <div><label className="block text-xs leading-[1.6] text-white/45" htmlFor={`team-status-${team.id}`}>状态</label><NativeSelect fitOptions id={`team-status-${team.id}`} name="status" defaultValue={team.status} className="h-9 w-full rounded-lg border border-white/15 bg-[#111] px-2 text-sm text-white" containerClassName="mt-2 w-full"><option value="ACTIVE">启用</option><option value="DISABLED">停用</option></NativeSelect></div>
                <input type="hidden" name="organizationId" value={user.organizationId} /><input type="hidden" name="teamId" value={team.id} /><div className="grid gap-2 text-xs"><span aria-hidden="true" className="hidden leading-[1.6] lg:block">&nbsp;</span><div className="flex items-center gap-3"><DeleteTeamButton organizationId={user.organizationId} teamId={team.id} name={team.name} /><AdminSubmitButton size="default" className="w-[100px]">保存</AdminSubmitButton></div></div>
              </AdminEditForm></div>
            ))}
          </div>
        </section>
      ) : null}
      {tab === 'users' ? (
        <section className={`mt-6 ${panelClass}`}>
          <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-medium tracking-[-.025em]">用户管理</h2><p className="mt-1 text-xs text-white/45">新增成员并设置角色与归属团队；已有账号的角色可在“角色权限”中调整。</p></div><AddUserDialog organizationId={user.organizationId} roles={roles} teams={teams} /></div>
          <div className="mt-4 divide-y divide-white/10">
            {users.items.map((member) => (
              <div className="space-y-3 py-4" key={member.id}>
                <AdminEditForm action={updateUserAction} className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_max-content_max-content_max-content]">
                  <input type="hidden" name="organizationId" value={user.organizationId} />
                  <input type="hidden" name="userId" value={member.id} />
                  <div className="min-w-0">
                    <Input name="name" defaultValue={member.name} aria-label={`${member.email} 的姓名`} required maxLength={100} className="max-w-[280px]" />
                    <p className="mt-2 text-xs text-white/45">{member.email}</p>
                    <p className="mt-2 text-xs text-white/40">{member.primaryTeam?.name ?? '尚未加入主团队'} · {member.userRoles.map((entry) => entry.role.name).join('、') || '无角色'}</p>
                  </div>
                  <NativeSelect fitOptions name="status" defaultValue={member.status} aria-label={`${member.email} 的状态`} className="w-full">
                    <option value="ACTIVE">启用</option><option value="INVITED">邀请中</option><option value="DISABLED">停用</option>
                  </NativeSelect>
                  <NativeSelect fitOptions name="replacementOwnerId" defaultValue="" aria-label="停用时的新内容负责人" className="w-full min-w-0">
                    <option value="">停用时转移内容至</option>
                    {users.items.filter(candidate => candidate.id !== member.id && candidate.status === 'ACTIVE').map(candidate => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}
                  </NativeSelect>
                  <div className="flex items-center gap-3"><EditUserDialog organizationId={user.organizationId} member={member} teams={teams} />{member.id !== user.id ? <DeleteUserButton organizationId={user.organizationId} userId={member.id} name={member.name} /> : null}<AdminSubmitButton pendingLabel="保存中…">保存</AdminSubmitButton></div>
                </AdminEditForm>

              </div>
            ))}
          </div>
        </section>
      ) : null}
      {tab === 'roles' ? (
        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
          <section className={panelClass}><h2 className="text-lg font-medium tracking-[-.025em]">系统角色权限</h2><p className="mt-1 text-xs text-white/45">权限矩阵由系统角色定义，授权后立即应用于页面和 API。</p><div className="mt-4 space-y-3">{roles.map((role) => <article data-card-surface="" className="rounded-xl border border-white/[.1] bg-black/[.16] p-4" key={role.id}><div className="flex items-center justify-between gap-3"><div><h3 className="text-sm font-medium">{role.name}</h3></div><Badge variant="outline" className="border-white/15 text-white/60">{role.rolePermissions.length} 项权限</Badge></div><div className="mt-3 flex flex-wrap gap-1.5">{role.rolePermissions.map(({ permission }) => <Badge variant="outline" className="border-white/10 text-[10px] text-white/45" key={permission.id}>{permission.name}</Badge>)}</div></article>)}</div></section>
          <section className={panelClass}>
            <h2 className="text-lg font-medium tracking-[-.025em]">用户角色授权</h2>
            <p className="mt-1 text-xs text-white/45">一个用户可以拥有多个组织级角色。</p>
            <div className="mt-4 divide-y divide-white/10">
              {users.items.map((member) => {
                const assignedRoleIds = new Set(member.userRoles.map((entry) => entry.role.id));
                const assignableRoles = roles.filter((role) => !assignedRoleIds.has(role.id));
                return (
                  <div className="py-4" key={member.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1"><AdminEditForm action={updateUserNameAction} className="mb-2 flex items-start gap-3">
                    <input type="hidden" name="organizationId" value={user.organizationId} />
                    <input type="hidden" name="userId" value={member.id} />
                    <Input name="name" defaultValue={member.name} aria-label={`${member.email} 的姓名`} required maxLength={100} className="min-w-0 flex-1" />
                    <AdminSubmitButton pendingLabel="保存中…">保存</AdminSubmitButton>
                  </AdminEditForm><p className="text-xs text-white/40">{member.email}</p></div>
                      <AdminEditForm action={assignRoleAction} resetOnSuccess className="flex items-start gap-3">
                        <input type="hidden" name="organizationId" value={user.organizationId} />
                        <input type="hidden" name="userId" value={member.id} />
                        <NativeSelect fitOptions
                          name="roleId"
                          defaultValue=""
                          required
                          disabled={!assignableRoles.length}
                          className="h-8 min-w-0 rounded-lg border border-white/15 bg-[#111] px-2 text-sm text-white"
                        >
                          <option value="" disabled>{assignableRoles.length ? '添加角色' : '已拥有全部角色'}</option>
                          {assignableRoles.map((role) => <option value={role.id} key={role.id}>{role.name}</option>)}
                        </NativeSelect>
                        <AdminSubmitButton size="default" variant="outline" disabled={!assignableRoles.length} pendingLabel="授予中…" className="border-white/15 bg-transparent text-white">授予</AdminSubmitButton>
                      </AdminEditForm>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {member.userRoles.length ? member.userRoles.map((entry) => (
                        <AdminEditForm action={removeUserRoleAction} key={entry.id}>
                          <input type="hidden" name="organizationId" value={user.organizationId} />
                          <input type="hidden" name="userId" value={member.id} />
                          <input type="hidden" name="userRoleId" value={entry.id} />
                          <AdminSubmitButton pendingLabel="移除中…" size="sm" variant="outline" className="h-7 border-white/15 bg-transparent px-2 text-xs text-white/70 hover:bg-white/10 hover:text-white">{entry.role.name} ×</AdminSubmitButton>
                        </AdminEditForm>
                      )) : <span className="text-xs text-white/45">无角色</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      ) : null}
      {tab === 'audit' ? (
        <section className={`mt-6 ${panelClass}`}>
          <h2 className="text-lg font-medium tracking-[-.025em]">审计日志</h2>
          <div className="mt-4 divide-y divide-white/10">
            {audit.items.map((item) => (
              <div className="flex flex-wrap justify-between gap-3 py-3.5 text-sm" key={item.id}>
                <span>
                  {item.action}
                  <em className="ml-2 not-italic text-xs text-white/40">{item.entityType}</em>
                </span>
                <span className="text-white/45">
                  {item.actor?.name ?? '系统'} ·{' '}
                  {new Intl.DateTimeFormat('zh-CN').format(new Date(item.createdAt))}
                </span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {tab === 'settings' ? (
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <article className={panelClass}><h2 className="text-lg font-medium tracking-[-.025em]">组织配置</h2><dl className="mt-4 divide-y divide-white/10 text-sm"><div className="flex justify-between gap-4 py-3"><dt className="text-white/45">组织名称</dt><dd>{organization?.name ?? '—'}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-white/45">组织代码</dt><dd>{organization?.code ?? '—'}</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-white/45">运行状态</dt><dd>{organization ? <WorkspaceStatusBadge status={organization.status} /> : '—'}</dd></div></dl></article>
          <article className={panelClass}><h2 className="text-lg font-medium tracking-[-.025em]">当前环境边界</h2><dl className="mt-4 divide-y divide-white/10 text-sm"><div className="flex justify-between gap-4 py-3"><dt className="text-white/45">认证</dt><dd>隔离开发认证</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-white/45">数据库</dt><dd>PostgreSQL 17</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-white/45">附件存储</dt><dd>Cloudflare R2</dd></div><div className="flex justify-between gap-4 py-3"><dt className="text-white/45">AI 接入网关</dt><dd className="text-white/45">尚未配置</dd></div></dl><p className="mt-4 text-xs leading-5 text-white/40">生产 SSO、Cloudflare R2 和 AI 数据边界确认后，才会开放对应的可写配置。</p></article>
        </section>
      ) : null}
      </WorkspaceResults>
    </main>
  );
}

export default async function CachedPage(props: Parameters<typeof AdminPage>[0]) {
  return <CachedWorkspacePage>{await AdminPage(props)}</CachedWorkspacePage>;
}
