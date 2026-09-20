import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
import { after, before, test } from 'node:test';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../dist/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;
const integrationEnabled = Boolean(connectionString);
const port = 31987;
const baseUrl = `http://127.0.0.1:${port}/api`;
const runId = `${process.pid}-${Date.now()}`;
const adminEmail = `codex-admin-${runId}@example.test`;
const memberEmail = `codex-member-${runId}@example.test`;
const reviewerEmail = `codex-reviewer-${runId}@example.test`;
const managerEmail = `codex-manager-${runId}@example.test`;
const teamReviewerEmail = `codex-team-reviewer-${runId}@example.test`;
let prisma;
let server;
let organization;
let adminUser;
let memberUser;
let reviewerUser;
let managerUser;
let teamReviewerUser;
let team;
let otherTeam;
let submitOnlyRole;
let publishedContent;
let memberDraftContent;
let submitOnlyDraftContent;
let teamScopeReview;
let otherTeamReview;
let memberRestrictedContent;
let adminRestrictedContent;
let organizationContent;
let publishedAttachmentFileId;
let restrictedAttachmentFileId;
let filterCategoryId;
const contentIds = [];
const categoryIds = [];
const tagIds = [];
let serverOutput = '';

const completeAssetBody = (blocks = []) => ({
  assetType: 'COMPONENT_STANDARD',
  platforms: ['Web'],
  scenarios: ['Integration validation'],
  unsuitableScenarios: ['Unreviewed production release'],
  problemStatement: 'Integration fixture keeps the content contract complete.',
  usageGuide: 'Review the asset before applying it to a handoff.',
  resourceLinks: ['https://example.test/integration-asset'],
  blocks,
});

const publicationFixtures = () => {
  const fixtures = [
    {
      contentType: 'AI_TOOL', detailKey: 'toolDetail', detailField: 'usageGuide',
      bodyV1: { websiteUrl: 'https://example.com', vendor: 'Vendor', platforms: ['Web'], scenarios: ['Design'], usageGuide: 'Tool guide v1', limitations: 'Check outputs', pricingModel: 'Free' },
      valueV2: 'Tool guide v2',
    },
    {
      contentType: 'DESIGN_ASSET',
      detailKey: 'assetDetail',
      detailField: 'assetType',
      bodyV1: { ...completeAssetBody(), assetType: 'E2E_ASSET_V1' },
      valueV2: 'E2E_ASSET_V2',
    },
    {
      contentType: 'AI_SKILL',
      detailKey: 'skillDetail',
      detailField: 'promptTemplate',
      bodyV1: {
        goal: 'Validate a reusable research workflow.',
        scenarios: ['Research synthesis'],
        unsuitableScenarios: ['Unreviewed final decisions'],
        applicableRoles: ['Designer'],
        inputRequirements: 'Approved research notes.',
        outputSchema: 'A structured findings list.',
        promptTemplate: 'E2E_SKILL_PROMPT_V1',
        executionSteps: 'Prepare, execute, and review.',
        exampleInput: 'Interview notes.',
        exampleOutput: 'Prioritized findings.',
        humanReviewRules: 'Verify each finding against its source.',
        limitations: 'Cannot replace accountable human judgment.',
        recommendedModels: ['approved-model'],
        dataSecurityLevel: 'internal',
        promptVersion: '1.0',
      },
      valueV2: 'E2E_SKILL_PROMPT_V2',
    },
    {
      contentType: 'AI_CASE',
      detailKey: 'caseDetail',
      detailField: 'resultSummary',
      bodyV1: {
        background: 'A controlled integration research case.',
        originalProblem: 'Synthesis was slow.',
        originalProcess: 'Manual synthesis.',
        aiIntervention: 'Candidate clustering.',
        aiResponsibilities: 'Generate candidate clusters.',
        humanResponsibilities: 'Verify evidence and conclusions.',
        resultSummary: 'E2E_CASE_RESULT_V1',
        beforeAfterComparison: 'Five days to two days.',
        sampleSize: '20 interviews',
        validationMethod: 'Owner and reviewer verification.',
        dataResult: 'Cycle time reduced in the fixture.',
        limitations: 'Validated only on the integration fixture.',
        reusableConclusion: 'Use AI for initial clustering with human review.',
      },
      valueV2: 'E2E_CASE_RESULT_V2',
    },
    {
      contentType: 'AI_PROJECT',
      detailKey: 'projectDetail',
      detailField: 'expectedOutcome',
      bodyV1: {
        projectCode: `E2E-PROJECT-${runId}`,
        domain: 'Research',
        targetValue: 'Efficiency',
        projectStage: 'EXPLORING',
        priority: 'high',
        problemStatement: 'The workflow repeats manual synthesis.',
        solutionHypothesis: 'AI can assist the first synthesis pass.',
        expectedOutcome: 'E2E_PROJECT_OUTCOME_V1',
        riskLevel: 'Internal data must remain controlled.',
        evaluationResult: 'Proceed through the controlled review flow.',
      },
      valueV2: 'E2E_PROJECT_OUTCOME_V2',
    },
  ];
  return fixtures.map((fixture) => ({
    ...fixture,
    bodyV2: { ...fixture.bodyV1, [fixture.detailField]: fixture.valueV2 },
  }));
};

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/health`);
      if (response.ok) return;
    } catch {
      // The child process is still starting.
    }
    await delay(100);
  }
  throw new Error(`API server did not become ready for integration tests.\n${serverOutput}`);
}

before(async () => {
  if (!integrationEnabled) return;

  prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  organization = await prisma.organization.findUniqueOrThrow({
    where: { code: 'palmpay-experience-design' },
  });
  const [adminRole, memberRole, reviewerRole, managerRole] = await Promise.all([
    prisma.role.findUniqueOrThrow({ where: { code: 'admin' } }),
    prisma.role.findUniqueOrThrow({ where: { code: 'member' } }),
    prisma.role.findUniqueOrThrow({ where: { code: 'member' } }),
    prisma.role.findUniqueOrThrow({ where: { code: 'manager' } }),
  ]);
  adminUser = await prisma.user.create({
    data: {
      organizationId: organization.id,
      name: 'Integration Admin',
      email: adminEmail,
      status: 'ACTIVE',
      userRoles: {
        create: {
          roleId: adminRole.id,
          scopeType: 'ORGANIZATION',
          scopeId: organization.id,
        },
      },
    },
  });
  memberUser = await prisma.user.create({
    data: {
      organizationId: organization.id,
      name: 'Integration Member',
      email: memberEmail,
      status: 'ACTIVE',
      userRoles: {
        create: {
          roleId: memberRole.id,
          scopeType: 'ORGANIZATION',
          scopeId: organization.id,
        },
      },
    },
  });
  reviewerUser = await prisma.user.create({
    data: {
      organizationId: organization.id,
      name: 'Integration Reviewer',
      email: reviewerEmail,
      status: 'ACTIVE',
      userRoles: {
        create: {
          roleId: reviewerRole.id,
          scopeType: 'ORGANIZATION',
          scopeId: organization.id,
        },
      },
    },
  });
  managerUser = await prisma.user.create({
    data: {
      organizationId: organization.id,
      name: 'Integration Manager',
      email: managerEmail,
      status: 'ACTIVE',
      userRoles: {
        create: {
          roleId: managerRole.id,
          scopeType: 'ORGANIZATION',
          scopeId: organization.id,
        },
      },
    },
  });
  team = await prisma.team.create({
    data: {
      organizationId: organization.id,
      name: 'Integration Team',
      code: `integration-${runId}`,
      ownerId: adminUser.id,
    },
  });
  await prisma.user.updateMany({
    where: { id: { in: [adminUser.id, memberUser.id, reviewerUser.id, managerUser.id] } },
    data: { primaryTeamId: team.id },
  });
  otherTeam = await prisma.team.create({
    data: {
      organizationId: organization.id,
      name: 'Other Integration Team',
      code: `integration-other-${runId}`,
      ownerId: adminUser.id,
    },
  });
  teamReviewerUser = await prisma.user.create({
    data: {
      organizationId: organization.id,
      primaryTeamId: team.id,
      name: 'Team-scoped Integration Reviewer',
      email: teamReviewerEmail,
      status: 'ACTIVE',
      userRoles: {
        create: {
          roleId: reviewerRole.id,
          scopeType: 'TEAM',
          scopeId: team.id,
        },
      },
    },
  });

  const submitPermission = await prisma.permission.findUniqueOrThrow({
    where: { code: 'content.read' },
  });
  submitOnlyRole = await prisma.role.create({
    data: {
      organizationId: organization.id,
      code: `submit-only-${runId}`,
      name: 'Integration submit-only role',
      rolePermissions: { create: { permissionId: submitPermission.id } },
      userRoles: {
        create: {
          userId: managerUser.id,
          scopeType: 'ORGANIZATION',
          scopeId: organization.id,
        },
      },
    },
  });

  async function createAsset(
    slug,
    visibility,
    status = 'PUBLISHED',
    ownerId = memberUser.id,
    contentTeamId = team.id,
  ) {
    const content = await prisma.content.create({
      data: {
        organizationId: organization.id,
        contentType: 'DESIGN_ASSET',
        title: `Integration ${visibility}`,
        slug,
        summary: 'Integration catalog fixture',
        ownerId,
        teamId: contentTeamId,
        createdById: ownerId,
        status,
        visibility,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        assetDetail: { create: { assetType: 'COMPONENT_STANDARD', platforms: ['Web'] } },
      },
    });
    const version = await prisma.contentVersion.create({
      data: {
        contentId: content.id,
        versionNumber: 1,
        versionLabel: 'v1.0',
        versionStatus: status,
        title: content.title,
        summary: content.summary,
        body: completeAssetBody(),
        createdById: ownerId,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
    });
    if (status === 'PUBLISHED') {
      await prisma.content.update({
        where: { id: content.id },
        data: { currentVersionId: version.id },
      });
    } else {
      await prisma.content.update({
        where: { id: content.id },
        data: { draftVersionId: version.id },
      });
    }
    contentIds.push(content.id);
    return content;
  }

  publishedContent = await createAsset(`integration-public-${runId}`, 'PUBLIC');
  organizationContent = await createAsset(`integration-organization-${runId}`, 'ORGANIZATION');
  await createAsset(`integration-team-${runId}`, 'TEAM');
  memberRestrictedContent = await createAsset(`integration-restricted-${runId}`, 'RESTRICTED');
  adminRestrictedContent = await createAsset(
    `integration-admin-restricted-${runId}`,
    'RESTRICTED',
    'PUBLISHED',
    adminUser.id,
  );
  memberDraftContent = await createAsset(`integration-draft-${runId}`, 'ORGANIZATION', 'DRAFT');
  submitOnlyDraftContent = await createAsset(
    `integration-submit-only-${runId}`,
    'ORGANIZATION',
    'DRAFT',
    managerUser.id,
  );
  const teamScopeContent = await createAsset(
    `integration-team-scope-${runId}`,
    'ORGANIZATION',
    'IN_REVIEW',
  );
  const otherTeamContent = await createAsset(
    `integration-other-team-scope-${runId}`,
    'ORGANIZATION',
    'IN_REVIEW',
    memberUser.id,
    otherTeam.id,
  );
  const [teamScopeVersion, otherTeamVersion] = await Promise.all([
    prisma.content.findUniqueOrThrow({
      where: { id: teamScopeContent.id },
      select: { draftVersionId: true },
    }),
    prisma.content.findUniqueOrThrow({
      where: { id: otherTeamContent.id },
      select: { draftVersionId: true },
    }),
  ]);
  [teamScopeReview, otherTeamReview] = await Promise.all([
    prisma.reviewRequest.create({
      data: {
        contentId: teamScopeContent.id,
        versionId: teamScopeVersion.draftVersionId,
        submittedById: memberUser.id,
      },
    }),
    prisma.reviewRequest.create({
      data: {
        contentId: otherTeamContent.id,
        versionId: otherTeamVersion.draftVersionId,
        submittedById: memberUser.id,
      },
    }),
  ]);
  const filterCategory = await prisma.category.create({
    data: {
      organizationId: organization.id,
      name: `Integration filter ${runId}`,
      code: `filter-${runId}`,
      contentTypes: ['DESIGN_ASSET'],
    },
  });
  const filterTag = await prisma.tag.create({
    data: {
      organizationId: organization.id,
      name: `Integration filter tag ${runId}`,
      normalizedName: `integration-filter-${runId}`,
    },
  });
  categoryIds.push(filterCategory.id);
  filterCategoryId = filterCategory.id;
  tagIds.push(filterTag.id);
  await prisma.content.update({
    where: { id: organizationContent.id },
    data: { categoryId: filterCategory.id, verificationStatus: 'VERIFIED' },
  });
  await prisma.contentTag.create({
    data: { contentId: organizationContent.id, tagId: filterTag.id, createdById: memberUser.id },
  });
  const [publishedVersion, restrictedVersion] = await Promise.all([
    prisma.content.findUniqueOrThrow({ where: { id: publishedContent.id }, select: { currentVersionId: true } }),
    prisma.content.findUniqueOrThrow({ where: { id: adminRestrictedContent.id }, select: { currentVersionId: true } }),
  ]);
  const [publishedFile, restrictedFile] = await Promise.all([
    prisma.fileAttachment.create({
      data: {
        organizationId: organization.id,
        originalName: 'integration-published.txt',
        storageKey: `integration/${runId}/published.txt`,
        mimeType: 'text/plain',
        sizeBytes: 12,
        checksum: 'sha256:integration',
        accessLevel: 'RESTRICTED',
        uploadStatus: 'READY',
        uploadedById: adminUser.id,
      },
    }),
    prisma.fileAttachment.create({
      data: {
        organizationId: organization.id,
        originalName: 'integration-restricted.txt',
        storageKey: `integration/${runId}/restricted.txt`,
        mimeType: 'text/plain',
        sizeBytes: 12,
        checksum: 'sha256:integration',
        accessLevel: 'RESTRICTED',
        uploadStatus: 'READY',
        uploadedById: adminUser.id,
      },
    }),
  ]);
  publishedAttachmentFileId = publishedFile.id;
  restrictedAttachmentFileId = restrictedFile.id;
  await prisma.attachmentRelation.createMany({
    data: [
      { fileId: publishedFile.id, entityType: 'VERSION', entityId: publishedVersion.currentVersionId, usageType: 'ATTACHMENT' },
      { fileId: restrictedFile.id, entityType: 'VERSION', entityId: restrictedVersion.currentVersionId, usageType: 'ATTACHMENT' },
    ],
  });

  server = spawn(process.execPath, ['dist/main.js'], {
    cwd: new URL('../', import.meta.url),
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
      AUTH_MODE: 'development',
      AUTH_AUTO_PROVISION: 'false',
      NODE_ENV: 'test',
      PORT: String(port),
      WEB_ORIGIN: 'http://localhost:3000',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server.stdout.on('data', (chunk) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on('data', (chunk) => {
    serverOutput += chunk.toString();
  });
  await waitForServer();
});

test('taxonomy selection is scoped, status-aware, durable and published atomically', { skip: !integrationEnabled }, async () => {
  async function request(path, method = 'GET', body, email = memberEmail, expected = 200) {
    const response = await fetch(`${baseUrl}${path}`, { method, headers: { 'x-dev-user-email': email, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const result = await response.json();
    assert.equal(response.status, expected, JSON.stringify(result));
    return result;
  }
  const category = await request('/admin/categories', 'POST', { name: 'Taxonomy E2E', code: `taxonomy-${runId}`, contentTypes: ['DESIGN_ASSET'] }, adminEmail, 201);
  categoryIds.push(category.id);
  const tag = await request('/admin/tags', 'POST', { name: `Taxonomy ${runId}` }, adminEmail, 201);
  tagIds.push(tag.id);
  assert.equal(tag.status, 'ACTIVE');
  let options = await request('/content-drafts/taxonomy');
  assert.equal(options.tags.some((item) => item.id === tag.id), true);
  const input = { contentType: 'DESIGN_ASSET', title: `Taxonomy lifecycle ${runId}`, summary: 'Test taxonomy publication', teamId: team.id, body: completeAssetBody() };
  await request(`/admin/tags/${tag.id}`, 'PATCH', { status: 'DISABLED' }, adminEmail);
  options = await request('/content-drafts/taxonomy');
  assert.equal(options.tags.some((item) => item.id === tag.id), false);
  await request('/content-drafts', 'POST', { ...input, tagIds: [tag.id] }, memberEmail, 400);
  await request(`/admin/tags/${tag.id}`, 'PATCH', { status: 'ACTIVE' }, adminEmail);
  const selection = { categoryId: category.id, tagIds: [tag.id] };
  await request('/content-drafts', 'POST', { ...input, ...selection, contentType: 'AI_SKILL' }, memberEmail, 400);
  const draft = await request('/content-drafts', 'POST', { ...input, ...selection }, memberEmail, 201);
  contentIds.push(draft.id);
  assert.deepEqual(draft.draftVersion.body.taxonomy, selection);
  await request(`/admin/tags/${tag.id}`, 'PATCH', { status: 'DISABLED' }, adminEmail);
  await request(`/admin/categories/${category.id}`, 'PATCH', { status: 'DISABLED' }, adminEmail);
  options = await request('/content-drafts/taxonomy');
  assert.equal(options.categories.some((item) => item.id === category.id), false);
  assert.equal(options.tags.some((item) => item.id === tag.id), false);
  await request(`/content-drafts/${draft.id}`, 'PATCH', { ...selection, title: input.title });
  const loaded = await request(`/content-drafts/${draft.id}`);
  assert.deepEqual(loaded.taxonomy, selection);
  assert.equal(loaded.taxonomyOptions.tags.find((item) => item.id === tag.id).status, 'DISABLED');
  const tagList = await request('/admin/tags', 'GET', undefined, adminEmail);
  assert.equal(tagList.find((item) => item.id === tag.id).usageCount, 1);
  const categoryList = await request('/admin/categories', 'GET', undefined, adminEmail);
  assert.equal(categoryList.find((item) => item.id === category.id).usageCount, 1);
  const linked = await request(`/admin/contents?tagId=${tag.id}`, 'GET', undefined, adminEmail);
  assert.equal(linked.total, 1);
  assert.equal(linked.items[0].id, draft.id);
  await request(`/admin/contents?tagId=${tag.id}`, 'GET', undefined, memberEmail, 403);
  // Publishing a previously saved association retains it even if an admin disabled it later.
  async function publish() {
    await request(`/content-drafts/${draft.id}/publish`, 'POST', undefined, memberEmail, 201);
  }
  await publish();
  const publishedV1 = await request(`/contents/${draft.slug}`);
  assert.equal(publishedV1.category.id, category.id);
  assert.equal(publishedV1.tags[0].tag.status, 'DISABLED');
  await request(`/content-drafts/${draft.id}/from-published`, 'POST', undefined, memberEmail, 201);
  await request(`/content-drafts/${draft.id}`, 'PATCH', { categoryId: null, tagIds: [], body: { ...input.body, taxonomy: selection } });
  const clearedDraft = await request(`/content-drafts/${draft.id}`);
  assert.deepEqual(clearedDraft.taxonomy, { categoryId: null, tagIds: [] });
  const unchanged = await request(`/contents/${draft.slug}`);
  assert.equal(unchanged.category.id, category.id);
  assert.equal(unchanged.tags[0].tag.id, tag.id);
  await request(`/content-drafts/${draft.id}`, 'PATCH', selection, memberEmail, 400);
  await publish();
  const publishedV2 = await request(`/contents/${draft.slug}`);
  assert.equal(publishedV2.category, null);
  assert.deepEqual(publishedV2.tags, []);
  const oldVersion = await prisma.contentVersion.findUniqueOrThrow({ where: { id: publishedV1.currentVersion.id } });
  assert.deepEqual(oldVersion.body.taxonomy, selection);
  assert.equal((await request('/admin/tags', 'GET', undefined, adminEmail)).find((item) => item.id === tag.id).usageCount, 0);
  await request(`/admin/tags/${tag.id}`, 'PATCH', { status: 'ACTIVE' }, adminEmail);
  await request(`/admin/categories/${category.id}`, 'PATCH', { status: 'ACTIVE' }, adminEmail);
  options = await request('/content-drafts/taxonomy');
  assert.equal(options.tags.some((item) => item.id === tag.id), true);
  assert.equal(options.categories.some((item) => item.id === category.id), true);
  await request(`/content-drafts/${draft.id}/unpublish`, 'POST', undefined, adminEmail, 201);
});

after(async () => {
  if (!integrationEnabled) return;
  server?.kill('SIGTERM');
  await prisma.favorite.deleteMany({
    where: {
      OR: [{ contentId: { in: contentIds } }, { userId: { in: [adminUser.id, memberUser.id] } }],
    },
  });
  await prisma.recentView.deleteMany({
    where: {
      OR: [{ contentId: { in: contentIds } }, { userId: { in: [adminUser.id, memberUser.id] } }],
    },
  });
  await prisma.usageEvent.deleteMany({
    where: {
      OR: [{ contentId: { in: contentIds } }, { userId: { in: [adminUser.id, memberUser.id] } }],
    },
  });
  await prisma.searchLog.deleteMany({
    where: {
      OR: [
        { clickedContentId: { in: contentIds } },
        { userId: { in: [adminUser.id, memberUser.id] } },
      ],
    },
  });
  await prisma.attachmentRelation.deleteMany({
    where: { fileId: { in: [publishedAttachmentFileId, restrictedAttachmentFileId].filter(Boolean) } },
  });
  await prisma.fileAttachment.deleteMany({
    where: { id: { in: [publishedAttachmentFileId, restrictedAttachmentFileId].filter(Boolean) } },
  });
  await prisma.auditLog.deleteMany({
    where: {
      actorId: {
        in: [adminUser.id, memberUser.id, reviewerUser.id, managerUser.id, teamReviewerUser.id],
      },
    },
  });
  await prisma.content.deleteMany({ where: { id: { in: contentIds } } });
  if (tagIds.length) await prisma.tag.deleteMany({ where: { id: { in: tagIds } } });
  if (categoryIds.length) await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
  if (otherTeam) await prisma.team.delete({ where: { id: otherTeam.id } });
  if (team) await prisma.team.delete({ where: { id: team.id } });
  await prisma.notification.deleteMany({
    where: {
      receiverId: {
        in: [adminUser.id, memberUser.id, reviewerUser.id, managerUser.id, teamReviewerUser.id],
      },
    },
  });
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [adminEmail, memberEmail, reviewerEmail, managerEmail, teamReviewerEmail],
      },
    },
  });
  if (submitOnlyRole) await prisma.role.delete({ where: { id: submitOnlyRole.id } });
  await prisma.$disconnect();
});

test(
  'content catalog filters published records by visibility and identity',
  { skip: !integrationEnabled },
  async () => {
    await prisma.user.update({ where: { id: memberUser.id }, data: { status: 'ACTIVE' } });
    const publicCatalog = await fetch(`${baseUrl}/contents?pageSize=100`);
    assert.equal(publicCatalog.status, 200);
    const publicBody = await publicCatalog.json();
    const publicFixtures = publicBody.items.filter((item) => contentIds.includes(item.id));
    assert.deepEqual(
      publicFixtures.map((item) => item.visibility),
      ['PUBLIC'],
    );

    const memberCatalog = await fetch(`${baseUrl}/contents?pageSize=100`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(memberCatalog.status, 200);
    const memberBody = await memberCatalog.json();
    const memberFixtures = memberBody.items.filter((item) => contentIds.includes(item.id));
    assert.equal(memberFixtures.length, 4);
    assert.equal(
      memberFixtures.some((item) => item.status !== 'PUBLISHED'),
      false,
    );

    const organizationSlug = `integration-organization-${runId}`;
    const publicOrganizationDetail = await fetch(`${baseUrl}/contents/${organizationSlug}`);
    assert.equal(publicOrganizationDetail.status, 404);

    const memberOrganizationDetail = await fetch(`${baseUrl}/contents/${organizationSlug}`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(memberOrganizationDetail.status, 200);
    const detail = await memberOrganizationDetail.json();
    assert.equal(detail.currentVersion.versionNumber, 1);
    assert.equal(detail.assetDetail.assetType, 'COMPONENT_STANDARD');

    const filters = new URLSearchParams({
      type: 'DESIGN_ASSET',
      categoryId: filterCategoryId,
      tag: `integration-filter-${runId}`,
      verificationStatus: 'VERIFIED',
    });
    const filteredCatalog = await fetch(`${baseUrl}/contents?${filters}`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(filteredCatalog.status, 200);
    const filteredFixtures = (await filteredCatalog.json()).items.filter((item) => contentIds.includes(item.id));
    assert.deepEqual(filteredFixtures.map((item) => item.id), [organizationContent.id]);
  },
);

test(
  'published attachments are listed and downloadable only through authorized signed URLs',
  { skip: !integrationEnabled },
  async () => {
    const detail = await fetch(`${baseUrl}/contents/${publishedContent.slug}`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(detail.status, 200);
    assert.equal((await detail.json()).attachments.some((item) => item.file.id === publishedAttachmentFileId), true);

    const allowedDownload = await fetch(`${baseUrl}/files/${publishedAttachmentFileId}/download`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(allowedDownload.status, 200);
    assert.equal(typeof (await allowedDownload.json()).url, 'string');

    const blockedDownload = await fetch(`${baseUrl}/files/${restrictedAttachmentFileId}/download`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(blockedDownload.status, 403);
  },
);

test(
  'draft preview source is visible only to its author or content editors',
  { skip: !integrationEnabled },
  async () => {
    const authorView = await fetch(`${baseUrl}/content-drafts/${memberDraftContent.id}`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(authorView.status, 200);
    const authorDraft = await authorView.json();
    assert.equal(authorDraft.draftVersion.versionStatus, 'DRAFT');
    assert.equal(authorDraft.draftVersion.body.assetType, 'COMPONENT_STANDARD');

    const reviewerView = await fetch(`${baseUrl}/content-drafts/${memberDraftContent.id}`, {
      headers: { 'x-dev-user-email': reviewerEmail },
    });
    assert.equal(reviewerView.status, 403);

    const editorView = await fetch(`${baseUrl}/content-drafts/${memberDraftContent.id}`, {
      headers: { 'x-dev-user-email': adminEmail },
    });
    assert.equal(editorView.status, 200);
  },
);

test(
  'search, favorites, recent views and usage confirmation persist formal engagement data',
  { skip: !integrationEnabled },
  async () => {
    const project = await prisma.content.create({
      data: {
        organizationId: organization.id,
        contentType: 'AI_PROJECT',
        title: 'Integration reuse project',
        slug: `integration-project-${runId}`,
        ownerId: memberUser.id,
        teamId: team.id,
        createdById: memberUser.id,
        status: 'PUBLISHED',
        visibility: 'ORGANIZATION',
        publishedAt: new Date(),
        projectDetail: { create: { projectCode: `IT-${runId}` } },
      },
    });
    const projectVersion = await prisma.contentVersion.create({
      data: {
        contentId: project.id,
        versionNumber: 1,
        versionStatus: 'PUBLISHED',
        title: project.title,
        body: {},
        createdById: memberUser.id,
        publishedAt: new Date(),
      },
    });
    await prisma.content.update({
      where: { id: project.id },
      data: { currentVersionId: projectVersion.id },
    });
    contentIds.push(project.id);

    const search = await fetch(`${baseUrl}/search?q=Integration&pageSize=100`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(search.status, 200);
    const searchBody = await search.json();
    assert.equal(
      searchBody.items.some((item) => item.id === publishedContent.id),
      true,
    );
    assert.equal(
      searchBody.items.some((item) => item.id === memberRestrictedContent.id),
      true,
    );
    assert.equal(
      searchBody.items.some((item) => item.id === adminRestrictedContent.id),
      false,
    );
    const click = await fetch(`${baseUrl}/search/${searchBody.searchLogId}/click`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-dev-user-email': memberEmail },
      body: JSON.stringify({ contentId: publishedContent.id }),
    });
    assert.equal(click.status, 200);
    const searchLog = await prisma.searchLog.findUniqueOrThrow({
      where: { id: searchBody.searchLogId },
    });
    assert.equal(searchLog.clickedContentId, publishedContent.id);

    const favorite = await fetch(`${baseUrl}/contents/${publishedContent.id}/favorite`, {
      method: 'POST',
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(favorite.status, 201);
    const favorites = await fetch(`${baseUrl}/me/favorites`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(favorites.status, 200);
    assert.equal(
      (await favorites.json()).items.some((item) => item.content.id === publishedContent.id),
      true,
    );

    const detail = await fetch(`${baseUrl}/contents/${publishedContent.slug}`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(detail.status, 200);
    const recent = await fetch(`${baseUrl}/me/recent-views`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(recent.status, 200);
    assert.equal(
      (await recent.json()).items.some((item) => item.content.id === publishedContent.id),
      true,
    );

    const usage = await fetch(`${baseUrl}/contents/${publishedContent.id}/usage-confirmations`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-dev-user-email': memberEmail },
      body: JSON.stringify({ projectContentId: project.id, note: 'Integration reuse evidence.' }),
    });
    assert.equal(usage.status, 201);
    const usageSummary = await fetch(`${baseUrl}/contents/${publishedContent.id}/usage-summary`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(usageSummary.status, 200);
    assert.equal((await usageSummary.json()).usageCount, 1);
  },
);

test(
  'event, analytics and administration APIs retain RBAC and organization boundaries',
  { skip: !integrationEnabled },
  async () => {
    const rejectedEvent = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-dev-user-email': memberEmail },
      body: JSON.stringify({ eventType: 'content_share', contentId: adminRestrictedContent.id }),
    });
    assert.equal(rejectedEvent.status, 404);

    const recordedEvent = await fetch(`${baseUrl}/events`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-dev-user-email': memberEmail },
      body: JSON.stringify({
        eventType: 'content_share',
        contentId: publishedContent.id,
        sourcePage: `/workspace/design-assets/${publishedContent.slug}`,
      }),
    });
    assert.equal(recordedEvent.status, 201);
    const shareEvent = await prisma.usageEvent.findFirstOrThrow({
      where: {
        userId: memberUser.id,
        contentId: publishedContent.id,
        eventType: 'content_share',
      },
      orderBy: { occurredAt: 'desc' },
    });
    assert.deepEqual(shareEvent.metadata, {
      sourcePage: `/workspace/design-assets/${publishedContent.slug}`,
    });

    const memberOverview = await fetch(`${baseUrl}/analytics/overview`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(memberOverview.status, 403);

    for (const path of ['/analytics/overview', '/analytics/insights']) {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: { 'x-dev-user-email': managerEmail },
      });
      assert.equal(response.status, 200, `Expected manager access to ${path}`);
    }
    for (const path of ['/admin/contents?pageSize=20']) {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: { 'x-dev-user-email': managerEmail },
      });
      assert.equal(response.status, 403, `Expected manager denial for ${path}`);
    }

    for (const path of [
      '/analytics/overview',
      '/analytics/insights',
      '/admin/contents?pageSize=20',
      '/admin/categories',
      '/admin/tags',
      '/admin/audit-logs?pageSize=20',
    ]) {
      const response = await fetch(`${baseUrl}${path}`, {
        headers: { 'x-dev-user-email': adminEmail },
      });
      assert.equal(response.status, 200, `Expected admin access to ${path}`);
    }
  },
);

test(
  'content submission requires edit-own or edit-all authority in addition to ownership',
  { skip: !integrationEnabled },
  async () => {
    const response = await fetch(`${baseUrl}/content-drafts/${submitOnlyDraftContent.id}/publish`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-dev-user-email': managerEmail },
      body: JSON.stringify({}),
    });
    assert.equal(response.status, 403);
    assert.equal(
      await prisma.reviewRequest.count({ where: { contentId: submitOnlyDraftContent.id } }),
      0,
    );
  },
);

test(
  'all content types publish draft detail projections and preserve prior version bodies',
  { skip: !integrationEnabled },
  async () => {
    async function request(path, method, email, body) {
      const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
          'x-dev-user-email': email,
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
      const text = await response.text();
      assert.ok(
        response.ok,
        `${method} ${path} returned ${response.status}: ${text}`,
      );
      return text ? JSON.parse(text) : null;
    }

    async function approveAndPublish(contentId) {
      await request(`/content-drafts/${contentId}/publish`, 'POST', memberEmail);
    }

    for (const fixture of publicationFixtures()) {
      const created = await request('/content-drafts', 'POST', memberEmail, {
        contentType: fixture.contentType,
        title: `${fixture.contentType} projection ${runId}`,
        summary: 'A temporary full publication-flow fixture.',
        teamId: team.id,
        visibility: 'ORGANIZATION',
        versionLabel: 'v1.0',
        body: fixture.bodyV1,
      });
      contentIds.push(created.id);
      const versionOneId = created.draftVersion.id;

      await approveAndPublish(created.id, `Review ${fixture.contentType} v1.`);
      const firstDetail = await request(`/contents/${created.slug}`, 'GET', memberEmail);
      assert.equal(firstDetail.currentVersion.id, versionOneId);
      assert.deepEqual(firstDetail.currentVersion.body, { ...fixture.bodyV1, taxonomy: { categoryId: null, tagIds: [] } });
      assert.equal(
        firstDetail[fixture.detailKey][fixture.detailField],
        fixture.bodyV1[fixture.detailField],
      );

      const editDraft = await request(
        `/content-drafts/${created.id}/from-published`,
        'POST',
        memberEmail,
      );
      assert.equal(editDraft.draftVersion.versionNumber, 2);
      await request(`/content-drafts/${created.id}`, 'PATCH', memberEmail, {
        title: `${fixture.contentType} projection v2 ${runId}`,
        versionLabel: 'v2.0',
        changeSummary: 'Update the projected detail field.',
        body: fixture.bodyV2,
      });
      await approveAndPublish(created.id, `Review ${fixture.contentType} v2.`);

      const secondDetail = await request(`/contents/${created.slug}`, 'GET', memberEmail);
      assert.equal(secondDetail.currentVersion.versionNumber, 2);
      assert.deepEqual(secondDetail.currentVersion.body, { ...fixture.bodyV2, taxonomy: { categoryId: null, tagIds: [] } });
      assert.equal(
        secondDetail[fixture.detailKey][fixture.detailField],
        fixture.valueV2,
      );

      const storedVersions = await prisma.contentVersion.findMany({
        where: { contentId: created.id },
        orderBy: { versionNumber: 'asc' },
        select: { id: true, versionNumber: true, versionStatus: true, body: true },
      });
      assert.equal(storedVersions.length, 2);
      assert.equal(storedVersions[0].id, versionOneId);
      assert.equal(storedVersions[0].versionStatus, 'PUBLISHED');
      assert.deepEqual(storedVersions[0].body, { ...fixture.bodyV1, taxonomy: { categoryId: null, tagIds: [] } });
      assert.equal(storedVersions[1].versionStatus, 'PUBLISHED');
      assert.deepEqual(storedVersions[1].body, { ...fixture.bodyV2, taxonomy: { categoryId: null, tagIds: [] } });
    }
  },
);

test(
  'editing published content creates an immutable next draft version',
  { skip: !integrationEnabled },
  async () => {
    const original = await prisma.content.findUniqueOrThrow({
      where: { id: publishedContent.id },
      include: { currentVersion: true },
    });
    const createDraft = await fetch(
      `${baseUrl}/content-drafts/${publishedContent.id}/from-published`,
      {
        method: 'POST',
        headers: { 'x-dev-user-email': memberEmail },
      },
    );
    assert.equal(createDraft.status, 201);
    const draftContent = await createDraft.json();
    assert.equal(draftContent.status, 'PUBLISHED');
    assert.equal(draftContent.currentVersionId, original.currentVersionId);
    assert.equal(draftContent.draftVersion.versionNumber, 2);
    assert.equal(draftContent.draftVersion.baseVersionId, original.currentVersionId);
    assert.deepEqual(draftContent.draftVersion.body, { ...original.currentVersion.body, taxonomy: { categoryId: null, tagIds: [] } });

    const memberContributions = await fetch(`${baseUrl}/content-drafts`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(memberContributions.status, 200);
    const memberContributionData = await memberContributions.json();
    assert.equal(memberContributionData.items.some((item) => item.id === publishedContent.id), true);
    assert.equal(memberContributionData.total, memberContributionData.items.length);

    const adminContributions = await fetch(`${baseUrl}/content-drafts`, {
      headers: { 'x-dev-user-email': adminEmail },
    });
    assert.equal(adminContributions.status, 200);
    const adminContributionData = await adminContributions.json();
    assert.equal(adminContributionData.items.some((item) => item.id === publishedContent.id), false);

    const autosave = await fetch(`${baseUrl}/content-drafts/${publishedContent.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-dev-user-email': memberEmail },
      body: JSON.stringify({ title: 'Edited draft title', body: completeAssetBody(['new draft only']) }),
    });
    assert.equal(autosave.status, 200);

    const afterAutosave = await prisma.content.findUniqueOrThrow({
      where: { id: publishedContent.id },
      include: { currentVersion: true, draftVersion: true },
    });
    assert.equal(afterAutosave.status, 'PUBLISHED');
    assert.equal(afterAutosave.title, original.title);
    assert.equal(afterAutosave.currentVersion.title, original.currentVersion.title);
    assert.equal(afterAutosave.draftVersion.title, 'Edited draft title');
    assert.deepEqual(afterAutosave.draftVersion.body, { ...completeAssetBody(['new draft only']), taxonomy: { categoryId: null, tagIds: [] } });

    const publish = await fetch(`${baseUrl}/content-drafts/${publishedContent.id}/publish`, {
      method: 'POST', headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(publish.status, 201, await publish.text());

    const afterPublish = await prisma.content.findUniqueOrThrow({
      where: { id: publishedContent.id },
      include: { currentVersion: true, versions: { orderBy: { versionNumber: 'asc' } } },
    });
    assert.equal(afterPublish.status, 'PUBLISHED');
    assert.equal(afterPublish.draftVersionId, null);
    assert.equal(afterPublish.currentVersion.versionNumber, 2);
    assert.equal(afterPublish.currentVersion.title, 'Edited draft title');
    assert.equal(afterPublish.title, 'Edited draft title');
    assert.equal(afterPublish.versions[0].versionStatus, 'PUBLISHED');
    assert.equal(afterPublish.versions[1].versionStatus, 'PUBLISHED');
    assert.equal(afterPublish.versions[1].publishedAt instanceof Date, true);

    const memberUnpublish = await fetch(
      `${baseUrl}/content-drafts/${publishedContent.id}/unpublish`,
      {
        method: 'POST',
        headers: { 'x-dev-user-email': memberEmail },
      },
    );
    assert.equal(memberUnpublish.status, 403);
    const unpublish = await fetch(`${baseUrl}/content-drafts/${publishedContent.id}/unpublish`, {
      method: 'POST',
      headers: { 'x-dev-user-email': adminEmail },
    });
    assert.equal(unpublish.status, 201);
    assert.equal(
      (await prisma.content.findUniqueOrThrow({ where: { id: publishedContent.id } })).status,
      'UNPUBLISHED',
    );
    const archive = await fetch(`${baseUrl}/content-drafts/${publishedContent.id}/archive`, {
      method: 'POST',
      headers: { 'x-dev-user-email': adminEmail },
    });
    assert.equal(archive.status, 201);
    const archived = await prisma.content.findUniqueOrThrow({ where: { id: publishedContent.id } });
    assert.equal(archived.status, 'ARCHIVED');
    assert.equal(archived.archivedAt instanceof Date, true);
  },
);

test(
  'taxonomy administration records create and status changes in the audit log',
  { skip: !integrationEnabled },
  async () => {
    const categoryCode = `integration-category-${runId}`;
    const created = await fetch(`${baseUrl}/admin/categories`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-dev-user-email': adminEmail },
      body: JSON.stringify({
        name: 'Integration Category',
        code: categoryCode,
        contentTypes: ['DESIGN_ASSET'],
      }),
    });
    assert.equal(created.status, 201);
    const category = await created.json();
    categoryIds.push(category.id);

    const updated = await fetch(`${baseUrl}/admin/categories/${category.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json', 'x-dev-user-email': adminEmail },
      body: JSON.stringify({ status: 'DISABLED' }),
    });
    assert.equal(updated.status, 200);
    assert.equal((await updated.json()).status, 'DISABLED');

    const auditEntries = await prisma.auditLog.findMany({
      where: { organizationId: organization.id, entityType: 'category', entityId: category.id },
      select: { action: true, actorId: true },
      orderBy: { createdAt: 'asc' },
    });
    assert.deepEqual(
      auditEntries.map((entry) => entry.action),
      ['taxonomy.category.create', 'taxonomy.category.update'],
    );
    assert.equal(auditEntries.every((entry) => entry.actorId === adminUser.id), true);

    const tagName = `Integration tag ${runId}`;
    const createdTagResponse = await fetch(`${baseUrl}/admin/tags`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-dev-user-email': adminEmail },
      body: JSON.stringify({ name: tagName }),
    });
    assert.equal(createdTagResponse.status, 201);
    const createdTag = await createdTagResponse.json();
    tagIds.push(createdTag.id);
    assert.equal(createdTag.status, 'ACTIVE');

    for (const status of ['DISABLED', 'ACTIVE']) {
      const updatedTagResponse = await fetch(`${baseUrl}/admin/tags/${createdTag.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', 'x-dev-user-email': adminEmail },
        body: JSON.stringify({ status }),
      });
      assert.equal(updatedTagResponse.status, 200);
      assert.equal((await updatedTagResponse.json()).status, status);
    }

    const tagAuditEntries = await prisma.auditLog.findMany({
      where: { organizationId: organization.id, entityType: 'tag', entityId: createdTag.id },
      select: { action: true, actorId: true },
      orderBy: { createdAt: 'asc' },
    });
    assert.deepEqual(
      tagAuditEntries.map((entry) => entry.action),
      ['taxonomy.tag.create', 'taxonomy.tag.update', 'taxonomy.tag.update'],
    );
    assert.equal(tagAuditEntries.every((entry) => entry.actorId === adminUser.id), true);
  },
);

test(
  'notifications are private and support individual and bulk read acknowledgement',
  { skip: !integrationEnabled },
  async () => {
    const [memberNotification, adminNotification] = await Promise.all([
      prisma.notification.create({
        data: {
          receiverId: memberUser.id,
          type: 'integration_notification',
          title: 'Member integration notification',
          message: 'This notification belongs to the integration member.',
        },
      }),
      prisma.notification.create({
        data: {
          receiverId: adminUser.id,
          type: 'integration_notification',
          title: 'Admin integration notification',
          message: 'This notification belongs to the integration admin.',
        },
      }),
    ]);

    const memberNotifications = await fetch(`${baseUrl}/notifications`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(memberNotifications.status, 200);
    const memberList = await memberNotifications.json();
    assert.equal(memberList.items.some((item) => item.id === memberNotification.id), true);
    assert.equal(memberList.items.some((item) => item.id === adminNotification.id), false);

    const markOwnRead = await fetch(`${baseUrl}/notifications/${memberNotification.id}/read`, {
      method: 'PATCH',
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(markOwnRead.status, 200);
    assert.equal(
      (await prisma.notification.findUniqueOrThrow({ where: { id: memberNotification.id } })).readAt instanceof Date,
      true,
    );

    const markForeignRead = await fetch(`${baseUrl}/notifications/${adminNotification.id}/read`, {
      method: 'PATCH',
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(markForeignRead.status, 403);

    const bulkRead = await fetch(`${baseUrl}/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(bulkRead.status, 200);
    assert.equal(
      await prisma.notification.count({ where: { receiverId: memberUser.id, readAt: null } }),
      0,
    );
  },
);

test(
  'request validation, CORS and search input preserve security boundaries',
  { skip: !integrationEnabled },
  async () => {
    const crossOriginPreflight = await fetch(`${baseUrl}/content-drafts`, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://attacker.example',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type,x-dev-user-email',
      },
    });
    assert.notEqual(crossOriginPreflight.headers.get('access-control-allow-origin'), 'https://attacker.example');

    const massAssignment = await fetch(`${baseUrl}/content-drafts`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-dev-user-email': memberEmail },
      body: JSON.stringify({
        contentType: 'DESIGN_ASSET',
        title: 'Rejected mass assignment',
        teamId: team.id,
        body: {},
        ownerId: adminUser.id,
      }),
    });
    assert.equal(massAssignment.status, 400);

    const spoofedFile = await fetch(`${baseUrl}/files/upload-intents`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-dev-user-email': memberEmail },
      body: JSON.stringify({
        originalName: 'unsafe.svg',
        mimeType: 'image/svg+xml',
        sizeBytes: 48,
        checksumSha256: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      }),
    });
    assert.equal(spoofedFile.status, 400);

    const injectionLikeSearch = await fetch(
      `${baseUrl}/search?q=${encodeURIComponent("' OR 1=1 --")}&pageSize=100`,
      { headers: { 'x-dev-user-email': memberEmail } },
    );
    assert.equal(injectionLikeSearch.status, 200);
    const searchResults = await injectionLikeSearch.json();
    assert.equal(searchResults.items.some((item) => item.id === adminRestrictedContent.id), false);
  },
);

test(
  'identity API enforces authentication, RBAC, tenant scope and disabled-user access',
  { skip: !integrationEnabled },
  async () => {
    const unauthenticated = await fetch(`${baseUrl}/me`);
    assert.equal(unauthenticated.status, 401);

    const adminMe = await fetch(`${baseUrl}/me`, { headers: { 'x-dev-user-email': adminEmail } });
    assert.equal(adminMe.status, 200);
    const admin = await adminMe.json();
    assert.equal(admin.id, adminUser.id);
    assert.equal(admin.permissions.includes('user.manage'), true);

    const memberAdminRequest = await fetch(`${baseUrl}/organizations/${organization.id}/users`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(memberAdminRequest.status, 403);

    const adminUsersRequest = await fetch(`${baseUrl}/organizations/${organization.id}/users`, {
      headers: { 'x-dev-user-email': adminEmail },
    });
    assert.equal(adminUsersRequest.status, 200);
    const users = await adminUsersRequest.json();
    assert.equal(
      users.items.some((user) => user.id === memberUser.id),
      true,
    );

    const crossOrganizationRequest = await fetch(
      `${baseUrl}/organizations/00000000-0000-0000-0000-000000000000/users`,
      {
        headers: { 'x-dev-user-email': adminEmail },
      },
    );
    assert.equal(crossOrganizationRequest.status, 403);

    await prisma.user.update({ where: { id: memberUser.id }, data: { status: 'DISABLED' } });
    const disabledUserRequest = await fetch(`${baseUrl}/me`, {
      headers: { 'x-dev-user-email': memberEmail },
    });
    assert.equal(disabledUserRequest.status, 403);
  },
);


test('retired review routes and privileges are unavailable even to administrators', { skip: !integrationEnabled }, async () => {
  for (const path of ['/reviews/queue', '/reviews/reviewers', '/reviews/mine']) {
    const response = await fetch(`${baseUrl}${path}`, { headers: { 'x-dev-user-email': adminEmail } });
    assert.equal(response.status, 404);
  }
  const oldSubmit = await fetch(`${baseUrl}/reviews/content/${publishedContent.id}/submit`, { method: 'POST', headers: { 'x-dev-user-email': adminEmail } });
  assert.equal(oldSubmit.status, 404);
  assert.equal(await prisma.role.count({ where: { code: 'reviewer' } }), 0);
  assert.equal(await prisma.permission.count({ where: { OR: [{ code: { startsWith: 'review.' } }, { code: { in: ['content.publish', 'content.submit'] } }] } }), 0);
});


test('asset covers are optional, versioned, access controlled and deleted contents disappear', { skip: !integrationEnabled }, async () => {
  await prisma.user.update({ where: { id: memberUser.id }, data: { status: 'ACTIVE' } });
  const { createHash } = await import('node:crypto');
  async function request(path, method = 'GET', body, email = memberEmail, status = 200) {
    const response = await fetch(`${baseUrl}${path}`, { method, headers: { 'x-dev-user-email': email, ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const text = await response.text(); assert.equal(response.status, status, `${path}: ${text}`);
    return text ? JSON.parse(text) : null;
  }
  const draft = await request('/content-drafts', 'POST', { contentType: 'DESIGN_ASSET', title: `Cover deletion fixture ${runId}`, summary: 'Image publication test', teamId: team.id, body: completeAssetBody() }, memberEmail, 201);
  contentIds.push(draft.id);
  assert.equal((await request(`/content-drafts/${draft.id}`)).coverFile, null);
  const bytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aS2kAAAAASUVORK5CYII=', 'base64');
  const intent = await request('/files/upload-intents', 'POST', { originalName: 'cover.png', mimeType: 'image/png', sizeBytes: bytes.length, checksumSha256: createHash('sha256').update(bytes).digest('base64') }, memberEmail, 201);
  try {
    const uploaded = await fetch(intent.upload.url, { method: intent.upload.method, headers: intent.upload.headers, body: bytes });
    assert.ok(uploaded.ok);
    await request(`/files/${intent.file.id}/complete`, 'POST', undefined, memberEmail, 201);
    await request(`/content-drafts/${draft.id}/cover`, 'PATCH', { fileId: publishedAttachmentFileId }, memberEmail, 400);
    await request(`/content-drafts/${draft.id}/cover`, 'PATCH', { fileId: intent.file.id });
    await request(`/content-drafts/${draft.id}`, 'PATCH', { attachmentFileIds: [] });
    assert.equal((await request(`/content-drafts/${draft.id}`)).coverFile, intent.file.id);
    await request(`/files/${intent.file.id}/image`, 'GET', undefined, reviewerEmail, 403);
    const tool = await request('/content-drafts', 'POST', { contentType: 'AI_TOOL', title: `Tool cover ${runId}`, summary: 'Tool cover test', teamId: team.id, body: publicationFixtures().find((fixture) => fixture.contentType === 'AI_TOOL').bodyV1 }, memberEmail, 201);
    contentIds.push(tool.id);
    await request(`/content-drafts/${tool.id}/cover`, 'PATCH', { fileId: intent.file.id });
    await request(`/content-drafts/${tool.id}/publish`, 'POST', undefined, memberEmail, 201);
    assert.equal((await request(`/contents/${tool.slug}`)).coverFile.id, intent.file.id);

    await request(`/content-drafts/${draft.id}/publish`, 'POST', undefined, memberEmail, 201);
    assert.equal((await request(`/contents/${draft.slug}`)).coverFile.id, intent.file.id);
    const image = await request(`/files/${intent.file.id}/image`, 'GET', undefined, reviewerEmail);
    assert.deepEqual(Buffer.from(await (await fetch(image.url)).arrayBuffer()), bytes);
    await request(`/content-drafts/${draft.id}/from-published`, 'POST', undefined, memberEmail, 201);
    await request(`/content-drafts/${draft.id}/cover`, 'PATCH', { fileId: null });
    assert.equal((await request(`/contents/${draft.slug}`)).coverFile.id, intent.file.id);
    await request(`/content-drafts/${draft.id}/publish`, 'POST', undefined, memberEmail, 201);
    assert.equal((await request(`/contents/${draft.slug}`)).coverFile, null);
    await request(`/content-drafts/${draft.id}`, 'DELETE', undefined, reviewerEmail, 403);
    await request(`/content-drafts/${draft.id}`, 'DELETE');
    await request(`/contents/${draft.slug}`, 'GET', undefined, memberEmail, 404);
    assert.equal((await request('/content-drafts')).items.some((item) => item.id === draft.id), false);
    assert.equal((await request('/admin/contents', 'GET', undefined, adminEmail)).items.some((item) => item.id === draft.id), false);
    assert.ok(await prisma.auditLog.findFirst({ where: { entityId: draft.id, action: 'content.delete' } }));
    const other = await request('/content-drafts', 'POST', { contentType: 'DESIGN_ASSET', title: `Admin deletion fixture ${runId}`, teamId: team.id, body: {} }, memberEmail, 201);
    contentIds.push(other.id);
    await request(`/content-drafts/${other.id}`, 'DELETE', undefined, adminEmail);
    const ownDraft = await request('/content-drafts', 'POST', { contentType: 'DESIGN_ASSET', title: `Own deleted draft ${runId}`, teamId: team.id, body: {} }, memberEmail, 201);
    contentIds.push(ownDraft.id);
    await request(`/content-drafts/${ownDraft.id}`, 'DELETE');
    await request(`/content-drafts/${ownDraft.id}`, 'GET', undefined, memberEmail, 404);
    assert.ok((await prisma.content.findUnique({ where: { id: other.id } })).deletedAt);
  } finally {
    await prisma.attachmentRelation.deleteMany({ where: { fileId: intent.file.id } });
    await prisma.content.updateMany({ where: { coverFileId: intent.file.id }, data: { coverFileId: null } });
    await prisma.fileAttachment.delete({ where: { id: intent.file.id } });
  }
});
