import { useMemo } from 'react';
import {
    calculateWorkoutStructureDurationMinutes,
    estimateWorkoutStructureTss,
} from '../../workout-structure-builder';
import { isSessionAdjusted, isSessionCompleted } from '../../session-reconciliation';
import type {
    SessionEditorContext,
    WorkoutStructure,
} from '../types';

type UseSessionDerivedValuesParams = {
    context: SessionEditorContext | null;
    sessionDetails: import('@/types/training-plans').TrainingSessionView | null;
    plannedStructure: WorkoutStructure | null;
    activeEditorTab: 'details' | 'structure';
    canManageSessionWrites: boolean;
    canManageSessionLinks: boolean;
    isSubmitting: boolean;
    isDeleting: boolean;
    isLinkingActivity: boolean;
    isUnlinkingActivity: boolean;
    isCompletingSession: boolean;
    isRevertingCompletion: boolean;
};

export function useSessionDerivedValues({
    context,
    sessionDetails,
    plannedStructure,
    activeEditorTab,
    canManageSessionWrites,
    canManageSessionLinks,
    isSubmitting,
    isDeleting,
    isLinkingActivity,
    isUnlinkingActivity,
    isCompletingSession,
    isRevertingCompletion,
}: UseSessionDerivedValuesParams) {
    const isEditMode = context?.mode === 'edit';

    const isBusy =
        isSubmitting ||
        isDeleting ||
        isLinkingActivity ||
        isUnlinkingActivity ||
        isCompletingSession ||
        isRevertingCompletion;

    const canPersistSessionWrites =
        canManageSessionWrites && context !== null && !isBusy;
    const canPerformLinking =
        canManageSessionLinks && isEditMode && context !== null && !isBusy;
    const canPerformCompletion =
        canManageSessionLinks && isEditMode && context !== null && !isBusy;

    const selectedSession =
        isEditMode && context !== null ? (sessionDetails ?? context.session) : null;

    const sessionIsCompleted =
        selectedSession !== null && isSessionCompleted(selectedSession);
    const sessionIsAdjusted =
        selectedSession !== null && isSessionAdjusted(selectedSession);

    const linkedActivitySummary = selectedSession?.linkedActivitySummary ?? null;
    const suggestedActivities =
        selectedSession?.suggestedActivities.filter(
            (activity) => activity.id !== selectedSession.linkedActivityId,
        ) ?? [];

    const plannedDurationLabel =
        selectedSession !== null
            ? formatDurationMinutes(selectedSession.durationMinutes)
            : '—';
    const actualDurationLabel = sessionIsCompleted
        ? formatDurationMinutes(selectedSession?.actualDurationMinutes ?? null)
        : formatDurationSecondsValue(linkedActivitySummary?.durationSeconds ?? null);

    const plannedTssLabel = formatTssValue(selectedSession?.plannedTss ?? null);
    const actualTssLabel = sessionIsCompleted
        ? formatTssValue(selectedSession?.actualTss ?? null)
        : '—';

    const dialogTitle = isEditMode ? 'Edit Session' : 'Create Session';
    const dialogDescription = isEditMode
        ? 'Update planned session details, manage links, or remove this session.'
        : 'Add a planned training session to this day.';

    const isStructureTab = activeEditorTab === 'structure';
    const hasStructuredPlanning =
        plannedStructure !== null && plannedStructure.steps.length > 0;

    const derivedStructureDurationMinutes = useMemo(() => {
        return calculateWorkoutStructureDurationMinutes(plannedStructure);
    }, [plannedStructure]);

    const derivedStructureTss = useMemo(() => {
        return estimateWorkoutStructureTss(plannedStructure);
    }, [plannedStructure]);

    return {
        isEditMode,
        isBusy,
        canPersistSessionWrites,
        canPerformLinking,
        canPerformCompletion,
        selectedSession,
        sessionIsCompleted,
        sessionIsAdjusted,
        linkedActivitySummary,
        suggestedActivities,
        plannedDurationLabel,
        actualDurationLabel,
        plannedTssLabel,
        actualTssLabel,
        dialogTitle,
        dialogDescription,
        isStructureTab,
        hasStructuredPlanning,
        derivedStructureDurationMinutes,
        derivedStructureTss,
    };
}

export function formatDurationSeconds(durationSeconds: number | null): string {
    if (durationSeconds === null || Number.isNaN(durationSeconds)) {
        return '—';
    }

    const roundedMinutes = Math.max(1, Math.round(durationSeconds / 60));
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;

    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (hours > 0) {
        return `${hours}h`;
    }

    return `${minutes}m`;
}

export function formatDurationSecondsValue(durationSeconds: number | null): string {
    if (durationSeconds === null || Number.isNaN(durationSeconds)) {
        return '—';
    }

    return formatDurationSeconds(durationSeconds);
}

export function formatDurationMinutes(durationMinutes: number | null): string {
    if (durationMinutes === null || Number.isNaN(durationMinutes)) {
        return '—';
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (hours > 0) {
        return `${hours}h`;
    }

    return `${minutes}m`;
}

export function formatTssValue(tss: number | null): string {
    if (tss === null || Number.isNaN(tss)) {
        return '—';
    }

    return `${tss}`;
}

export function formatStartedAt(startedAt: string | null): string {
    if (startedAt === null) {
        return 'Unknown start time';
    }

    return new Date(startedAt).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export function formatCompletedAt(completedAt: string): string {
    return new Date(completedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}
