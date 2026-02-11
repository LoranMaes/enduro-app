import type { DescriptionUserRef } from '../components/ticket-description-editor';
import type {
    TicketImportance,
    TicketType,
} from '../types';

type RequestFieldErrors = Record<string, string[]>;

type TicketRecordLike = {
    title: string;
    type: TicketType;
    importance: TicketImportance;
    assignee_admin_id: number | null;
};

export function buildDescriptionPayload(
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

export function buildTicketUpdatePayload(
    ticket: TicketRecordLike,
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

export function descriptionHtmlFromPayload(payload: unknown): string {
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

export function descriptionUserRefsFromPayload(
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

export function normalizeTicketPayload<T>(payload: unknown): T | null {
    if (
        typeof payload === 'object' &&
        payload !== null &&
        'data' in payload &&
        typeof (payload as { data?: unknown }).data === 'object' &&
        (payload as { data?: unknown }).data !== null
    ) {
        return (payload as { data: T }).data;
    }

    if (typeof payload === 'object' && payload !== null && 'id' in payload) {
        return payload as T;
    }

    return null;
}

export function parseRequestError(
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

export function withoutFieldError(
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

export function csrfToken(): string {
    const csrfMetaTag = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]',
    );

    return csrfMetaTag?.content ?? '';
}

export function formatDateTime(value: string | null): string {
    if (value === null) {
        return '—';
    }

    return new Date(value).toLocaleString();
}

export function formatRelative(value: string | null): string {
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

export function formatDuration(seconds: number): string {
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

export function formatAuditEvent(eventType: string): string {
    return eventType
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
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
