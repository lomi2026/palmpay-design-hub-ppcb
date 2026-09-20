import type { ContentCard, PublishedAttachment } from './content-types';

export interface AISkillDetail extends ContentCard {
  attachments: PublishedAttachment[];
  skillDetail: {
    applicableRoles: string[];
    inputRequirements: { description?: string } | null;
    outputSchema: { description?: string } | null;
    promptTemplate: string | null;
    executionSteps: { duration?: string; complexity?: string; description?: string } | null;
    exampleInput: unknown;
    exampleOutput: unknown;
    humanReviewRules: { note?: string } | null;
    limitations: string | null;
    recommendedModels: string[];
    dataSecurityLevel: string;
    promptVersion: string | null;
    onlineExecutable: boolean;
  } | null;
  currentVersion: {
    versionNumber: number;
    versionLabel: string | null;
    body: unknown;
  } | null;
}

export interface AICaseDetail extends ContentCard {
  attachments: PublishedAttachment[];
  caseDetail: {
    background: string | null;
    originalProcess: string | null;
    aiResponsibilities: string | null;
    humanResponsibilities: string | null;
    resultSummary: string | null;
    metricName: string | null;
    validationMethod: string | null;
  } | null;
  currentVersion: {
    versionNumber: number;
    versionLabel: string | null;
    body: unknown;
  } | null;
}

export type ImportedCatalogBody = {
  source?: { baselineUrl?: string; sourceCommit?: string; legacyId?: string };
  usageCount?: number;
  updatedLabel?: string;
  duration?: string;
  complexity?: string;
  verifiedLabel?: string;
  metric?: string;
  statusLabel?: string;
  before?: string;
  after?: string;
  sample?: string;
  validation?: string;
  phase?: string;
};

export function getImportedCatalogBody(value: unknown): ImportedCatalogBody {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as ImportedCatalogBody;
}

export const verificationLabels: Record<string, string> = {
  UNVERIFIED: '探索中',
  INTERNAL_TRIAL: '内部试运行',
  PILOT: '试点中',
  VERIFIED: '已验证',
  INVALIDATED: '已失效',
};
