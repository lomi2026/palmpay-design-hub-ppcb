import 'dotenv/config';
import { createDatabaseAdapter } from '../src/database/connection';
import { PrismaClient } from '../src/generated/prisma/client';
import {
  ContentStatus,
  ContentType,
  ContentVisibility,
  DataSecurityLevel,
  VerificationStatus,
} from '../src/generated/prisma/enums';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required to import the v9-1 AI catalog.');

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(connectionString) });
const organizationCode = process.env.DEFAULT_ORGANIZATION_CODE ?? 'palmpay-experience-design';
const ownerEmail = process.env.V91_PROJECT_OWNER_EMAIL ?? 'lomi2026@126.com';
const teamCode = 'palmpay-experience-design';
const baselineUrl = 'https://lomi2026.github.io/palmpay-design-intelligence/';
const sourceCommit = 'bf39748e99540b6e87ac1479954b96f44bac771b';

type LegacySkill = {
  id: string;
  title: string;
  category: string;
  role: string;
  usage: number;
  updated: string;
  description: string;
  input: string;
  output: string;
  prompt: string;
  duration: string;
  complexity: string;
  model: string;
  verified: string;
  featured?: boolean;
};

type LegacyCase = {
  id: string;
  title: string;
  category: string;
  status: string;
  metric: string;
  description: string;
  background: string;
  ai: string;
  human: string;
  result: string;
  before: string;
  after: string;
  sample: string;
  validation: string;
  phase: string;
};

// Snapshot extracted from the approved deployed v9-1 workspace source at bf39748.
const skills: readonly LegacySkill[] = [
  { id: 's1', title: 'PRD 设计分析', category: '需求分析', role: '产品设计师', usage: 482, updated: '07-08', description: '将PRD转化为核心路径、信息架构、页面模块、状态与待确认问题。', input: '完整PRD、业务背景和约束', output: '结构化设计分析与页面方案', prompt: '你是一名资深体验设计专家。请基于以下PRD输出用户核心路径、信息架构、页面模块、状态、关键交互、用户困惑点和待确认问题。区分事实、假设与待确认信息。', duration: '8–12 min', complexity: '中等', model: 'GPT-5.6', verified: '2026-07-08', featured: false },
  { id: 's2', title: 'UI 设计还原度验收', category: '质量验收', role: 'UI设计师', usage: 417, updated: '07-07', description: '对比设计稿和开发截图，识别视觉样式偏差并输出修改建议。', input: '设计稿截图、开发实现截图', output: '问题分级、偏差估算、修改建议', prompt: '请按区域检查布局、间距、字号、颜色、圆角、阴影、图标、对齐和组件状态，并输出严重程度、位置、差异、偏差与修改建议。', duration: '5–10 min', complexity: '低', model: 'GPT-5.6', verified: '2026-07-07', featured: false },
  { id: 's3', title: '竞品体验研究', category: '研究策略', role: '体验研究/设计', usage: 356, updated: '07-05', description: '用统一任务和证据框架分析竞品流程、体验与机会点。', input: '业务目标、竞品名单、关键任务', output: '竞品矩阵、洞察与策略建议', prompt: '定义研究目标、目标用户和关键任务，再从信息架构、流程效率、反馈、信任、异常处理和本地化维度横向分析。', duration: '20–35 min', complexity: '高', model: 'GPT-5.6', verified: '2026-07-05' },
  { id: 's4', title: '用户访谈总结', category: '用户研究', role: '用研/产品设计', usage: 298, updated: '07-02', description: '从访谈材料提炼主题、证据、用户需求、矛盾与机会。', input: '访谈逐字稿或会议记录', output: '主题分析、引语证据、洞察和机会', prompt: '按照研究问题、受访者背景、关键行为、痛点、目标、替代方案、信任因素、原话证据和设计机会输出。', duration: '12–20 min', complexity: '中等', model: 'GPT-5.6', verified: '2026-07-02' },
  { id: 's5', title: '移动端适配方案生成', category: '方案设计', role: '产品/UI设计师', usage: 265, updated: '06-29', description: '将Web页面按移动端核心任务重新组织，而非简单缩放。', input: 'Web页面截图、业务优先级、目标设备', output: '问题分析、适配策略和页面结构', prompt: '识别桌面端信息架构、核心任务、次要内容和高风险交互，再给出移动端内容优先级、布局重组和断点方案。', duration: '10–18 min', complexity: '中等', model: 'GPT-5.6', verified: '2026-06-29' },
  { id: 's6', title: '体验优化专项方案', category: '方案设计', role: '体验设计专家', usage: 244, updated: '06-26', description: '从业务问题和用户证据形成可执行的体验优化专项。', input: '业务背景、数据、反馈和现状', output: '问题树、策略、行动、指标与节奏', prompt: '输出问题定义、证据、目标用户、问题树、设计原则、策略、具体事项、负责人、依赖、优先级和验证指标。', duration: '15–25 min', complexity: '高', model: 'GPT-5.6', verified: '2026-06-26' },
];

const cases: readonly LegacyCase[] = [
  { id: 'c1', title: 'AI辅助 UI 还原度验收', category: '质量效率', status: '已验证', metric: '准备时间 -74%', description: '通过设计稿与开发截图对比，自动整理视觉差异，再由设计师复核优先级。', background: '原流程需要设计师逐页面人工对比并手工整理问题。', ai: '识别布局、间距、字号、颜色、圆角、阴影与组件状态差异。', human: '判断业务影响、问题优先级及最终验收结论。', result: '减少信息整理时间，让设计师聚焦高风险问题。', before: '平均 3.2 小时', after: '平均 50 分钟', sample: '8 个 Web 项目', validation: '设计负责人复核', phase: '已验证' },
  { id: 'c2', title: 'PRD 到设计方案自动分析', category: '方案效率', status: '试运行', metric: '需求缺口 +31%', description: '将需求文档快速转为路径、模块、状态和待确认问题。', background: '需求启动时信息分散，设计师需要多轮整理。', ai: '提取目标、角色、任务、页面模块、字段与规则冲突。', human: '确认业务事实、设计策略和最终页面方案。', result: '更早暴露需求缺口，减少进入高保真后的返工。', before: '依赖个人经验', after: '统一 10 项输出', sample: '6 个需求试点', validation: 'PM / Design 双审', phase: '内部试运行' },
  { id: 'c3', title: 'Web 页面移动端适配', category: '多端体验', status: '试点', metric: '方案返工 -38%', description: '先识别核心任务与信息层级，再生成移动端重组策略。', background: 'Web页面直接压缩后，表格、筛选和操作难以使用。', ai: '分析页面模块、信息优先级、断点和交互替代方式。', human: '决定核心任务、业务取舍和最终视觉方案。', result: '让移动端适配从视觉缩放升级为任务重组。', before: '直接缩放页面', after: '按任务重构', sample: '3 个核心页面', validation: '可用性走查', phase: '小范围试点' },
  { id: 'c4', title: '竞品体验研究自动化', category: '研究效率', status: '探索中', metric: '证据完整度 +42%', description: '使用统一任务和维度采集竞品信息，生成横向对比和初步洞察。', background: '不同设计师完成的竞品研究质量差异较大。', ai: '整理公开资料、页面结构、流程步骤与对比矩阵。', human: '验证来源、完成真实体验、判断机会和业务适配性。', result: '提高研究材料的一致性和可追溯性。', before: '输出结构不统一', after: '证据链标准化', sample: '4 个竞品研究', validation: '研究负责人抽检', phase: '探索中' },
];

const normalize = (value: string) => value.trim().toLocaleLowerCase('zh-CN');
const slugify = (type: 'skill' | 'case', id: string) => `ai-${type}-${id.toLowerCase()}`;

function caseVerification(status: string): VerificationStatus {
  if (status === '已验证') return VerificationStatus.VERIFIED;
  if (status === '试点') return VerificationStatus.PILOT;
  if (status === '试运行') return VerificationStatus.INTERNAL_TRIAL;
  return VerificationStatus.UNVERIFIED;
}

async function main() {
  const organization = await prisma.organization.findUnique({ where: { code: organizationCode } });
  if (!organization) throw new Error(`Organization not found: ${organizationCode}`);
  const owner = await prisma.user.findUnique({ where: { organizationId_email: { organizationId: organization.id, email: ownerEmail } } });
  if (!owner) throw new Error(`Configured migration owner not found: ${ownerEmail}`);
  const team = await prisma.team.findUnique({ where: { organizationId_code: { organizationId: organization.id, code: teamCode } } });
  if (!team) throw new Error(`Team not found: ${teamCode}. Run the AI project import first.`);

  const [skillCategory, caseCategory] = await Promise.all([
    prisma.category.upsert({
      where: { organizationId_code: { organizationId: organization.id, code: 'ai-skills' } },
      create: { organizationId: organization.id, code: 'ai-skills', name: 'AI Skill', contentTypes: [ContentType.AI_SKILL] },
      update: { name: 'AI Skill', contentTypes: [ContentType.AI_SKILL] },
    }),
    prisma.category.upsert({
      where: { organizationId_code: { organizationId: organization.id, code: 'ai-cases' } },
      create: { organizationId: organization.id, code: 'ai-cases', name: 'AI 案例', contentTypes: [ContentType.AI_CASE] },
      update: { name: 'AI 案例', contentTypes: [ContentType.AI_CASE] },
    }),
  ]);

  let skillsCreated = 0;
  let skillsSkipped = 0;
  for (const skill of skills) {
    const slug = slugify('skill', skill.id);
    const existing = await prisma.content.findUnique({ where: { slug }, select: { id: true } });
    if (existing) { skillsSkipped += 1; continue; }
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      const content = await tx.content.create({
        data: { organizationId: organization.id, contentType: ContentType.AI_SKILL, title: skill.title, slug, summary: skill.description, categoryId: skillCategory.id, ownerId: owner.id, teamId: team.id, createdById: owner.id, status: ContentStatus.PUBLISHED, visibility: ContentVisibility.ORGANIZATION, verificationStatus: VerificationStatus.UNVERIFIED, publishedAt: now },
      });
      const version = await tx.contentVersion.create({
        data: { contentId: content.id, versionNumber: 1, versionLabel: 'v9-1 imported', versionStatus: ContentStatus.PUBLISHED, title: skill.title, summary: skill.description, body: { source: { baseline: 'deployed-v9-1', baselineUrl, sourceCommit, legacyId: skill.id }, usageCount: skill.usage, updatedLabel: skill.updated, duration: skill.duration, complexity: skill.complexity, verifiedLabel: skill.verified, featured: skill.featured ?? false }, changeSummary: 'Imported from the approved deployed v9-1 AI Skill library.', createdById: owner.id, publishedAt: now },
      });
      await tx.content.update({ where: { id: content.id }, data: { currentVersionId: version.id } });
      await tx.skillDetail.create({
        data: { contentId: content.id, applicableRoles: skill.role.split('/'), inputRequirements: { description: skill.input }, outputSchema: { description: skill.output }, promptTemplate: skill.prompt, executionSteps: { duration: skill.duration, complexity: skill.complexity }, humanReviewRules: { required: true, note: 'Imported v9-1 Skill requires human review before use.' }, recommendedModels: [skill.model], dataSecurityLevel: DataSecurityLevel.INTERNAL, promptVersion: 'v9-1 imported', onlineExecutable: false },
      });
      const tag = await tx.tag.upsert({ where: { organizationId_normalizedName: { organizationId: organization.id, normalizedName: normalize(`领域：${skill.category}`) } }, create: { organizationId: organization.id, name: `领域：${skill.category}`, normalizedName: normalize(`领域：${skill.category}`) }, update: { name: `领域：${skill.category}` } });
      await tx.contentTag.create({ data: { contentId: content.id, tagId: tag.id, createdById: owner.id } });
    });
    skillsCreated += 1;
  }

  let casesCreated = 0;
  let casesSkipped = 0;
  for (const item of cases) {
    const slug = slugify('case', item.id);
    const existing = await prisma.content.findUnique({ where: { slug }, select: { id: true } });
    if (existing) { casesSkipped += 1; continue; }
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      const content = await tx.content.create({
        data: { organizationId: organization.id, contentType: ContentType.AI_CASE, title: item.title, slug, summary: item.description, categoryId: caseCategory.id, ownerId: owner.id, teamId: team.id, createdById: owner.id, status: ContentStatus.PUBLISHED, visibility: ContentVisibility.ORGANIZATION, verificationStatus: caseVerification(item.status), publishedAt: now },
      });
      const version = await tx.contentVersion.create({
        data: { contentId: content.id, versionNumber: 1, versionLabel: 'v9-1 imported', versionStatus: ContentStatus.PUBLISHED, title: item.title, summary: item.description, body: { source: { baseline: 'deployed-v9-1', baselineUrl, sourceCommit, legacyId: item.id }, metric: item.metric, statusLabel: item.status, before: item.before, after: item.after, sample: item.sample, validation: item.validation, phase: item.phase }, changeSummary: 'Imported from the approved deployed v9-1 AI case library.', createdById: owner.id, publishedAt: now },
      });
      await tx.content.update({ where: { id: content.id }, data: { currentVersionId: version.id } });
      await tx.caseDetail.create({
        data: { contentId: content.id, background: item.background, originalProcess: item.before, aiResponsibilities: item.ai, humanResponsibilities: item.human, resultSummary: item.result, metricName: item.metric, validationMethod: item.validation },
      });
      const tag = await tx.tag.upsert({ where: { organizationId_normalizedName: { organizationId: organization.id, normalizedName: normalize(`领域：${item.category}`) } }, create: { organizationId: organization.id, name: `领域：${item.category}`, normalizedName: normalize(`领域：${item.category}`) }, update: { name: `领域：${item.category}` } });
      await tx.contentTag.create({ data: { contentId: content.id, tagId: tag.id, createdById: owner.id } });
    });
    casesCreated += 1;
  }

  console.log(JSON.stringify({ skills: { created: skillsCreated, skipped: skillsSkipped, total: skills.length }, cases: { created: casesCreated, skipped: casesSkipped, total: cases.length } }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
