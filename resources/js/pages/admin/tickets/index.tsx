import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Archive,
    CalendarClock,
    CheckCircle2,
    CircleDot,
    LoaderCircle,
    Paperclip,
    Plus,
} from 'lucide-react';
import {
    useCallback,
    ChangeEvent,
    FormEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import AppLayout from '@/layouts/app-layout';
import { ticketUserSearch as adminTicketUserSearch } from '@/routes/admin/api';
import {
    index as adminTicketIndex,
    auditLogs as adminTicketAuditLogs,
    moveStatus as adminTicketMoveStatus,
    show as adminTicketShow,
    store as adminTicketStore,
    update as adminTicketUpdate,
} from '@/routes/admin/api/tickets';
import {
    destroy as adminTicketAttachmentDestroy,
    store as adminTicketAttachmentStore,
} from '@/routes/admin/api/tickets/attachments';
import { upsert as adminTicketInternalNoteUpsert } from '@/routes/admin/api/tickets/internal-note';
import { index as adminIndex } from '@/routes/admin';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { TicketBoard } from './components/TicketBoard';
import { TicketCreateDialog } from './components/TicketCreateDialog';
import { TicketFilters } from './components/TicketFilters';
import {
    type DescriptionUserRef,
    TicketDescriptionEditor,
    type TicketDescriptionValue,
} from './components/ticket-description-editor';
import {
    AssigneeLabel,
    HeaderButton,
    highlightSearchMatch,
    ImportanceDot,
    ImportanceLabel,
    SelectField,
    TypeBadge,
} from './components/ticket-ui';
import { statusColumns } from './constants';
import {
    buildDescriptionPayload,
    buildTicketUpdatePayload,
    csrfToken,
    descriptionHtmlFromPayload,
    descriptionUserRefsFromPayload,
    formatAuditEvent,
    formatDateTime,
    formatDuration,
    formatRelative,
    normalizeTicketPayload,
    parseRequestError,
    withoutFieldError,
} from './lib/ticket-utils';
import { useTicketBoardData } from './hooks/useTicketBoardData';
import { useTicketRealtime } from './hooks/useTicketRealtime';
import type {
    AdminOption,
    BoardData,
    Filters,
    Paginated,
    RequestFieldErrors,
    TicketAudit,
    TicketImportance,
    TicketRecord,
    TicketStatusKey,
    TicketSyncState,
    TicketType,
    UserSearchResult,
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
        href: '/admin/tickets',
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

    const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(
        null,
    );
    const [ticketTitleDraft, setTicketTitleDraft] = useState('');
    const [ticketTypeDraft, setTicketTypeDraft] =
        useState<TicketType>('feature');
    const [ticketImportanceDraft, setTicketImportanceDraft] =
        useState<TicketImportance>('normal');
    const [ticketAssigneeDraftId, setTicketAssigneeDraftId] = useState<
        number | null
    >(null);
    const [ticketDetailOpen, setTicketDetailOpen] = useState(false);
    const [, setTicketDetailSaving] = useState(false);
    const [ticketDetailError, setTicketDetailError] = useState<string | null>(
        null,
    );
    const [ticketDetailFieldErrors, setTicketDetailFieldErrors] =
        useState<RequestFieldErrors>({});
    const [ticketDetailTab, setTicketDetailTab] = useState<
        'overview' | 'audit'
    >('overview');
    const [ticketAuditLogs, setTicketAuditLogs] = useState<TicketAudit[]>([]);
    const [ticketAuditLoading, setTicketAuditLoading] = useState(false);
    const [ticketInternalNote, setTicketInternalNote] = useState('');
    const [ticketAttachmentUploading, setTicketAttachmentUploading] =
        useState(false);
    const [ticketDetailDescriptionHtml, setTicketDetailDescriptionHtml] =
        useState('');
    const [
        ticketDetailDescriptionMentions,
        setTicketDetailDescriptionMentions,
    ] = useState<number[]>([]);
    const [
        ticketDetailDescriptionUserRefs,
        setTicketDetailDescriptionUserRefs,
    ] = useState<DescriptionUserRef[]>([]);
    const [ticketSyncState, setTicketSyncState] =
        useState<TicketSyncState>('idle');
    const [ticketSyncMessage, setTicketSyncMessage] =
        useState('All changes saved');
    const [savedTicketPayloadHash, setSavedTicketPayloadHash] = useState<
        string | null
    >(null);
    const [savedInternalNoteValue, setSavedInternalNoteValue] = useState('');

    const activeSyncRequestId = useRef(0);

    useEffect(() => {
        if (selectedTicket === null) {
            setTicketTitleDraft('');
            setTicketTypeDraft('feature');
            setTicketImportanceDraft('normal');
            setTicketAssigneeDraftId(null);
            setTicketInternalNote('');
            setTicketDetailDescriptionHtml('');
            setTicketDetailDescriptionMentions([]);
            setTicketDetailDescriptionUserRefs([]);
            setSavedTicketPayloadHash(null);
            setSavedInternalNoteValue('');
            setTicketSyncState('idle');
            setTicketSyncMessage('All changes saved');

            return;
        }

        const descriptionHtml = descriptionHtmlFromPayload(
            selectedTicket.description,
        );
        const mentionAdminIds = selectedTicket.mentions.map(
            (mention) => mention.mentioned_admin_id,
        );
        const userRefs = descriptionUserRefsFromPayload(
            selectedTicket.description,
        );
        const internalNoteValue = selectedTicket.internal_note?.content ?? '';

        setTicketTitleDraft(selectedTicket.title);
        setTicketTypeDraft(selectedTicket.type);
        setTicketImportanceDraft(selectedTicket.importance);
        setTicketAssigneeDraftId(selectedTicket.assignee_admin_id);
        setTicketInternalNote(internalNoteValue);
        setTicketDetailDescriptionHtml(descriptionHtml);
        setTicketDetailDescriptionMentions(mentionAdminIds);
        setTicketDetailDescriptionUserRefs(userRefs);
        setSavedTicketPayloadHash(
            JSON.stringify(
                buildTicketUpdatePayload(
                    {
                        title: selectedTicket.title,
                        type: selectedTicket.type,
                        importance: selectedTicket.importance,
                        assignee_admin_id: selectedTicket.assignee_admin_id,
                    },
                    descriptionHtml,
                    mentionAdminIds,
                    userRefs,
                ),
            ),
        );
        setSavedInternalNoteValue(internalNoteValue);
        setTicketDetailFieldErrors({});
        setTicketDetailError(null);
        setTicketSyncState('idle');
        setTicketSyncMessage('All changes saved');
    }, [selectedTicket?.id]);

    const ticketDetailPayload = useMemo(() => {
        if (selectedTicket === null) {
            return null;
        }

        return buildTicketUpdatePayload(
            {
                title: ticketTitleDraft,
                type: ticketTypeDraft,
                importance: ticketImportanceDraft,
                assignee_admin_id: ticketAssigneeDraftId,
            },
            ticketDetailDescriptionHtml,
            ticketDetailDescriptionMentions,
            ticketDetailDescriptionUserRefs,
        );
    }, [
        selectedTicket,
        ticketAssigneeDraftId,
        ticketDetailDescriptionHtml,
        ticketDetailDescriptionMentions,
        ticketDetailDescriptionUserRefs,
        ticketImportanceDraft,
        ticketTitleDraft,
        ticketTypeDraft,
    ]);

    const ticketDetailPayloadHash = useMemo(() => {
        if (ticketDetailPayload === null) {
            return null;
        }

        return JSON.stringify(ticketDetailPayload);
    }, [ticketDetailPayload]);

    useEffect(() => {
        if (
            !ticketDetailOpen ||
            ticketDetailTab !== 'overview' ||
            selectedTicket === null ||
            ticketDetailPayload === null ||
            ticketDetailPayloadHash === null ||
            savedTicketPayloadHash === null ||
            ticketDetailPayloadHash === savedTicketPayloadHash
        ) {
            return;
        }

        setTicketSyncState('dirty');
        setTicketSyncMessage('Changes pending sync');

        const timeoutId = window.setTimeout(() => {
            void persistTicketChanges(
                ticketDetailPayload,
                ticketDetailPayloadHash,
            );
        }, 480);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [
        ticketDetailOpen,
        ticketDetailPayload,
        ticketDetailPayloadHash,
        ticketDetailTab,
        savedTicketPayloadHash,
        selectedTicket,
    ]);

    useEffect(() => {
        if (
            !ticketDetailOpen ||
            ticketDetailTab !== 'overview' ||
            selectedTicket === null ||
            ticketInternalNote === savedInternalNoteValue
        ) {
            return;
        }

        setTicketSyncState('dirty');
        setTicketSyncMessage('Changes pending sync');

        const timeoutId = window.setTimeout(() => {
            void persistInternalNote(ticketInternalNote);
        }, 640);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [
        savedInternalNoteValue,
        selectedTicket,
        ticketDetailOpen,
        ticketDetailTab,
        ticketInternalNote,
    ]);

    useEffect(() => {
        if (ticketSyncState !== 'saved') {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setTicketSyncState('idle');
            setTicketSyncMessage('All changes saved');
        }, 1600);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [ticketSyncState]);

    const createTicket = async (
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
            const route = adminTicketStore();

            const response = await fetch(route.url, {
                method: route.method,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    title: newTicketTitle.trim(),
                    description: buildDescriptionPayload(
                        newTicketDescriptionHtml,
                        newTicketMentions,
                        newTicketUserRefs,
                    ),
                    type: newTicketType,
                    importance: newTicketImportance,
                    assignee_admin_id:
                        newTicketAssigneeId > 0 ? newTicketAssigneeId : null,
                    mention_admin_ids: newTicketMentions,
                }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                const { message, fieldErrors } = parseRequestError(
                    payload,
                    'Could not create ticket.',
                );
                setNewTicketError(message);
                setNewTicketFieldErrors(fieldErrors);

                return;
            }

            const payload = normalizeTicketPayload<TicketRecord>(
                await response.json(),
            );

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

            if (payload !== null) {
                setSelectedTicket(payload);
                setTicketDetailOpen(true);
            }

            await refreshBoard();
        } finally {
            setTicketCreateBusy(false);
        }
    };

    const moveTicketStatus = async (
        ticketId: number,
        nextStatus: TicketStatusKey,
    ): Promise<void> => {
        const route = adminTicketMoveStatus(ticketId);

        const response = await fetch(route.url, {
            method: route.method,
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken(),
            },
            body: JSON.stringify({ status: nextStatus }),
        });

        if (!response.ok) {
            return;
        }

        await refreshBoard();

        if (activeTab === 'archived') {
            await refreshArchived();
        }

        if (selectedTicket?.id === ticketId) {
            await openTicketDetail(ticketId);
        }
    };

    const openTicketDetail = useCallback(
        async (ticketId: number): Promise<void> => {
            const route = adminTicketShow(ticketId);

            const response = await fetch(route.url, {
                method: route.method,
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                return;
            }

            const payload = normalizeTicketPayload<TicketRecord>(
                await response.json(),
            );

            if (payload === null) {
                return;
            }

            setSelectedTicket(payload);
            setTicketDetailOpen(true);
        },
        [],
    );

    const persistTicketChanges = async (
        changes: ReturnType<typeof buildTicketUpdatePayload>,
        payloadHash: string,
    ): Promise<void> => {
        if (selectedTicket === null) {
            return;
        }

        const requestId = activeSyncRequestId.current + 1;
        activeSyncRequestId.current = requestId;
        setTicketDetailSaving(true);
        setTicketDetailError(null);
        setTicketDetailFieldErrors({});
        setTicketSyncState('syncing');
        setTicketSyncMessage('Syncing changes...');

        try {
            const route = adminTicketUpdate.form.patch(selectedTicket.id);

            const response = await fetch(route.action, {
                method: route.method,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify(changes),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                const { message, fieldErrors } = parseRequestError(
                    payload,
                    'Could not sync ticket changes.',
                );
                setTicketDetailError(message);
                setTicketDetailFieldErrors(fieldErrors);
                setTicketSyncState('error');
                setTicketSyncMessage('Sync failed');

                return;
            }

            const payload = normalizeTicketPayload<TicketRecord>(
                await response.json(),
            );

            if (requestId !== activeSyncRequestId.current) {
                return;
            }

            if (payload !== null) {
                setSelectedTicket(payload);
            }

            setSavedTicketPayloadHash(payloadHash);
            setTicketSyncState('saved');
            setTicketSyncMessage('All changes saved');

            await refreshBoard();

            if (activeTab === 'archived') {
                await refreshArchived();
            }
        } finally {
            setTicketDetailSaving(false);
        }
    };

    const uploadAttachment = async (
        event: ChangeEvent<HTMLInputElement>,
    ): Promise<void> => {
        if (selectedTicket === null) {
            return;
        }

        const file = event.target.files?.[0];

        if (file === undefined) {
            return;
        }

        setTicketAttachmentUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const route = adminTicketAttachmentStore(selectedTicket.id);

            const response = await fetch(route.url, {
                method: route.method,
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: formData,
            });

            if (!response.ok) {
                return;
            }

            await openTicketDetail(selectedTicket.id);
            await refreshBoard();
            await refreshArchived();
        } finally {
            setTicketAttachmentUploading(false);
            event.target.value = '';
        }
    };

    const removeAttachment = async (attachmentId: number): Promise<void> => {
        if (selectedTicket === null) {
            return;
        }

        const route = adminTicketAttachmentDestroy.form.delete({
            ticket: selectedTicket.id,
            ticketAttachment: attachmentId,
        });

        const response = await fetch(route.action, {
            method: route.method,
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken(),
            },
        });

        if (!response.ok) {
            return;
        }

        await openTicketDetail(selectedTicket.id);
        await refreshBoard();
        await refreshArchived();
    };

    const persistInternalNote = async (content: string): Promise<void> => {
        if (selectedTicket === null) {
            return;
        }

        setTicketDetailSaving(true);
        setTicketDetailError(null);
        setTicketDetailFieldErrors({});
        setTicketSyncState('syncing');
        setTicketSyncMessage('Syncing notes...');

        try {
            const route = adminTicketInternalNoteUpsert.form.put(
                selectedTicket.id,
            );

            const response = await fetch(route.action, {
                method: route.method,
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                const { message, fieldErrors } = parseRequestError(
                    payload,
                    'Could not sync internal note.',
                );
                setTicketDetailError(message);
                setTicketDetailFieldErrors(fieldErrors);
                setTicketSyncState('error');
                setTicketSyncMessage('Sync failed');
                return;
            }

            setSavedInternalNoteValue(content);
            setTicketSyncState('saved');
            setTicketSyncMessage('All changes saved');
            await openTicketDetail(selectedTicket.id);
        } finally {
            setTicketDetailSaving(false);
        }
    };

    const loadAuditLogs = async (): Promise<void> => {
        if (selectedTicket === null) {
            return;
        }

        setTicketAuditLoading(true);

        try {
            const route = adminTicketAuditLogs(selectedTicket.id, {
                query: { per_page: 50 },
            });

            const response = await fetch(route.url, {
                method: route.method,
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as {
                data: TicketAudit[];
            };
            setTicketAuditLogs(payload.data);
        } finally {
            setTicketAuditLoading(false);
        }
    };

    const handleOpenArchivedPage = async (page: number): Promise<void> => {
        await refreshArchived(page);
    };

    const fetchUserSearch = useCallback(
        async (query: string): Promise<UserSearchResult[]> => {
            const normalizedQuery = query.trim();

            if (normalizedQuery.length < 2 || normalizedQuery.length > 120) {
                return [];
            }

            try {
                const route = adminTicketUserSearch({
                    query: { q: normalizedQuery },
                });

                const response = await fetch(route.url, {
                    method: route.method,
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    return [];
                }

                const payload = (await response.json()) as {
                    data: UserSearchResult[];
                };

                return payload.data;
            } catch {
                return [];
            }
        },
        [],
    );

    const removeTicketQueryFromUrl = useCallback((): void => {
        if (typeof window === 'undefined') {
            return;
        }

        const nextUrl = new URL(window.location.href);
        nextUrl.searchParams.delete('ticket');
        window.history.replaceState(
            window.history.state,
            '',
            `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`,
        );
    }, []);

    useTicketRealtime({
        activeTab,
        selectedTicketId: selectedTicket?.id ?? null,
        pageUrl: page.url,
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
                            <Link href="/admin/settings">
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
                        setQueryFilters={setQueryFilters}
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
                        onMoveTicketStatus={moveTicketStatus}
                        onOpenTicket={openTicketDetail}
                        onOpenArchivedPage={handleOpenArchivedPage}
                    />
                </div>
            </div>

            <TicketCreateDialog
                open={newTicketOpen}
                onOpenChange={setNewTicketOpen}
                onSubmit={createTicket}
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
                admins={admins}
                fetchUserSearch={fetchUserSearch}
            />

            <Dialog
                open={ticketDetailOpen}
                onOpenChange={(next) => {
                    setTicketDetailOpen(next);
                    if (!next) {
                        removeTicketQueryFromUrl();
                        setSelectedTicket(null);
                        setTicketDetailTab('overview');
                        setTicketAuditLogs([]);
                        setTicketDetailError(null);
                        setTicketDetailFieldErrors({});
                        setTicketSyncState('idle');
                        setTicketSyncMessage('All changes saved');
                    }
                }}
            >
                <DialogContent
                    size="xl"
                    className="h-[min(92dvh,57.5rem)] max-w-[min(98vw,87.5rem)] overflow-hidden border-border bg-surface p-0"
                >
                    <DialogHeader className="sr-only">
                        <DialogTitle>Ticket Details</DialogTitle>
                        <DialogDescription>
                            View and edit ticket details, status, attachments,
                            internal notes, and audit trail.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedTicket === null ? null : (
                        <div className="flex h-full min-h-0 min-w-0 flex-col">
                            <div className="border-b border-border px-5 py-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-medium text-zinc-100">
                                            Ticket #{selectedTicket.id}
                                        </h2>
                                        <p className="text-xs text-zinc-500">
                                            Created{' '}
                                            {formatDateTime(
                                                selectedTicket.created_at,
                                            )}
                                        </p>
                                    </div>
                                    <Tabs
                                        value={ticketDetailTab}
                                        onValueChange={(nextTab) => {
                                            const resolvedTab =
                                                nextTab === 'audit'
                                                    ? 'audit'
                                                    : 'overview';

                                            setTicketDetailTab(resolvedTab);

                                            if (resolvedTab === 'audit') {
                                                void loadAuditLogs();
                                            }
                                        }}
                                    >
                                        <TabsList className="mr-8 border-border bg-background p-1">
                                            <TabsTrigger
                                                value="overview"
                                                className="text-xs"
                                            >
                                                Overview
                                            </TabsTrigger>
                                            <TabsTrigger
                                                value="audit"
                                                className="text-xs"
                                            >
                                                Audit Trail
                                            </TabsTrigger>
                                        </TabsList>
                                    </Tabs>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <p className="mr-1 text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                                        Status
                                    </p>
                                    <ToggleGroup
                                        type="single"
                                        value={selectedTicket.status}
                                        onValueChange={(value) => {
                                            if (value === '') {
                                                return;
                                            }

                                            void moveTicketStatus(
                                                selectedTicket.id,
                                                value as TicketStatusKey,
                                            );
                                        }}
                                        variant="outline"
                                        size="sm"
                                        className="gap-2 rounded-none bg-transparent"
                                        aria-label="Ticket status"
                                    >
                                        {statusColumns.map((statusColumn) => (
                                            <ToggleGroupItem
                                                key={statusColumn.key}
                                                value={statusColumn.key}
                                                className="h-auto rounded-md border-zinc-800 px-2.5 py-1 text-xs whitespace-nowrap text-zinc-400 transition-colors data-[state=on]:border-emerald-600 data-[state=on]:bg-emerald-950/25 data-[state=on]:text-emerald-300 hover:border-zinc-700"
                                            >
                                                {statusColumn.label}
                                            </ToggleGroupItem>
                                        ))}
                                    </ToggleGroup>
                                </div>
                            </div>

                            {ticketDetailTab === 'overview' ? (
                                <div className="flex min-h-0 flex-1 gap-4 overflow-hidden p-5">
                                    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pr-1">
                                        <div className="space-y-1">
                                            <Label htmlFor="detail-title">
                                                Title
                                            </Label>
                                            <Input
                                                id="detail-title"
                                                value={ticketTitleDraft}
                                                onChange={(event) => {
                                                    setTicketTitleDraft(
                                                        event.target.value,
                                                    );
                                                    setTicketDetailError(null);
                                                    setTicketDetailFieldErrors(
                                                        (current) =>
                                                            withoutFieldError(
                                                                current,
                                                                'title',
                                                            ),
                                                    );
                                                }}
                                            />
                                            {ticketDetailFieldErrors.title !==
                                            undefined ? (
                                                <p className="text-xs text-red-300">
                                                    {
                                                        ticketDetailFieldErrors
                                                            .title[0]
                                                    }
                                                </p>
                                            ) : null}
                                        </div>
                                        <div className="grid grid-cols-3 gap-3">
                                            <SelectField
                                                label="Type"
                                                value={ticketTypeDraft}
                                                onChange={(value) => {
                                                    setTicketTypeDraft(
                                                        value as TicketType,
                                                    );
                                                    setTicketDetailError(null);
                                                    setTicketDetailFieldErrors(
                                                        (current) =>
                                                            withoutFieldError(
                                                                current,
                                                                'type',
                                                            ),
                                                    );
                                                }}
                                                options={[
                                                    {
                                                        value: 'bug',
                                                        label: 'Bug',
                                                    },
                                                    {
                                                        value: 'feature',
                                                        label: 'Feature',
                                                    },
                                                    {
                                                        value: 'chore',
                                                        label: 'Chore',
                                                    },
                                                    {
                                                        value: 'support',
                                                        label: 'Support',
                                                    },
                                                ]}
                                            />
                                            <SelectField
                                                label="Importance"
                                                value={ticketImportanceDraft}
                                                onChange={(value) => {
                                                    setTicketImportanceDraft(
                                                        value as TicketImportance,
                                                    );
                                                    setTicketDetailError(null);
                                                    setTicketDetailFieldErrors(
                                                        (current) =>
                                                            withoutFieldError(
                                                                current,
                                                                'importance',
                                                            ),
                                                    );
                                                }}
                                                options={[
                                                    {
                                                        value: 'low',
                                                        label: 'Low',
                                                    },
                                                    {
                                                        value: 'normal',
                                                        label: 'Normal',
                                                    },
                                                    {
                                                        value: 'high',
                                                        label: 'High',
                                                    },
                                                    {
                                                        value: 'urgent',
                                                        label: 'Urgent',
                                                    },
                                                ]}
                                            />
                                            <SelectField
                                                label="Assignee"
                                                value={String(
                                                    ticketAssigneeDraftId ?? 0,
                                                )}
                                                onChange={(value) => {
                                                    setTicketAssigneeDraftId(
                                                        Number.parseInt(
                                                            value,
                                                            10,
                                                        ) || null,
                                                    );
                                                    setTicketDetailError(null);
                                                    setTicketDetailFieldErrors(
                                                        (current) =>
                                                            withoutFieldError(
                                                                current,
                                                                'assignee_admin_id',
                                                            ),
                                                    );
                                                }}
                                                options={[
                                                    {
                                                        value: '0',
                                                        label: 'Unassigned',
                                                    },
                                                    ...admins.map((admin) => ({
                                                        value: String(admin.id),
                                                        label: admin.name,
                                                    })),
                                                ]}
                                            />
                                        </div>
                                        {ticketDetailFieldErrors.type !==
                                            undefined ||
                                        ticketDetailFieldErrors.importance !==
                                            undefined ||
                                        ticketDetailFieldErrors.assignee_admin_id !==
                                            undefined ? (
                                            <div className="rounded-md border border-red-900/40 bg-red-950/20 px-3 py-2 text-xs text-red-300">
                                                {ticketDetailFieldErrors
                                                    .type?.[0] ??
                                                    ticketDetailFieldErrors
                                                        .importance?.[0] ??
                                                    ticketDetailFieldErrors
                                                        .assignee_admin_id?.[0]}
                                            </div>
                                        ) : null}

                                        <TicketDescriptionEditor
                                            label="Description"
                                            html={ticketDetailDescriptionHtml}
                                            placeholder="Update details, mention @admins, and reference /user results."
                                            admins={admins}
                                            searchUsers={fetchUserSearch}
                                            onChange={(
                                                value: TicketDescriptionValue,
                                            ) => {
                                                setTicketDetailDescriptionHtml(
                                                    value.html,
                                                );
                                                setTicketDetailDescriptionMentions(
                                                    value.mentionAdminIds,
                                                );
                                                setTicketDetailDescriptionUserRefs(
                                                    value.userRefs,
                                                );
                                                setTicketDetailError(null);
                                                setTicketDetailFieldErrors(
                                                    (current) =>
                                                        withoutFieldError(
                                                            current,
                                                            'description',
                                                        ),
                                                );
                                            }}
                                        />
                                        {ticketDetailFieldErrors.description !==
                                        undefined ? (
                                            <p className="text-xs text-red-300">
                                                {
                                                    ticketDetailFieldErrors
                                                        .description[0]
                                                }
                                            </p>
                                        ) : null}

                                        <div className="rounded-lg border border-border bg-background p-3">
                                            <div className="mb-2 flex items-center justify-between">
                                                <p className="text-xs font-medium text-zinc-300 uppercase">
                                                    Attachments
                                                </p>
                                                <label className="cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[0.6875rem] text-zinc-200 transition-colors hover:bg-zinc-700">
                                                    {ticketAttachmentUploading
                                                        ? 'Uploading...'
                                                        : 'Upload'}
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        onChange={(event) =>
                                                            void uploadAttachment(
                                                                event,
                                                            )
                                                        }
                                                        disabled={
                                                            ticketAttachmentUploading
                                                        }
                                                    />
                                                </label>
                                            </div>
                                            <div className="space-y-2">
                                                {selectedTicket.attachments
                                                    .length === 0 ? (
                                                    <p className="text-xs text-zinc-500">
                                                        No attachments yet.
                                                    </p>
                                                ) : (
                                                    selectedTicket.attachments.map(
                                                        (attachment) => (
                                                            <div
                                                                key={
                                                                    attachment.id
                                                                }
                                                                className="flex items-center justify-between gap-3 rounded border border-zinc-800 px-2 py-1"
                                                            >
                                                                <a
                                                                    href={
                                                                        attachment.download_url
                                                                    }
                                                                    target="_blank"
                                                                    className="inline-flex min-w-0 items-center gap-1 text-xs text-zinc-300 transition-colors hover:text-white"
                                                                    rel="noreferrer"
                                                                >
                                                                    <Paperclip className="h-3.5 w-3.5" />
                                                                    <span className="truncate">
                                                                        {
                                                                            attachment.display_name
                                                                        }
                                                                        {attachment.extension !==
                                                                        null
                                                                            ? `.${attachment.extension}`
                                                                            : ''}
                                                                    </span>
                                                                </a>
                                                                <button
                                                                    type="button"
                                                                    className="text-[0.6875rem] text-zinc-500 transition-colors hover:text-red-300"
                                                                    onClick={() =>
                                                                        void removeAttachment(
                                                                            attachment.id,
                                                                        )
                                                                    }
                                                                >
                                                                    Remove
                                                                </button>
                                                            </div>
                                                        ),
                                                    )
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <aside className="flex w-80 shrink-0 flex-col space-y-4 overflow-y-auto rounded-xl border border-border bg-background p-4">
                                        <div className="rounded-lg border border-zinc-800 px-3 py-2">
                                            <p className="text-[0.6875rem] text-zinc-500 uppercase">
                                                Creator
                                            </p>
                                            <p className="text-xs text-zinc-300">
                                                {selectedTicket.creator_admin
                                                    ?.name ?? 'Unknown'}
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-zinc-800 px-3 py-2">
                                            <p className="text-[0.6875rem] text-zinc-500 uppercase">
                                                Archived
                                            </p>
                                            {selectedTicket.status === 'done' &&
                                            selectedTicket.archiving_in_seconds !==
                                                null ? (
                                                <p className="inline-flex items-center gap-1 text-xs text-zinc-300">
                                                    <Archive className="h-3.5 w-3.5" />
                                                    In{' '}
                                                    {formatDuration(
                                                        selectedTicket.archiving_in_seconds,
                                                    )}
                                                </p>
                                            ) : (
                                                <p className="text-xs text-zinc-500">
                                                    Not scheduled
                                                </p>
                                            )}
                                        </div>

                                        <div className="h-full space-y-2 rounded-lg border border-zinc-800 px-3 py-2">
                                            <p className="text-[0.6875rem] text-zinc-500 uppercase">
                                                Internal Notes (Private)
                                            </p>
                                            <Textarea
                                                value={ticketInternalNote}
                                                onChange={(event) => {
                                                    setTicketInternalNote(
                                                        event.target.value,
                                                    );
                                                    setTicketDetailError(null);
                                                    setTicketDetailFieldErrors(
                                                        (current) =>
                                                            withoutFieldError(
                                                                current,
                                                                'content',
                                                            ),
                                                    );
                                                }}
                                                className="min-h-32 bg-zinc-950"
                                                placeholder="Only visible to you."
                                            />
                                            {ticketDetailFieldErrors.content !==
                                            undefined ? (
                                                <p className="text-xs text-red-300">
                                                    {
                                                        ticketDetailFieldErrors
                                                            .content[0]
                                                    }
                                                </p>
                                            ) : null}
                                        </div>
                                    </aside>
                                </div>
                            ) : (
                                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden px-5 py-4">
                                    {ticketAuditLoading ? (
                                        <p className="text-sm text-zinc-500">
                                            Loading audit trail...
                                        </p>
                                    ) : ticketAuditLogs.length === 0 ? (
                                        <p className="text-sm text-zinc-500">
                                            No audit events yet.
                                        </p>
                                    ) : (
                                        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 overflow-x-hidden overflow-y-auto pr-1">
                                            {ticketAuditLogs.map((auditLog) => (
                                                <div
                                                    key={auditLog.id}
                                                    className="max-w-full min-w-0 shrink-0 rounded-md border border-border bg-background px-3 py-2"
                                                >
                                                    <p className="text-xs font-medium text-zinc-200">
                                                        {formatAuditEvent(
                                                            auditLog.event_type,
                                                        )}
                                                    </p>
                                                    <p className="mt-1 text-xs text-zinc-500">
                                                        {auditLog.actor_admin
                                                            ?.name ??
                                                            'System'}{' '}
                                                        •{' '}
                                                        {formatDateTime(
                                                            auditLog.created_at,
                                                        )}
                                                    </p>
                                                    {auditLog.meta !== null ? (
                                                        <pre className="mt-2 max-h-56 w-full max-w-full overflow-x-hidden overflow-y-auto rounded border border-zinc-800 bg-zinc-950 p-2 text-[0.6875rem] [overflow-wrap:anywhere] break-words whitespace-pre-wrap text-zinc-400">
                                                            {JSON.stringify(
                                                                auditLog.meta,
                                                                null,
                                                                2,
                                                            )}
                                                        </pre>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {ticketDetailError !== null ? (
                                <div className="border-t border-red-900/50 bg-red-950/20 px-5 py-2 text-xs text-red-300">
                                    {ticketDetailError}
                                </div>
                            ) : null}

                            {ticketDetailTab === 'overview' ? (
                                <div className="border-t border-border px-5 py-3">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() =>
                                                setTicketDetailOpen(false)
                                            }
                                        >
                                            Close
                                        </Button>
                                    </div>
                                </div>
                            ) : null}

                            {ticketDetailTab === 'overview' ? (
                                <div className="pointer-events-none absolute bottom-4 left-4 inline-flex w-fit items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/90 px-2.5 py-1 text-[0.6875rem] text-zinc-400">
                                    {ticketSyncState === 'syncing' ||
                                    ticketSyncState === 'dirty' ? (
                                        <LoaderCircle className="h-3.5 w-3.5 animate-spin text-zinc-300" />
                                    ) : ticketSyncState === 'saved' ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                    ) : ticketSyncState === 'error' ? (
                                        <AlertCircle className="h-3.5 w-3.5 text-red-300" />
                                    ) : (
                                        <CircleDot className="h-3.5 w-3.5 text-zinc-500" />
                                    )}
                                    <span>{ticketSyncMessage}</span>
                                </div>
                            ) : null}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
