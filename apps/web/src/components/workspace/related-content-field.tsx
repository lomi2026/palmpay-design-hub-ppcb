'use client';
import { useEffect, useState } from 'react';
import { referenceOptions } from '@/app/workspace/submit/reference-actions';
import type { ContentType } from '@/lib/content-types';
export function RelatedContentField({
  name,
  initialValue,
  onChange,
}: {
  name: string;
  initialValue: string;
  onChange: (value: string) => void;
}) {
  const [selected, setSelected] = useState(initialValue.split('\n').filter(Boolean));
  const [options, setOptions] = useState<Array<{ id: string; title: string }>>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const type: ContentType = name.toLowerCase().includes('skill')
    ? 'AI_SKILL'
    : name.toLowerCase().includes('case')
      ? 'AI_CASE'
      : name.toLowerCase().includes('project')
        ? 'AI_PROJECT'
        : 'DESIGN_ASSET';
  const single = name.endsWith('ContentId');
  useEffect(() => {
    let cancelled = false;
    referenceOptions(type)
      .then((items) => {
        if (!cancelled) {
          setOptions(items);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) setError('暂时无法加载内容，请稍后重试。已有选择会保留。');
      });
    return () => {
      cancelled = true;
    };
  }, [type]);
  const update = (id: string) => {
    const next = selected.includes(id)
      ? selected.filter((value) => value !== id)
      : single
        ? [id]
        : [...selected, id];
    setSelected(next);
    onChange(next.join('\n'));
  };
  return (
    <div className="reference-picker">
      <input type="hidden" name={name} value={selected.join('\n')} />
      <input
        aria-label="搜索关联内容"
        placeholder="按内容名称查找"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div>
        {options
          .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
          .map((item) => (
            <label key={item.id}>
              <input
                type="checkbox"
                checked={selected.includes(item.id)}
                onChange={() => update(item.id)}
              />
              <span>{item.title}</span>
            </label>
          ))}
      </div>
      {selected
        .filter((id) => !options.some((item) => item.id === id))
        .map((id) => (
          <label key={id}>
            <input type="checkbox" checked onChange={() => update(id)} />
            <span>已有内容关联 · {id.slice(0, 8)}</span>
          </label>
        ))}
      {error ? (
        <p role="alert">{error}</p>
      ) : !loaded ? (
        <p>正在加载可关联内容…</p>
      ) : !options.length ? (
        <p>当前没有可关联的已发布内容。</p>
      ) : null}
      <small>
        {single ? '可选择一项' : '可选择多项'} · 已选 {selected.length} 项
      </small>
    </div>
  );
}
