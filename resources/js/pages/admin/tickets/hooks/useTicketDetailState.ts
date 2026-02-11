import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
    DescriptionUserRef,
    TicketDescriptionValue,
} from '../components/ticket-description-editor';
import {
    buildTicketUpdatePayload,
    descriptionHtmlFromPayload,
    descriptionUserRefsFromPayload,
    withoutFieldError,
} from '../lib/ticket-utils';
import type {
    RequestFieldErrors,
    TicketImportance,
    TicketRecord,
    TicketSyncState,
    TicketType,
} from '../types';
import type {
    TicketMutationResult,
    TicketUpdatePayload,
} from './useTicketMutations';

type UseTicketDetailStateOptions = {
    open: boolean;
    ticket: TicketRecord | null;
    onTicketChange: (ticket: TicketRecord | null) => void;
    onUpdateTicket: (
        ticketId: number,
        payload: TicketUpdatePayload,
    ) => Promise<TicketMutationResult<TicketRecord>>;
    onUpsertInternalNote: (
        ticketId: number,
        content: string,
    ) => Promise<TicketMutationResult<TicketRecord>>;
};

type UseTicketDetailStateResult = {
    ticketTitleDraft: string;
    setTicketTitleDraft: (value: string) => void;
    ticketTypeDraft: TicketType;
    setTicketTypeDraft: (value: TicketType) => void;
    ticketImportanceDraft: TicketImportance;
    setTicketImportanceDraft: (value: TicketImportance) => void;
    ticketAssigneeDraftId: number | null;
    setTicketAssigneeDraftId: (value: number | null) => void;
    ticketDetailError: string | null;
    ticketDetailFieldErrors: RequestFieldErrors;
    ticketDetailTab: 'overview' | 'audit';
    setTicketDetailTab: (value: 'overview' | 'audit') => void;
    ticketInternalNote: string;
    setTicketInternalNote: (value: string) => void;
    ticketDetailDescriptionHtml: string;
    ticketSyncState: TicketSyncState;
    ticketSyncMessage: string;
    clearFieldError: (field: string) => void;
    clearError: () => void;
    handleDescriptionChange: (value: TicketDescriptionValue) => void;
};

export function useTicketDetailState({
    open,
    ticket,
    onTicketChange,
    onUpdateTicket,
    onUpsertInternalNote,
}: UseTicketDetailStateOptions): UseTicketDetailStateResult {
    const [ticketTitleDraft, setTicketTitleDraftState] = useState('');
    const [ticketTypeDraft, setTicketTypeDraftState] =
        useState<TicketType>('feature');
    const [ticketImportanceDraft, setTicketImportanceDraftState] =
        useState<TicketImportance>('normal');
    const [ticketAssigneeDraftId, setTicketAssigneeDraftIdState] = useState<
        number | null
    >(null);
    const [ticketDetailError, setTicketDetailError] = useState<string | null>(
        null,
    );
    const [ticketDetailFieldErrors, setTicketDetailFieldErrors] =
        useState<RequestFieldErrors>({});
    const [ticketDetailTab, setTicketDetailTab] = useState<
        'overview' | 'audit'
    >('overview');
    const [ticketInternalNote, setTicketInternalNoteState] = useState('');
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
        if (ticket === null) {
            setTicketTitleDraftState('');
            setTicketTypeDraftState('feature');
            setTicketImportanceDraftState('normal');
            setTicketAssigneeDraftIdState(null);
            setTicketInternalNoteState('');
            setTicketDetailDescriptionHtml('');
            setTicketDetailDescriptionMentions([]);
            setTicketDetailDescriptionUserRefs([]);
            setSavedTicketPayloadHash(null);
            setSavedInternalNoteValue('');
            setTicketDetailFieldErrors({});
            setTicketDetailError(null);
            setTicketDetailTab('overview');
            setTicketSyncState('idle');
            setTicketSyncMessage('All changes saved');

            return;
        }

        const descriptionHtml = descriptionHtmlFromPayload(ticket.description);
        const mentionAdminIds = ticket.mentions.map(
            (mention) => mention.mentioned_admin_id,
        );
        const userRefs = descriptionUserRefsFromPayload(ticket.description);
        const internalNoteValue = ticket.internal_note?.content ?? '';

        setTicketTitleDraftState(ticket.title);
        setTicketTypeDraftState(ticket.type);
        setTicketImportanceDraftState(ticket.importance);
        setTicketAssigneeDraftIdState(ticket.assignee_admin_id);
        setTicketInternalNoteState(internalNoteValue);
        setTicketDetailDescriptionHtml(descriptionHtml);
        setTicketDetailDescriptionMentions(mentionAdminIds);
        setTicketDetailDescriptionUserRefs(userRefs);
        setSavedTicketPayloadHash(
            JSON.stringify(
                buildTicketUpdatePayload(
                    {
                        title: ticket.title,
                        type: ticket.type,
                        importance: ticket.importance,
                        assignee_admin_id: ticket.assignee_admin_id,
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
    }, [ticket?.id]);

    const ticketDetailPayload = useMemo(() => {
        if (ticket === null) {
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
        ticket,
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

    const persistTicketChanges = useCallback(
        async (
            changes: TicketUpdatePayload,
            payloadHash: string,
        ): Promise<void> => {
            if (ticket === null) {
                return;
            }

            const requestId = activeSyncRequestId.current + 1;
            activeSyncRequestId.current = requestId;
            setTicketDetailError(null);
            setTicketDetailFieldErrors({});
            setTicketSyncState('syncing');
            setTicketSyncMessage('Syncing changes...');

            const response = await onUpdateTicket(ticket.id, changes);

            if (requestId !== activeSyncRequestId.current) {
                return;
            }

            if (!response.ok) {
                setTicketDetailError(response.message);
                setTicketDetailFieldErrors(response.fieldErrors);
                setTicketSyncState('error');
                setTicketSyncMessage('Sync failed');
                return;
            }

            if (response.data !== null) {
                onTicketChange(response.data);
            }

            setSavedTicketPayloadHash(payloadHash);
            setTicketSyncState('saved');
            setTicketSyncMessage('All changes saved');
        },
        [onTicketChange, onUpdateTicket, ticket],
    );

    const persistInternalNote = useCallback(
        async (content: string): Promise<void> => {
            if (ticket === null) {
                return;
            }

            setTicketDetailError(null);
            setTicketDetailFieldErrors({});
            setTicketSyncState('syncing');
            setTicketSyncMessage('Syncing notes...');

            const response = await onUpsertInternalNote(ticket.id, content);

            if (!response.ok) {
                setTicketDetailError(response.message);
                setTicketDetailFieldErrors(response.fieldErrors);
                setTicketSyncState('error');
                setTicketSyncMessage('Sync failed');
                return;
            }

            if (response.data !== null) {
                onTicketChange(response.data);
            }

            setSavedInternalNoteValue(content);
            setTicketSyncState('saved');
            setTicketSyncMessage('All changes saved');
        },
        [onTicketChange, onUpsertInternalNote, ticket],
    );

    useEffect(() => {
        if (
            !open ||
            ticketDetailTab !== 'overview' ||
            ticket === null ||
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
        open,
        persistTicketChanges,
        savedTicketPayloadHash,
        ticket,
        ticketDetailPayload,
        ticketDetailPayloadHash,
        ticketDetailTab,
    ]);

    useEffect(() => {
        if (
            !open ||
            ticketDetailTab !== 'overview' ||
            ticket === null ||
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
        open,
        persistInternalNote,
        savedInternalNoteValue,
        ticket,
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

    const clearFieldError = useCallback((field: string): void => {
        setTicketDetailFieldErrors((current) =>
            withoutFieldError(current, field),
        );
    }, []);

    const clearError = useCallback((): void => {
        setTicketDetailError(null);
    }, []);

    const setTicketTitleDraft = useCallback((value: string): void => {
        setTicketTitleDraftState(value);
    }, []);

    const setTicketTypeDraft = useCallback((value: TicketType): void => {
        setTicketTypeDraftState(value);
    }, []);

    const setTicketImportanceDraft = useCallback(
        (value: TicketImportance): void => {
            setTicketImportanceDraftState(value);
        },
        [],
    );

    const setTicketAssigneeDraftId = useCallback(
        (value: number | null): void => {
            setTicketAssigneeDraftIdState(value);
        },
        [],
    );

    const setTicketInternalNote = useCallback((value: string): void => {
        setTicketInternalNoteState(value);
    }, []);

    const handleDescriptionChange = useCallback(
        (value: TicketDescriptionValue): void => {
            setTicketDetailDescriptionHtml(value.html);
            setTicketDetailDescriptionMentions(value.mentionAdminIds);
            setTicketDetailDescriptionUserRefs(value.userRefs);
        },
        [],
    );

    return {
        ticketTitleDraft,
        setTicketTitleDraft,
        ticketTypeDraft,
        setTicketTypeDraft,
        ticketImportanceDraft,
        setTicketImportanceDraft,
        ticketAssigneeDraftId,
        setTicketAssigneeDraftId,
        ticketDetailError,
        ticketDetailFieldErrors,
        ticketDetailTab,
        setTicketDetailTab,
        ticketInternalNote,
        setTicketInternalNote,
        ticketDetailDescriptionHtml,
        ticketSyncState,
        ticketSyncMessage,
        clearFieldError,
        clearError,
        handleDescriptionChange,
    };
}
