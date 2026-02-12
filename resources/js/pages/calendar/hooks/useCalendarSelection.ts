import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { show as showActivityDetails } from '@/routes/activity-details';
import { show as showSessionDetails } from '@/routes/sessions';
import type {
    ActivityView,
    CalendarEntryView,
    TrainingSessionView,
} from '@/types/training-plans';
import type { SessionEditorContext } from '../components/session-editor-modal';
import type {
    CalendarEntryEditorContext,
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

    void impersonating;

    const canManageSessionWrites = role === 'athlete';
    const canManageSessionLinks = role === 'athlete';
    const canOpenActivityDetails = role === 'athlete';

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
        (date: string, type: OtherEntryType): void => {
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

    return {
        sessionEditorContext,
        setSessionEditorContext,
        createEntryDate,
        calendarEntryEditorContext,
        canManageSessionWrites,
        canManageSessionLinks,
        canOpenActivityDetails,
        openCreateEntryFlow,
        openCreateSessionModal,
        openCreateCalendarEntryModal,
        openEditCalendarEntryModal,
        openEditSessionModal,
        openActivityDetails,
        closeSessionModal,
        closeCreateEntryFlow,
        closeCalendarEntryModal,
    };
}
