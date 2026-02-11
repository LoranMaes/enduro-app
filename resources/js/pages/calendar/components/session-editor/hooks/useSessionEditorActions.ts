import { FormEvent, KeyboardEvent, useCallback } from 'react';
import { buildPayload } from '../utils';
import type {
    SessionEditorContext,
    SessionWritePayload,
    Sport,
    ValidationErrors,
    WorkoutStructure,
} from '../types';

type MutationResult = {
    success: boolean;
    validationErrors: ValidationErrors | null;
    message: string | null;
};

type DeleteMutationResult = {
    success: boolean;
    message: string | null;
};

type UseSessionEditorActionsParams = {
    context: SessionEditorContext | null;
    canManageSessionWrites: boolean;
    isBusy: boolean;
    sport: Sport;
    plannedDurationMinutes: string;
    plannedTss: string;
    notes: string;
    plannedStructure: WorkoutStructure | null;
    derivedStructureDurationMinutes: number;
    derivedStructureTss: number | null;
    confirmingDelete: boolean;
    setErrors: (errors: ValidationErrors) => void;
    setGeneralError: (value: string | null) => void;
    setStatusMessage: (value: string | null) => void;
    setConfirmingDelete: (value: boolean) => void;
    submitSession: (
        context: SessionEditorContext,
        payload: SessionWritePayload,
    ) => Promise<MutationResult>;
    deleteSession: (sessionId: number) => Promise<DeleteMutationResult>;
    onOpenChange: (open: boolean) => void;
    onSaved: () => void;
};

export function useSessionEditorActions({
    context,
    canManageSessionWrites,
    isBusy,
    sport,
    plannedDurationMinutes,
    plannedTss,
    notes,
    plannedStructure,
    derivedStructureDurationMinutes,
    derivedStructureTss,
    confirmingDelete,
    setErrors,
    setGeneralError,
    setStatusMessage,
    setConfirmingDelete,
    submitSession,
    deleteSession,
    onOpenChange,
    onSaved,
}: UseSessionEditorActionsParams) {
    const resetTransientState = useCallback((): void => {
        setErrors({});
        setGeneralError(null);
        setStatusMessage(null);
    }, [setErrors, setGeneralError, setStatusMessage]);

    const handleFormKeyDown = useCallback(
        (event: KeyboardEvent<HTMLFormElement>): void => {
            if (!canManageSessionWrites || event.key !== 'Enter') {
                return;
            }

            if (event.target instanceof HTMLTextAreaElement) {
                return;
            }

            if (event.target instanceof HTMLButtonElement) {
                return;
            }

            event.preventDefault();

            if (!isBusy) {
                event.currentTarget.requestSubmit();
            }
        },
        [canManageSessionWrites, isBusy],
    );

    const submit = useCallback(
        async (event: FormEvent<HTMLFormElement>): Promise<void> => {
            event.preventDefault();

            if (context === null || !canManageSessionWrites || isBusy) {
                return;
            }

            resetTransientState();
            setConfirmingDelete(false);

            const payload = buildPayload({
                trainingWeekId: context.trainingWeekId,
                date: context.date,
                sport,
                plannedDurationMinutes,
                plannedTss,
                notes,
                plannedStructure,
                derivedStructureDurationMinutes,
                derivedStructureTss,
            });

            const result = await submitSession(context, payload);

            if (result.success) {
                onOpenChange(false);
                onSaved();
                return;
            }

            if (result.validationErrors !== null) {
                setErrors(result.validationErrors);

                if (
                    result.validationErrors.training_week_id !== undefined ||
                    result.validationErrors.date !== undefined
                ) {
                    setGeneralError(
                        'Session context is invalid for this week. Refresh and try again.',
                    );
                    return;
                }
            }

            setGeneralError(result.message ?? 'Unable to save this session.');
        },
        [
            canManageSessionWrites,
            context,
            derivedStructureDurationMinutes,
            derivedStructureTss,
            isBusy,
            notes,
            onOpenChange,
            onSaved,
            plannedDurationMinutes,
            plannedStructure,
            plannedTss,
            resetTransientState,
            setConfirmingDelete,
            setErrors,
            setGeneralError,
            sport,
            submitSession,
        ],
    );

    const handleDeleteSession = useCallback(async (): Promise<void> => {
        if (
            context === null ||
            context.mode !== 'edit' ||
            !canManageSessionWrites ||
            isBusy
        ) {
            return;
        }

        if (!confirmingDelete) {
            setConfirmingDelete(true);
            return;
        }

        resetTransientState();

        const result = await deleteSession(context.session.id);

        if (result.success) {
            onOpenChange(false);
            onSaved();
            return;
        }

        setGeneralError(result.message ?? 'Unable to delete session.');
    }, [
        canManageSessionWrites,
        confirmingDelete,
        context,
        deleteSession,
        isBusy,
        onOpenChange,
        onSaved,
        resetTransientState,
        setConfirmingDelete,
        setGeneralError,
    ]);

    return {
        handleFormKeyDown,
        submit,
        handleDeleteSession,
    };
}
