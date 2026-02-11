import { useCallback } from 'react';
import { ticketUserSearch as adminTicketUserSearch } from '@/routes/admin/api';
import {
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
import type { DescriptionUserRef } from '../components/ticket-description-editor';
import type {
    buildTicketUpdatePayload} from '../lib/ticket-utils';
import {
    buildDescriptionPayload,
    csrfToken,
    normalizeTicketPayload,
    parseRequestError,
} from '../lib/ticket-utils';
import type {
    RequestFieldErrors,
    TicketAudit,
    TicketImportance,
    TicketRecord,
    TicketStatusKey,
    TicketType,
    UserSearchResult,
} from '../types';

type UseTicketMutationsOptions = {
    activeTab: 'board' | 'archived';
    refreshBoard: () => Promise<void>;
    refreshArchived: () => Promise<void>;
};

export type TicketCreatePayload = {
    title: string;
    descriptionHtml: string;
    mentionAdminIds: number[];
    userRefs: DescriptionUserRef[];
    type: TicketType;
    importance: TicketImportance;
    assigneeAdminId: number | null;
};

export type TicketUpdatePayload = ReturnType<typeof buildTicketUpdatePayload>;

export type TicketMutationResult<T> = {
    ok: boolean;
    data: T | null;
    message: string | null;
    fieldErrors: RequestFieldErrors;
};

const defaultHeaders = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
};

export function useTicketMutations({
    activeTab,
    refreshBoard,
    refreshArchived,
}: UseTicketMutationsOptions) {
    const fetchTicket = useCallback(
        async (ticketId: number): Promise<TicketRecord | null> => {
            const route = adminTicketShow(ticketId);
            const response = await fetch(route.url, {
                method: route.method,
                headers: defaultHeaders,
            });

            if (!response.ok) {
                return null;
            }

            return normalizeTicketPayload<TicketRecord>(await response.json());
        },
        [],
    );

    const createTicket = useCallback(
        async (
            payload: TicketCreatePayload,
        ): Promise<TicketMutationResult<TicketRecord>> => {
            const route = adminTicketStore();
            const response = await fetch(route.url, {
                method: route.method,
                headers: {
                    ...defaultHeaders,
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({
                    title: payload.title,
                    description: buildDescriptionPayload(
                        payload.descriptionHtml,
                        payload.mentionAdminIds,
                        payload.userRefs,
                    ),
                    type: payload.type,
                    importance: payload.importance,
                    assignee_admin_id: payload.assigneeAdminId,
                    mention_admin_ids: payload.mentionAdminIds,
                }),
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => null);
                const { message, fieldErrors } = parseRequestError(
                    errorPayload,
                    'Could not create ticket.',
                );

                return {
                    ok: false,
                    data: null,
                    message,
                    fieldErrors,
                };
            }

            const ticket = normalizeTicketPayload<TicketRecord>(
                await response.json(),
            );
            await refreshBoard();

            return {
                ok: true,
                data: ticket,
                message: null,
                fieldErrors: {},
            };
        },
        [refreshBoard],
    );

    const moveTicketStatus = useCallback(
        async (
            ticketId: number,
            nextStatus: TicketStatusKey,
        ): Promise<TicketRecord | null> => {
            const route = adminTicketMoveStatus(ticketId);
            const response = await fetch(route.url, {
                method: route.method,
                headers: {
                    ...defaultHeaders,
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ status: nextStatus }),
            });

            if (!response.ok) {
                return null;
            }

            await refreshBoard();

            if (activeTab === 'archived') {
                await refreshArchived();
            }

            return fetchTicket(ticketId);
        },
        [activeTab, fetchTicket, refreshArchived, refreshBoard],
    );

    const updateTicket = useCallback(
        async (
            ticketId: number,
            changes: TicketUpdatePayload,
        ): Promise<TicketMutationResult<TicketRecord>> => {
            const route = adminTicketUpdate.form.patch(ticketId);
            const response = await fetch(route.action, {
                method: route.method,
                headers: {
                    ...defaultHeaders,
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify(changes),
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => null);
                const { message, fieldErrors } = parseRequestError(
                    errorPayload,
                    'Could not sync ticket changes.',
                );

                return {
                    ok: false,
                    data: null,
                    message,
                    fieldErrors,
                };
            }

            const ticket = normalizeTicketPayload<TicketRecord>(
                await response.json(),
            );

            await refreshBoard();

            if (activeTab === 'archived') {
                await refreshArchived();
            }

            return {
                ok: true,
                data: ticket,
                message: null,
                fieldErrors: {},
            };
        },
        [activeTab, refreshArchived, refreshBoard],
    );

    const upsertInternalNote = useCallback(
        async (
            ticketId: number,
            content: string,
        ): Promise<TicketMutationResult<TicketRecord>> => {
            const route = adminTicketInternalNoteUpsert.form.put(ticketId);
            const response = await fetch(route.action, {
                method: route.method,
                headers: {
                    ...defaultHeaders,
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ content }),
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => null);
                const { message, fieldErrors } = parseRequestError(
                    errorPayload,
                    'Could not sync internal note.',
                );

                return {
                    ok: false,
                    data: null,
                    message,
                    fieldErrors,
                };
            }

            const ticket = await fetchTicket(ticketId);

            return {
                ok: true,
                data: ticket,
                message: null,
                fieldErrors: {},
            };
        },
        [fetchTicket],
    );

    const uploadAttachment = useCallback(
        async (ticketId: number, file: File): Promise<TicketRecord | null> => {
            const formData = new FormData();
            formData.append('file', file);

            const route = adminTicketAttachmentStore(ticketId);
            const response = await fetch(route.url, {
                method: route.method,
                headers: {
                    ...defaultHeaders,
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: formData,
            });

            if (!response.ok) {
                return null;
            }

            await refreshBoard();
            await refreshArchived();

            return fetchTicket(ticketId);
        },
        [fetchTicket, refreshArchived, refreshBoard],
    );

    const removeAttachment = useCallback(
        async (
            ticketId: number,
            attachmentId: number,
        ): Promise<TicketRecord | null> => {
            const route = adminTicketAttachmentDestroy.form.delete({
                ticket: ticketId,
                ticketAttachment: attachmentId,
            });

            const response = await fetch(route.action, {
                method: route.method,
                headers: {
                    ...defaultHeaders,
                    'X-CSRF-TOKEN': csrfToken(),
                },
            });

            if (!response.ok) {
                return null;
            }

            await refreshBoard();
            await refreshArchived();

            return fetchTicket(ticketId);
        },
        [fetchTicket, refreshArchived, refreshBoard],
    );

    const loadAuditLogs = useCallback(
        async (ticketId: number): Promise<TicketAudit[]> => {
            const route = adminTicketAuditLogs(ticketId, {
                query: { per_page: 50 },
            });

            const response = await fetch(route.url, {
                method: route.method,
                headers: defaultHeaders,
            });

            if (!response.ok) {
                return [];
            }

            const payload = (await response.json()) as {
                data: TicketAudit[];
            };

            return payload.data;
        },
        [],
    );

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
                    headers: defaultHeaders,
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

    return {
        createTicket,
        fetchTicket,
        moveTicketStatus,
        updateTicket,
        upsertInternalNote,
        uploadAttachment,
        removeAttachment,
        loadAuditLogs,
        fetchUserSearch,
    };
}
