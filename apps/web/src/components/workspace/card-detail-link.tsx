import { WorkspaceDataLink as Link } from './workspace-data-link';

// One native link covers the card; sibling actions sit above it, never inside it.
export function CardDetailLink({ href, title }: { href: string; title: string }) {
  return <Link data-card-link="" href={href} prefetch={false} aria-label={`查看详情：${title}`} className="absolute inset-0 z-10 cursor-pointer rounded-[inherit] focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-ring" />;
}
