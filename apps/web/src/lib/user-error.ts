const fields: Record<string, string> = {
  teamId: '归属团队', categoryId: '分类', tagIds: '标签', title: '标题', summary: '摘要',
  contentType: '内容类型', email: '邮箱', name: '名称', code: '代码', fileId: '文件',
  contentId: '内容', versionId: '内容版本', sizeBytes: '文件大小', mimeType: '文件类型',
  websiteUrl: '工具地址', url: '链接', password: '密码', roleId: '角色', userId: '账号',
};
const messages: Record<string, string> = {
  'Select a team before creating content.': '请先选择归属团队。',
  'The selected team is not available in your organization.': '所选团队不可用，请重新选择。',
  'Category code already exists.': '分类代码已存在，请使用其他代码。',
  'Tag already exists.': '该标签已存在，请勿重复添加。',
  'Unsupported file type.': '不支持此文件格式，请选择支持的文件类型。',
  'Only a draft version can be published.': '仅草稿可以发布，请刷新页面确认内容状态。',
  'Draft has already been published.': '草稿已发布，请刷新后继续操作。',
  'Content changed; refresh and try again.': '内容已发生变化，请刷新后重试。',
  'This file is not ready to download.': '文件尚未准备完成，请稍后再下载。',
  'A content item cannot reference itself.': '内容不能关联自身，请选择其他内容。',
  'This content relation already exists.': '该内容关联已存在。',
  'Only published content can be unpublished.': '只能下架已发布的内容。',
  'Only published or unpublished content can be archived.': '只能归档已发布或已下架的内容。',
  'Only design assets and AI tools support a cover.': '仅设计资产和 AI 工具支持封面图片。',
};
export function userError(error: unknown, fallback = '操作未完成，请稍后重试。', status?: number): string {
  const raw = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  if (!raw) return statusMessage(status, fallback);
  if (messages[raw]) return messages[raw];
  if (/^[^\u4e00-\u9fff]*[；;\n]/.test(raw)) return raw.split(/[；;\n]/).filter(Boolean).map(m => userError(m.trim(), fallback, status)).join('；');
  const match = raw.match(/^(?:each value in )?([\w.]+) (must|should|is not|should not) (.+)$/);
  if (match?.[1] && match[3]) {
    const field = fields[match[1]] ?? '该字段';
    const rule = match[3];
    if (/UUID/.test(rule)) return `请重新选择有效的${field}。`;
    if (/empty/.test(rule)) return `请填写${field}。`;
    if (/email/.test(rule)) return '请输入有效的邮箱地址。';
    if (/URL|url/.test(rule)) return `请输入有效的${field}。`;
    const max = rule.match(/(?:shorter than or equal to|no more than) (\d+)/);
    if (max) return `${field}不能超过 ${max[1]} 个字符。`;
    return `${field}格式不正确，请检查后重试。`;
  }
  if (/timeout|timed out|aborted/i.test(raw)) return '请求超时，操作结果暂未确认，请刷新核对后重试。';
  if (/fetch failed|failed to fetch|network|load failed/i.test(raw)) return '网络连接异常，请检查网络后重试。';
  if (/cannot (?:access|edit|delete|publish|use)|permissions|forbidden|access is denied|Only the content owner/i.test(raw)) return '当前账号没有执行此操作的权限。';
  if (/not found|was not found|not available/i.test(raw)) return '内容或资源不存在、已删除，或当前不可访问。';
  if (/file.*size|size.*file|declared.*size/i.test(raw)) return '文件大小与上传信息不一致，请重新选择文件上传。';
  if (/file.*type|metadata/i.test(raw)) return '文件格式与上传信息不一致，请重新上传。';
  if (/expired|signature|storage URL/i.test(raw)) return '文件链接已失效，请重新上传或获取下载链接。';
  if (/draft|version|current state|changed|publication/i.test(raw)) return '内容状态已变化，无法完成此操作，请刷新页面后重试。';
  if (/[\u4e00-\u9fff]/.test(raw)) return raw;
  return statusMessage(status, fallback);
}
function statusMessage(status: number | undefined, fallback: string) {
  if (status === 401) return '登录状态已失效，请重新登录。';
  if (status === 403) return '当前账号没有执行此操作的权限。';
  if (status === 404) return '内容或资源不存在、已删除，或当前不可访问。';
  if (status === 413) return '上传内容过大，请减小文件大小后重试。';
  if (status === 429) return '操作过于频繁，请稍后重试。';
  if (status && status >= 500) return '服务暂时不可用，请稍后重试。';
  if (status === 400) return '填写的信息不符合要求，请检查后重试。';
  if (status === 409) return '内容状态已变化或信息重复，请刷新核对后重试。';
  return fallback;
}
