import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  Clock3,
  Sparkles,
  XCircle,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { workspaceStatus, type WorkspaceStatusTone } from '@/lib/workspace-status';

const toneClasses: Record<WorkspaceStatusTone, string> = {
  neutral: 'border-[var(--v9-status-neutral-line)] bg-[var(--v9-status-neutral-bg)] text-[var(--v9-status-neutral-text)]',
  info: 'border-[var(--v9-status-info-line)] bg-[var(--v9-status-info-bg)] text-[var(--v9-status-info-text)]',
  accent: 'border-[var(--v9-status-accent-line)] bg-[var(--v9-status-accent-bg)] text-[var(--v9-status-accent-text)]',
  success: 'border-[var(--v9-status-success-line)] bg-[var(--v9-status-success-bg)] text-[var(--v9-status-success-text)]',
  warning: 'border-[var(--v9-status-warning-line)] bg-[var(--v9-status-warning-bg)] text-[var(--v9-status-warning-text)]',
  danger: 'border-[var(--v9-status-danger-line)] bg-[var(--v9-status-danger-bg)] text-[var(--v9-status-danger-text)]',
};

const toneIcons = {
  neutral: CircleDashed,
  info: Clock3,
  accent: Sparkles,
  success: CheckCircle2,
  warning: AlertTriangle,
  danger: XCircle,
} satisfies Record<WorkspaceStatusTone, typeof CircleDashed>;

export function WorkspaceStatusBadge({
  status,
  label,
  className,
  showIcon = true,
}: {
  status: string;
  label?: string;
  className?: string;
  showIcon?: boolean;
}) {
  const definition = workspaceStatus(status, label);
  const Icon = toneIcons[definition.tone];
  return (
    <Badge
      variant="outline"
      className={cn('h-5 gap-1 rounded-full px-2 text-[10px] font-medium', toneClasses[definition.tone], className)}
    >
      {showIcon ? <Icon aria-hidden="true" className="size-3" /> : null}
      {definition.label}
    </Badge>
  );
}
