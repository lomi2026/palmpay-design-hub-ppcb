import { BadRequestException } from '@nestjs/common';
import { ContentType } from '../generated/prisma/enums';

type Snapshot = {
  contentType: ContentType;
  title: string | null;
  summary: string | null;
  ownerId: string | null;
  versionNumber: number | null;
  body: unknown;
};

export type MissingContentField = { field: string; label: string };

const hasText = (value: unknown) => typeof value === 'string' && value.trim().length > 0;
const hasList = (value: unknown) => Array.isArray(value) && value.some(hasText);
const hasValue = (value: unknown) => hasText(value) || hasList(value) || (value !== null && typeof value === 'object' && Object.keys(value).length > 0);

const common = [
  ['title', '标题'],
  ['summary', '摘要'],
] as const;

const requirements: Record<ContentType, ReadonlyArray<readonly [string, string, 'text' | 'list' | 'value']>> = {
  AI_TOOL: [
    ['websiteUrl', '官网链接', 'text'], ['vendor', '提供方', 'text'],
    ['platforms', '适用平台', 'list'], ['scenarios', '适用场景', 'list'],
    ['usageGuide', '使用说明', 'text'], ['limitations', '限制与注意事项', 'text'], ['pricingModel', '收费方式', 'text'],
  ],
  DESIGN_ASSET: [
    ['assetType', '资产类型', 'text'], ['platforms', '适用平台', 'list'], ['scenarios', '适用场景', 'list'],
    ['unsuitableScenarios', '不适用场景', 'list'], ['problemStatement', '解决的问题', 'text'],
    ['usageGuide', '使用指引', 'text'], ['resourceLinks', '资源链接', 'list'],
  ],
  AI_SKILL: [
    ['goal', 'Skill 目标', 'text'], ['scenarios', '适用场景', 'list'], ['unsuitableScenarios', '不适用场景', 'list'],
    ['applicableRoles', '适用角色', 'list'], ['inputRequirements', '输入要求', 'text'], ['outputSchema', '输出结构', 'text'],
    ['promptTemplate', '核心 Prompt', 'text'], ['executionSteps', '执行步骤', 'text'], ['exampleInput', '示例输入', 'text'],
    ['exampleOutput', '示例输出', 'text'], ['humanReviewRules', '人工复核规则', 'text'], ['limitations', '已知限制', 'text'],
    ['recommendedModels', '推荐模型', 'list'], ['dataSecurityLevel', '数据安全等级', 'text'], ['promptVersion', 'Prompt 版本', 'text'],
  ],
  AI_CASE: [
    ['background', '案例背景', 'text'], ['originalProblem', '原始问题', 'text'], ['originalProcess', '原有流程', 'text'],
    ['aiIntervention', 'AI 介入节点', 'text'], ['aiResponsibilities', 'AI 完成内容', 'text'],
    ['humanResponsibilities', '设计师判断内容', 'text'], ['resultSummary', '最终结果', 'text'],
    ['beforeAfterComparison', '前后对比', 'text'], ['sampleSize', '样本范围', 'text'], ['validationMethod', '验证方式', 'text'],
    ['dataResult', '数据结果', 'text'], ['limitations', '局限性', 'text'], ['reusableConclusion', '可复用结论', 'text'],
  ],
  AI_PROJECT: [
    ['projectCode', '项目编号', 'text'], ['domain', '所属领域', 'text'], ['targetValue', '目标价值', 'text'],
    ['projectStage', '当前阶段', 'text'], ['priority', '优先级', 'text'], ['problemStatement', '问题陈述', 'text'],
    ['solutionHypothesis', '解决方案假设', 'text'], ['expectedOutcome', '预期效果', 'text'], ['riskLevel', '风险', 'text'],
    ['evaluationResult', '评估结论', 'text'],
  ],
};

export function missingContentFields(snapshot: Snapshot): MissingContentField[] {
  const body = snapshot.body && typeof snapshot.body === 'object' && !Array.isArray(snapshot.body)
    ? snapshot.body as Record<string, unknown>
    : {};
  const missing: MissingContentField[] = [];
  for (const [field, label] of common) if (!hasText(snapshot[field])) missing.push({ field, label });
  if (!snapshot.ownerId) missing.push({ field: 'ownerId', label: '负责人' });
  if (!snapshot.versionNumber) missing.push({ field: 'versionNumber', label: '版本号' });
  for (const [field, label, kind] of requirements[snapshot.contentType]) {
    const value = body[field];
    const valid = kind === 'text' ? hasText(value) : kind === 'list' ? hasList(value) : hasValue(value);
    if (!valid) missing.push({ field: `body.${field}`, label });
  }
  return missing;
}

export function assertContentComplete(snapshot: Snapshot) {
  const missingFields = missingContentFields(snapshot);
  if (missingFields.length) {
    throw new BadRequestException({
      code: 'CONTENT_INCOMPLETE',
      message: `内容尚不完整：${missingFields.map((item) => item.label).join('、')}`,
      missingFields,
    });
  }
}
