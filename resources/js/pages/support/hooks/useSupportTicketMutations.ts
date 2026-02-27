import { useCallback } from 'react';
import {
    index as supportTicketsIndex,
    show as supportTicketsShow,
    store as supportTicketsStore,
} from '@/routes/support/tickets';
import { store as supportTicketAttachmentsStore } from '@/routes/support/tickets/attachments';
import { store as supportTicketMessagesStore } from '@/routes/support/tickets/messages';
import {
    csrfToken,
    normalizeTicketPayload,
    parseRequestError,
} from '@/pages/admin/tickets/lib/ticket-utils';
import type {
    SupportRequestFieldErrors,
    SupportTicketBuckets,
    SupportTicketRecord,
} from '../types';

type SupportMutationResult<T> = {
    ok: boolean;
    data: T | null;
    message: string | null;
    fieldErrors: SupportRequestFieldErrors;
};

const defaultHeaders = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
};

export function useSupportTicketMutations() {
    const fetchTicket = useCallback(
        async (ticketId: number | string): Promise<SupportTicketRecord | null> => {
            const route = supportTicketsShow(String(ticketId));
            const response = await fetch(route.url, {
                method: route.method.toUpperCase(),
                headers: defaultHeaders,
            });

            if (!response.ok) {
                return null;
            }

            return normalizeTicketPayload<SupportTicketRecord>(
                await response.json(),
            );
        },
        [],
    );

    const fetchTickets = useCallback(async (): Promise<SupportTicketBuckets | null> => {
        const route = supportTicketsIndex();
        const response = await fetch(route.url, {
            method: route.method.toUpperCase(),
            headers: defaultHeaders,
        });

        if (!response.ok) {
            return null;
        }

        return (await response.json()) as SupportTicketBuckets;
    }, []);

    const createTicket = useCallback(
        async (payload: {
            title: string;
            type: 'bug' | 'feature' | 'support';
            message: string;
        }): Promise<SupportMutationResult<SupportTicketRecord>> => {
            const route = supportTicketsStore();
            const response = await fetch(route.url, {
                method: route.method.toUpperCase(),
                headers: {
                    ...defaultHeaders,
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => null);
                const { message, fieldErrors } = parseRequestError(
                    errorPayload,
                    'Could not create support ticket.',
                );

                return {
                    ok: false,
                    data: null,
                    message,
                    fieldErrors,
                };
            }

            return {
                ok: true,
                data: normalizeTicketPayload<SupportTicketRecord>(
                    await response.json(),
                ),
                message: null,
                fieldErrors: {},
            };
        },
        [],
    );

    const createMessage = useCallback(
        async (
            ticketId: number | string,
            body: string,
        ): Promise<SupportMutationResult<SupportTicketRecord>> => {
            const messageRoute = supportTicketMessagesStore(String(ticketId));
            const response = await fetch(messageRoute.url, {
                method: messageRoute.method.toUpperCase(),
                headers: {
                    ...defaultHeaders,
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: JSON.stringify({ body }),
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => null);
                const { message, fieldErrors } = parseRequestError(
                    errorPayload,
                    'Could not send your follow-up message.',
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
        async (
            ticketId: number | string,
            file: File,
        ): Promise<SupportMutationResult<SupportTicketRecord>> => {
            const formData = new FormData();
            formData.append('file', file);

            const attachmentRoute = supportTicketAttachmentsStore(
                String(ticketId),
            );
            const response = await fetch(attachmentRoute.url, {
                method: attachmentRoute.method.toUpperCase(),
                headers: {
                    ...defaultHeaders,
                    'X-CSRF-TOKEN': csrfToken(),
                },
                body: formData,
            });

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => null);
                const { message, fieldErrors } = parseRequestError(
                    errorPayload,
                    'Could not upload attachment.',
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

    return {
        fetchTickets,
        fetchTicket,
        createTicket,
        createMessage,
        uploadAttachment,
    };
}
