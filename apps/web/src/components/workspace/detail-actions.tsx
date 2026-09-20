import type { ReactNode } from 'react';

export function DetailActions({ children }: { children: ReactNode }) {
  return <div className="mt-6 flex w-full flex-wrap items-start gap-3 [&_button]:h-9 [&_button]:rounded-lg [&_a]:h-9 [&_a]:rounded-lg">{children}</div>;
}
