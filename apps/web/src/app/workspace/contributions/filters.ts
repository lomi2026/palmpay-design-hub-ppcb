export type ContributionFilters = { search?: string; categoryId?: string; status?: string };
export function filterContributions<T extends { title: string; summary: string | null; status: string; category: { id: string } | null }>(items: T[], filters: ContributionFilters): T[] {
  const search = filters.search?.trim().toLocaleLowerCase() ?? '';
  return items.filter((item) => (!search || `${item.title} ${item.summary ?? ''}`.toLocaleLowerCase().includes(search))
    && (!filters.categoryId || (filters.categoryId === 'uncategorized' ? !item.category : item.category?.id === filters.categoryId))
    && (!filters.status || item.status === filters.status));
}
