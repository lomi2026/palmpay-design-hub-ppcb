import type { ContentCard, PublishedAttachment } from './content-types';

export type ProjectStage = 'EXPLORING' | 'READY' | 'PILOTING' | 'CONVERTED' | 'ARCHIVED';

export interface AIProjectCard extends ContentCard {
  projectDetail: {
    projectCode: string;
    domain: string | null;
    targetValue: string | null;
    projectStage: ProjectStage;
    priority: string;
  } | null;
}

export interface AIProjectDetail extends AIProjectCard {
  currentVersion: {
    versionNumber: number;
    versionLabel: string | null;
    title: string;
    summary: string | null;
    body: unknown;
  } | null;
  projectDetail: {
    projectCode: string;
    domain: string | null;
    targetValue: string | null;
    projectStage: ProjectStage;
    priority: string;
    problemStatement: string | null;
    solutionHypothesis: string | null;
    expectedOutcome: string | null;
    riskLevel: string | null;
    evaluationResult: unknown;
    suggestedOwnerTeam: { id: string; name: string; code: string } | null;
  } | null;
  attachments: PublishedAttachment[];
}

export type ImportedProjectBody = {
  source?: {
    baseline?: string;
    baselineUrl?: string;
    sourceCommit?: string;
    legacyProjectFile?: string;
    legacyProjectUrl?: string;
  };
  nextStep?: string;
  prioritization?: {
    rank?: number | null;
    reason?: string | null;
    impact?: string | null;
    effort?: string | null;
    readiness?: string | null;
  };
};

export function getImportedProjectBody(value: unknown): ImportedProjectBody {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as ImportedProjectBody;
}

export const stageLabels: Record<ProjectStage, string> = {
  EXPLORING: '探索方案',
  READY: '可立项',
  PILOTING: '试点中',
  CONVERTED: '已转项目',
  ARCHIVED: '已归档',
};

export const verificationLabels: Record<string, string> = {
  UNVERIFIED: '待验证',
  INTERNAL_TRIAL: '内部试用',
  PILOT: '试点中',
  VERIFIED: '已验证',
  INVALIDATED: '已失效',
};

/** Resolve migrated static pages without rewriting stored source provenance. */
export function getProjectPageUrl(sourceUrl: string | undefined): string | undefined {
  if (!sourceUrl) return undefined;
  try {
    const url = new URL(sourceUrl);
    const code = url.searchParams.get('id');
    if (
      url.origin === 'https://lomi2026.github.io' &&
      url.pathname === '/palmpay-design-intelligence/projects/project-detail.html' &&
      code && /^(P(0[1-9]|1[0-9]|2[0-6])|S0[1-7])$/.test(code)
    ) {
      url.pathname = '/palmpay-design-hub-ppcb/projects/project-detail.html';
      return url.toString();
    }
  } catch {
    // Preserve existing handling of unrelated or malformed source values.
  }
  return sourceUrl;
}
