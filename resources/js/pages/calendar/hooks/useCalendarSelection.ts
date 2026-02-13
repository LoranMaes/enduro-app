import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { show as showActivityDetails } from '@/routes/activity-details';
import { show as showSessionDetails } from '@/routes/sessions';
import type {
    ActivityView,
    CalendarEntryView,
    GoalView,
    TrainingSessionView,
} from '@/types/training-plans';
import type { SessionEditorContext } from '../components/session-editor-modal';
import type {
    CalendarEntryEditorContext,
    GoalEditorContext,
    OtherEntryType,
    WorkoutEntrySport,
} from '../types';

export function useCalendarSelection({
    role,
    impersonating,
}: {
    role: string | null | undefined;
    impersonating: boolean;
}) {
    const [sessionEditorContext, setSessionEditorContext] =
        useState<SessionEditorContext | null>(null);
    const [createEntryDate, setCreateEntryDate] = useState<string | null>(null);
    const [calendarEntryEditorContext, setCalendarEntryEditorContext] =
        useState<CalendarEntryEditorContext | null>(null);
    const [goalEditorContext, setGoalEditorContext] =
        useState<GoalEditorContext | null>(null);

    const isAthleteContext =
        role === null || role === undefined || role === 'athlete' || impersonating;
    const canManageSessionWrites = isAthleteContext;
    const canManageSessionLinks = isAthleteContext;
    const canOpenActivityDetails = isAthleteContext;

    const openCreateEntryFlow = useCallback(
        (date: string): void => {
            if (!canManageSessionWrites) {
                return;
            }

            setCreateEntryDate(date);
        },
        [canManageSessionWrites],
    );

    const openCreateSessionModal = useCallback(
        (date: string, sport?: WorkoutEntrySport): void => {
            if (!canManageSessionWrites) {
                return;
            }

            setCreateEntryDate(null);
            setSessionEditorContext({
                mode: 'create',
                trainingWeekId: null,
                date,
                sport,
            });
        },
        [canManageSessionWrites],
    );

    const openCreateCalendarEntryModal = useCallback(
        (date: string, type: Exclude<OtherEntryType, 'goal'>): void => {
            if (!canManageSessionWrites) {
                return;
            }

            setCreateEntryDate(null);
            setCalendarEntryEditorContext({
                mode: 'create',
                date,
                type,
            });
        },
        [canManageSessionWrites],
    );

    const openCreateGoalModal = useCallback(
        (date: string): void => {
            if (!canManageSessionWrites) {
                return;
            }

            setCreateEntryDate(null);
            setGoalEditorContext({
                mode: 'create',
                date,
            });
        },
        [canManageSessionWrites],
    );

    const openGoalModal = useCallback(
        (goal: GoalView): void => {
            if (!canManageSessionWrites) {
                return;
            }

            setGoalEditorContext({
                mode: 'edit',
                goal,
            });
        },
        [canManageSessionWrites],
    );

    const openEditCalendarEntryModal = useCallback(
        (entry: CalendarEntryView): void => {
            if (!canManageSessionWrites) {
                return;
            }

            setCalendarEntryEditorContext({
                mode: 'edit',
                entry,
            });
        },
        [canManageSessionWrites],
    );

    const openEditSessionModal = useCallback(
        (session: TrainingSessionView): void => {
            if (!canManageSessionLinks) {
                return;
            }

            if (session.status === 'completed') {
                router.visit(showSessionDetails(session.id).url);

                return;
            }

            setSessionEditorContext({
                mode: 'edit',
                trainingWeekId: session.trainingWeekId,
                date: session.scheduledDate,
                session,
            });
        },
        [canManageSessionLinks],
    );

    const openActivityDetails = useCallback(
        (activity: ActivityView): void => {
            if (!canOpenActivityDetails) {
                return;
            }

            if (activity.linkedSessionId !== null) {
                router.visit(showSessionDetails(activity.linkedSessionId).url);

                return;
            }

            router.visit(showActivityDetails(activity.id).url);
        },
        [canOpenActivityDetails],
    );

    const closeSessionModal = useCallback((): void => {
        setSessionEditorContext(null);
    }, []);

    const closeCreateEntryFlow = useCallback((): void => {
        setCreateEntryDate(null);
    }, []);

    const closeCalendarEntryModal = useCallback((): void => {
        setCalendarEntryEditorContext(null);
    }, []);

    const closeGoalModal = useCallback((): void => {
        setGoalEditorContext(null);
    }, []);

    return {
        sessionEditorContext,
        setSessionEditorContext,
        createEntryDate,
        calendarEntryEditorContext,
        goalEditorContext,
        canManageSessionWrites,
        canManageSessionLinks,
        canOpenActivityDetails,
        openCreateEntryFlow,
        openCreateSessionModal,
        openCreateCalendarEntryModal,
        openCreateGoalModal,
        openEditCalendarEntryModal,
        openGoalModal,
        openEditSessionModal,
        openActivityDetails,
        closeSessionModal,
        closeCreateEntryFlow,
        closeCalendarEntryModal,
        closeGoalModal,
    };
}
