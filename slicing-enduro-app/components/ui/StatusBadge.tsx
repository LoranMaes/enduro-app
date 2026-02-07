
import React from 'react';
import { cn } from '../../lib/utils';
import type { SessionStatus } from '../../types';

interface StatusBadgeProps {
  status: SessionStatus;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const styles = {
    planned: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    completed: 'bg-emerald-950/40 text-emerald-400 border-emerald-900/50',
    skipped: 'bg-red-950/40 text-red-400 border-red-900/50',
    partial: 'bg-amber-950/40 text-amber-400 border-amber-900/50',
  };

  const labels = {
    planned: 'Planned',
    completed: 'Completed',
    skipped: 'Skipped',
    partial: 'Partial',
  };

  return (
    <span className={cn(
      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
      styles[status],
      className
    )}>
      {labels[status]}
    </span>
  );
};
