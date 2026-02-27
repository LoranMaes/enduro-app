import { MessageCircleMore } from 'lucide-react';
import { formatDuration, formatRelative } from '@/pages/admin/tickets/lib/ticket-utils';
import type {
    SupportTicketRecord,
    SupportTicketStatusLabels,
} from '../types';
import { SupportStatusBadge } from './SupportStatusBadge';

type SupportTicketListProps = {
    tickets: SupportTicketRecord[];
    selectedTicketId: number | string | null;
    statusLabels: SupportTicketStatusLabels;
    loading: boolean;
    emptyMessage: string;
    onSelectTicket: (ticketId: number | string) => void;
};

export function SupportTicketList({
    tickets,
    selectedTicketId,
    statusLabels,
    loading,
    emptyMessage,
    onSelectTicket,
}: SupportTicketListProps) {
    if (loading) {
        return (
            <div className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-zinc-400">
                Loading tickets...
            </div>
        );
    }

    if (tickets.length === 0) {
        return (
            <div className="rounded-xl border border-border bg-surface px-4 py-6 text-center text-sm text-zinc-500">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {tickets.map((ticket) => {
                const isSelected = selectedTicketId === ticket.id;

                return (
                    <button
                        key={ticket.id}
                        type="button"
                        onClick={() => onSelectTicket(ticket.id)}
                        className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                            isSelected
                                ? 'border-blue-700 bg-blue-950/20'
                                : 'border-border bg-surface hover:border-zinc-700 hover:bg-zinc-900/40'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-sm font-medium text-zinc-100">
                                {ticket.title}
                            </p>
                            <SupportStatusBadge
                                status={ticket.status}
                                labels={statusLabels}
                            />
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-[0.6875rem] text-zinc-400">
                            <span className="capitalize">{ticket.type}</span>
                            {ticket.has_admin_response ? (
                                <span className="inline-flex items-center gap-1 text-emerald-300">
                                    <MessageCircleMore className="h-3.5 w-3.5" />
                                    Responded
                                </span>
                            ) : null}
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[0.625rem] text-zinc-500">
                            <span>{formatRelative(ticket.updated_at)}</span>
                            {ticket.status === 'done' &&
                            ticket.archiving_in_seconds !== null ? (
                                <span>
                                    Archive in{' '}
                                    {formatDuration(ticket.archiving_in_seconds)}
                                </span>
                            ) : null}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
