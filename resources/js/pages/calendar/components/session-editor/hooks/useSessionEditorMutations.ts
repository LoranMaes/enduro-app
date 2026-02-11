import { useCallback, useState } from 'react';
import {
    destroy as destroyTrainingSession,
    show as showTrainingSession,
    store as storeTrainingSession,
    update as updateTrainingSession,
} from '@/routes/training-sessions';
import type {
    ApiSessionResponse,
    SessionEditorContext,
    ValidationErrors,
    SessionWritePayload,
} from '../types';
import {
    extractMessage,
    extractValidationErrors,
    mapSessionFromApi,
} from '../utils';

type MutationResult = {
    success: boolean;
    validationErrors: ValidationErrors | null;
    message: string | null;
};

type DeleteResult = {
    success: boolean;
    message: string | null;
};

type RefreshResult = {
    session: import('@/types/training-plans').TrainingSessionView | null;
};

export function useSessionEditorMutations() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isLoadingSessionDetails, setIsLoadingSessionDetails] =
        useState(false);

    const refreshSessionDetails = useCallback(
        async (sessionId: number): Promise<RefreshResult> => {
            setIsLoadingSessionDetails(true);

            try {
                const route = showTrainingSession(sessionId);
                const response = await fetch(route.url, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    return { session: null };
                }

                const payload = (await response.json()) as ApiSessionResponse;

                if (payload.data === undefined) {
                    return { session: null };
                }

                return {
                    session: mapSessionFromApi(payload.data),
                };
            } finally {
                setIsLoadingSessionDetails(false);
            }
        },
        [],
    );

    const submitSession = useCallback(
        async (
            context: SessionEditorContext,
            payload: SessionWritePayload,
        ): Promise<MutationResult> => {
            setIsSubmitting(true);

            try {
                const route =
                    context.mode === 'create'
                        ? storeTrainingSession()
                        : updateTrainingSession(context.session.id);

                const response = await fetch(route.url, {
                    method: context.mode === 'create' ? 'POST' : 'PUT',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    return {
                        success: true,
                        validationErrors: null,
                        message: null,
                    };
                }

                const responsePayload = await response.json().catch(() => null);
                const validationErrors = extractValidationErrors(responsePayload);

                return {
                    success: false,
                    validationErrors,
                    message:
                        extractMessage(responsePayload) ??
                        'Unable to save this session.',
                };
            } finally {
                setIsSubmitting(false);
            }
        },
        [],
    );

    const deleteSession = useCallback(async (sessionId: number): Promise<DeleteResult> => {
        setIsDeleting(true);

        try {
            const route = destroyTrainingSession(sessionId);
            const response = await fetch(route.url, {
                method: 'DELETE',
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (response.ok) {
                return {
                    success: true,
                    message: null,
                };
            }

            const responsePayload = await response.json().catch(() => null);

            return {
                success: false,
                message:
                    extractMessage(responsePayload) ?? 'Unable to delete session.',
            };
        } finally {
            setIsDeleting(false);
        }
    }, []);

    return {
        isSubmitting,
        isDeleting,
        isLoadingSessionDetails,
        refreshSessionDetails,
        submitSession,
        deleteSession,
    };
}
