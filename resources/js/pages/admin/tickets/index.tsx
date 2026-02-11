import { Head, Link, usePage } from '@inertiajs/react';
import { Plus } from 'lucide-react';
import type {
    FormEvent} from 'react';
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as adminIndex } from '@/routes/admin';
import { show as adminSettingsShow } from '@/routes/admin/settings';
import { index as adminTicketsIndex } from '@/routes/admin/tickets';
import type { BreadcrumbItem, SharedData } from '@/types';
import type { DescriptionUserRef } from './components/ticket-description-editor';
import { TicketBoard } from './components/TicketBoard';
import { TicketCreateDialog } from './components/TicketCreateDialog';
import { TicketDetailSheet } from './components/TicketDetailSheet';
import { TicketFilters } from './components/TicketFilters';
import { useTicketBoardData } from './hooks/useTicketBoardData';
import { useTicketMutations } from './hooks/useTicketMutations';
import { useTicketRealtime } from './hooks/useTicketRealtime';
import { useTicketSelection } from './hooks/useTicketSelection';
import type {
    AdminOption,
    BoardData,
    Filters,
    Paginated,
    RequestFieldErrors,
    TicketImportance,
    TicketRecord,
    TicketStatusKey,
    TicketType,
} from './types';

type TicketsPageProps = {
    initialBoard: BoardData;
    initialArchived: Paginated<TicketRecord>;
    filters: Filters;
    admins: AdminOption[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Console',
        href: adminIndex().url,
    },
    {
        title: 'Tickets',
        href: adminTicketsIndex().url,
    },
];

export default function AdminTickets({
    initialBoard,
    initialArchived,
    filters,
    admins,
}: TicketsPageProps) {
    const page = usePage<SharedData>();
    const { auth } = page.props;
    const {
        activeTab,
        setActiveTab,
        board,
        archived,
        queryFilters,
        setQueryFilters,
        boardLoading,
        archivedLoading,
        refreshBoard,
        refreshArchived,
    } = useTicketBoardData({
        initialBoard,
        initialArchived,
        initialFilters: filters,
    });
    const {
        selectedTicketId,
        ticketDetailOpen,
        openTicket,
        closeTicket,
    } = useTicketSelection({ pageUrl: page.url });

    const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(
        null,
    );
    const [draggingTicketId, setDraggingTicketId] = useState<number | null>(
        null,
    );
    const [dropStatus, setDropStatus] = useState<TicketStatusKey | null>(null);

    const [newTicketOpen, setNewTicketOpen] = useState(false);
    const [ticketCreateBusy, setTicketCreateBusy] = useState(false);
    const [newTicketError, setNewTicketError] = useState<string | null>(null);
    const [newTicketFieldErrors, setNewTicketFieldErrors] =
        useState<RequestFieldErrors>({});
    const [newTicketTitle, setNewTicketTitle] = useState('');
    const [newTicketType, setNewTicketType] = useState<TicketType>('feature');
    const [newTicketImportance, setNewTicketImportance] =
        useState<TicketImportance>('normal');
    const [newTicketAssigneeId, setNewTicketAssigneeId] = useState<number>(0);
    const [newTicketAssigneeQuery, setNewTicketAssigneeQuery] = useState('');
    const [newTicketAssigneeDropdownOpen, setNewTicketAssigneeDropdownOpen] =
        useState(false);
    const [newTicketDescriptionHtml, setNewTicketDescriptionHtml] =
        useState('');
    const [newTicketDescriptionText, setNewTicketDescriptionText] =
        useState('');
    const [newTicketMentions, setNewTicketMentions] = useState<number[]>([]);
    const [newTicketUserRefs, setNewTicketUserRefs] = useState<
        DescriptionUserRef[]
    >([]);

    const adminsWithoutCurrentUser = useMemo(
        () => admins.filter((admin) => admin.id !== auth.user.id),
        [admins, auth.user.id],
    );

    const {
        createTicket,
        fetchTicket,
        moveTicketStatus,
        updateTicket,
        upsertInternalNote,
        uploadAttachment,
        removeAttachment,
        loadAuditLogs,
        fetchUserSearch,
    } = useTicketMutations({
        activeTab,
        refreshBoard: async () => {
            await refreshBoard();
        },
        refreshArchived: async () => {
            await refreshArchived();
        },
    });

    const ticketLoadRequestId = useRef(0);

    const loadTicketDetail = useCallback(
        async (ticketId: number): Promise<TicketRecord | null> => {
            const requestId = ticketLoadRequestId.current + 1;
            ticketLoadRequestId.current = requestId;

            const ticketPayload = await fetchTicket(ticketId);

            if (requestId !== ticketLoadRequestId.current) {
                return null;
            }

            if (ticketPayload === null) {
                closeTicket();
                setSelectedTicket(null);
                return null;
            }

            setSelectedTicket(ticketPayload);
            return ticketPayload;
        },
        [closeTicket, fetchTicket],
    );

    const openTicketDetail = useCallback(
        async (ticketId: number): Promise<void> => {
            openTicket(ticketId);
            await loadTicketDetail(ticketId);
        },
        [loadTicketDetail, openTicket],
    );

    const closeTicketDetail = useCallback((): void => {
        closeTicket();
        setSelectedTicket(null);
    }, [closeTicket]);

    useEffect(() => {
        if (!ticketDetailOpen || selectedTicketId === null) {
            setSelectedTicket(null);
            return;
        }

        void loadTicketDetail(selectedTicketId);
    }, [loadTicketDetail, selectedTicketId, ticketDetailOpen]);

    const handleCreateTicket = async (
        event: FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        event.preventDefault();

        if (newTicketTitle.trim() === '') {
            setNewTicketFieldErrors({
                title: ['Title is required.'],
            });
            return;
        }

        setTicketCreateBusy(true);
        setNewTicketError(null);
        setNewTicketFieldErrors({});

        try {
            const response = await createTicket({
                title: newTicketTitle.trim(),
                descriptionHtml: newTicketDescriptionHtml,
                mentionAdminIds: newTicketMentions,
                userRefs: newTicketUserRefs,
                type: newTicketType,
                importance: newTicketImportance,
                assigneeAdminId:
                    newTicketAssigneeId > 0 ? newTicketAssigneeId : null,
            });

            if (!response.ok) {
                setNewTicketError(response.message);
                setNewTicketFieldErrors(response.fieldErrors);
                return;
            }

            setNewTicketOpen(false);
            setNewTicketTitle('');
            setNewTicketDescriptionHtml('');
            setNewTicketDescriptionText('');
            setNewTicketType('feature');
            setNewTicketImportance('normal');
            setNewTicketAssigneeId(0);
            setNewTicketAssigneeQuery('');
            setNewTicketAssigneeDropdownOpen(false);
            setNewTicketMentions([]);
            setNewTicketUserRefs([]);
            setNewTicketError(null);
            setNewTicketFieldErrors({});

            if (response.data !== null) {
                openTicket(response.data.id);
                setSelectedTicket(response.data);
            }
        } finally {
            setTicketCreateBusy(false);
        }
    };

    const handleMoveTicketStatus = useCallback(
        async (ticketId: number, nextStatus: TicketStatusKey): Promise<void> => {
            const updatedTicket = await moveTicketStatus(ticketId, nextStatus);

            if (selectedTicket?.id === ticketId && updatedTicket !== null) {
                setSelectedTicket(updatedTicket);
            }
        },
        [moveTicketStatus, selectedTicket?.id],
    );

    useTicketRealtime({
        activeTab,
        selectedTicketId,
        refreshBoard: async () => {
            await refreshBoard();
        },
        refreshArchived: async () => {
            await refreshArchived();
        },
        openTicketDetail,
    });

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tickets" />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <header className="border-b border-border px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                                Internal Ops
                            </p>
                            <h1 className="mt-1 text-4xl font-medium text-zinc-100">
                                Tickets
                            </h1>
                            <p className="mt-2 text-xs text-zinc-500">
                                Admin-only kanban workflow with private notes,
                                mentions, audit trail, and delayed archiving.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link href={adminSettingsShow().url}>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="h-9 px-3"
                                >
                                    Admin Settings
                                </Button>
                            </Link>
                            <Button
                                type="button"
                                className="h-9"
                                onClick={() => setNewTicketOpen(true)}
                            >
                                <Plus className="mr-1.5 h-4 w-4" />
                                New Ticket
                            </Button>
                        </div>
                    </div>
                </header>

                <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-5">
                    <TicketFilters
                        queryFilters={queryFilters}
                        admins={admins}
                        onFiltersChange={setQueryFilters}
                    />

                    <TicketBoard
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        board={board}
                        boardLoading={boardLoading}
                        archived={archived}
                        archivedLoading={archivedLoading}
                        queryFilters={queryFilters}
                        setQueryFilters={setQueryFilters}
                        draggingTicketId={draggingTicketId}
                        setDraggingTicketId={setDraggingTicketId}
                        dropStatus={dropStatus}
                        setDropStatus={setDropStatus}
                        onRefreshArchived={async () => {
                            await refreshArchived();
                        }}
                        onMoveTicketStatus={handleMoveTicketStatus}
                        onOpenTicket={openTicketDetail}
                        onOpenArchivedPage={async (pageNumber) => {
                            await refreshArchived(pageNumber);
                        }}
                    />
                </div>
            </div>

            <TicketCreateDialog
                open={newTicketOpen}
                onOpenChange={setNewTicketOpen}
                onSubmit={handleCreateTicket}
                ticketCreateBusy={ticketCreateBusy}
                newTicketError={newTicketError}
                newTicketFieldErrors={newTicketFieldErrors}
                newTicketTitle={newTicketTitle}
                setNewTicketTitle={setNewTicketTitle}
                newTicketType={newTicketType}
                setNewTicketType={setNewTicketType}
                newTicketImportance={newTicketImportance}
                setNewTicketImportance={setNewTicketImportance}
                newTicketAssigneeId={newTicketAssigneeId}
                setNewTicketAssigneeId={setNewTicketAssigneeId}
                newTicketAssigneeQuery={newTicketAssigneeQuery}
                setNewTicketAssigneeQuery={setNewTicketAssigneeQuery}
                newTicketAssigneeDropdownOpen={newTicketAssigneeDropdownOpen}
                setNewTicketAssigneeDropdownOpen={
                    setNewTicketAssigneeDropdownOpen
                }
                newTicketDescriptionHtml={newTicketDescriptionHtml}
                setNewTicketDescriptionHtml={setNewTicketDescriptionHtml}
                newTicketDescriptionText={newTicketDescriptionText}
                setNewTicketDescriptionText={setNewTicketDescriptionText}
                setNewTicketMentions={setNewTicketMentions}
                setNewTicketUserRefs={setNewTicketUserRefs}
                setNewTicketError={setNewTicketError}
                setNewTicketFieldErrors={setNewTicketFieldErrors}
                admins={adminsWithoutCurrentUser}
                fetchUserSearch={fetchUserSearch}
            />

            <TicketDetailSheet
                open={ticketDetailOpen}
                ticket={selectedTicket}
                admins={admins}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        closeTicketDetail();
                    }
                }}
                onTicketChange={setSelectedTicket}
                onMoveStatus={moveTicketStatus}
                onUpdateTicket={updateTicket}
                onUpsertInternalNote={upsertInternalNote}
                onUploadAttachment={uploadAttachment}
                onRemoveAttachment={removeAttachment}
                onLoadAuditLogs={loadAuditLogs}
                searchUsers={fetchUserSearch}
            />
        </AppLayout>
    );
}
