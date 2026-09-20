'use server';

import { authenticatedApiHeaders } from '@/lib/auth';
import { ApiError, serverApiFetch } from '@/lib/api';
import type { AdminSaveResult } from './admin-save-result';

async function api(path: string, init: RequestInit) {
  return serverApiFetch(path, {
    ...init,
    headers: { ...(await authenticatedApiHeaders()), ...init.headers },
  });
}

async function saveEdit(
  path: string,
  body: Record<string, unknown> | undefined,
  method: 'PATCH' | 'POST' | 'DELETE' = 'PATCH',
  operation = '保存',
): Promise<AdminSaveResult> {
  try {
    const saved = await api(path, {
      method,
      signal: AbortSignal.timeout(15_000),
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    // Return the write acknowledgement immediately. AdminEditForm refreshes the
    // view separately, outside the save action's pending lifecycle.
    return { status: 'success', message: `${operation}成功`, refresh: method !== 'PATCH' || path.includes('/users/'), fields: saved && typeof saved === 'object' ? Object.fromEntries(Object.entries(saved).filter((entry): entry is [string, string] => typeof entry[1] === 'string')) : {} };
  } catch (error) {
    return {
      status: 'error',
      message: error instanceof ApiError
        ? `${operation}失败：${error.message}`
        : `${operation}结果暂未确认，可能是网络较慢。请刷新核对状态后再重试。`,
    };
  }
}

export async function createCategoryAction(formData: FormData) {
  return saveEdit('/api/admin/categories', {
    name: String(formData.get('name') ?? ''),
    contentTypes: [String(formData.get('contentType') ?? 'DESIGN_ASSET')],
  }, 'POST', '新增分类');
}
export async function createTagAction(formData: FormData) {
  return saveEdit('/api/admin/tags', {
    contentTypes: formData.getAll('contentTypes').map(String),
    name: String(formData.get('name') ?? ''),
  }, 'POST', '新增标签');
}

export async function updateCategoryStatusAction(formData: FormData) {
  const categoryId = String(formData.get('categoryId'));
  const status = String(formData.get('status'));
  return saveEdit(`/api/admin/categories/${categoryId}`, { status });
}

export async function updateTagStatusAction(formData: FormData) {
  const tagId = String(formData.get('tagId'));
  const status = String(formData.get('status'));
  return saveEdit(`/api/admin/tags/${tagId}`, { status });
}
export async function updateUserAction(formData: FormData) {
  const organizationId = String(formData.get('organizationId'));
  const userId = String(formData.get('userId'));
  const replacementOwnerId = String(formData.get('replacementOwnerId') ?? '');
  return saveEdit(`/api/organizations/${organizationId}/users/${userId}`, {
    name: String(formData.get('name') ?? '').trim(),
    status: String(formData.get('status')),
    ...(formData.has('email') ? { email: String(formData.get('email')).trim().toLowerCase() } : {}),
    ...(formData.has('teamId') ? { teamId: String(formData.get('teamId') ?? '') || null } : {}),
    ...(replacementOwnerId ? { replacementOwnerId } : {}),
  });
}

export async function updateUserStatusAction(formData: FormData) {
  const organizationId = String(formData.get('organizationId'));
  const userId = String(formData.get('userId'));
  const replacementOwnerId = String(formData.get('replacementOwnerId') ?? '');
  return saveEdit(`/api/organizations/${organizationId}/users/${userId}/status`, {
    status: String(formData.get('status')),
    ...(replacementOwnerId ? { replacementOwnerId } : {}),
  });
}
export async function updateTeamAction(formData: FormData) {
  const organizationId = String(formData.get('organizationId'));
  const teamId = String(formData.get('teamId'));
  const ownerId = String(formData.get('ownerId') ?? '');
  return saveEdit(`/api/organizations/${organizationId}/teams/${teamId}`, {
    name: String(formData.get('name') ?? ''),
    status: String(formData.get('status') ?? 'ACTIVE'),
    ...(ownerId ? { ownerId } : {}),
  });
}
export async function assignRoleAction(formData: FormData) {
  const organizationId = String(formData.get('organizationId'));
  const userId = String(formData.get('userId'));
  const roleId = String(formData.get('roleId') ?? '');
  if (!roleId) return { status: 'error' as const, message: '请先选择要授予的角色' };
  return saveEdit(`/api/organizations/${organizationId}/users/${userId}/roles`, {
    roleId,
    scopeType: 'ORGANIZATION',
    scopeId: organizationId,
  }, 'POST', '角色授予');
}

export async function removeUserRoleAction(formData: FormData) {
  const organizationId = String(formData.get('organizationId'));
  const userId = String(formData.get('userId'));
  const userRoleId = String(formData.get('userRoleId'));
  return saveEdit(`/api/organizations/${organizationId}/users/${userId}/roles/${userRoleId}`, undefined, 'DELETE', '角色移除');
}


export async function deleteCategoryAction(formData: FormData) {
  const id = String(formData.get('categoryId') ?? '');
  return saveEdit(`/api/admin/categories/${encodeURIComponent(id)}`, undefined, 'DELETE', '删除分类');
}

export async function deleteTagAction(formData: FormData) {
  const id = String(formData.get('tagId') ?? '');
  return saveEdit(`/api/admin/tags/${encodeURIComponent(id)}`, undefined, 'DELETE', '删除标签');
}

export async function createTeamAction(formData: FormData) {
  const ownerId = String(formData.get('ownerId') ?? '');
  return saveEdit(`/api/organizations/${String(formData.get('organizationId'))}/teams`, { name: String(formData.get('name') ?? '').trim(), ...(ownerId ? { ownerId } : {}) }, 'POST', '新增团队');
}
export async function deleteTeamAction(formData: FormData) {
  return saveEdit(`/api/organizations/${String(formData.get('organizationId'))}/teams/${String(formData.get('teamId'))}`, undefined, 'DELETE', '删除团队');
}

export async function createUserAction(formData: FormData) {
  return saveEdit(`/api/organizations/${String(formData.get('organizationId'))}/users`, {
    name: String(formData.get('name') ?? '').trim(), email: String(formData.get('email') ?? '').trim().toLowerCase(),
    roleId: String(formData.get('roleId') ?? ''), teamId: String(formData.get('teamId') ?? ''),
  }, 'POST', '新增用户');
}

export async function deleteUserAction(formData: FormData) {
  return saveEdit(`/api/organizations/${String(formData.get('organizationId'))}/users/${String(formData.get('userId'))}`, undefined, 'DELETE', '删除用户');
}

export async function updateUserNameAction(formData: FormData) {
  return saveEdit(`/api/organizations/${String(formData.get("organizationId"))}/users/${String(formData.get("userId"))}/name`, { name: String(formData.get("name") ?? "").trim() });
}
