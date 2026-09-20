'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';

type V9MobileSectionProps = {
  children: ReactNode;
  className: string;
  header: ReactNode;
  headerClassName: string;
  id: string;
};

export function V9MobileSection({ children, className, header, headerClassName, id }: V9MobileSectionProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 720px)');
    const sync = () => {
      setIsMobile(mediaQuery.matches);
      setIsExpanded(!mediaQuery.matches || window.location.hash === `#${id}`);
    };
    const revealLinkedSection = () => {
      if (mediaQuery.matches && window.location.hash === `#${id}`) setIsExpanded(true);
    };

    sync();
    mediaQuery.addEventListener('change', sync);
    window.addEventListener('hashchange', revealLinkedSection);
    return () => {
      mediaQuery.removeEventListener('change', sync);
      window.removeEventListener('hashchange', revealLinkedSection);
    };
  }, [id]);

  return (
    <section id={id} className={className}>
      <div className="mx-auto max-w-[1232px]">
        <div className={headerClassName}>
          {header}
          {isMobile ? (
            <button
              aria-controls={`${id}-content`}
              aria-expanded={isExpanded}
              className="mt-[14px] inline-flex h-9 shrink-0 items-center justify-center gap-1.5 self-stretch rounded-[12px] border border-white/[.12] bg-white/[.035] px-3 text-[12px] font-semibold text-white/70 transition hover:bg-white/[.08] hover:text-white"
              onClick={() => setIsExpanded((expanded) => !expanded)}
              type="button"
            >
              {isExpanded ? '收起本模块' : '展开本模块'}
              <ChevronDown className={`size-3 transition ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          ) : null}
        </div>
        <div id={`${id}-content`} hidden={isMobile && !isExpanded}>{children}</div>
      </div>
    </section>
  );
}
