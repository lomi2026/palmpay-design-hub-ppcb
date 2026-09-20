import type { ReactNode } from 'react';

type WorkspacePageHeroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: ReactNode;
  metric?: { value: string | number; label: string };
};

export function WorkspaceHeroMetric({ value, label }: { value: string | number; label: string }) {
  return (
    <div data-card-surface="" className="min-w-[82px] rounded-[16px] border border-[var(--v9-line)] bg-[var(--v9-soft)] p-4">
      <strong className="block text-[26px] font-semibold leading-none tracking-[-.055em] text-[var(--v9-text)]">{value}</strong>
      <span className="mt-2 block text-[10px] text-[var(--v9-subtle)]">{label}</span>
    </div>
  );
}

export function WorkspacePageHero({ title, description, children, metric }: WorkspacePageHeroProps) {
  return (
    <header data-card-surface="" className="workspace-page-card relative overflow-hidden rounded-[24px] border border-[var(--v9-line)] bg-[var(--v9-panel)] px-6 py-7 sm:px-8">
      <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <h1 className="text-[32px] font-semibold tracking-[-.055em] text-[var(--v9-text)]">{title}</h1>
          {description ? <p className="mt-3 text-sm leading-6 text-[var(--v9-copy)]">{description}</p> : null}
        </div>
        {children || metric ? (
          <div className="flex flex-wrap items-end gap-3">
            {metric ? <WorkspaceHeroMetric label={metric.label} value={metric.value} /> : null}
            {children}
          </div>
        ) : null}
      </div>
    </header>
  );
}
