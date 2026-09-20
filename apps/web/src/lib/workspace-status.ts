export type WorkspaceStatusTone = 'neutral' | 'info' | 'accent' | 'success' | 'warning' | 'danger';

export type WorkspaceStatusDefinition = {
  label: string;
  tone: WorkspaceStatusTone;
};

const definitions: Record<string, WorkspaceStatusDefinition> = {
  DRAFT: { label: '草稿', tone: 'neutral' },
  PUBLISHED: { label: '已发布', tone: 'success' },
  UNPUBLISHED: { label: '已下架', tone: 'warning' },
  ARCHIVED: { label: '已归档', tone: 'neutral' },
  CANCELLED: { label: '已取消', tone: 'neutral' },
  UNVERIFIED: { label: '待验证', tone: 'neutral' },
  INTERNAL_TRIAL: { label: '内部试运行', tone: 'info' },
  PILOT: { label: '试点中', tone: 'accent' },
  VERIFIED: { label: '已验证', tone: 'success' },
  INVALIDATED: { label: '已失效', tone: 'danger' },
  ACTIVE: { label: '启用', tone: 'success' },
  INVITED: { label: '邀请中', tone: 'info' },
  DISABLED: { label: '停用', tone: 'danger' },
  MERGED: { label: '已合并', tone: 'neutral' },
  OVERDUE: { label: '已超时', tone: 'danger' },
  EXPLORING: { label: '探索方案', tone: 'accent' },
  EXPLORATION: { label: '探索方案', tone: 'accent' },
  EVALUATION: { label: '待评估', tone: 'info' },
  READY: { label: '可立项', tone: 'success' },
  PILOTING: { label: '试点中', tone: 'accent' },
  CONVERTED: { label: '已转项目', tone: 'success' },
  PAUSED: { label: '暂缓', tone: 'warning' },
  TERMINATED: { label: '终止', tone: 'danger' },
  '待复审': { label: '待复审', tone: 'warning' },
  '试运行': { label: '试运行', tone: 'info' },
  '内部试运行': { label: '内部试运行', tone: 'info' },
  '探索中': { label: '探索中', tone: 'accent' },
  '试点中': { label: '试点中', tone: 'accent' },
  '已验证': { label: '已验证', tone: 'success' },
  '正式发布': { label: '正式发布', tone: 'success' },
  '已发布': { label: '已发布', tone: 'success' },
  '已失效': { label: '已失效', tone: 'danger' },
};

export function workspaceStatus(status: string, label?: string): WorkspaceStatusDefinition {
  return definitions[status] ?? {
    label: label ?? status.replaceAll('_', ' ').toLocaleLowerCase('zh-CN'),
    tone: 'neutral',
  };
}

export function workspaceStatusLabel(status: string, label?: string) {
  return workspaceStatus(status, label).label;
}
