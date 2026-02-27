import type { Dispatch, DragEvent, SetStateAction } from 'react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { statusColumns } from '../constants';
import { formatDateTime } from '../lib/ticket-utils';
import type { BoardData, Filters, Paginated, TicketRecord, TicketStatusKey } from '../types';
import {
    AssigneeLabel,
    HeaderButton,
    ImportanceLabel,
    StatusBadge,
    TypeBadge,
    highlightSearchMatch,
} from './ticket-ui';
import { TicketColumn } from './TicketColumn';

type TicketBoardProps = {
    activeTab: 'board' | 'archived';
    setActiveTab: Dispatch<SetStateAction<'board' | 'archived'>>;
    board: BoardData;
    boardLoading: boolean;
    archived: Paginated<TicketRecord>;
    archivedLoading: boolean;
    queryFilters: Filters;
    setQueryFilters: Dispatch<SetStateAction<Filters>>;
    draggingTicketId: number | null;
    setDraggingTicketId: Dispatch<SetStateAction<number | null>>;
    dropStatus: TicketStatusKey | null;
    setDropStatus: Dispatch<SetStateAction<TicketStatusKey | null>>;
    onRefreshArchived: () => Promise<void>;
    onMoveTicketStatus: (
        ticketId: number,
        nextStatus: TicketStatusKey,
    ) => Promise<void>;
    onOpenTicket: (ticketId: number) => Promise<void>;
    onOpenArchivedPage: (page: number) => Promise<void>;
};

export function TicketBoard({
    activeTab,
    setActiveTab,
    board,
    boardLoading,
    archived,
    archivedLoading,
    queryFilters,
    setQueryFilters,
    draggingTicketId,
    setDraggingTicketId,
    dropStatus,
    setDropStatus,
    onRefreshArchived,
    onMoveTicketStatus,
    onOpenTicket,
    onOpenArchivedPage,
}: TicketBoardProps) {
    const boardTotals = useMemo(() => {
        return {
            todo: board.todo.length,
            in_progress: board.in_progress.length,
            to_review: board.to_review.length,
            done: board.done.length,
        };
    }, [board]);

    const hasBoardContent =
        board.todo.length > 0 ||
        board.in_progress.length > 0 ||
        board.to_review.length > 0 ||
        board.done.length > 0;

    const handleDrop = async (
        event: DragEvent<HTMLElement>,
        nextStatus: TicketStatusKey,
    ): Promise<void> => {
        event.preventDefault();
        setDropStatus(null);

        if (draggingTicketId === null) {
            return;
        }

        await onMoveTicketStatus(draggingTicketId, nextStatus);
        setDraggingTicketId(null);
    };

    return (
        <Tabs
            value={activeTab}
            onValueChange={(nextTab) => {
                const resolvedTab = nextTab === 'archived' ? 'archived' : 'board';

                setActiveTab(resolvedTab);

                if (resolvedTab === 'archived') {
                    void onRefreshArchived();
                }
            }}
            className="min-h-0 flex-1"
        >
            <TabsList className="mb-4 border-border bg-surface">
                <TabsTrigger value="board" className="text-xs">
                    Board
                </TabsTrigger>
                <TabsTrigger value="archived" className="text-xs">
                    Archived
                </TabsTrigger>
            </TabsList>

            <TabsContent value="board" className="min-h-0 flex-1">
                <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-1">
                    {statusColumns.map((column) => (
                        <TicketColumn
                            key={column.key}
                            columnKey={column.key}
                            columnLabel={column.label}
                            tickets={board[column.key]}
                            count={boardTotals[column.key]}
                            isDropTarget={dropStatus === column.key}
                            canDrop={draggingTicketId !== null}
                            onDragOver={(event) => {
                                event.preventDefault();
                                setDropStatus(column.key);
                            }}
                            onDragLeave={() => {
                                setDropStatus(null);
                            }}
                            onDrop={(event) => {
                                void handleDrop(event, column.key);
                            }}
                            onOpenTicket={(ticketId) => {
                                void onOpenTicket(ticketId);
                            }}
                            onTicketDragStart={(ticketId, event) => {
                                event.dataTransfer.effectAllowed = 'move';
                                setDraggingTicketId(ticketId);
                            }}
                            onTicketDragEnd={() => {
                                setDraggingTicketId(null);
                                setDropStatus(null);
                            }}
                        />
                    ))}

                    {!hasBoardContent && !boardLoading ? (
                        <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-surface/40 px-8 text-sm text-zinc-500">
                            No tickets match the current filters.
                        </div>
                    ) : null}
                </div>
            </TabsContent>

            <TabsContent value="archived" className="min-h-0 flex-1">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface">
                    <ScrollArea className="min-h-0 flex-1">
                        <Table className="min-w-[63.75rem]">
                            <TableHeader className="sticky top-0 z-10 bg-zinc-900/40">
                                <TableRow className="hover:bg-transparent">
                                    <TableHead className="w-[34%]">
                                        <HeaderButton
                                            label="Title"
                                            sortKey="title"
                                            currentSort={queryFilters.sort}
                                            currentDirection={queryFilters.direction}
                                            onClick={(nextDirection) => {
                                                setQueryFilters((current) => ({
                                                    ...current,
                                                    sort: 'title',
                                                    direction: nextDirection,
                                                }));
                                            }}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[9%]">
                                        <HeaderButton
                                            label="Type"
                                            sortKey="type"
                                            currentSort={queryFilters.sort}
                                            currentDirection={queryFilters.direction}
                                            onClick={(nextDirection) => {
                                                setQueryFilters((current) => ({
                                                    ...current,
                                                    sort: 'type',
                                                    direction: nextDirection,
                                                }));
                                            }}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[10%]">
                                        <HeaderButton
                                            label="Priority"
                                            sortKey="importance"
                                            currentSort={queryFilters.sort}
                                            currentDirection={queryFilters.direction}
                                            onClick={(nextDirection) => {
                                                setQueryFilters((current) => ({
                                                    ...current,
                                                    sort: 'importance',
                                                    direction: nextDirection,
                                                }));
                                            }}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[16%] text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                                        Assignee
                                    </TableHead>
                                    <TableHead className="w-[11%]">
                                        <HeaderButton
                                            label="Status"
                                            sortKey="status"
                                            currentSort={queryFilters.sort}
                                            currentDirection={queryFilters.direction}
                                            onClick={(nextDirection) => {
                                                setQueryFilters((current) => ({
                                                    ...current,
                                                    sort: 'status',
                                                    direction: nextDirection,
                                                }));
                                            }}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[14%]">
                                        <HeaderButton
                                            label="Updated"
                                            sortKey="updated_at"
                                            currentSort={queryFilters.sort}
                                            currentDirection={queryFilters.direction}
                                            onClick={(nextDirection) => {
                                                setQueryFilters((current) => ({
                                                    ...current,
                                                    sort: 'updated_at',
                                                    direction: nextDirection,
                                                }));
                                            }}
                                        />
                                    </TableHead>
                                    <TableHead className="w-[14%]">
                                        <HeaderButton
                                            label="Created"
                                            sortKey="created_at"
                                            currentSort={queryFilters.sort}
                                            currentDirection={queryFilters.direction}
                                            onClick={(nextDirection) => {
                                                setQueryFilters((current) => ({
                                                    ...current,
                                                    sort: 'created_at',
                                                    direction: nextDirection,
                                                }));
                                            }}
                                        />
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {archivedLoading ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="px-4 py-8 text-sm text-zinc-500"
                                        >
                                            Loading archived tickets...
                                        </TableCell>
                                    </TableRow>
                                ) : archived.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="px-4 py-8 text-sm text-zinc-500"
                                        >
                                            No archived tickets found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    archived.data.map((ticket) => (
                                        <TableRow
                                            key={ticket.id}
                                            className="hover:bg-zinc-900/35"
                                        >
                                            <TableCell className="text-sm text-zinc-100">
                                                <button
                                                    type="button"
                                                    className="w-full text-left underline-offset-4 transition-colors hover:text-zinc-50 hover:underline"
                                                    onClick={() =>
                                                        void onOpenTicket(
                                                            ticket.id,
                                                        )
                                                    }
                                                >
                                                    {highlightSearchMatch(
                                                        ticket.title,
                                                        queryFilters.search,
                                                    )}
                                                </button>
                                            </TableCell>
                                            <TableCell>
                                                <TypeBadge type={ticket.type} />
                                            </TableCell>
                                            <TableCell>
                                                <ImportanceLabel
                                                    importance={ticket.importance}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <AssigneeLabel
                                                    name={
                                                        ticket.assignee_admin
                                                            ?.name ?? null
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge
                                                    status={ticket.status}
                                                />
                                            </TableCell>
                                            <TableCell className="text-xs text-zinc-500">
                                                {formatDateTime(ticket.updated_at)}
                                            </TableCell>
                                            <TableCell className="text-xs text-zinc-500">
                                                {formatDateTime(ticket.created_at)}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </ScrollArea>

                    <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-zinc-500">
                        <p>
                            Showing {archived.meta.from ?? 0}-{archived.meta.to ?? 0}{' '}
                            of {archived.meta.total}
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                className="h-7 px-2 text-[0.6875rem]"
                                disabled={archived.meta.current_page <= 1}
                                onClick={() =>
                                    void onOpenArchivedPage(
                                        archived.meta.current_page - 1,
                                    )
                                }
                            >
                                Prev
                            </Button>
                            <span>
                                {archived.meta.current_page} /{' '}
                                {archived.meta.last_page}
                            </span>
                            <Button
                                type="button"
                                variant="secondary"
                                className="h-7 px-2 text-[0.6875rem]"
                                disabled={
                                    archived.meta.current_page >=
                                    archived.meta.last_page
                                }
                                onClick={() =>
                                    void onOpenArchivedPage(
                                        archived.meta.current_page + 1,
                                    )
                                }
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    );
}
