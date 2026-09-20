import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function WorkspaceEmptyState({
  children,
  className,
  icon,
  title,
}: {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  title?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-2xl border border-dashed border-[var(--v9-line-strong)] bg-[var(--v9-soft)] px-6 py-10 text-sm leading-6 text-[var(--v9-copy)]',
        icon || title ? 'text-center' : '',
        className,
      )}
    >
      {icon ? <div className="mx-auto mb-4 flex size-9 items-center justify-center text-[var(--v9-subtle)]">{icon}</div> : null}
      {title ? <h2 className="text-base font-semibold text-[var(--v9-text)]">{title}</h2> : null}
      <div className={cn(title ? 'mt-2' : '')}>{children}</div>
    </section>
  );
}
