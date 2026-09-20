import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');

test('administration creation returns acknowledgement before refreshing the management view', () => {
  const actions = read('../src/app/workspace/admin/actions.ts');
  const page = read('../src/app/workspace/admin/page.tsx');

  for (const actionName of ['createCategoryAction', 'createTagAction']) {
    const action = actions.match(
      new RegExp(`export async function ${actionName}\\b[\\s\\S]*?(?=export async function|$)`),
    )?.[0];
    assert.ok(action, `${actionName} should exist`);
    assert.match(action, /return saveEdit\(/);
    assert.doesNotMatch(action, /refreshAdmin\(/);
  }
  assert.doesNotMatch(actions, /from 'next\/cache'/);
  assert.match(page, /<AddTaxonomyDialog kind="category"/);
  assert.match(page, /<AddTaxonomyDialog kind="tag"/);
});

test('edit saves return acknowledgements without waiting for page reads and have bounded API waits', () => {
  const actions = read('../src/app/workspace/admin/actions.ts');
  const form = read('../src/app/workspace/admin/admin-edit-form.tsx');
  const feedback = read('../src/components/workspace/action-feedback.tsx');
  for (const name of ['updateCategoryStatusAction', 'updateTagStatusAction', 'updateTeamAction', 'updateUserAction', 'assignRoleAction', 'removeUserRoleAction']) {
    const action = actions.match(new RegExp(`export async function ${name}\\b[\\s\\S]*?(?=export async function|$)`))?.[0];
    assert.match(action, /return saveEdit\(/);
    assert.doesNotMatch(action, /refreshAdmin\(/);
  }
  assert.match(actions, /AbortSignal\.timeout\(15_000\)/);
  assert.match(actions, /结果暂未确认/);
  assert.match(form, /useActionState/);
  assert.match(form, /showAdminFeedback\(response\)/);
  assert.match(form, /startTransition\(\(\) => router\.refresh\(\)\)/);
  assert.match(feedback, /role=\{success \? 'status' : 'alert'\}/);
});

test('management selects submit the visible value and accept refreshed server defaults', () => {
  const nativeSelect = read('../src/components/ui/native-select.tsx');
  const adminPage = read('../src/app/workspace/admin/page.tsx');
  const submitButton = read('../src/app/workspace/admin/admin-submit-button.tsx');

  assert.match(nativeSelect, /submissionInput\.current\.value =/);
  assert.match(nativeSelect, /setUncontrolledValue\(initialValue\)/);
  assert.match(adminPage, /AdminSubmitButton/);
  assert.match(submitButton, /useFormStatus/);
  assert.match(submitButton, /disabled=\{pending \|\| disabled\}/);
});

test('editing forms block automatic reset before Radix can restore mount-time values', () => {
  const form = read('../src/app/workspace/admin/admin-edit-form.tsx');
  const page = read('../src/app/workspace/admin/page.tsx');
  assert.match(form, /onResetCapture/);
  assert.match(form, /event\.preventDefault\(\)/);
  assert.match(form, /event\.stopPropagation\(\)/);
  for (const action of ['updateCategoryStatusAction', 'updateTagStatusAction', 'updateTeamAction', 'updateUserAction']) {
    assert.match(page, new RegExp(`<AdminEditForm action=\\{${action}\\}`));
  }
  // Creation and role grants clear only after confirmed success.
  assert.match(page, /<AddTaxonomyDialog kind="category"/);
  assert.match(page, /<AddTaxonomyDialog kind="tag"/);
  assert.match(page, /<AdminEditForm action=\{assignRoleAction\} resetOnSuccess/);
  assert.match(form, /if \(resetOnSuccess\)/);
  assert.match(form, /form\.current\?\.reset\(\)/);
});

test('tags are disabled until an administrator explicitly enables them', () => {
  const schema = read('../../api/prisma/schema.prisma');
  const migration = read(
    '../../api/prisma/migrations/20260904090000_disable_tags_by_default/migration.sql',
  );

  assert.match(schema, /status\s+TagStatus @default\(DISABLED\)/);
  assert.match(migration, /ALTER COLUMN "status" SET DEFAULT 'disabled'/);
  assert.match(migration, /WHERE "status" = 'active'/);
});

test('role assignment excludes roles the user already owns', () => {
  const adminPage = read('../src/app/workspace/admin/page.tsx');

  assert.match(adminPage, /const assignedRoleIds = new Set/);
  assert.match(adminPage, /roles\.filter\(\(role\) => !assignedRoleIds\.has\(role\.id\)\)/);
  assert.match(adminPage, /已拥有全部角色/);
});
