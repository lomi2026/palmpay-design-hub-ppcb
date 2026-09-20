import { PrismaClient } from '../generated/prisma/client';
import { ContentStatus, ContentVisibility, ContentType, DataSecurityLevel, Priority, RoleScopeType, TagStatus, UserStatus } from '../generated/prisma/enums';
import { publishedContentSnapshot } from './ppcb-data/published-content-snapshot';

// The checked-in snapshot spans several Prisma models with different JSON shapes.
// Its values are only consumed by the explicit field mappings below.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
type Snapshot = { contents: Row[]; versions: Row[]; projects: Row[]; assets: Row[]; tools: Row[]; skills: Row[]; cases: Row[]; tags: Row[]; content_tags: Row[] };

const snapshot = publishedContentSnapshot as unknown as Snapshot;
const organizationCode = process.env.DEFAULT_ORGANIZATION_CODE ?? 'palmpay-experience-design';
const ownerEmail = process.env.PPCB_OWNER_EMAIL ?? 'lomi2026@126.com';
const teamCode = 'palmpay-experience-design';

const categoryDefinition: Record<string, { code: string; name: string; type: ContentType }> = {
  AI_PROJECT: { code: 'ai-projects', name: 'AI 项目库', type: ContentType.AI_PROJECT },
  DESIGN_ASSET: { code: 'design-assets', name: '设计资产', type: ContentType.DESIGN_ASSET },
  AI_TOOL: { code: 'ai-tools', name: 'AI 工具', type: ContentType.AI_TOOL },
  AI_SKILL: { code: 'ai-skills', name: 'AI Skill', type: ContentType.AI_SKILL },
  AI_CASE: { code: 'ai-cases', name: 'AI 案例', type: ContentType.AI_CASE },
};

const asDate = (value: unknown) => (value ? new Date(String(value)) : undefined);
const asTagStatus = (value: unknown): TagStatus => {
  const normalized = String(value ?? '').toUpperCase();
  if (normalized === TagStatus.ACTIVE || normalized === TagStatus.MERGED || normalized === TagStatus.DISABLED) return normalized;
  return TagStatus.DISABLED;
};
const asPriority = (value: unknown): Priority => {
  const normalized = String(value ?? '').toUpperCase();
  if (normalized === Priority.HIGH || normalized === Priority.MEDIUM || normalized === Priority.LOW) return normalized;
  return Priority.MEDIUM;
};
const asDataSecurityLevel = (value: unknown): DataSecurityLevel => {
  const normalized = String(value ?? '').toUpperCase();
  if (normalized === DataSecurityLevel.PUBLIC || normalized === DataSecurityLevel.INTERNAL || normalized === DataSecurityLevel.CONFIDENTIAL) return normalized;
  return DataSecurityLevel.INTERNAL;
};

/** Legacy migration utility: overwrites existing records; never invoke during ordinary startup. */
export async function importPpcbPublishedContent(prisma: PrismaClient) {
  const organization = await prisma.organization.findUnique({ where: { code: organizationCode } });
  if (!organization) throw new Error(`Organization not found: ${organizationCode}`);

  // The unique e-mail lookup is intentional: PPCB may have already provisioned the Owner.
  const owner = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: organization.id, email: ownerEmail } },
    create: { organizationId: organization.id, email: ownerEmail, name: 'lomi2026', status: UserStatus.ACTIVE },
    update: { status: UserStatus.ACTIVE, deletedAt: null },
  });
  const team = await prisma.team.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: teamCode } },
    create: { organizationId: organization.id, code: teamCode, name: 'PalmPay Experience Design', ownerId: owner.id },
    update: { ownerId: owner.id, status: 'ACTIVE' },
  });
  const admin = await prisma.role.findUnique({ where: { code: 'admin' } });
  if (!admin) throw new Error('System admin role is missing. Run the database seed first.');
  await prisma.userRole.upsert({
    where: { userId_roleId_scopeType_scopeId: { userId: owner.id, roleId: admin.id, scopeType: RoleScopeType.ORGANIZATION, scopeId: organization.id } },
    create: { userId: owner.id, roleId: admin.id, scopeType: RoleScopeType.ORGANIZATION, scopeId: organization.id },
    update: {},
  });

  const categories = new Map<string, string>();
  for (const [type, definition] of Object.entries(categoryDefinition)) {
    const category = await prisma.category.upsert({
      where: { organizationId_code: { organizationId: organization.id, code: definition.code } },
      create: { organizationId: organization.id, code: definition.code, name: definition.name, contentTypes: [definition.type] },
      update: { name: definition.name, contentTypes: [definition.type], status: 'ACTIVE' },
    });
    categories.set(type, category.id);
  }

  const tagIds = new Map<string, string>();
  for (const source of snapshot.tags) {
    const tag = await prisma.tag.upsert({
      where: { organizationId_normalizedName: { organizationId: organization.id, normalizedName: source.normalized_name } },
      create: { organizationId: organization.id, name: source.name, normalizedName: source.normalized_name, status: asTagStatus(source.status), contentTypes: source.content_types ?? [] },
      update: { name: source.name, status: asTagStatus(source.status), contentTypes: source.content_types ?? [] },
    });
    tagIds.set(source.id, tag.id);
  }

  const contentIds = new Map<string, string>();
  for (const source of snapshot.contents) {
    const content = await prisma.content.upsert({
      where: { slug: source.slug },
      create: { id: source.id, organizationId: organization.id, contentType: source.content_type, title: source.title, slug: source.slug, summary: source.summary, categoryId: categories.get(source.content_type), ownerId: owner.id, teamId: team.id, createdById: owner.id, status: ContentStatus.PUBLISHED, visibility: ContentVisibility.ORGANIZATION, verificationStatus: source.verification_status, publishedAt: asDate(source.published_at), createdAt: asDate(source.created_at), updatedAt: asDate(source.updated_at) },
      update: { title: source.title, summary: source.summary, categoryId: categories.get(source.content_type), ownerId: owner.id, teamId: team.id, createdById: owner.id, status: ContentStatus.PUBLISHED, visibility: ContentVisibility.ORGANIZATION, verificationStatus: source.verification_status, publishedAt: asDate(source.published_at), archivedAt: null, deletedAt: null },
    });
    contentIds.set(source.id, content.id);
  }

  const versionIds = new Map<string, string>();
  for (const source of snapshot.versions) {
    const version = await prisma.contentVersion.upsert({
      where: { contentId_versionNumber: { contentId: contentIds.get(source.content_id)!, versionNumber: source.version_number } },
      create: { id: source.id, contentId: contentIds.get(source.content_id)!, versionNumber: source.version_number, versionLabel: source.version_label, versionStatus: source.version_status, title: source.title, summary: source.summary, body: source.body, changeSummary: source.change_summary, createdById: owner.id, createdAt: asDate(source.created_at), submittedAt: asDate(source.submitted_at), publishedAt: asDate(source.published_at) },
      update: { versionLabel: source.version_label, versionStatus: source.version_status, title: source.title, summary: source.summary, body: source.body, changeSummary: source.change_summary, createdById: owner.id, submittedAt: asDate(source.submitted_at), publishedAt: asDate(source.published_at) },
    });
    versionIds.set(source.id, version.id);
  }
  for (const source of snapshot.versions) {
    if (source.base_version_id) await prisma.contentVersion.update({ where: { id: versionIds.get(source.id)! }, data: { baseVersionId: versionIds.get(source.base_version_id) ?? null } });
  }
  for (const source of snapshot.contents) {
    await prisma.content.update({ where: { id: contentIds.get(source.id)! }, data: { currentVersionId: versionIds.get(source.current_version_id) ?? null, draftVersionId: versionIds.get(source.draft_version_id) ?? null } });
  }

  for (const source of snapshot.projects) await prisma.aIProjectDetail.upsert({ where: { contentId: contentIds.get(source.content_id)! }, create: { contentId: contentIds.get(source.content_id)!, projectCode: source.project_code, domain: source.domain, targetValue: source.target_value, projectStage: source.project_stage, priority: asPriority(source.priority), suggestedOwnerTeamId: source.suggested_owner_team_id ? team.id : null, problemStatement: source.problem_statement, solutionHypothesis: source.solution_hypothesis, expectedOutcome: source.expected_outcome, riskLevel: source.risk_level, evaluationResult: source.evaluation_result, convertedProjectRef: source.converted_project_ref }, update: { projectCode: source.project_code, domain: source.domain, targetValue: source.target_value, projectStage: source.project_stage, priority: asPriority(source.priority), suggestedOwnerTeamId: source.suggested_owner_team_id ? team.id : null, problemStatement: source.problem_statement, solutionHypothesis: source.solution_hypothesis, expectedOutcome: source.expected_outcome, riskLevel: source.risk_level, evaluationResult: source.evaluation_result, convertedProjectRef: source.converted_project_ref } });
  for (const source of snapshot.assets) await prisma.assetDetail.upsert({ where: { contentId: contentIds.get(source.content_id)! }, create: { contentId: contentIds.get(source.content_id)!, assetType: source.asset_type, platforms: source.platforms, scenarios: source.scenarios, unsuitableScenarios: source.unsuitable_scenarios, problemStatement: source.problem_statement, usageGuide: source.usage_guide, resourceLinks: source.resource_links, maintenanceCycleDays: source.maintenance_cycle_days, extraData: source.extra_data }, update: { assetType: source.asset_type, platforms: source.platforms, scenarios: source.scenarios, unsuitableScenarios: source.unsuitable_scenarios, problemStatement: source.problem_statement, usageGuide: source.usage_guide, resourceLinks: source.resource_links, maintenanceCycleDays: source.maintenance_cycle_days, extraData: source.extra_data } });
  for (const source of snapshot.tools) await prisma.aIToolDetail.upsert({ where: { contentId: contentIds.get(source.content_id)! }, create: { contentId: contentIds.get(source.content_id)!, websiteUrl: source.website_url, vendor: source.vendor, platforms: source.platforms, scenarios: source.scenarios, usageGuide: source.usage_guide, limitations: source.limitations, pricingModel: source.pricing_model }, update: { websiteUrl: source.website_url, vendor: source.vendor, platforms: source.platforms, scenarios: source.scenarios, usageGuide: source.usage_guide, limitations: source.limitations, pricingModel: source.pricing_model } });
  for (const source of snapshot.skills) await prisma.skillDetail.upsert({ where: { contentId: contentIds.get(source.content_id)! }, create: { contentId: contentIds.get(source.content_id)!, applicableRoles: source.applicable_roles, inputRequirements: source.input_requirements, outputSchema: source.output_schema, promptTemplate: source.prompt_template, executionSteps: source.execution_steps, exampleInput: source.example_input, exampleOutput: source.example_output, humanReviewRules: source.human_review_rules, limitations: source.limitations, recommendedModels: source.recommended_models, dataSecurityLevel: asDataSecurityLevel(source.data_security_level), promptVersion: source.prompt_version, onlineExecutable: source.online_executable, executionConfig: source.execution_config }, update: { applicableRoles: source.applicable_roles, inputRequirements: source.input_requirements, outputSchema: source.output_schema, promptTemplate: source.prompt_template, executionSteps: source.execution_steps, exampleInput: source.example_input, exampleOutput: source.example_output, humanReviewRules: source.human_review_rules, limitations: source.limitations, recommendedModels: source.recommended_models, dataSecurityLevel: asDataSecurityLevel(source.data_security_level), promptVersion: source.prompt_version, onlineExecutable: source.online_executable, executionConfig: source.execution_config } });
  for (const source of snapshot.cases) await prisma.caseDetail.upsert({ where: { contentId: contentIds.get(source.content_id)! }, create: { contentId: contentIds.get(source.content_id)!, background: source.background, originalProcess: source.original_process, aiResponsibilities: source.ai_responsibilities, humanResponsibilities: source.human_responsibilities, resultSummary: source.result_summary, metricName: source.metric_name, beforeValue: source.before_value, afterValue: source.after_value, sampleSize: source.sample_size, validationMethod: source.validation_method, limitations: source.limitations, relatedSkillContentId: contentIds.get(source.related_skill_content_id) ?? null, relatedProjectContentId: contentIds.get(source.related_project_content_id) ?? null }, update: { background: source.background, originalProcess: source.original_process, aiResponsibilities: source.ai_responsibilities, humanResponsibilities: source.human_responsibilities, resultSummary: source.result_summary, metricName: source.metric_name, beforeValue: source.before_value, afterValue: source.after_value, sampleSize: source.sample_size, validationMethod: source.validation_method, limitations: source.limitations, relatedSkillContentId: contentIds.get(source.related_skill_content_id) ?? null, relatedProjectContentId: contentIds.get(source.related_project_content_id) ?? null } });
  for (const source of snapshot.content_tags) {
    const contentId = contentIds.get(source.content_id); const tagId = tagIds.get(source.tag_id);
    if (contentId && tagId) await prisma.contentTag.upsert({ where: { contentId_tagId: { contentId, tagId } }, create: { contentId, tagId, createdById: owner.id }, update: { createdById: owner.id } });
  }
  return { owner: owner.email, imported: snapshot.contents.length, versions: snapshot.versions.length, tags: tagIds.size };
}
