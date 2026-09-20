import assert from 'node:assert/strict';
import test from 'node:test';

import { workspaceStatus, workspaceStatusLabel } from '../src/lib/workspace-status.ts';
import { contentTypeLabel } from '../src/lib/content-types.ts';

test('formal content statuses use one Chinese label system', () => {
  assert.deepEqual(workspaceStatus('DRAFT'), { label: '草稿', tone: 'neutral' });
  assert.deepEqual(workspaceStatus('PUBLISHED'), { label: '已发布', tone: 'success' });
  assert.equal(workspaceStatusLabel('ARCHIVED'), '已归档');
});

test('verification and account statuses keep semantic tones', () => {
  assert.deepEqual(workspaceStatus('VERIFIED'), { label: '已验证', tone: 'success' });
  assert.deepEqual(workspaceStatus('DISABLED'), { label: '停用', tone: 'danger' });
  assert.deepEqual(workspaceStatus('PILOT'), { label: '试点中', tone: 'accent' });
});

test('unknown backend states remain readable and neutral', () => {
  assert.deepEqual(workspaceStatus('WAITING_FOR_OWNER'), {
    label: 'waiting for owner',
    tone: 'neutral',
  });
});

test('content types use one product-facing label system', () => {
  assert.equal(contentTypeLabel('DESIGN_ASSET'), '设计资产');
  assert.equal(contentTypeLabel('AI_PROJECT'), 'AI 项目');
  assert.equal(contentTypeLabel('SOMETHING_NEW'), 'something new');
});
