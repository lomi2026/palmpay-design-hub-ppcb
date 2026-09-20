import type { TaxonomyOptions, TaxonomySelection } from './taxonomy-fields';

export function TaxonomySummary({ selection, options }: { selection: TaxonomySelection; options: TaxonomyOptions }) {
  const category = options.categories.find((item) => item.id === selection.categoryId);
  const tags = options.tags.filter((item) => selection.tagIds.includes(item.id));
  const label = (item: { name: string; status: string }) => `${item.name}${item.status !== 'ACTIVE' ? '（已停用）' : ''}`;
  return <div className="mt-4 space-y-2 text-sm text-[var(--v9-muted)]"><p>分类：{category ? label(category) : '未分类'}</p><p>标签：{tags.length ? tags.map(label).join('、') : '未选择'}</p></div>;
}
