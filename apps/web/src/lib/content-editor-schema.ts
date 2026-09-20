import type { ContentType } from './content-types';
export type EditorField = {
  name: string;
  label: string;
  kind: 'text' | 'textarea' | 'list' | 'select';
  required: boolean;
  placeholder?: string;
  options?: string[][];
};
export type EditorSection = {
  id: string;
  title: string;
  description: string;
  fields: EditorField[];
};
export const editorSections: Record<ContentType, EditorSection[]> = {
  DESIGN_ASSET: [
    {
      id: 'section-1',
      title: '适用范围',
      description: '先判断这份资产是否适合当前任务。',
      fields: [
        {
          name: 'assetType',
          label: '资产类型',
          kind: 'text',
          required: true,
          placeholder: '例如：组件规范、页面模板、研究方法',
        },
        {
          name: 'platforms',
          label: '适用平台',
          kind: 'list',
          required: true,
          placeholder: 'Web\niOS\nAndroid',
        },
        {
          name: 'scenarios',
          label: '适用场景',
          kind: 'list',
          required: true,
          placeholder: '每行一个适用场景',
        },
        {
          name: 'unsuitableScenarios',
          label: '不适用场景',
          kind: 'list',
          required: true,
          placeholder: '每行一个不适用场景；无已知限制时请明确说明',
        },
      ],
    },
    {
      id: 'section-2',
      title: '使用与资源',
      description: '把问题、做法和可使用的资源放在一起。',
      fields: [
        {
          name: 'problemStatement',
          label: '问题陈述',
          kind: 'textarea',
          required: true,
          placeholder: '填写问题陈述',
        },
        {
          name: 'usageGuide',
          label: '使用指引',
          kind: 'textarea',
          required: true,
          placeholder: '按实际使用顺序说明步骤、前置条件和注意事项',
        },
        {
          name: 'resourceLinks',
          label: '资源链接',
          kind: 'list',
          required: true,
          placeholder: '每行一个 https:// 资源链接',
        },
      ],
    },
    {
      id: 'section-3',
      title: '关联内容',
      description: '建立相关资产之间的联系。',
      fields: [
        {
          name: 'relatedAssetIds',
          label: '相关资产',
          kind: 'list',
          required: false,
          placeholder: '每行填写一项',
        },
      ],
    },
  ],
  AI_TOOL: [
    {
      id: 'section-1',
      title: '工具概览',
      description: '提供可访问的入口与使用条件。',
      fields: [
        {
          name: 'websiteUrl',
          label: '官网链接',
          kind: 'text',
          required: true,
          placeholder: 'https://…',
        },
        {
          name: 'vendor',
          label: '提供方',
          kind: 'text',
          required: true,
          placeholder: '例如：工具团队或产品提供方',
        },
        {
          name: 'pricingModel',
          label: '收费方式',
          kind: 'text',
          required: true,
          placeholder: '例如：免费 / 订阅制 / 按使用量计费',
        },
        {
          name: 'platforms',
          label: '适用平台',
          kind: 'list',
          required: true,
          placeholder: 'Web\niOS\nAndroid',
        },
      ],
    },
    {
      id: 'section-2',
      title: '适用场景',
      description: '让同事快速判断是否适用。',
      fields: [
        {
          name: 'scenarios',
          label: '适用场景',
          kind: 'list',
          required: true,
          placeholder: '每行一个适用场景',
        },
        {
          name: 'limitations',
          label: '局限性',
          kind: 'textarea',
          required: true,
          placeholder: '填写局限性',
        },
      ],
    },
    {
      id: 'section-3',
      title: '开始使用',
      description: '说明从打开工具到完成任务的步骤。',
      fields: [
        {
          name: 'usageGuide',
          label: '使用指引',
          kind: 'textarea',
          required: true,
          placeholder: '按实际使用顺序说明步骤、前置条件和注意事项',
        },
      ],
    },
  ],
  AI_SKILL: [
    {
      id: 'section-1',
      title: '目标与边界',
      description: '明确这套方法适合谁、解决什么问题。',
      fields: [
        {
          name: 'goal',
          label: 'Skill 目标',
          kind: 'textarea',
          required: true,
          placeholder: '填写Skill 目标',
        },
        {
          name: 'scenarios',
          label: '适用场景',
          kind: 'list',
          required: true,
          placeholder: '每行一个适用场景',
        },
        {
          name: 'unsuitableScenarios',
          label: '不适用场景',
          kind: 'list',
          required: true,
          placeholder: '每行一个不适用场景；无已知限制时请明确说明',
        },
        {
          name: 'applicableRoles',
          label: '适用角色',
          kind: 'list',
          required: true,
          placeholder: '每行填写一项',
        },
      ],
    },
    {
      id: 'section-2',
      title: '输入与执行',
      description: '输入、提示词与操作步骤形成完整方法。',
      fields: [
        {
          name: 'inputRequirements',
          label: '输入要求',
          kind: 'textarea',
          required: true,
          placeholder: '说明需要提供的材料、格式及输入边界',
        },
        {
          name: 'outputSchema',
          label: '输出结构',
          kind: 'textarea',
          required: true,
          placeholder: '说明预期输出的格式和结构',
        },
        {
          name: 'promptTemplate',
          label: '核心 Prompt',
          kind: 'textarea',
          required: true,
          placeholder: '填写可直接复制使用的完整提示词，用 {{变量名}} 标识需要替换的内容',
        },
        {
          name: 'executionSteps',
          label: '执行步骤',
          kind: 'textarea',
          required: true,
          placeholder: '填写执行步骤',
        },
      ],
    },
    {
      id: 'section-3',
      title: '示例与复核',
      description: '用示例帮助复用，用人工判断保证质量。',
      fields: [
        {
          name: 'exampleInput',
          label: '示例输入',
          kind: 'textarea',
          required: true,
          placeholder: '填写示例输入',
        },
        {
          name: 'exampleOutput',
          label: '示例输出',
          kind: 'textarea',
          required: true,
          placeholder: '填写示例输出',
        },
        {
          name: 'humanReviewRules',
          label: '人工复核规则',
          kind: 'textarea',
          required: true,
          placeholder: '明确哪些信息需要设计师核实、哪些判断不能交给 AI',
        },
        {
          name: 'limitations',
          label: '局限性',
          kind: 'textarea',
          required: true,
          placeholder: '填写局限性',
        },
      ],
    },
    {
      id: 'section-4',
      title: '模型与版本',
      description: '说明运行条件与提示词版本。',
      fields: [
        {
          name: 'recommendedModels',
          label: '推荐模型',
          kind: 'list',
          required: true,
          placeholder: '每行填写一项',
        },
        {
          name: 'dataSecurityLevel',
          label: '数据安全等级',
          kind: 'select',
          required: true,
          placeholder: '填写数据安全等级',
          options: [
            ['public', '公开'],
            ['internal', '内部'],
            ['confidential', '机密'],
          ],
        },
        {
          name: 'promptVersion',
          label: 'Prompt 版本',
          kind: 'text',
          required: true,
          placeholder: '例如：1.0',
        },
      ],
    },
  ],
  AI_CASE: [
    {
      id: 'section-1',
      title: '背景与问题',
      description: '交代情境、问题及原有工作方式。',
      fields: [
        {
          name: 'caseUrl',
          label: '案例链接',
          kind: 'text',
          required: false,
          placeholder: 'https://…',
        },
        {
          name: 'background',
          label: '案例背景',
          kind: 'textarea',
          required: true,
          placeholder: '填写案例背景',
        },
        {
          name: 'originalProblem',
          label: '原始问题',
          kind: 'textarea',
          required: true,
          placeholder: '填写原始问题',
        },
        {
          name: 'originalProcess',
          label: '原有流程',
          kind: 'textarea',
          required: true,
          placeholder: '填写原有流程',
        },
      ],
    },
    {
      id: 'section-2',
      title: 'AI 与人的分工',
      description: '说明 AI 介入的位置，以及设计师做出的判断。',
      fields: [
        {
          name: 'aiIntervention',
          label: 'AI 介入节点',
          kind: 'textarea',
          required: true,
          placeholder: '填写AI 介入节点',
        },
        {
          name: 'aiResponsibilities',
          label: 'AI 完成内容',
          kind: 'textarea',
          required: true,
          placeholder: '填写AI 完成内容',
        },
        {
          name: 'humanResponsibilities',
          label: '设计师判断内容',
          kind: 'textarea',
          required: true,
          placeholder: '填写设计师判断内容',
        },
      ],
    },
    {
      id: 'section-3',
      title: '结果与证据',
      description: '把观察结果与验证范围一起呈现。',
      fields: [
        {
          name: 'resultSummary',
          label: '最终结果',
          kind: 'textarea',
          required: true,
          placeholder: '填写最终结果',
        },
        {
          name: 'beforeAfterComparison',
          label: '前后对比',
          kind: 'textarea',
          required: true,
          placeholder: '填写前后对比',
        },
        {
          name: 'sampleSize',
          label: '样本范围',
          kind: 'text',
          required: true,
          placeholder: '例如：12 个页面，3 个核心任务',
        },
        {
          name: 'validationMethod',
          label: '验证方式',
          kind: 'text',
          required: true,
          placeholder: '例如：对照测试、设计验收、用户访谈',
        },
        {
          name: 'dataResult',
          label: '数据结果',
          kind: 'textarea',
          required: true,
          placeholder: '填写数据结果',
        },
      ],
    },
    {
      id: 'section-4',
      title: '复用与关联',
      description: '说明哪些经验可迁移、有哪些局限。',
      fields: [
        {
          name: 'reusableConclusion',
          label: '可复用结论',
          kind: 'textarea',
          required: true,
          placeholder: '填写可复用结论',
        },
        {
          name: 'limitations',
          label: '局限性',
          kind: 'textarea',
          required: true,
          placeholder: '填写局限性',
        },
        {
          name: 'relatedSkillContentId',
          label: '关联 Skill',
          kind: 'text',
          required: false,
          placeholder: '填写关联 Skill',
        },
        {
          name: 'relatedProjectContentId',
          label: '关联项目',
          kind: 'text',
          required: false,
          placeholder: '填写关联项目',
        },
      ],
    },
  ],
  AI_PROJECT: [
    {
      id: 'section-1',
      title: '项目概况',
      description: '定义探索方向和推进优先级。',
      fields: [
        {
          name: 'projectCode',
          label: '项目编号',
          kind: 'text',
          required: true,
          placeholder: '例如：P27',
        },
        {
          name: 'domain',
          label: '所属领域',
          kind: 'text',
          required: true,
          placeholder: '填写所属领域',
        },
        {
          name: 'targetValue',
          label: '目标价值',
          kind: 'textarea',
          required: true,
          placeholder: '填写目标价值',
        },
        {
          name: 'projectStage',
          label: '当前阶段',
          kind: 'select',
          required: true,
          placeholder: '填写当前阶段',
          options: [
            ['EXPLORING', '探索方案'],
            ['PENDING_EVALUATION', '待评估'],
            ['READY', '可立项'],
            ['PILOTING', '试点中'],
            ['VERIFIED', '已验证'],
            ['PAUSED', '暂缓'],
            ['TERMINATED', '终止'],
          ],
        },
        {
          name: 'priority',
          label: '优先级',
          kind: 'select',
          required: true,
          placeholder: '填写优先级',
          options: [
            ['high', '高'],
            ['medium', '中'],
            ['low', '低'],
          ],
        },
      ],
    },
    {
      id: 'section-2',
      title: '方案与验证',
      description: '从问题到假设，形成可执行的验证方向。',
      fields: [
        {
          name: 'problemStatement',
          label: '问题陈述',
          kind: 'textarea',
          required: true,
          placeholder: '填写问题陈述',
        },
        {
          name: 'solutionHypothesis',
          label: '解决方案假设',
          kind: 'textarea',
          required: true,
          placeholder: '填写解决方案假设',
        },
        {
          name: 'expectedOutcome',
          label: '预期效果',
          kind: 'textarea',
          required: true,
          placeholder: '填写预期效果',
        },
      ],
    },
    {
      id: 'section-3',
      title: '风险与关联',
      description: '记录风险、结论与相关实践。',
      fields: [
        {
          name: 'riskLevel',
          label: '风险',
          kind: 'textarea',
          required: true,
          placeholder: '填写风险',
        },
        {
          name: 'evaluationResult',
          label: '评估结论',
          kind: 'textarea',
          required: true,
          placeholder: '填写评估结论',
        },
        {
          name: 'relatedSkillIds',
          label: '关联 Skill',
          kind: 'list',
          required: false,
          placeholder: '每行填写一项',
        },
        {
          name: 'relatedCaseIds',
          label: '关联案例',
          kind: 'list',
          required: false,
          placeholder: '每行填写一项',
        },
        {
          name: 'convertedProjectRef',
          label: '外部正式项目引用',
          kind: 'text',
          required: false,
          placeholder: '填写外部正式项目引用',
        },
      ],
    },
  ],
};

export function readableValue(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(readableValue).filter(Boolean).join('\n');
  if (typeof value === 'object') {
    const v = value as Record<string, unknown>;
    for (const key of ['description', 'text', 'note', 'steps', 'url'])
      if (v[key]) return readableValue(v[key]);
    return Object.entries(v)
      .filter(([key]) => !['source', 'legacy', 'extraData', 'required'].includes(key))
      .map(
        ([key, item]) =>
          `${({ duration: '预计时长', complexity: '复杂度', before: '之前', after: '之后', title: '标题', content: '内容' } as Record<string, string>)[key] ?? key}：${readableValue(item)}`,
      )
      .join('\n');
  }
  return '';
}
export function contentBody(content: Record<string, unknown>): Record<string, unknown> {
  const version = content.currentVersion as { body?: Record<string, unknown> } | null;
  const body = version?.body && typeof version.body === 'object' ? version.body : {};
  const detail = (content.assetDetail ||
    content.skillDetail ||
    content.caseDetail ||
    content.toolDetail ||
    content.projectDetail ||
    {}) as Record<string, unknown>;
  const result: Record<string, unknown> = { ...detail, ...body };
  const aliases: Record<string, string> = {
    problemStatement: 'problem',
    usageGuide: 'usage',
    promptTemplate: 'prompt',
    executionSteps: 'steps',
    beforeAfterComparison: 'before',
    sampleSize: 'sample',
    validationMethod: 'validation',
  };
  for (const [key, alias] of Object.entries(aliases))
    if (result[key] == null && body[alias] != null) result[key] = body[alias];
  const steps = result.executionSteps;
  if (
    steps &&
    typeof steps === 'object' &&
    !Array.isArray(steps) &&
    Object.keys(steps).length &&
    Object.keys(steps).every((key) => ['duration', 'complexity'].includes(key))
  ) {
    // Historical imports stored effort metadata here, not executable instructions.
    result.executionSteps = '';
  }
  return result;
}
export function fieldValue(field: EditorField, body: Record<string, unknown>): string {
  const raw = readableValue(body[field.name]);
  if (raw === 'Imported v9-1 Skill requires human review before use.')
    return '使用前请由设计师复核输入、事实和最终输出。';
  if (field.name === 'dataSecurityLevel') return raw.toLowerCase();
  return raw;
}
export function missingEditorFields(
  type: ContentType,
  data: FormData,
): { name: string; label: string }[] {
  return [
    { name: 'title', label: '标题', required: true },
    { name: 'summary', label: '摘要', required: true },
    ...editorSections[type].flatMap((section) => section.fields),
  ]
    .filter((field) => field.required && !String(data.get(field.name) ?? '').trim())
    .map(({ name, label }) => ({ name, label }));
}
