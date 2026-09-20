import { WorkspaceDataLink as Link } from '@/components/workspace/workspace-data-link';
import { resolveContentReferences } from '@/lib/content-references';
import { ArrowUpRight, FileText } from 'lucide-react';
import { editorSections, fieldValue } from '@/lib/content-editor-schema';
import type { ContentType } from '@/lib/content-types';
import { CopyTextButton } from './copy-text-button';

export async function ContentSections({
  type,
  body,
}: {
  type: ContentType;
  body: Record<string, unknown>;
}) {
  const references = await resolveContentReferences(body);
  return (
    <div className="content-reading-layout">
      <div className="reading-sections">
        {editorSections[type].map((section, index) => {
          const fields = section.fields.filter((field) => fieldValue(field, body).trim());
          const missing = section.fields.filter(
            (field) => field.required && !fieldValue(field, body).trim(),
          );
          return (
            <section className="reading-section" id={`read-${section.id}`} key={section.id}>
              <div className="reading-section-heading">
                <span>0{index + 1}</span>
                <h2>{section.title}</h2>
              </div>
              {fields.length ? (
                <>
                  {' '}
                  <dl className="reading-field-grid">
                    {fields.map((field) => {
                      const text = fieldValue(field, body);
                      const options = field.options;
                      const display = options?.find(([key]) => key === text)?.[1] ?? text;
                      return (
                        <div
                          className={`reading-field ${field.kind === 'text' || field.kind === 'select' ? '' : 'field-wide'} ${field.name === 'promptTemplate' ? 'prompt-field' : ''}`}
                          key={field.name}
                        >
                          <dt>
                            {field.label}
                            {field.name === 'promptTemplate' ? (
                              <CopyTextButton text={text} label="复制 Prompt" />
                            ) : null}
                          </dt>
                          <dd>
                            {field.name.startsWith('related') ? (
                              <ul className="resource-list">
                                {text
                                  .split('\n')
                                  .filter(Boolean)
                                  .map((id) => {
                                    const item = references.find(
                                      (reference) => reference.id === id,
                                    );
                                    return (
                                      <li key={id}>
                                        {item ? (
                                          <Link href={item.href}>
                                            <FileText size={16} />
                                            <span>{item.title}</span>
                                            <ArrowUpRight size={16} />
                                          </Link>
                                        ) : (
                                          <span className="reading-empty">
                                            关联内容当前不可访问
                                          </span>
                                        )}
                                      </li>
                                    );
                                  })}
                              </ul>
                            ) : field.name === 'resourceLinks' || field.name === 'websiteUrl' ? (
                              <ul className="resource-list">
                                {text
                                  .split('\n')
                                  .filter(Boolean)
                                  .map((url, i) => {
                                    let safe = false;
                                    try {
                                      const u = new URL(url);
                                      safe =
                                        ['https:', 'http:'].includes(u.protocol) &&
                                        !u.username &&
                                        !u.password;
                                    } catch {}
                                    return (
                                      <li key={i}>
                                        {safe ? (
                                          <a href={url} target="_blank" rel="noopener noreferrer">
                                            <FileText size={16} />
                                            <span>{url}</span>
                                            <ArrowUpRight size={16} />
                                          </a>
                                        ) : (
                                          <span>{url}</span>
                                        )}
                                      </li>
                                    );
                                  })}
                              </ul>
                            ) : field.kind === 'list' ? (
                              <ul className="reading-list">
                                {text
                                  .split('\n')
                                  .filter(Boolean)
                                  .map((line, i) => (
                                    <li key={i}>{line}</li>
                                  ))}
                              </ul>
                            ) : (
                              <p className="whitespace-pre-wrap">{display}</p>
                            )}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                  {missing.length ? (
                    <p className="reading-empty">
                      待作者补充：{missing.map((field) => field.label).join('、')}。
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="reading-empty">作者尚未补充这部分内容。</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
