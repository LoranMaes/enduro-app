import { useCallback, useState } from 'react';
import {
    complete as completeTrainingSession,
    revertCompletion as revertTrainingSessionCompletion,
} from '@/routes/training-sessions';
import type { ValidationErrors } from '../types';
import { extractMessage, extractValidationErrors } from '../utils';

type CompletionResult = {
    success: boolean;
    validationErrors: ValidationErrors | null;
    message: string | null;
};

export function useSessionCompletion() {
    const [isCompletingSession, setIsCompletingSession] = useState(false);
    const [isRevertingCompletion, setIsRevertingCompletion] = useState(false);

    const completeSession = useCallback(
        async (sessionId: number): Promise<CompletionResult> => {
            setIsCompletingSession(true);

            try {
                const route = completeTrainingSession(sessionId);
                const response = await fetch(route.url, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (response.ok) {
                    return {
                        success: true,
                        validationErrors: null,
                        message: null,
                    };
                }

                const responsePayload = await response.json().catch(() => null);
                return {
                    success: false,
                    validationErrors: extractValidationErrors(responsePayload),
                    message:
                        extractMessage(responsePayload) ??
                        'Unable to complete this session.',
                };
            } finally {
                setIsCompletingSession(false);
            }
        },
        [],
    );

    const revertSessionCompletion = useCallback(
        async (sessionId: number): Promise<CompletionResult> => {
            setIsRevertingCompletion(true);

            try {
                const route = revertTrainingSessionCompletion(sessionId);
                const response = await fetch(route.url, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (response.ok) {
                    return {
                        success: true,
                        validationErrors: null,
                        message: null,
                    };
                }

                const responsePayload = await response.json().catch(() => null);
                return {
                    success: false,
                    validationErrors: extractValidationErrors(responsePayload),
                    message:
                        extractMessage(responsePayload) ??
                        'Unable to revert session completion.',
                };
            } finally {
                setIsRevertingCompletion(false);
            }
        },
        [],
    );

    return {
        isCompletingSession,
        isRevertingCompletion,
        completeSession,
        revertSessionCompletion,
    };
}
