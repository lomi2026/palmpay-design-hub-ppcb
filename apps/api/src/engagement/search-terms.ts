/** Word fragments retain organization filtering in the caller's SQL. */
export function searchTerms(keyword: string): string[] {
  const normalized = keyword.normalize('NFKC').trim().toLowerCase();
  const chunks = normalized.split(/\s+/).filter(Boolean);
  if (chunks.length > 1) return [...new Set(chunks)].slice(0, 16);
  const segments = new Intl.Segmenter('zh-CN', { granularity: 'word' }).segment(normalized);
  return [...new Set([...segments].filter(s => s.isWordLike).map(s => s.segment))].slice(0, 16);
}
export function containsPattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, '\\$&')}%`;
}
