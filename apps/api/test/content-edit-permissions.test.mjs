import assert from 'node:assert/strict';
import test from 'node:test';
import { DraftsService } from '../dist/content/drafts.service.js';

const content = {
  id: 'content-1',
  organizationId: 'organization-1',
  ownerId: 'owner-1',
  status: 'PUBLISHED',
  currentVersion: { id: 'version-1' },
  currentVersionId: 'version-1',
  draftVersion: null,
};

function service() {
  return new DraftsService(
    { content: { findFirst: async () => content } },
    { write: async () => undefined },
    { recordEvent: async () => undefined },
  );
}

test('content owners still need content.edit_own to open an edit draft', async () => {
  await assert.rejects(
    service().createFromPublished(
      {
        id: 'owner-1',
        organizationId: 'organization-1',
        permissions: [],
      },
      'content-1',
    ),
    (error) => error.getStatus() === 403,
  );
});

test('content.edit_own is scoped to the actual owner while edit_all overrides ownership', () => {
  const drafts = service();

  assert.equal(
    drafts.canEditContent(
      { id: 'owner-1', permissions: ['content.edit_own'] },
      'owner-1',
    ),
    true,
  );
  assert.equal(
    drafts.canEditContent(
      { id: 'other-1', permissions: ['content.edit_own'] },
      'owner-1',
    ),
    false,
  );
  assert.equal(
    drafts.canEditContent(
      { id: 'other-1', permissions: ['content.edit_all'] },
      'owner-1',
    ),
    true,
  );
});
