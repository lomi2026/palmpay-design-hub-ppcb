import 'dotenv/config';
import { createDatabaseAdapter } from '../src/database/connection';
import { PrismaClient } from '../src/generated/prisma/client';
import {
  ContentStatus,
  ContentType,
  ContentVisibility,
  VerificationStatus,
} from '../src/generated/prisma/enums';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('DATABASE_URL is required to import the v9-1 design assets.');

const prisma = new PrismaClient({ adapter: createDatabaseAdapter(connectionString) });
const organizationCode = process.env.DEFAULT_ORGANIZATION_CODE ?? 'palmpay-experience-design';
const ownerEmail = process.env.V91_PROJECT_OWNER_EMAIL ?? 'lomi2026@126.com';
const teamCode = 'palmpay-experience-design';
const baselineUrl = 'https://lomi2026.github.io/palmpay-design-intelligence/';
const sourceCommit = 'bf39748e99540b6e87ac1479954b96f44bac771b';

type LegacyAsset = {
  id: string;
  title: string;
  category: string;
  scene: string;
  platform: string;
  owner: string;
  date: string;
  version: string;
  views: number;
  favorites: number;
  description: string;
  problem: string;
  fit: string;
  usage: string;
  tags: readonly string[];
  status: string;
  cover: string;
};

// Snapshot extracted from the approved deployed v9-1 workspace source at bf39748.
const assets: readonly LegacyAsset[] = [
  { id: 'a1', title: 'Web 数据表格组件规范', category: '组件与模式', scene: '交易管理', platform: 'Web', owner: 'Design System', date: '2026-07-08', version: 'v2.3', views: 328, favorites: 42, description: '统一复杂业务表格的布局、字段、筛选、状态与批量操作规则。', problem: '不同业务模块的表格密度、字段排序和操作方式不一致。', fit: '交易、结算、商户和风控等复杂数据列表。', usage: '根据业务复杂度选择标准、紧凑或可编辑模式。', tags: ['高复用', '核心资产'], status: '已验证', cover: 'table' },
  { id: 'a2', title: '金额输入与货币格式规范', category: '组件与模式', scene: '支付与换汇', platform: '全平台', owner: 'Payments UX', date: '2026-07-06', version: 'v1.8', views: 286, favorites: 38, description: '覆盖千分符、小数位、币种、错误校验与非洲市场金额输入规则。', problem: '金额输入规则在不同产品和终端之间不一致。', fit: '支付、收款、退款、换汇和结算场景。', usage: '根据币种与业务类型使用对应格式。', tags: ['金融核心', '区域规则'], status: '正式发布', cover: 'amount' },
  { id: 'a3', title: '交易列表页面模板', category: '页面模板', scene: '交易管理', platform: 'Web', owner: 'Merchant UX', date: '2026-07-05', version: 'v1.4', views: 241, favorites: 31, description: '包含数据概览、筛选、表格、批量操作与导出的完整页面模板。', problem: '交易类页面重复搭建，页面骨架和交互策略不统一。', fit: '收单、转账、换汇和结算交易列表。', usage: '复制页面模板并替换业务字段。', tags: ['页面模板', '可复制'], status: '正式发布', cover: 'desktop' },
  { id: 'a4', title: '移动端交易详情模板', category: '页面模板', scene: '交易管理', platform: 'Mobile', owner: 'Mobile UX', date: '2026-07-02', version: 'v1.1', views: 198, favorites: 29, description: '面向移动端查看、分享和处理交易详情的模块化模板。', problem: 'Web详情页直接缩放到移动端，信息层级不足。', fit: '移动端交易、订单和结算详情。', usage: '保留1—2个主操作，其余收纳到更多菜单。', tags: ['移动端', '任务重组'], status: '试运行', cover: 'mobile' },
  { id: 'a5', title: '表单校验与错误反馈规范', category: '设计系统', scene: '账户与配置', platform: '全平台', owner: 'Design System', date: '2026-06-29', version: 'v2.0', views: 354, favorites: 48, description: '定义必填、格式、异步校验、跨字段错误和全局反馈规则。', problem: '同类错误采用不同触发时机和提示方式。', fit: '注册、登录、配置和交易表单。', usage: '优先在字段级解决问题。', tags: ['基础规范', '高复用'], status: '已验证', cover: 'form' },
  { id: 'a6', title: '设计评审检查清单', category: '交付与验收', scene: '设计交付', platform: '全平台', owner: 'Design Ops', date: '2026-06-26', version: 'v1.6', views: 206, favorites: 26, description: '覆盖业务目标、核心路径、异常状态、规范一致性和可实现性。', problem: '设计评审依赖个人经验，常遗漏状态与权限问题。', fit: '设计评审、交付前自检与跨团队评审。', usage: '评审前由主设计师完成自检。', tags: ['评审', '质量门槛'], status: '已验证', cover: 'checklist' },
  { id: 'a7', title: '非洲金融产品体验研究', category: '研究与策略', scene: '市场研究', platform: '全平台', owner: 'UX Research', date: '2026-06-22', version: 'v1.2', views: 174, favorites: 22, description: '整理尼日利亚等市场的设备、网络、支付习惯与信任要素。', problem: '产品方案容易沿用中国或欧美市场习惯。', fit: '非洲市场新业务、移动端与金融产品规划。', usage: '在方案早期作为假设输入。', tags: ['用研', '区域市场'], status: '待复审', cover: 'research' },
  { id: 'a8', title: 'UI还原度验收标准', category: '交付与验收', scene: '设计走查', platform: '全平台', owner: 'Design QA', date: '2026-06-18', version: 'v1.9', views: 311, favorites: 44, description: '定义布局、间距、字号、颜色、圆角和组件状态的验收标准。', problem: '设计稿与开发实现偏差缺少统一分级。', fit: 'Web和移动端上线前视觉走查。', usage: '先自动识别，再由设计师确认优先级。', tags: ['设计质量', 'AI辅助'], status: '已验证', cover: 'compare' },
];

const normalize = (value: string) => value.trim().toLocaleLowerCase('zh-CN');
const categoryCode = (name: string) => `v9-1-design-asset-${name.replaceAll(/[^a-zA-Z0-9\u4e00-\u9fff]+/g, '-').toLocaleLowerCase('zh-CN')}`;
const slugify = (id: string) => `design-asset-${id}`;

function verificationStatus(status: string): VerificationStatus {
  if (status === '已验证') return VerificationStatus.VERIFIED;
  if (status === '试运行') return VerificationStatus.INTERNAL_TRIAL;
  return VerificationStatus.UNVERIFIED;
}

async function main() {
  const organization = await prisma.organization.findUnique({ where: { code: organizationCode } });
  if (!organization) throw new Error(`Organization not found: ${organizationCode}`);
  const owner = await prisma.user.findUnique({ where: { organizationId_email: { organizationId: organization.id, email: ownerEmail } } });
  if (!owner) throw new Error(`Configured migration owner not found: ${ownerEmail}`);
  const team = await prisma.team.findUnique({ where: { organizationId_code: { organizationId: organization.id, code: teamCode } } });
  if (!team) throw new Error(`Team not found: ${teamCode}. Run the v9-1 project import first.`);

  let created = 0;
  let skipped = 0;
  for (const asset of assets) {
    const slug = slugify(asset.id);
    const existing = await prisma.content.findUnique({ where: { slug }, select: { id: true } });
    if (existing) {
      skipped += 1;
      continue;
    }
    const category = await prisma.category.upsert({
      where: { organizationId_code: { organizationId: organization.id, code: categoryCode(asset.category) } },
      create: { organizationId: organization.id, code: categoryCode(asset.category), name: asset.category, contentTypes: [ContentType.DESIGN_ASSET] },
      update: { name: asset.category, contentTypes: [ContentType.DESIGN_ASSET] },
    });
    const publishedAt = new Date(`${asset.date}T00:00:00.000Z`);
    await prisma.$transaction(async (tx) => {
      const content = await tx.content.create({
        data: {
          organizationId: organization.id,
          contentType: ContentType.DESIGN_ASSET,
          title: asset.title,
          slug,
          summary: asset.description,
          categoryId: category.id,
          ownerId: owner.id,
          teamId: team.id,
          createdById: owner.id,
          status: ContentStatus.PUBLISHED,
          visibility: ContentVisibility.ORGANIZATION,
          verificationStatus: verificationStatus(asset.status),
          publishedAt,
        },
      });
      const version = await tx.contentVersion.create({
        data: {
          contentId: content.id,
          versionNumber: 1,
          versionLabel: asset.version,
          versionStatus: ContentStatus.PUBLISHED,
          title: asset.title,
          summary: asset.description,
          body: {
            source: { baseline: 'deployed-v9-1', baselineUrl, sourceCommit, legacyId: asset.id },
            legacy: { owner: asset.owner, date: asset.date, version: asset.version, views: asset.views, favorites: asset.favorites, statusLabel: asset.status, cover: asset.cover },
            problem: asset.problem,
            fit: asset.fit,
            usage: asset.usage,
          },
          changeSummary: 'Imported from the approved deployed v9-1 design asset library.',
          createdById: owner.id,
          publishedAt,
        },
      });
      await tx.content.update({ where: { id: content.id }, data: { currentVersionId: version.id } });
      await tx.assetDetail.create({
        data: {
          contentId: content.id,
          assetType: asset.category,
          platforms: [asset.platform],
          scenarios: [asset.scene, asset.fit],
          problemStatement: asset.problem,
          usageGuide: { description: asset.usage },
          extraData: { legacyOwner: asset.owner, legacyDate: asset.date, legacyVersion: asset.version, legacyViews: asset.views, legacyFavorites: asset.favorites, legacyStatus: asset.status, legacyCover: asset.cover },
        },
      });
      for (const tagName of asset.tags) {
        const tag = await tx.tag.upsert({
          where: { organizationId_normalizedName: { organizationId: organization.id, normalizedName: normalize(tagName) } },
          create: { organizationId: organization.id, name: tagName, normalizedName: normalize(tagName) },
          update: { name: tagName },
        });
        await tx.contentTag.create({ data: { contentId: content.id, tagId: tag.id, createdById: owner.id } });
      }
    });
    created += 1;
  }
  console.log(JSON.stringify({ designAssets: { created, skipped, total: assets.length } }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
