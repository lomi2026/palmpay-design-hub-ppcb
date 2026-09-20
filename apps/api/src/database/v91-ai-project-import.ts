import { PrismaClient } from '../generated/prisma/client';
import {
  AIProjectStage,
  ContentStatus,
  ContentType,
  ContentVisibility,
  Priority,
  VerificationStatus,
  UserStatus,
} from '../generated/prisma/enums';

const organizationCode = process.env.DEFAULT_ORGANIZATION_CODE ?? 'palmpay-experience-design';
const ownerEmail = process.env.V91_PROJECT_OWNER_EMAIL ?? 'lomi2026@126.com';
const teamCode = 'palmpay-experience-design';
const teamName = 'PalmPay Experience Design';
const baselineUrl = 'https://lomi2026.github.io/palmpay-design-intelligence/';
const sourceCommit = 'bf39748e99540b6e87ac1479954b96f44bac771b';

type LegacyProject = {
  code: string;
  title: string;
  description: string;
  category: string;
  value: string;
  stage: '探索方案' | '可立项';
  owner: string;
  file: string;
  nextStep: string;
  priorityRank?: number;
  priorityReason?: string;
  impact?: string;
  effort?: string;
  readiness?: string;
};

// Snapshot extracted from the deployed final v9-1 source at commit bf39748.
const projects: readonly LegacyProject[] = [
  { code: 'S01', title: '体验设计团队北极星指标对焦板', description: '统一团队的业务价值、体验结果和组织能力指标。', category: '战略与组织', value: '提升组织能力', stage: '探索方案', owner: '设计管理 / Design Ops', file: '01_体验设计团队北极星指标对焦板.html', nextStep: '与业务负责人对齐 3 个北极星维度，选取一个季度项目回填基线数据。' },
  { code: 'S02', title: '设计团队升级为体验增长部门', description: '从需求交付升级为持续发现机会并推动业务结果。', category: '战略与组织', value: '提升组织能力', stage: '探索方案', owner: '设计管理 / Design Ops', file: '02_设计团队升级为体验增长部门.html', nextStep: '选择一条关键业务旅程，明确设计团队从需求交付到增长共创的职责边界。' },
  { code: 'S03', title: '把设计指标与业务指标绑定', description: '建立业务结果、体验结果与设计过程的三级指标体系。', category: '战略与组织', value: '提升组织能力', stage: '探索方案', owner: '设计管理 / Design Ops', file: '10_把设计指标与业务指标绑定.html', nextStep: '选择一个已上线项目，补齐业务、体验和设计过程三级指标并验证关联性。' },
  { code: 'S04', title: '设计团队组织如何调整', description: '重构负责人、核心旅程、增长、AI 与平台能力角色。', category: '战略与组织', value: '提升组织能力', stage: '探索方案', owner: '设计管理 / Design Ops', file: '11_设计团队组织如何调整.html', nextStep: '盘点现有角色与关键旅程，确定负责人、增长、AI 和平台能力的最小编组。' },
  { code: 'S05', title: '90 天执行计划', description: '通过试点完成基础建设、结果验证、标准化与复制。', category: '战略与组织', value: '提升组织能力', stage: '可立项', owner: '设计管理 / Design Ops', file: '12_90天执行计划.html', nextStep: '确认首批 3 个试点项目、负责人和 30 / 60 / 90 天验收节点。' },
  { code: 'S06', title: '设计团队固定周运行机制', description: '将问题评审、方案实验、跨职能决策和资产沉淀固定化。', category: '战略与组织', value: '提升组织能力', stage: '探索方案', owner: '设计管理 / Design Ops', file: '13_设计团队固定周运行机制.html', nextStep: '用一个真实项目试运行周一问题评审、周三实验决策、周五资产沉淀节奏。' },
  { code: 'S07', title: '设计团队 AI 转型组织与运行机制', description: '建立围绕业务结果、AI 能力和组织资产的长期运行模型。', category: '战略与组织', value: '提升组织能力', stage: '探索方案', owner: '设计管理 / Design Ops', file: '07_设计团队AI转型组织与运行机制.html', nextStep: '完成团队 AI 能力盘点，选定一个高频任务作为首个组织级工作流试点。' },
  { code: 'P01', title: 'AI 需求分析与体验策略中心', description: '统一吸收项目上下文，自动生成设计分析与体验策略。', category: '设计生产', value: '提升效率', stage: '可立项', owner: '体验设计 / 产品', file: '08_AI需求分析与体验策略中心.html', nextStep: '选取一个真实 PRD，验证策略产出质量、覆盖率与节省时长。', priorityRank: 1, priorityReason: '输入与输出边界清晰，可直接复用现有 PRD，最快形成团队级效率样板。', impact: '高', effort: '中', readiness: '高' },
  { code: 'P02', title: 'AI 用户反馈与机会发现系统', description: '将分散反馈转化为结构化、可排序、可行动的机会池。', category: '设计生产', value: '提升组织能力', stage: '可立项', owner: '体验设计 / 产品', file: '09_AI用户反馈与机会发现系统.html', nextStep: '汇总近 30 天客服、访谈和运营反馈，验证机会聚类与优先级排序准确性。', priorityRank: 6, priorityReason: '反馈数据分散但可快速汇总，能形成持续机会发现能力。', impact: '中', effort: '中', readiness: '中' },
  { code: 'P03', title: 'AI 设计系统与设计开发一体化', description: '连接规范、组件、Token、代码与 AI 生产流程。', category: '设计生产', value: '提升效率', stage: '探索方案', owner: '体验设计 / 产品', file: '03_AI设计系统与设计开发一体化.html', nextStep: '选择一个高频组件，打通 Token、Figma、代码和 AI 生成的最小闭环。' },
  { code: 'P04', title: 'AI 产品质量门禁', description: '建立需求、设计、开发和上线前后的自动化质量控制。', category: '设计生产', value: '提升质量', stage: '可立项', owner: '体验设计 / 产品', file: '04_AI产品质量门禁.html', nextStep: '选择一个即将上线项目，建立需求、设计、开发三阶段质量门禁并回测问题召回率。', priorityRank: 2, priorityReason: '质量问题成本可量化，适合在上线前流程中建立明确门禁。', impact: '高', effort: '中', readiness: '高' },
  { code: 'P05', title: '体验增长实验工厂', description: '将用户问题持续转化为可验证、可复盘的增长实验。', category: '设计生产', value: '提升效率', stage: '探索方案', owner: '体验设计 / 产品', file: '05_体验增长实验工厂.html', nextStep: '围绕一个核心漏斗建立问题—假设—实验—复盘的两周试运行机制。' },
  { code: 'P06', title: '产品内 AI 体验升级', description: '把 AI 嵌入关键任务，提升效率、成功率和可解释性。', category: '设计生产', value: '提升效率', stage: '探索方案', owner: '体验设计 / 产品', file: '06_产品内AI体验升级.html', nextStep: '选择一个高频任务，将 AI 建议嵌入流程并验证完成时长、成功率和可解释性。' },
  { code: 'P15', title: 'AI PRD 风险扫描器', description: '在设计启动前识别规则、状态、权限、数据和异常流程风险。', category: '设计生产', value: '提升质量', stage: '可立项', owner: '体验设计 / 产品', file: '22_项目十五_AI_PRD风险扫描器.html', nextStep: '选取 3 份已完成 PRD，回测规则、状态、权限和异常流程的召回率与误报率。', priorityRank: 3, priorityReason: '可利用历史 PRD 回测，低风险验证规则召回率与误报率。', impact: '高', effort: '低', readiness: '高' },
  { code: 'P16', title: 'AI 体验债务管理系统', description: '持续识别、分级和关闭历史体验问题与一致性债务。', category: '设计生产', value: '提升质量', stage: '探索方案', owner: '体验设计 / 产品', file: '23_项目十六_AI体验债务管理系统.html', nextStep: '从现有产品中收集 20 个体验债务，完成分级、归因和关闭优先级试算。' },
  { code: 'P17', title: 'AI 竞品与行业变化雷达', description: '持续追踪竞品、行业、合规和设计趋势，发现有效机会。', category: '设计生产', value: '提升组织能力', stage: '探索方案', owner: '体验设计 / 产品', file: '24_项目十七_AI竞品与行业变化雷达.html', nextStep: '定义 5 个核心竞品与 3 类行业信号，运行两周并评估机会发现质量。' },
  { code: 'P18', title: 'AI 用户研究助手', description: '覆盖研究前、中、后的计划、记录、聚类与洞察生产。', category: '设计生产', value: '提升组织能力', stage: '探索方案', owner: '体验设计 / 产品', file: '25_项目十八_AI用户研究助手.html', nextStep: '用一次真实访谈验证研究计划、转录、聚类和洞察摘要的端到端效率。' },
  { code: 'P19', title: 'AI 页面状态生成器', description: '根据 PRD 和页面结构自动补齐组件与业务状态矩阵。', category: '设计生产', value: '提升质量', stage: '探索方案', owner: '体验设计 / 产品', file: '26_项目十九_AI页面状态生成器.html', nextStep: '选择一个复杂表单页面，自动生成空、错、加载、权限和边界状态并与人工结果对比。' },
  { code: 'P20', title: 'AI 原型批量生成工作流', description: '先生成结构、信息架构、状态和多方案低保真原型。', category: '设计生产', value: '提升效率', stage: '探索方案', owner: '体验设计 / 产品', file: '27_项目二十_AI原型批量生成工作流.html', nextStep: '选取一个新功能，用同一需求批量生成 3 套低保真方案并评估可用性。' },
  { code: 'P21', title: 'AI 文案与内容治理中心', description: '统一产品术语、状态文案、错误提示和多语言内容规则。', category: '设计生产', value: '提升质量', stage: '探索方案', owner: '体验设计 / 产品', file: '28_项目二十一_AI文案与内容治理中心.html', nextStep: '从错误提示和高风险操作文案入手，建立首批术语与状态文案规则库。' },
  { code: 'P07', title: 'AI 核心漏斗诊断中心', description: '定位核心流程最大流失步骤、失败原因和优化实验。', category: '增长与运营', value: '提升增长', stage: '探索方案', owner: '体验设计 / 产品', file: '14_项目七_AI核心漏斗诊断中心.html', nextStep: '选择一个关键漏斗，接入事件数据并验证流失定位与实验建议的准确性。' },
  { code: 'P08', title: 'AI 新用户激活助手', description: '基于用户状态推荐最有价值的下一步行动。', category: '增长与运营', value: '提升增长', stage: '可立项', owner: '体验设计 / 产品', file: '15_项目八_AI新用户激活助手.html', nextStep: '选择注册完成但未完成认证的用户，验证任务推荐对认证完成率的提升。', priorityRank: 4, priorityReason: '激活链路数据基础较成熟，业务结果可通过转化率直接验证。', impact: '高', effort: '中', readiness: '中' },
  { code: 'P09', title: 'AI 功能渗透增长助手', description: '根据行为识别潜在需求，在合适时机推荐相关功能。', category: '增长与运营', value: '提升增长', stage: '探索方案', owner: '体验设计 / 产品', file: '16_项目九_AI功能渗透增长助手.html', nextStep: '选择一个低渗透高价值功能，验证行为触发推荐的点击率与使用转化。' },
  { code: 'P10', title: 'AI 流失用户召回分析', description: '识别流失原因、用户类型和可执行的召回策略。', category: '增长与运营', value: '提升增长', stage: '探索方案', owner: '体验设计 / 产品', file: '17_项目十_AI流失用户召回分析.html', nextStep: '抽取近 90 天流失用户，验证流失分群、原因解释和召回策略的可执行性。' },
  { code: 'P11', title: 'AI 客服问题产品化系统', description: '把高频咨询持续转化为产品、流程、文案和帮助内容优化。', category: '增长与运营', value: '提升增长', stage: '探索方案', owner: '体验设计 / 产品', file: '18_项目十一_AI客服问题产品化系统.html', nextStep: '分析近 30 天 Top 20 客服问题，形成产品、流程和帮助内容的改进清单。' },
  { code: 'P12', title: 'AI 运营工作台助手', description: '重构运营工作台的信息架构、任务优先级和风险提醒。', category: '增长与运营', value: '提升增长', stage: '探索方案', owner: '体验设计 / 产品', file: '19_项目十二_AI运营工作台助手.html', nextStep: '选择一个高频运营角色，重排任务优先级并验证处理时长与风险遗漏变化。' },
  { code: 'P13', title: 'AI 审核材料预检', description: '在用户提交前发现缺失、模糊、过期和字段冲突。', category: '增长与运营', value: '提升增长', stage: '探索方案', owner: '体验设计 / 产品', file: '20_项目十三_AI审核材料预检.html', nextStep: '以企业认证材料为样本，验证缺失、模糊、过期和字段冲突的预检准确率。' },
  { code: 'P14', title: 'AI 智能报表生成器', description: '自动生成交易、费用、风险和运营分析报告。', category: '增长与运营', value: '提升增长', stage: '探索方案', owner: '体验设计 / 产品', file: '21_项目十四_AI智能报表生成器.html', nextStep: '选择一份周度运营报表，验证数据归集、异常解释和结论生成的准确性。' },
  { code: 'P22', title: 'AI 多语言与本地化体验检查', description: '检查语言、格式、字段、金融术语、文化表达和 RTL 布局。', category: '风险与治理', value: '降低风险', stage: '探索方案', owner: '体验设计 / 风控合规', file: '29_项目二十二_AI多语言与本地化体验检查.html', nextStep: '选择英语、法语和阿拉伯语三个市场，检查金融术语、格式和 RTL 布局问题。' },
  { code: 'P23', title: 'AI 高风险操作体验审计', description: '审计资金、权限、安全和敏感操作的保护与可追溯性。', category: '风险与治理', value: '降低风险', stage: '可立项', owner: '体验设计 / 风控合规', file: '30_项目二十三_AI高风险操作体验审计.html', nextStep: '先覆盖退款、权限变更和收款账户修改，建立首批高风险操作审计规则。', priorityRank: 5, priorityReason: '高风险操作范围明确，合规与用户保护价值突出。', impact: '高', effort: '中', readiness: '中' },
  { code: 'P24', title: 'AI 合规规则体验转译器', description: '把专业规则转化为用户可理解、可准备、可执行的内容。', category: '风险与治理', value: '降低风险', stage: '探索方案', owner: '体验设计 / 风控合规', file: '31_项目二十四_AI合规规则体验转译器.html', nextStep: '选择一条复杂合规规则，将其转译为用户准备清单并进行可理解性测试。' },
  { code: 'P25', title: 'AI 设计决策知识库', description: '让关键决策可检索、可复用、可追溯并持续验证。', category: '风险与治理', value: '提升组织能力', stage: '探索方案', owner: '体验设计 / 风控合规', file: '32_项目二十五_AI设计决策知识库.html', nextStep: '整理 10 个已完成项目的关键设计决策，验证检索、复用和追溯效率。' },
  { code: 'P26', title: 'AI 团队能力诊断与培训系统', description: '基于真实项目识别能力短板并生成个性化成长计划。', category: '风险与治理', value: '提升组织能力', stage: '探索方案', owner: '体验设计 / 风控合规', file: '33_项目二十六_AI团队能力诊断与培训系统.html', nextStep: '基于 3 个真实项目完成团队能力诊断，生成个性化学习计划并验证改进。' },
];

const projectStage: Record<LegacyProject['stage'], AIProjectStage> = {
  探索方案: AIProjectStage.EXPLORING,
  可立项: AIProjectStage.READY,
};

const normalizedName = (name: string) => name.trim().toLocaleLowerCase('zh-CN');

export async function importV91AiProjects(prisma: PrismaClient) {
  const organization = await prisma.organization.findUnique({ where: { code: organizationCode } });
  if (!organization) throw new Error(`Organization not found: ${organizationCode}`);

  const owner = await prisma.user.upsert({
    where: { organizationId_email: { organizationId: organization.id, email: ownerEmail } },
    create: {
      organizationId: organization.id,
      email: ownerEmail,
      name: 'PalmPay PPCB Owner',
      employeeId: process.env.PPCB_OWNER_USER_ID ?? null,
      status: UserStatus.ACTIVE,
    },
    update: { status: UserStatus.ACTIVE, deletedAt: null },
  });

  const team = await prisma.team.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: teamCode } },
    create: {
      organizationId: organization.id,
      code: teamCode,
      name: teamName,
      ownerId: owner.id,
    },
    update: { ownerId: owner.id, status: 'ACTIVE' },
  });

  const category = await prisma.category.upsert({
    where: { organizationId_code: { organizationId: organization.id, code: 'ai-projects' } },
    create: {
      organizationId: organization.id,
      code: 'ai-projects',
      name: 'AI 项目库',
      contentTypes: [ContentType.AI_PROJECT],
    },
    update: { name: 'AI 项目库', contentTypes: [ContentType.AI_PROJECT] },
  });

  let created = 0;
  let skipped = 0;

  for (const project of projects) {
    const existing = await prisma.aIProjectDetail.findUnique({
      where: { projectCode: project.code },
      select: { contentId: true },
    });
    if (existing) {
      skipped += 1;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const slug = `ai-project-${project.code.toLowerCase()}`;
      const slugConflict = await tx.content.findUnique({ where: { slug }, select: { id: true } });
      if (slugConflict) {
        throw new Error(`Slug is already used by a non-project content record: ${slug}`);
      }

      const now = new Date();
      const body = {
        source: {
          baseline: 'deployed-v9-1',
          baselineUrl,
          sourceCommit,
          legacyProjectFile: project.file,
          legacyProjectUrl: `${baselineUrl}projects/project-detail.html?id=${project.code}`,
          legacyOwnerLabel: project.owner,
        },
        nextStep: project.nextStep,
        prioritization: {
          rank: project.priorityRank ?? null,
          reason: project.priorityReason ?? null,
          impact: project.impact ?? null,
          effort: project.effort ?? null,
          readiness: project.readiness ?? null,
        },
      };

      const content = await tx.content.create({
        data: {
          organizationId: organization.id,
          contentType: ContentType.AI_PROJECT,
          title: project.title,
          slug,
          summary: project.description,
          categoryId: category.id,
          ownerId: owner.id,
          teamId: team.id,
          createdById: owner.id,
          status: ContentStatus.PUBLISHED,
          visibility: ContentVisibility.ORGANIZATION,
          verificationStatus: VerificationStatus.UNVERIFIED,
          publishedAt: now,
        },
      });

      const version = await tx.contentVersion.create({
        data: {
          contentId: content.id,
          versionNumber: 1,
          versionLabel: 'v9-1 imported',
          versionStatus: ContentStatus.PUBLISHED,
          title: project.title,
          summary: project.description,
          body,
          changeSummary: 'Imported from the approved deployed v9-1 AI project library.',
          createdById: owner.id,
          publishedAt: now,
        },
      });

      await tx.content.update({
        where: { id: content.id },
        data: { currentVersionId: version.id },
      });

      await tx.aIProjectDetail.create({
        data: {
          contentId: content.id,
          projectCode: project.code,
          domain: project.category,
          targetValue: project.value,
          projectStage: projectStage[project.stage],
          priority: Priority.MEDIUM,
          problemStatement: project.description,
          evaluationResult: {
            importedFrom: 'v9-1',
            legacyOwnerLabel: project.owner,
            priorityRank: project.priorityRank ?? null,
            priorityReason: project.priorityReason ?? null,
            impact: project.impact ?? null,
            effort: project.effort ?? null,
            readiness: project.readiness ?? null,
          },
        },
      });

      const tagNames = [`领域：${project.category}`, `目标：${project.value}`];
      const tagIds = await Promise.all(
        tagNames.map(async (name) => {
          const tag = await tx.tag.upsert({
            where: { organizationId_normalizedName: { organizationId: organization.id, normalizedName: normalizedName(name) } },
            create: { organizationId: organization.id, name, normalizedName: normalizedName(name) },
            update: { name },
          });
          return tag.id;
        }),
      );
      await tx.contentTag.createMany({
        data: tagIds.map((tagId) => ({ contentId: content.id, tagId, createdById: owner.id })),
        skipDuplicates: true,
      });
    });

    created += 1;
  }

  return { team: team.name, owner: owner.email, created, skipped, total: projects.length };
}
