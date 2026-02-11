import type { DragEvent } from 'react';
import { AssigneeLabel, ImportanceDot, TypeBadge } from './ticket-ui';
import { formatDuration, formatRelative } from '../lib/ticket-utils';
import type { TicketRecord } from '../types';

type TicketCardProps = {
    ticket: TicketRecord;
    onOpen: (ticketId: number) => void;
    onDragStart: (
        ticketId: number,
        event: DragEvent<HTMLButtonElement>,
    ) => void;
    onDragEnd: () => void;
};

export function TicketCard({
    ticket,
    onOpen,
    onDragStart,
    onDragEnd,
}: TicketCardProps) {
    return (
        <button
            type="button"
            draggable
            aria-label={`Open ticket ${ticket.id}: ${ticket.title}`}
            aria-grabbed="false"
            onDragStart={(event) => {
                onDragStart(ticket.id, event);
            }}
            onDragEnd={onDragEnd}
            onClick={() => onOpen(ticket.id)}
            className="w-full cursor-pointer rounded-lg border border-border bg-background px-3 py-2 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-900/40"
        >
            <div className="mb-2 flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-medium text-zinc-100">
                    {ticket.title}
                </p>
                <ImportanceDot importance={ticket.importance} />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
                <TypeBadge type={ticket.type} />
                <AssigneeLabel name={ticket.assignee_admin?.name ?? null} />
            </div>
            <div className="mt-2 flex items-center justify-between text-[0.625rem] text-zinc-500">
                <span>{formatRelative(ticket.updated_at)}</span>
                {ticket.status === 'done' &&
                ticket.archiving_in_seconds !== null ? (
                    <span className="text-zinc-400">
                        Archiving in{' '}
                        {formatDuration(ticket.archiving_in_seconds)}
                    </span>
                ) : null}
            </div>
        </button>
    );
}
