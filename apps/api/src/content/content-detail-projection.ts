import { BadRequestException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';
import {
  AIProjectStage,
  ContentType,
  DataSecurityLevel,
  Priority,
} from '../generated/prisma/enums';

type DetailTransaction = Pick<
  Prisma.TransactionClient,
  'aIToolDetail' | 'assetDetail' | 'skillDetail' | 'caseDetail' | 'aIProjectDetail' | 'content' | 'team'
>;

type AssetProjection = Omit<Prisma.AssetDetailUncheckedCreateInput, 'contentId'>;
type SkillProjection = Omit<Prisma.SkillDetailUncheckedCreateInput, 'contentId'>;
type CaseProjection = Omit<Prisma.CaseDetailUncheckedCreateInput, 'contentId'>;
type ProjectProjection = Omit<Prisma.AIProjectDetailUncheckedCreateInput, 'contentId'>;

export type ContentDetailProjection =
  | { contentType: typeof ContentType.AI_TOOL; data: Omit<Prisma.AIToolDetailUncheckedCreateInput, 'contentId'> }
  | { contentType: typeof ContentType.DESIGN_ASSET; data: AssetProjection }
  | { contentType: typeof ContentType.AI_SKILL; data: SkillProjection }
  | { contentType: typeof ContentType.AI_CASE; data: CaseProjection }
  | { contentType: typeof ContentType.AI_PROJECT; data: ProjectProjection };

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function bodyRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw invalidDetail('body', 'must be an object');
  }
  return value as Record<string, unknown>;
}

function invalidDetail(field: string, reason: string) {
  return new BadRequestException({
    code: 'INVALID_CONTENT_DETAIL',
    message: `Content detail field ${field} ${reason}.`,
    field: field === 'body' ? field : `body.${field}`,
  });
}

function requiredText(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== 'string' || !value.trim()) throw invalidDetail(field, 'is required');
  return value.trim();
}

function optionalText(body: Record<string, unknown>, field: string): string | null {
  const value = body[field];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function requiredTextList(body: Record<string, unknown>, field: string): string[] {
  const value = body[field];
  if (
    !Array.isArray(value) ||
    value.length === 0 ||
    value.some((item) => typeof item !== 'string' || !item.trim())
  ) {
    throw invalidDetail(field, 'must be a non-empty list of text values');
  }
  return value.map((item) => (item as string).trim());
}

function optionalUuid(body: Record<string, unknown>, field: string): string | null {
  const value = optionalText(body, field);
  return value && uuidPattern.test(value) ? value : null;
}

function optionalInteger(body: Record<string, unknown>, field: string): number | null {
  const value = body[field];
  if (typeof value === 'string' && !value.trim()) return null;
  const number =
    typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim()) : NaN;
  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function optionalDecimal(body: Record<string, unknown>, field: string): string | null {
  const value = body[field];
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const normalized = String(value).trim();
  return normalized && Number.isFinite(Number(normalized)) ? normalized : null;
}

function optionalJson(body: Record<string, unknown>, field: string) {
  const value = body[field];
  return value === undefined || value === null
    ? Prisma.DbNull
    : (value as Prisma.InputJsonValue);
}

function requiredJson(body: Record<string, unknown>, field: string) {
  const value = body[field];
  if (
    value === undefined ||
    value === null ||
    (typeof value === 'string' && !value.trim()) ||
    (Array.isArray(value) && value.length === 0)
  ) {
    throw invalidDetail(field, 'is required');
  }
  return value as Prisma.InputJsonValue;
}

function requiredEnum<T extends string>(
  body: Record<string, unknown>,
  field: string,
  values: readonly T[],
): T {
  const value = requiredText(body, field).toUpperCase();
  const matched = values.find((item) => item === value);
  if (!matched) throw invalidDetail(field, `must be one of ${values.join(', ')}`);
  return matched;
}

export function projectContentDetail(
  contentType: ContentType,
  bodyValue: unknown,
): ContentDetailProjection {
  const body = bodyRecord(bodyValue);
  switch (contentType) {
    case ContentType.AI_TOOL: {
      const websiteUrl = requiredText(body, 'websiteUrl');
      try {
        const url = new URL(websiteUrl);
        if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('invalid URL');
      } catch { throw invalidDetail('websiteUrl', 'must be an HTTP(S) URL without credentials'); }
      return { contentType, data: {
        websiteUrl, vendor: requiredText(body, 'vendor'),
        platforms: requiredTextList(body, 'platforms'), scenarios: requiredTextList(body, 'scenarios'),
        usageGuide: requiredText(body, 'usageGuide'), limitations: requiredText(body, 'limitations'),
        pricingModel: requiredText(body, 'pricingModel'),
      } };
    }
    case ContentType.DESIGN_ASSET:
      return {
        contentType,
        data: {
          assetType: requiredText(body, 'assetType'),
          platforms: requiredTextList(body, 'platforms'),
          scenarios: requiredTextList(body, 'scenarios'),
          unsuitableScenarios: requiredTextList(body, 'unsuitableScenarios'),
          problemStatement: requiredText(body, 'problemStatement'),
          usageGuide: requiredJson(body, 'usageGuide'),
          resourceLinks: requiredJson(body, 'resourceLinks'),
          maintenanceCycleDays: optionalInteger(body, 'maintenanceCycleDays'),
          extraData: optionalJson(body, 'extraData'),
        },
      };
    case ContentType.AI_SKILL:
      return {
        contentType,
        data: {
          applicableRoles: requiredTextList(body, 'applicableRoles'),
          inputRequirements: requiredJson(body, 'inputRequirements'),
          outputSchema: requiredJson(body, 'outputSchema'),
          promptTemplate: requiredText(body, 'promptTemplate'),
          executionSteps: requiredJson(body, 'executionSteps'),
          exampleInput: requiredJson(body, 'exampleInput'),
          exampleOutput: requiredJson(body, 'exampleOutput'),
          humanReviewRules: requiredJson(body, 'humanReviewRules'),
          limitations: requiredText(body, 'limitations'),
          recommendedModels: requiredTextList(body, 'recommendedModels'),
          dataSecurityLevel: requiredEnum(body, 'dataSecurityLevel', [
            DataSecurityLevel.PUBLIC,
            DataSecurityLevel.INTERNAL,
            DataSecurityLevel.CONFIDENTIAL,
          ]),
          promptVersion: requiredText(body, 'promptVersion'),
          onlineExecutable: body.onlineExecutable === true,
          executionConfig: optionalJson(body, 'executionConfig'),
        },
      };
    case ContentType.AI_CASE:
      return {
        contentType,
        data: {
          background: requiredText(body, 'background'),
          originalProcess: requiredText(body, 'originalProcess'),
          aiResponsibilities: requiredText(body, 'aiResponsibilities'),
          humanResponsibilities: requiredText(body, 'humanResponsibilities'),
          resultSummary: requiredText(body, 'resultSummary'),
          metricName: optionalText(body, 'metricName'),
          beforeValue: optionalDecimal(body, 'beforeValue'),
          afterValue: optionalDecimal(body, 'afterValue'),
          sampleSize: optionalInteger(body, 'sampleSize'),
          validationMethod: requiredText(body, 'validationMethod'),
          limitations: requiredText(body, 'limitations'),
          relatedSkillContentId: optionalUuid(body, 'relatedSkillContentId'),
          relatedProjectContentId: optionalUuid(body, 'relatedProjectContentId'),
        },
      };
    case ContentType.AI_PROJECT:
      return {
        contentType,
        data: {
          projectCode: requiredText(body, 'projectCode'),
          domain: requiredText(body, 'domain'),
          targetValue: requiredText(body, 'targetValue'),
          projectStage: requiredEnum(body, 'projectStage', [
            AIProjectStage.EXPLORING,
            AIProjectStage.PENDING_EVALUATION,
            AIProjectStage.READY,
            AIProjectStage.PILOTING,
            AIProjectStage.VERIFIED,
            AIProjectStage.PAUSED,
            AIProjectStage.TERMINATED,
          ]),
          priority: requiredEnum(body, 'priority', [Priority.HIGH, Priority.MEDIUM, Priority.LOW]),
          suggestedOwnerTeamId: optionalUuid(body, 'suggestedOwnerTeamId'),
          problemStatement: requiredText(body, 'problemStatement'),
          solutionHypothesis: requiredText(body, 'solutionHypothesis'),
          expectedOutcome: requiredText(body, 'expectedOutcome'),
          riskLevel: requiredText(body, 'riskLevel'),
          evaluationResult: requiredJson(body, 'evaluationResult'),
          convertedProjectRef: optionalText(body, 'convertedProjectRef'),
        },
      };
  }
}

export async function upsertPublishedContentDetail(
  tx: DetailTransaction,
  contentType: ContentType,
  contentId: string,
  organizationId: string,
  body: unknown,
) {
  const projection = projectContentDetail(contentType, body);
  switch (projection.contentType) {
    case ContentType.AI_TOOL:
      await tx.aIToolDetail.upsert({ where: { contentId }, create: { contentId, ...projection.data }, update: projection.data });
      return;
    case ContentType.DESIGN_ASSET:
      await tx.assetDetail.upsert({
        where: { contentId },
        create: { contentId, ...projection.data },
        update: projection.data,
      });
      return;
    case ContentType.AI_SKILL:
      await tx.skillDetail.upsert({
        where: { contentId },
        create: { contentId, ...projection.data },
        update: projection.data,
      });
      return;
    case ContentType.AI_CASE:
      if (projection.data.relatedSkillContentId || projection.data.relatedProjectContentId) {
        const related = await tx.content.findMany({
          where: {
            organizationId,
            deletedAt: null,
            OR: [
              ...(projection.data.relatedSkillContentId
                ? [
                    {
                      id: projection.data.relatedSkillContentId,
                      contentType: ContentType.AI_SKILL,
                    },
                  ]
                : []),
              ...(projection.data.relatedProjectContentId
                ? [
                    {
                      id: projection.data.relatedProjectContentId,
                      contentType: ContentType.AI_PROJECT,
                    },
                  ]
                : []),
            ],
          },
          select: { id: true, contentType: true },
        });
        const validSkillId = related.find(
          (item) => item.contentType === ContentType.AI_SKILL,
        )?.id;
        const validProjectId = related.find(
          (item) => item.contentType === ContentType.AI_PROJECT,
        )?.id;
        projection.data.relatedSkillContentId = validSkillId ?? null;
        projection.data.relatedProjectContentId = validProjectId ?? null;
      }
      await tx.caseDetail.upsert({
        where: { contentId },
        create: { contentId, ...projection.data },
        update: projection.data,
      });
      return;
    case ContentType.AI_PROJECT:
      if (projection.data.suggestedOwnerTeamId) {
        const suggestedOwnerTeam = await tx.team.findFirst({
          where: {
            id: projection.data.suggestedOwnerTeamId,
            organizationId,
            status: 'ACTIVE',
          },
          select: { id: true },
        });
        projection.data.suggestedOwnerTeamId = suggestedOwnerTeam?.id ?? null;
      }
      await tx.aIProjectDetail.upsert({
        where: { contentId },
        create: { contentId, ...projection.data },
        update: projection.data,
      });
  }
}
