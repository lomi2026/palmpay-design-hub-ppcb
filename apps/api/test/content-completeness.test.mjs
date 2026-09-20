import assert from 'node:assert/strict';
import test from 'node:test';
import { missingContentFields } from '../dist/content/content-completeness.js';

const base = { title: '标题', summary: '摘要', ownerId: 'owner', versionNumber: 1 };
const fixtures = {
  AI_TOOL: { websiteUrl: 'https://example.test', vendor: 'Test', platforms: ['Web'], scenarios: ['Design'], usageGuide: 'Read guide', limitations: 'Review output', pricingModel: 'Free' },
  DESIGN_ASSET: { assetType: '规范', platforms: ['Web'], scenarios: ['设计'], unsuitableScenarios: ['开发规范'], problemStatement: '不一致', usageGuide: '按步骤使用', resourceLinks: ['https://example.com'] },
  AI_SKILL: { goal: '提升效率', scenarios: ['研究'], unsuitableScenarios: ['高风险决策'], applicableRoles: ['设计师'], inputRequirements: '研究目标', outputSchema: '结构化报告', promptTemplate: '分析以下材料', executionSteps: '准备、执行、复核', exampleInput: '访谈记录', exampleOutput: '洞察列表', humanReviewRules: '核实证据', limitations: '不能代替判断', recommendedModels: ['approved-model'], dataSecurityLevel: 'internal', promptVersion: '1.0' },
  AI_CASE: { background: '研究项目', originalProblem: '耗时', originalProcess: '人工整理', aiIntervention: '聚类阶段', aiResponsibilities: '初步聚类', humanResponsibilities: '核实结论', resultSummary: '周期缩短', beforeAfterComparison: '5 天到 2 天', sampleSize: '20 份访谈', validationMethod: '负责人复核', dataResult: '节省 60%', limitations: '小样本', reusableConclusion: '适合初步整理' },
  AI_PROJECT: { projectCode: 'P27', domain: '研究', targetValue: '提效', projectStage: 'EXPLORING', priority: 'high', problemStatement: '重复劳动', solutionHypothesis: 'AI 辅助', expectedOutcome: '周期降低', riskLevel: '数据风险需控制', evaluationResult: '进入试点评估' },
};

for (const [contentType, body] of Object.entries(fixtures)) {
  test(`${contentType} complete snapshot passes`, () => {
    assert.deepEqual(missingContentFields({ ...base, contentType, body }), []);
  });
  test(`${contentType} reports a specific missing body field`, () => {
    const first = Object.keys(body)[0];
    assert.ok(missingContentFields({ ...base, contentType, body: { ...body, [first]: '' } }).some((item) => item.field === `body.${first}`));
  });
}
