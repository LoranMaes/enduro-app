import { useCallback } from 'react';
import type { TrainingSessionView } from '@/types/training-plans';
import type {
    SessionEditorContext,
    ValidationErrors,
} from '../types';

type MutationResult = {
    success: boolean;
    validationErrors: ValidationErrors | null;
    message: string | null;
};

type UseSessionEditorWorkflowActionsParams = {
    context: SessionEditorContext | null;
    canPerformLinking: boolean;
    canPerformCompletion: boolean;
    setErrors: (errors: ValidationErrors) => void;
    setGeneralError: (value: string | null) => void;
    setStatusMessage: (value: string | null) => void;
    setSessionDetails: (session: TrainingSessionView | null) => void;
    refreshSessionDetails: (
        sessionId: number,
    ) => Promise<{ session: TrainingSessionView | null }>;
    linkActivity: (
        sessionId: number,
        activityId: number,
    ) => Promise<MutationResult>;
    unlinkActivity: (sessionId: number) => Promise<MutationResult>;
    completeSession: (sessionId: number) => Promise<MutationResult>;
    revertSessionCompletion: (sessionId: number) => Promise<MutationResult>;
    onSaved: () => void;
};

export function useSessionEditorWorkflowActions({
    context,
    canPerformLinking,
    canPerformCompletion,
    setErrors,
    setGeneralError,
    setStatusMessage,
    setSessionDetails,
    refreshSessionDetails,
    linkActivity,
    unlinkActivity,
    completeSession,
    revertSessionCompletion,
    onSaved,
}: UseSessionEditorWorkflowActionsParams) {
    const resetTransientState = useCallback((): void => {
        setErrors({});
        setGeneralError(null);
        setStatusMessage(null);
    }, [setErrors, setGeneralError, setStatusMessage]);

    const refreshEditedSession = useCallback(
        async (sessionId: number): Promise<void> => {
            const refreshed = await refreshSessionDetails(sessionId);

            if (refreshed.session !== null) {
                setSessionDetails(refreshed.session);
            }

            onSaved();
        },
        [onSaved, refreshSessionDetails, setSessionDetails],
    );

    const handleLinkActivity = useCallback(
        async (activityId: number): Promise<void> => {
            if (context === null || context.mode !== 'edit' || !canPerformLinking) {
                return;
            }

            resetTransientState();

            const result = await linkActivity(context.session.id, activityId);

            if (result.success) {
                await refreshEditedSession(context.session.id);
                setStatusMessage('Activity linked.');
                return;
            }

            if (result.validationErrors !== null) {
                setErrors(result.validationErrors);
            }

            setGeneralError(result.message ?? 'Unable to link activity.');
        },
        [
            canPerformLinking,
            context,
            linkActivity,
            refreshEditedSession,
            resetTransientState,
            setErrors,
            setGeneralError,
            setStatusMessage,
        ],
    );

    const handleUnlinkActivity = useCallback(async (): Promise<void> => {
        if (context === null || context.mode !== 'edit' || !canPerformLinking) {
            return;
        }

        resetTransientState();

        const result = await unlinkActivity(context.session.id);

        if (result.success) {
            await refreshEditedSession(context.session.id);
            setStatusMessage('Activity unlinked.');
            return;
        }

        if (result.validationErrors !== null) {
            setErrors(result.validationErrors);
        }

        setGeneralError(result.message ?? 'Unable to unlink activity.');
    }, [
        canPerformLinking,
        context,
        refreshEditedSession,
        resetTransientState,
        setErrors,
        setGeneralError,
        setStatusMessage,
        unlinkActivity,
    ]);

    const handleCompleteSession = useCallback(async (): Promise<void> => {
        if (context === null || context.mode !== 'edit' || !canPerformCompletion) {
            return;
        }

        resetTransientState();

        const result = await completeSession(context.session.id);

        if (result.success) {
            await refreshEditedSession(context.session.id);
            setStatusMessage('Session marked as completed.');
            return;
        }

        if (result.validationErrors !== null) {
            setErrors(result.validationErrors);
        }

        setGeneralError(result.message ?? 'Unable to complete this session.');
    }, [
        canPerformCompletion,
        completeSession,
        context,
        refreshEditedSession,
        resetTransientState,
        setErrors,
        setGeneralError,
        setStatusMessage,
    ]);

    const handleRevertCompletion = useCallback(async (): Promise<void> => {
        if (context === null || context.mode !== 'edit' || !canPerformCompletion) {
            return;
        }

        resetTransientState();

        const result = await revertSessionCompletion(context.session.id);

        if (result.success) {
            await refreshEditedSession(context.session.id);
            setStatusMessage('Session reverted to planned.');
            return;
        }

        if (result.validationErrors !== null) {
            setErrors(result.validationErrors);
        }

        setGeneralError(result.message ?? 'Unable to revert session completion.');
    }, [
        canPerformCompletion,
        context,
        refreshEditedSession,
        resetTransientState,
        revertSessionCompletion,
        setErrors,
        setGeneralError,
        setStatusMessage,
    ]);

    return {
        handleLinkActivity,
        handleUnlinkActivity,
        handleCompleteSession,
        handleRevertCompletion,
    };
}
