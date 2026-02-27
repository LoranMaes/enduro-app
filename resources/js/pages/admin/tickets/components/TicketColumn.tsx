import type { DragEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TicketRecord, TicketStatusKey } from '../types';
import { TicketCard } from './TicketCard';

type TicketColumnProps = {
    columnKey: TicketStatusKey;
    columnLabel: string;
    tickets: TicketRecord[];
    count: number;
    isDropTarget: boolean;
    canDrop: boolean;
    onDragOver: (event: DragEvent<HTMLElement>) => void;
    onDragLeave: () => void;
    onDrop: (event: DragEvent<HTMLElement>) => void;
    onOpenTicket: (ticketId: number) => void;
    onTicketDragStart: (
        ticketId: number,
        event: DragEvent<HTMLButtonElement>,
    ) => void;
    onTicketDragEnd: () => void;
};

export function TicketColumn({
    columnKey,
    columnLabel,
    tickets,
    count,
    isDropTarget,
    canDrop,
    onDragOver,
    onDragLeave,
    onDrop,
    onOpenTicket,
    onTicketDragStart,
    onTicketDragEnd,
}: TicketColumnProps) {
    return (
        <section
            className={`flex min-w-[17.5rem] flex-1 flex-col rounded-xl border bg-surface transition-colors ${
                isDropTarget ? 'border-emerald-500/60' : 'border-border'
            }`}
            role="region"
            aria-label={`${columnLabel} tickets`}
            onDragOver={(event) => {
                if (!canDrop) {
                    return;
                }

                onDragOver(event);
            }}
            onDragLeave={() => {
                if (!canDrop) {
                    return;
                }

                onDragLeave();
            }}
            onDrop={(event) => {
                if (!canDrop) {
                    return;
                }

                onDrop(event);
            }}
            data-column={columnKey}
        >
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <p className="text-xs font-medium tracking-wide text-zinc-300 uppercase">
                    {columnLabel}
                </p>
                <Badge
                    variant="outline"
                    className="border-zinc-700 bg-zinc-900/60 px-1.5 py-0 text-[0.625rem] text-zinc-400"
                >
                    {count}
                </Badge>
            </div>

            <ScrollArea className="min-h-0 flex-1 p-2">
                <ul className="flex min-h-full flex-col gap-2" role="list">
                    {tickets.length === 0 ? (
                        <li className="rounded-lg border border-dashed border-zinc-800 px-3 py-6 text-center text-xs text-zinc-600">
                            No tickets
                        </li>
                    ) : (
                        tickets.map((ticket) => (
                            <li key={ticket.id}>
                                <TicketCard
                                    ticket={ticket}
                                    onOpen={onOpenTicket}
                                    onDragStart={onTicketDragStart}
                                    onDragEnd={onTicketDragEnd}
                                />
                            </li>
                        ))
                    )}
                </ul>
            </ScrollArea>
        </section>
    );
}
