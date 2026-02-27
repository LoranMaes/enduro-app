import { Badge } from '@/components/ui/badge';
import type { SupportTicketStatus, SupportTicketStatusLabels } from '../types';

type SupportStatusBadgeProps = {
    status: SupportTicketStatus;
    labels: SupportTicketStatusLabels;
};

export function SupportStatusBadge({ status, labels }: SupportStatusBadgeProps) {
    const classes: Record<SupportTicketStatus, string> = {
        todo: 'border-sky-900/60 bg-sky-950/30 text-sky-300',
        in_progress: 'border-violet-900/60 bg-violet-950/30 text-violet-300',
        to_review: 'border-amber-900/60 bg-amber-950/30 text-amber-300',
        done: 'border-emerald-900/60 bg-emerald-950/30 text-emerald-300',
    };

    return (
        <Badge
            variant="outline"
            className={`px-2 py-0 text-[0.6875rem] ${classes[status]}`}
        >
            {labels[status]}
        </Badge>
    );
}
