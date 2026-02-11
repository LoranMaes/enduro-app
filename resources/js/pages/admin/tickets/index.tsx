import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    Archive,
    ArrowDown,
    ArrowUp,
    CalendarClock,
    CheckCircle2,
    CircleDot,
    LoaderCircle,
    Paperclip,
    Plus,
    Search,
    UserRound,
} from 'lucide-react';
import {
    ChangeEvent,
    FormEvent,
    ReactNode,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import AppLayout from '@/layouts/app-layout';
import { initializeEcho } from '@/lib/echo';
import { index as adminIndex } from '@/routes/admin';
import type { BreadcrumbItem, SharedData } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    type DescriptionUserRef,
    TicketDescriptionEditor,
    type TicketDescriptionValue,
} from './components/ticket-description-editor';

type TicketStatusKey = 'todo' | 'in_progress' | 'to_review' | 'done';
type TicketType = 'bug' | 'feature' | 'chore' | 'support';
type TicketImportance = 'low' | 'normal' | 'high' | 'urgent';

type AdminOption = {
    id: number;
    name: string;
    email: string;
};

type TicketAttachment = {
    id: number;
    display_name: string;
    extension: string | null;
    mime_type: string;
    size_bytes: number;
    download_url: string;
    created_at: string | null;
};

type TicketAudit = {
    id: number;
    event_type: string;
    actor_admin: {
        id: number;
        name: string;
        email: string;
    } | null;
    meta: Record<string, unknown> | null;
    created_at: string | null;
};

type TicketRecord = {
    id: number;
    title: string;
    description: unknown;
    status: TicketStatusKey;
    type: TicketType;
    importance: TicketImportance;
    assignee_admin_id: number | null;
    creator_admin_id: number;
    done_at: string | null;
    archived_at: string | null;
    archive_deadline_at: string | null;
    archiving_in_seconds: number | null;
    creator_admin: AdminOption | null;
    assignee_admin: AdminOption | null;
    attachments: TicketAttachment[];
    internal_note: {
        id: number;
        content: string;
        updated_at: string | null;
    } | null;
    mentions: Array<{
        id: number;
        mentioned_admin_id: number;
        mentioned_by_admin_id: number;
        source: string;
        created_at: string | null;
    }>;
    updated_at: string | null;
    created_at: string | null;
};

type BoardData = Record<TicketStatusKey, TicketRecord[]>;

type Paginated<T> = {
    data: T[];
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        path: string;
        per_page: number;
        to: number | null;
        total: number;
    };
};

type Filters = {
    search: string;
    assignee_admin_id: number;
    creator_admin_id: number;
    type: 'all' | TicketType;
    importance: 'all' | TicketImportance;
    sort:
        | 'title'
        | 'status'
        | 'type'
        | 'importance'
        | 'created_at'
        | 'updated_at';
    direction: 'asc' | 'desc';
};

type TicketsPageProps = {
    initialBoard: BoardData;
    initialArchived: Paginated<TicketRecord>;
    filters: Filters;
    admins: AdminOption[];
    api: {
        boardIndex: string;
        store: string;
        notifications: string;
        userSearch: string;
    };
};

type UserSearchResult = {
    id: number;
    name: string;
    email: string;
    role: string;
};

type RequestFieldErrors = Record<string, string[]>;

type TicketSyncState = 'idle' | 'dirty' | 'syncing' | 'saved' | 'error';

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

const statusColumns: Array<{ key: TicketStatusKey; label: string }> = [
    { key: 'todo', label: 'Todo' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'to_review', label: 'To Review' },
    { key: 'done', label: 'Done' },
];

const ticketTypeOptions: Array<{ value: TicketType; label: string }> = [
    { value: 'bug', label: 'Bug' },
    { value: 'feature', label: 'Feature' },
    { value: 'chore', label: 'Chore' },
    { value: 'support', label: 'Support' },
];

const ticketImportanceOptions: Array<{
    value: TicketImportance;
    label: string;
}> = [
    { value: 'low', label: 'Low' },
    { value: 'normal', label: 'Normal' },
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
];

export default function AdminTickets({
    initialBoard,
    initialArchived,
    filters,
    admins,
    api,
}: TicketsPageProps) {
    const { auth } = usePage<SharedData>().props;
    const [activeTab, setActiveTab] = useState<'board' | 'archived'>('board');
    const [board, setBoard] = useState<BoardData>(initialBoard);
    const [archived, setArchived] =
        useState<Paginated<TicketRecord>>(initialArchived);
    const [queryFilters, setQueryFilters] = useState<Filters>(filters);
    const [boardLoading, setBoardLoading] = useState(false);
    const [archivedLoading, setArchivedLoading] = useState(false);
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

    const hasInitializedFilters = useRef(false);
    const activeSyncRequestId = useRef(0);

    const boardTotals = useMemo(() => {
        return {
            todo: board.todo.length,
            in_progress: board.in_progress.length,
            to_review: board.to_review.length,
            done: board.done.length,
        };
    }, [board]);

    const newTicketAssigneeResults = useMemo(() => {
        const query = newTicketAssigneeQuery.trim().toLowerCase();

        if (query === '') {
            return admins.slice(0, 6);
        }

        return admins
            .filter((admin) => {
                return (
                    admin.name.toLowerCase().includes(query) ||
                    admin.email.toLowerCase().includes(query)
                );
            })
            .slice(0, 6);
    }, [admins, newTicketAssigneeQuery]);

    useEffect(() => {
        const echo = initializeEcho();

        if (echo === null) {
            return;
        }

        const channel = echo.private('admin.tickets');

        channel.listen('.ticket.updated', () => {
            void refreshBoard();

            if (activeTab === 'archived') {
                void refreshArchived();
            }

            if (selectedTicket !== null) {
                void openTicketDetail(selectedTicket.id);
            }
        });

        return () => {
            channel.stopListening('.ticket.updated');
            echo.leave('admin.tickets');
        };
    }, [activeTab, selectedTicket?.id]);

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
        if (!hasInitializedFilters.current) {
            hasInitializedFilters.current = true;
            return;
        }

        const timeoutId = window.setTimeout(() => {
            if (activeTab === 'archived') {
                void refreshArchived(1, queryFilters);
                return;
            }

            void refreshBoard(queryFilters);
        }, 260);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [
        activeTab,
        queryFilters.assignee_admin_id,
        queryFilters.creator_admin_id,
        queryFilters.direction,
        queryFilters.importance,
        queryFilters.search,
        queryFilters.sort,
        queryFilters.type,
    ]);

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

    const refreshBoard = async (nextFilters = queryFilters): Promise<void> => {
        setBoardLoading(true);

        try {
            const response = await fetch(
                `${api.boardIndex}?${buildQueryString({
                    view: 'board',
                    search: nextFilters.search,
                    assignee_admin_id: nextFilters.assignee_admin_id,
                    creator_admin_id: nextFilters.creator_admin_id,
                    type: nextFilters.type === 'all' ? '' : nextFilters.type,
                    importance:
                        nextFilters.importance === 'all'
                            ? ''
                            : nextFilters.importance,
                    sort: nextFilters.sort,
                    direction: nextFilters.direction,
                })}`,
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as { data: BoardData };
            setBoard(payload.data);
        } finally {
            setBoardLoading(false);
        }
    };

    const refreshArchived = async (
        page = archived.meta.current_page,
        nextFilters = queryFilters,
    ): Promise<void> => {
        setArchivedLoading(true);

        try {
            const response = await fetch(
                `${api.boardIndex}?${buildQueryString({
                    view: 'archived',
                    search: nextFilters.search,
                    assignee_admin_id: nextFilters.assignee_admin_id,
                    creator_admin_id: nextFilters.creator_admin_id,
                    type: nextFilters.type === 'all' ? '' : nextFilters.type,
                    importance:
                        nextFilters.importance === 'all'
                            ? ''
                            : nextFilters.importance,
                    sort: nextFilters.sort,
                    direction: nextFilters.direction,
                    page,
                    per_page: archived.meta.per_page,
                })}`,
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as Paginated<TicketRecord>;
            setArchived(payload);
        } finally {
            setArchivedLoading(false);
        }
    };

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
            const response = await fetch(api.store, {
                method: 'POST',
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

            const payload = normalizeTicketPayload(await response.json());

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
        const response = await fetch(
            `/api/admin/tickets/${ticketId}/move-status`,
            {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ status: nextStatus }),
            },
        );

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

    const openTicketDetail = async (ticketId: number): Promise<void> => {
        const response = await fetch(`/api/admin/tickets/${ticketId}`, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });

        if (!response.ok) {
            return;
        }

        const payload = normalizeTicketPayload(await response.json());

        if (payload === null) {
            return;
        }

        setSelectedTicket(payload);
        setTicketDetailOpen(true);
    };

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
            const response = await fetch(
                `/api/admin/tickets/${selectedTicket.id}`,
                {
                    method: 'PATCH',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken(),
                    },
                    body: JSON.stringify(changes),
                },
            );

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

            const payload = normalizeTicketPayload(await response.json());

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

            const response = await fetch(
                `/api/admin/tickets/${selectedTicket.id}/attachments`,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken(),
                    },
                    body: formData,
                },
            );

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

        const response = await fetch(
            `/api/admin/tickets/${selectedTicket.id}/attachments/${attachmentId}`,
            {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': csrfToken(),
                },
            },
        );

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
            const response = await fetch(
                `/api/admin/tickets/${selectedTicket.id}/internal-note`,
                {
                    method: 'PUT',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRF-TOKEN': csrfToken(),
                    },
                    body: JSON.stringify({ content }),
                },
            );

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
            const response = await fetch(
                `/api/admin/tickets/${selectedTicket.id}/audit-logs?per_page=50`,
                {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                },
            );

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

    const handleDrop = async (status: TicketStatusKey): Promise<void> => {
        setDropStatus(null);

        if (draggingTicketId === null) {
            return;
        }

        await moveTicketStatus(draggingTicketId, status);
        setDraggingTicketId(null);
    };

    const handleOpenArchivedPage = async (page: number): Promise<void> => {
        await refreshArchived(page);
    };

    const hasBoardContent =
        board.todo.length > 0 ||
        board.in_progress.length > 0 ||
        board.to_review.length > 0 ||
        board.done.length > 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tickets" />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <header className="border-b border-border px-6 py-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-[11px] tracking-wide text-zinc-500 uppercase">
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
                    <section className="mb-4 rounded-xl border border-border bg-surface px-4 py-3">
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[2fr_repeat(5,minmax(0,1fr))]">
                            <div className="space-y-1">
                                <Label
                                    htmlFor="ticket-search"
                                    className="text-[11px] tracking-wide text-zinc-500 uppercase"
                                >
                                    Search
                                </Label>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-zinc-600" />
                                    <Input
                                        id="ticket-search"
                                        value={queryFilters.search}
                                        onChange={(event) =>
                                            setQueryFilters((current) => ({
                                                ...current,
                                                search: event.target.value,
                                            }))
                                        }
                                        className="h-9 bg-background pl-8 text-xs"
                                        placeholder="Search title, description, my notes..."
                                    />
                                </div>
                            </div>

                            <SelectField
                                label="Assignee"
                                value={String(queryFilters.assignee_admin_id)}
                                onChange={(value) =>
                                    setQueryFilters((current) => ({
                                        ...current,
                                        assignee_admin_id:
                                            Number.parseInt(value, 10) || 0,
                                    }))
                                }
                                options={[
                                    { value: '0', label: 'All assignees' },
                                    ...admins.map((admin) => ({
                                        value: String(admin.id),
                                        label: admin.name,
                                    })),
                                ]}
                            />

                            <SelectField
                                label="Creator"
                                value={String(queryFilters.creator_admin_id)}
                                onChange={(value) =>
                                    setQueryFilters((current) => ({
                                        ...current,
                                        creator_admin_id:
                                            Number.parseInt(value, 10) || 0,
                                    }))
                                }
                                options={[
                                    { value: '0', label: 'All creators' },
                                    ...admins.map((admin) => ({
                                        value: String(admin.id),
                                        label: admin.name,
                                    })),
                                ]}
                            />

                            <SelectField
                                label="Type"
                                value={queryFilters.type}
                                onChange={(value) =>
                                    setQueryFilters((current) => ({
                                        ...current,
                                        type: value as Filters['type'],
                                    }))
                                }
                                options={[
                                    { value: 'all', label: 'All types' },
                                    { value: 'bug', label: 'Bug' },
                                    { value: 'feature', label: 'Feature' },
                                    { value: 'chore', label: 'Chore' },
                                    { value: 'support', label: 'Support' },
                                ]}
                            />

                            <SelectField
                                label="Importance"
                                value={queryFilters.importance}
                                onChange={(value) =>
                                    setQueryFilters((current) => ({
                                        ...current,
                                        importance:
                                            value as Filters['importance'],
                                    }))
                                }
                                options={[
                                    { value: 'all', label: 'All priorities' },
                                    { value: 'low', label: 'Low' },
                                    { value: 'normal', label: 'Normal' },
                                    { value: 'high', label: 'High' },
                                    { value: 'urgent', label: 'Urgent' },
                                ]}
                            />

                            <div className="grid grid-cols-2 gap-2">
                                <SelectField
                                    label="Sort"
                                    value={queryFilters.sort}
                                    onChange={(value) =>
                                        setQueryFilters((current) => ({
                                            ...current,
                                            sort: value as Filters['sort'],
                                        }))
                                    }
                                    options={[
                                        {
                                            value: 'updated_at',
                                            label: 'Updated',
                                        },
                                        {
                                            value: 'created_at',
                                            label: 'Created',
                                        },
                                        { value: 'title', label: 'Title' },
                                        { value: 'status', label: 'Status' },
                                        { value: 'type', label: 'Type' },
                                        {
                                            value: 'importance',
                                            label: 'Importance',
                                        },
                                    ]}
                                />
                                <SelectField
                                    label="Direction"
                                    value={queryFilters.direction}
                                    onChange={(value) =>
                                        setQueryFilters((current) => ({
                                            ...current,
                                            direction:
                                                value === 'asc'
                                                    ? 'asc'
                                                    : 'desc',
                                        }))
                                    }
                                    options={[
                                        { value: 'desc', label: 'Desc' },
                                        { value: 'asc', label: 'Asc' },
                                    ]}
                                />
                            </div>
                        </div>

                        <div className="mt-2 flex justify-end">
                            <span className="text-[11px] text-zinc-500">
                                Filters apply automatically.
                            </span>
                        </div>
                    </section>

                    <section className="mb-4 inline-flex w-fit rounded-lg border border-border bg-surface p-1">
                        <button
                            type="button"
                            className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                                activeTab === 'board'
                                    ? 'bg-zinc-800 text-zinc-100'
                                    : 'text-zinc-500 hover:text-zinc-200'
                            }`}
                            onClick={() => setActiveTab('board')}
                        >
                            Board
                        </button>
                        <button
                            type="button"
                            className={`rounded-md px-3 py-1.5 text-xs transition-colors ${
                                activeTab === 'archived'
                                    ? 'bg-zinc-800 text-zinc-100'
                                    : 'text-zinc-500 hover:text-zinc-200'
                            }`}
                            onClick={() => {
                                setActiveTab('archived');
                                void refreshArchived();
                            }}
                        >
                            Archived
                        </button>
                    </section>

                    {activeTab === 'board' ? (
                        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto pb-1">
                            {statusColumns.map((column) => (
                                <section
                                    key={column.key}
                                    className={`flex min-w-[280px] flex-1 flex-col rounded-xl border bg-surface transition-colors ${
                                        dropStatus === column.key
                                            ? 'border-emerald-500/60'
                                            : 'border-border'
                                    }`}
                                    onDragOver={(event) => {
                                        event.preventDefault();
                                        if (draggingTicketId !== null) {
                                            setDropStatus(column.key);
                                        }
                                    }}
                                    onDragLeave={() => setDropStatus(null)}
                                    onDrop={(event) => {
                                        event.preventDefault();
                                        void handleDrop(column.key);
                                    }}
                                >
                                    <div className="flex items-center justify-between border-b border-border px-3 py-2">
                                        <p className="text-xs font-medium tracking-wide text-zinc-300 uppercase">
                                            {column.label}
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="border-zinc-700 bg-zinc-900/60 px-1.5 py-0 text-[10px] text-zinc-400"
                                        >
                                            {boardTotals[column.key]}
                                        </Badge>
                                    </div>

                                    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
                                        {board[column.key].length === 0 ? (
                                            <div className="rounded-lg border border-dashed border-zinc-800 px-3 py-6 text-center text-xs text-zinc-600">
                                                No tickets
                                            </div>
                                        ) : (
                                            board[column.key].map((ticket) => (
                                                <article
                                                    key={ticket.id}
                                                    draggable
                                                    onDragStart={(event) => {
                                                        event.dataTransfer.effectAllowed =
                                                            'move';
                                                        setDraggingTicketId(
                                                            ticket.id,
                                                        );
                                                    }}
                                                    onDragEnd={() => {
                                                        setDraggingTicketId(
                                                            null,
                                                        );
                                                        setDropStatus(null);
                                                    }}
                                                    onClick={() =>
                                                        void openTicketDetail(
                                                            ticket.id,
                                                        )
                                                    }
                                                    className="cursor-pointer rounded-lg border border-border bg-background px-3 py-2 transition-colors hover:border-zinc-700 hover:bg-zinc-900/40"
                                                >
                                                    <div className="mb-2 flex items-start justify-between gap-2">
                                                        <p className="line-clamp-2 text-sm font-medium text-zinc-100">
                                                            {ticket.title}
                                                        </p>
                                                        <ImportanceDot
                                                            importance={
                                                                ticket.importance
                                                            }
                                                        />
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-1.5">
                                                        <TypeBadge
                                                            type={ticket.type}
                                                        />
                                                        {ticket.assignee_admin ? (
                                                            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500">
                                                                <UserRound className="h-3 w-3" />
                                                                {
                                                                    ticket
                                                                        .assignee_admin
                                                                        .name
                                                                }
                                                            </span>
                                                        ) : (
                                                            <span className="text-[10px] text-zinc-600 italic">
                                                                Unassigned
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 flex items-center justify-between text-[10px] text-zinc-500">
                                                        <span>
                                                            {formatRelative(
                                                                ticket.updated_at,
                                                            )}
                                                        </span>
                                                        {ticket.status ===
                                                            'done' &&
                                                        ticket.archiving_in_seconds !==
                                                            null ? (
                                                            <span className="text-zinc-400">
                                                                Archiving in{' '}
                                                                {formatDuration(
                                                                    ticket.archiving_in_seconds,
                                                                )}
                                                            </span>
                                                        ) : null}
                                                    </div>
                                                </article>
                                            ))
                                        )}
                                    </div>
                                </section>
                            ))}

                            {!hasBoardContent && !boardLoading ? (
                                <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-zinc-800 bg-surface/40 px-8 text-sm text-zinc-500">
                                    No tickets match the current filters.
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface">
                            <div className="grid grid-cols-[2fr_90px_100px_160px_110px_150px_120px] border-b border-border bg-zinc-900/40 px-4 py-2">
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
                                <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
                                    Assignee
                                </p>
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
                            </div>
                            <div className="flex-1 divide-y divide-border overflow-y-auto">
                                {archivedLoading ? (
                                    <div className="px-4 py-8 text-sm text-zinc-500">
                                        Loading archived tickets...
                                    </div>
                                ) : archived.data.length === 0 ? (
                                    <div className="px-4 py-8 text-sm text-zinc-500">
                                        No archived tickets found.
                                    </div>
                                ) : (
                                    archived.data.map((ticket) => (
                                        <button
                                            key={ticket.id}
                                            type="button"
                                            onClick={() =>
                                                void openTicketDetail(ticket.id)
                                            }
                                            className="grid w-full grid-cols-[2fr_90px_100px_160px_110px_150px_120px] items-center gap-3 px-4 py-2 text-left transition-colors hover:bg-zinc-900/30"
                                        >
                                            <p className="text-sm text-zinc-100">
                                                {highlightSearchMatch(
                                                    ticket.title,
                                                    queryFilters.search,
                                                )}
                                            </p>
                                            <TypeBadge type={ticket.type} />
                                            <ImportanceLabel
                                                importance={ticket.importance}
                                            />
                                            <p className="text-xs text-zinc-400">
                                                {ticket.assignee_admin?.name ??
                                                    'Unassigned'}
                                            </p>
                                            <p className="text-xs text-zinc-400 capitalize">
                                                {ticket.status.replace(
                                                    '_',
                                                    ' ',
                                                )}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {formatDateTime(
                                                    ticket.updated_at,
                                                )}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {formatDateTime(
                                                    ticket.created_at,
                                                )}
                                            </p>
                                        </button>
                                    ))
                                )}
                            </div>
                            <div className="flex items-center justify-between border-t border-border px-4 py-2 text-xs text-zinc-500">
                                <p>
                                    Showing {archived.meta.from ?? 0}-
                                    {archived.meta.to ?? 0} of{' '}
                                    {archived.meta.total}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        className="h-7 px-2 text-[11px]"
                                        disabled={
                                            archived.meta.current_page <= 1
                                        }
                                        onClick={() =>
                                            void handleOpenArchivedPage(
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
                                        className="h-7 px-2 text-[11px]"
                                        disabled={
                                            archived.meta.current_page >=
                                            archived.meta.last_page
                                        }
                                        onClick={() =>
                                            void handleOpenArchivedPage(
                                                archived.meta.current_page + 1,
                                            )
                                        }
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={newTicketOpen} onOpenChange={setNewTicketOpen}>
                <DialogContent className="max-h-[92vh] max-w-[min(96vw,980px)] overflow-hidden border-border bg-surface">
                    <DialogHeader>
                        <DialogTitle>New Ticket</DialogTitle>
                        <DialogDescription>
                            Create an admin-only ticket for internal tracking.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        className="flex max-h-[calc(92vh-170px)] flex-col gap-5 overflow-y-auto pr-1"
                        onSubmit={(event) => void createTicket(event)}
                    >
                        <div className="space-y-1">
                            <Label htmlFor="ticket-title">Title</Label>
                            <Input
                                id="ticket-title"
                                value={newTicketTitle}
                                onChange={(event) => {
                                    setNewTicketTitle(event.target.value);
                                    setNewTicketError(null);
                                    setNewTicketFieldErrors((current) =>
                                        withoutFieldError(current, 'title'),
                                    );
                                }}
                                required
                            />
                            {newTicketFieldErrors.title !== undefined ? (
                                <p className="text-xs text-red-300">
                                    {newTicketFieldErrors.title[0]}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                                Type
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {ticketTypeOptions.map((typeOption) => (
                                    <button
                                        key={typeOption.value}
                                        type="button"
                                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                                            newTicketType === typeOption.value
                                                ? 'border-sky-600 bg-sky-950/25 text-sky-200'
                                                : 'border-zinc-700 bg-zinc-900/60 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                                        }`}
                                        onClick={() => {
                                            setNewTicketType(typeOption.value);
                                            setNewTicketFieldErrors((current) =>
                                                withoutFieldError(
                                                    current,
                                                    'type',
                                                ),
                                            );
                                        }}
                                    >
                                        {typeOption.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {newTicketFieldErrors.type !== undefined ? (
                            <p className="text-xs text-red-300">
                                {newTicketFieldErrors.type[0]}
                            </p>
                        ) : null}

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_1.2fr]">
                            <div className="space-y-2">
                                <p className="text-xs font-medium tracking-wide text-zinc-500 uppercase">
                                    Importance
                                </p>
                                <input
                                    type="range"
                                    min={0}
                                    max={ticketImportanceOptions.length - 1}
                                    step={1}
                                    value={ticketImportanceOptions.findIndex(
                                        (option) =>
                                            option.value ===
                                            newTicketImportance,
                                    )}
                                    onChange={(event) => {
                                        const option =
                                            ticketImportanceOptions[
                                                Number.parseInt(
                                                    event.target.value,
                                                    10,
                                                ) ?? 1
                                            ];

                                        if (option !== undefined) {
                                            setNewTicketImportance(
                                                option.value,
                                            );
                                            setNewTicketFieldErrors((current) =>
                                                withoutFieldError(
                                                    current,
                                                    'importance',
                                                ),
                                            );
                                        }
                                    }}
                                    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-emerald-400"
                                />
                                <div className="flex items-center justify-between text-[11px] text-zinc-500">
                                    {ticketImportanceOptions.map((option) => (
                                        <span
                                            key={option.value}
                                            className={
                                                newTicketImportance ===
                                                option.value
                                                    ? 'font-semibold text-zinc-200'
                                                    : ''
                                            }
                                        >
                                            {option.label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label htmlFor="ticket-assignee">
                                    Assignee
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="ticket-assignee"
                                        value={newTicketAssigneeQuery}
                                        onFocus={() =>
                                            setNewTicketAssigneeDropdownOpen(
                                                true,
                                            )
                                        }
                                        onBlur={() => {
                                            window.setTimeout(() => {
                                                setNewTicketAssigneeDropdownOpen(
                                                    false,
                                                );
                                            }, 120);
                                        }}
                                        onChange={(event) => {
                                            setNewTicketAssigneeQuery(
                                                event.target.value,
                                            );
                                            if (
                                                event.target.value.trim() === ''
                                            ) {
                                                setNewTicketAssigneeId(0);
                                            }
                                        }}
                                        placeholder="Type admin name..."
                                        className="h-10 bg-background"
                                    />
                                    {newTicketAssigneeDropdownOpen ? (
                                        <div className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-border bg-surface p-1 shadow-lg">
                                            <button
                                                type="button"
                                                className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
                                                onClick={() => {
                                                    setNewTicketAssigneeId(0);
                                                    setNewTicketAssigneeQuery(
                                                        '',
                                                    );
                                                    setNewTicketFieldErrors(
                                                        (current) =>
                                                            withoutFieldError(
                                                                current,
                                                                'assignee_admin_id',
                                                            ),
                                                    );
                                                    setNewTicketAssigneeDropdownOpen(
                                                        false,
                                                    );
                                                }}
                                            >
                                                Unassigned
                                            </button>
                                            {newTicketAssigneeResults.map(
                                                (admin) => (
                                                    <button
                                                        key={admin.id}
                                                        type="button"
                                                        className={`flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors ${
                                                            newTicketAssigneeId ===
                                                            admin.id
                                                                ? 'bg-zinc-800 text-zinc-100'
                                                                : 'text-zinc-300 hover:bg-zinc-800'
                                                        }`}
                                                        onClick={() => {
                                                            setNewTicketAssigneeId(
                                                                admin.id,
                                                            );
                                                            setNewTicketFieldErrors(
                                                                (current) =>
                                                                    withoutFieldError(
                                                                        current,
                                                                        'assignee_admin_id',
                                                                    ),
                                                            );
                                                            setNewTicketAssigneeQuery(
                                                                admin.name,
                                                            );
                                                            setNewTicketAssigneeDropdownOpen(
                                                                false,
                                                            );
                                                        }}
                                                    >
                                                        <Avatar className="h-6 w-6 border border-zinc-700 bg-zinc-900">
                                                            <AvatarFallback className="bg-zinc-900 text-[10px] text-zinc-300">
                                                                {initials(
                                                                    admin.name,
                                                                )}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="block truncate text-zinc-100">
                                                                {admin.name}
                                                            </span>
                                                            <span className="block truncate text-zinc-500">
                                                                {admin.email}
                                                            </span>
                                                        </span>
                                                    </button>
                                                ),
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                                {newTicketFieldErrors.assignee_admin_id !==
                                undefined ? (
                                    <p className="text-xs text-red-300">
                                        {
                                            newTicketFieldErrors
                                                .assignee_admin_id[0]
                                        }
                                    </p>
                                ) : null}
                            </div>
                        </div>

                        <TicketDescriptionEditor
                            label="Description"
                            html={newTicketDescriptionHtml}
                            placeholder="Write a ticket update. Use @ to mention admins and /user to reference athletes/coaches."
                            admins={admins}
                            className="h-full"
                            searchUsers={fetchUserSearch}
                            onChange={(value: TicketDescriptionValue) => {
                                setNewTicketDescriptionHtml(value.html);
                                setNewTicketDescriptionText(value.text);
                                setNewTicketMentions(value.mentionAdminIds);
                                setNewTicketUserRefs(value.userRefs);
                                setNewTicketError(null);
                                setNewTicketFieldErrors((current) =>
                                    withoutFieldError(current, 'description'),
                                );
                            }}
                        />
                        {newTicketFieldErrors.description !== undefined ? (
                            <p className="text-xs text-red-300">
                                {newTicketFieldErrors.description[0]}
                            </p>
                        ) : null}

                        {newTicketError !== null ? (
                            <p className="rounded-md border border-red-900/50 bg-red-950/20 px-3 py-2 text-sm text-red-300">
                                {newTicketError}
                            </p>
                        ) : null}

                        <p className="text-[11px] text-zinc-500">
                            Description length:{' '}
                            {newTicketDescriptionText.trim().length} chars
                        </p>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setNewTicketOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={ticketCreateBusy}>
                                {ticketCreateBusy
                                    ? 'Creating...'
                                    : 'Create Ticket'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={ticketDetailOpen}
                onOpenChange={(next) => {
                    setTicketDetailOpen(next);
                    if (!next) {
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
                <DialogContent className="h-[min(92vh,920px)] max-w-[min(98vw,1400px)] overflow-hidden border-border bg-surface p-0">
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
                                    <div className="mr-8 inline-flex rounded-lg border border-border bg-background p-1">
                                        <button
                                            type="button"
                                            className={`rounded-md px-3 py-1 text-xs ${
                                                ticketDetailTab === 'overview'
                                                    ? 'bg-zinc-800 text-zinc-100'
                                                    : 'text-zinc-500'
                                            }`}
                                            onClick={() =>
                                                setTicketDetailTab('overview')
                                            }
                                        >
                                            Overview
                                        </button>
                                        <button
                                            type="button"
                                            className={`rounded-md px-3 py-1 text-xs ${
                                                ticketDetailTab === 'audit'
                                                    ? 'bg-zinc-800 text-zinc-100'
                                                    : 'text-zinc-500'
                                            }`}
                                            onClick={() => {
                                                setTicketDetailTab('audit');
                                                void loadAuditLogs();
                                            }}
                                        >
                                            Audit Trail
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <p className="mr-1 text-[11px] tracking-wide text-zinc-500 uppercase">
                                        Status
                                    </p>
                                    {statusColumns.map((statusColumn) => (
                                        <button
                                            key={statusColumn.key}
                                            type="button"
                                            className={`rounded-md border px-2.5 py-1 text-xs whitespace-nowrap transition-colors ${
                                                selectedTicket.status ===
                                                statusColumn.key
                                                    ? 'border-emerald-600 bg-emerald-950/25 text-emerald-300'
                                                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700'
                                            }`}
                                            onClick={() =>
                                                void moveTicketStatus(
                                                    selectedTicket.id,
                                                    statusColumn.key,
                                                )
                                            }
                                        >
                                            {statusColumn.label}
                                        </button>
                                    ))}
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
                                                <label className="cursor-pointer rounded-md border border-zinc-700 bg-zinc-800 px-2 py-1 text-[11px] text-zinc-200 transition-colors hover:bg-zinc-700">
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
                                                                    className="text-[11px] text-zinc-500 transition-colors hover:text-red-300"
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

                                    <aside className="flex w-[320px] shrink-0 flex-col space-y-4 overflow-y-auto rounded-xl border border-border bg-background p-4">
                                        <div className="rounded-lg border border-zinc-800 px-3 py-2">
                                            <p className="text-[11px] text-zinc-500 uppercase">
                                                Creator
                                            </p>
                                            <p className="text-xs text-zinc-300">
                                                {selectedTicket.creator_admin
                                                    ?.name ?? 'Unknown'}
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-zinc-800 px-3 py-2">
                                            <p className="text-[11px] text-zinc-500 uppercase">
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
                                            <p className="text-[11px] text-zinc-500 uppercase">
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
                                                        <pre className="mt-2 max-h-56 w-full max-w-full overflow-x-hidden overflow-y-auto rounded border border-zinc-800 bg-zinc-950 p-2 text-[11px] [overflow-wrap:anywhere] break-words whitespace-pre-wrap text-zinc-400">
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
                                <div className="pointer-events-none absolute bottom-4 left-4 inline-flex w-fit items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950/90 px-2.5 py-1 text-[11px] text-zinc-400">
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

    async function fetchUserSearch(query: string): Promise<UserSearchResult[]> {
        const response = await fetch(
            `${api.userSearch}?${buildQueryString({ q: query })}`,
            {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            },
        );

        if (!response.ok) {
            return [];
        }

        const payload = (await response.json()) as {
            data: UserSearchResult[];
        };

        return payload.data;
    }
}

function buildDescriptionPayload(
    descriptionHtml: string,
    mentions: number[],
    userRefs: DescriptionUserRef[] = [],
): unknown[] {
    return [
        {
            type: 'rich_text',
            text: stripHtml(descriptionHtml),
            html: descriptionHtml,
            mentions: mentions.map((mentionId) => ({
                type: 'admin_mention',
                admin_id: mentionId,
            })),
            user_refs: userRefs.map((reference) => ({
                type: 'user_ref',
                user_id: reference.id,
                role: reference.role,
                name: reference.name,
                email: reference.email,
            })),
        },
    ];
}

function buildTicketUpdatePayload(
    ticket: Pick<
        TicketRecord,
        'title' | 'type' | 'importance' | 'assignee_admin_id'
    >,
    descriptionHtml: string,
    mentionAdminIds: number[],
    userRefs: DescriptionUserRef[],
): {
    title: string;
    type: TicketType;
    importance: TicketImportance;
    assignee_admin_id: number | null;
    description: unknown[];
    mention_admin_ids: number[];
} {
    return {
        title: ticket.title,
        type: ticket.type,
        importance: ticket.importance,
        assignee_admin_id: ticket.assignee_admin_id,
        description: buildDescriptionPayload(
            descriptionHtml,
            mentionAdminIds,
            userRefs,
        ),
        mention_admin_ids: mentionAdminIds,
    };
}

function descriptionHtmlFromPayload(payload: unknown): string {
    if (!Array.isArray(payload)) {
        return '';
    }

    const firstRichText = payload.find(
        (item): item is Record<string, unknown> => {
            if (typeof item !== 'object' || item === null) {
                return false;
            }

            return 'type' in item && item.type === 'rich_text';
        },
    );

    if (firstRichText === undefined) {
        return '';
    }

    if (typeof firstRichText.html === 'string') {
        return firstRichText.html;
    }

    if (typeof firstRichText.text === 'string') {
        return escapeHtml(firstRichText.text).replace(/\\n/g, '<br />');
    }

    return '';
}

function descriptionUserRefsFromPayload(
    payload: unknown,
): DescriptionUserRef[] {
    if (!Array.isArray(payload)) {
        return [];
    }

    const firstRichText = payload.find(
        (item): item is Record<string, unknown> => {
            if (typeof item !== 'object' || item === null) {
                return false;
            }

            return 'type' in item && item.type === 'rich_text';
        },
    );

    if (
        firstRichText === undefined ||
        !Array.isArray(firstRichText.user_refs)
    ) {
        return [];
    }

    return firstRichText.user_refs
        .map((value): DescriptionUserRef | null => {
            if (typeof value !== 'object' || value === null) {
                return null;
            }

            const userId = Number(
                (value as { user_id?: unknown }).user_id ?? 0,
            );

            if (userId <= 0) {
                return null;
            }

            return {
                id: userId,
                name: String((value as { name?: unknown }).name ?? ''),
                email: String((value as { email?: unknown }).email ?? ''),
                role: String((value as { role?: unknown }).role ?? ''),
            };
        })
        .filter(
            (reference): reference is DescriptionUserRef => reference !== null,
        );
}

function normalizeTicketPayload(payload: unknown): TicketRecord | null {
    if (
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload &&
        typeof (payload as { data?: unknown }).data === 'object' &&
        (payload as { data?: unknown }).data !== null
    ) {
        return (payload as { data: TicketRecord }).data;
    }

    if (typeof payload === 'object' && payload !== null && 'id' in payload) {
        return payload as TicketRecord;
    }

    return null;
}

function parseRequestError(
    payload: unknown,
    fallback: string,
): {
    message: string;
    fieldErrors: RequestFieldErrors;
} {
    if (typeof payload !== 'object' || payload === null) {
        return {
            message: fallback,
            fieldErrors: {},
        };
    }

    const responsePayload = payload as {
        message?: unknown;
        errors?: unknown;
    };

    const fieldErrors: RequestFieldErrors = {};

    if (
        typeof responsePayload.errors === 'object' &&
        responsePayload.errors !== null
    ) {
        Object.entries(responsePayload.errors).forEach(([key, value]) => {
            if (!Array.isArray(value)) {
                return;
            }

            const messages = value.filter(
                (item): item is string => typeof item === 'string',
            );

            if (messages.length > 0) {
                fieldErrors[key] = messages;
            }
        });
    }

    const firstFieldError = Object.values(fieldErrors)[0]?.[0];

    return {
        message:
            typeof responsePayload.message === 'string'
                ? responsePayload.message
                : (firstFieldError ?? fallback),
        fieldErrors,
    };
}

function withoutFieldError(
    fieldErrors: RequestFieldErrors,
    field: string,
): RequestFieldErrors {
    if (fieldErrors[field] === undefined) {
        return fieldErrors;
    }

    const nextErrors = { ...fieldErrors };
    delete nextErrors[field];

    return nextErrors;
}

function stripHtml(value: string): string {
    return value
        .replace(/<[^>]*>/g, ' ')
        .replace(/\\s+/g, ' ')
        .trim();
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function initials(value: string): string {
    return value
        .split(' ')
        .map((chunk) => chunk.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('');
}

function buildQueryString(params: Record<string, string | number>): string {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === '' || value === 0) {
            return;
        }

        query.set(key, String(value));
    });

    return query.toString();
}

function csrfToken(): string {
    const csrfMetaTag = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]',
    );

    return csrfMetaTag?.content ?? '';
}

function formatDateTime(value: string | null): string {
    if (value === null) {
        return '—';
    }

    return new Date(value).toLocaleString();
}

function formatRelative(value: string | null): string {
    if (value === null) {
        return '—';
    }

    const date = new Date(value);
    const seconds = Math.round((date.getTime() - Date.now()) / 1000);
    const absSeconds = Math.abs(seconds);

    if (absSeconds < 60) {
        return `${absSeconds}s ago`;
    }

    if (absSeconds < 3600) {
        return `${Math.round(absSeconds / 60)}m ago`;
    }

    if (absSeconds < 86400) {
        return `${Math.round(absSeconds / 3600)}h ago`;
    }

    return `${Math.round(absSeconds / 86400)}d ago`;
}

function formatDuration(seconds: number): string {
    if (seconds <= 0) {
        return '0m';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours === 0) {
        return `${minutes}m`;
    }

    return `${hours}h ${minutes}m`;
}

function formatAuditEvent(eventType: string): string {
    return eventType
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function highlightSearchMatch(text: string, search: string): ReactNode {
    const query = search.trim();

    if (query === '') {
        return text;
    }

    const index = text.toLowerCase().indexOf(query.toLowerCase());

    if (index === -1) {
        return text;
    }

    const start = text.slice(0, index);
    const match = text.slice(index, index + query.length);
    const end = text.slice(index + query.length);

    return (
        <>
            {start}
            <mark className="rounded-sm bg-sky-500/20 px-0.5 text-sky-100">
                {match}
            </mark>
            {end}
        </>
    );
}

function TypeBadge({ type }: { type: TicketType }) {
    const classes: Record<TicketType, string> = {
        bug: 'border-rose-900/60 bg-rose-950/30 text-rose-300',
        feature: 'border-sky-900/60 bg-sky-950/30 text-sky-300',
        chore: 'border-zinc-700 bg-zinc-800/60 text-zinc-300',
        support: 'border-violet-900/60 bg-violet-950/30 text-violet-300',
    };

    return (
        <Badge
            variant="outline"
            className={`px-1.5 py-0 text-[10px] capitalize ${classes[type]}`}
        >
            {type}
        </Badge>
    );
}

function ImportanceDot({ importance }: { importance: TicketImportance }) {
    const classes: Record<TicketImportance, string> = {
        low: 'bg-zinc-500',
        normal: 'bg-sky-500',
        high: 'bg-amber-500',
        urgent: 'bg-red-500',
    };

    return (
        <span
            className={`inline-block h-2 w-2 rounded-full ${classes[importance]}`}
        />
    );
}

function ImportanceLabel({ importance }: { importance: TicketImportance }) {
    return (
        <span className="text-xs text-zinc-400 capitalize">{importance}</span>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: Array<{ value: string; label: string }>;
}) {
    return (
        <div className="space-y-1">
            <Label className="text-[11px] tracking-wide text-zinc-500 uppercase">
                {label}
            </Label>
            <Select value={value} onValueChange={onChange}>
                <SelectTrigger className="h-9 border-border bg-background text-xs text-zinc-200 focus-visible:ring-zinc-700">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-border bg-surface text-zinc-200">
                    {options.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            className="text-xs focus:bg-zinc-800 focus:text-zinc-100"
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

function HeaderButton({
    label,
    sortKey,
    currentSort,
    currentDirection,
    onClick,
}: {
    label: string;
    sortKey: Filters['sort'];
    currentSort: Filters['sort'];
    currentDirection: Filters['direction'];
    onClick: (nextDirection: Filters['direction']) => void;
}) {
    return (
        <button
            type="button"
            className="inline-flex items-center gap-1 text-[10px] tracking-wide text-zinc-500 uppercase transition-colors hover:text-zinc-300"
            onClick={() =>
                onClick(
                    currentSort === sortKey && currentDirection === 'asc'
                        ? 'desc'
                        : 'asc',
                )
            }
        >
            {label}
            {currentSort === sortKey ? (
                currentDirection === 'asc' ? (
                    <ArrowUp className="h-3 w-3" />
                ) : (
                    <ArrowDown className="h-3 w-3" />
                )
            ) : null}
        </button>
    );
}
