'use client';
import { useState } from 'react';
import { RelatedContentField } from '@/components/workspace/related-content-field';
import { Check, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';
import { editorSections, fieldValue } from '@/lib/content-editor-schema';
import type { ContentType } from '@/lib/content-types';

export function ContentTypeFields({
  contentType,
  body = {},
  onChange,
}: {
  contentType: ContentType;
  body?: Record<string, unknown>;
  onChange?: () => void;
}) {
  const sections = editorSections[contentType];
  const [active, setActive] = useState(0);
  const [values, setValues] = useState(() =>
    Object.fromEntries(
      sections
        .flatMap((section) => section.fields)
        .map((field) => [field.name, fieldValue(field, body)]),
    ),
  );
  const all = sections.flatMap((section) => section.fields).filter((field) => field.required);
  const complete = all.filter((field) => values[field.name]?.trim()).length;
  return (
    <div
      className="editor-sections"
      onInput={(event) => {
        const input = event.target as HTMLInputElement;
        if (input.name) setValues((current) => ({ ...current, [input.name]: input.value }));
      }}
    >
      <aside className="editor-outline">
        <p className="eyebrow">内容结构</p>
        <h3>把经验写成方法</h3>
        <nav aria-label="编辑章节">
          {sections.map((section, index) => {
            const required = section.fields.filter((field) => field.required);
            const done = required.every((field) => values[field.name]?.trim());
            return (
              <button
                type="button"
                key={section.id}
                className={active === index ? 'is-current' : ''}
                aria-current={active === index ? 'step' : undefined}
                onClick={() => setActive(index)}
              >
                <span className="step-number">{done ? <Check size={13} /> : `0${index + 1}`}</span>
                <span>{section.title}</span>
                <ChevronRight size={13} />
              </button>
            );
          })}
        </nav>
        <div className="editor-progress">
          <span>必填内容</span>
          <strong>
            {complete} / {all.length}
          </strong>
          <progress max={all.length} value={complete} />
          <p>可以随时保存草稿，完善后再发布。</p>
        </div>
      </aside>
      <div className="editor-section-body">
        {sections.map((section, index) => (
          <section key={section.id} hidden={active !== index} data-editor-section={index}>
            <div className="section-heading">
              <span className="eyebrow">
                0{index + 1} / 0{sections.length}
              </span>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
            </div>
            <div className="editor-field-grid">
              {section.fields.map((field) => (
                <div
                  className={`editor-field ${field.kind === 'text' || field.kind === 'select' ? '' : 'field-wide'}`}
                  key={field.name}
                >
                  <label htmlFor={`field-${field.name}`}>
                    {field.label}
                    {field.required ? <em aria-label="发布时必填">*</em> : <small>选填</small>}
                  </label>
                  {field.name.startsWith('related') ? (
                    <RelatedContentField
                      name={field.name}
                      initialValue={fieldValue(field, body)}
                      onChange={(value) => {
                        setValues((current) => ({ ...current, [field.name]: value }));
                        onChange?.();
                      }}
                    />
                  ) : field.kind === 'select' ? (
                    <NativeSelect
                      id={`field-${field.name}`}
                      aria-label={field.label}
                      name={field.name}
                      defaultValue={fieldValue(field, body)}
                      onValueChange={(value) => {
                        setValues((current) => ({ ...current, [field.name]: value }));
                        onChange?.();
                      }}
                    >
                      <option value="">请选择</option>
                      {field.options?.map(([key, label]) => (
                        <option value={key} key={key}>
                          {label}
                        </option>
                      ))}
                    </NativeSelect>
                  ) : field.kind === 'text' ? (
                    <Input
                      id={`field-${field.name}`}
                      aria-label={field.label}
                      name={field.name}
                      defaultValue={fieldValue(field, body)}
                      placeholder={field.placeholder}
                      aria-required={field.required}
                    />
                  ) : (
                    <Textarea
                      id={`field-${field.name}`}
                      aria-label={field.label}
                      name={field.name}
                      defaultValue={fieldValue(field, body)}
                      placeholder={field.placeholder}
                      rows={field.name === 'promptTemplate' ? 8 : 4}
                      aria-required={field.required}
                    />
                  )}
                  {field.kind === 'list' ? (
                    <small className="field-hint">每行一项，发布后自动整理成列表。</small>
                  ) : null}
                </div>
              ))}
            </div>
            <div className="section-pagination">
              <button type="button" disabled={index === 0} onClick={() => setActive(index - 1)}>
                上一部分
              </button>
              <span>
                {index + 1} / {sections.length}
              </span>
              <button
                type="button"
                disabled={index === sections.length - 1}
                onClick={() => setActive(index + 1)}
              >
                下一部分 <ChevronRight size={14} />
              </button>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
