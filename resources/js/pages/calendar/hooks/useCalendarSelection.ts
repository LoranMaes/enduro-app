import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import type { ActivityView, TrainingSessionView } from '@/types/training-plans';
import type { SessionEditorContext } from '../components/session-editor-modal';

export function useCalendarSelection({
    role,
    impersonating,
}: {
    role: string | null | undefined;
    impersonating: boolean;
}) {
    const [sessionEditorContext, setSessionEditorContext] =
        useState<SessionEditorContext | null>(null);

    const canManageSessionWrites = role === 'athlete' && !impersonating;
    const canManageSessionLinks = role === 'athlete';
    const canOpenActivityDetails = role === 'athlete';

    const openCreateSessionModal = useCallback(
        (date: string): void => {
            if (!canManageSessionWrites) {
                return;
            }

            setSessionEditorContext({
                mode: 'create',
                trainingWeekId: null,
                date,
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
                router.visit(`/sessions/${session.id}`);

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
                router.visit(`/sessions/${activity.linkedSessionId}`);

                return;
            }

            router.visit(`/activity-details/${activity.id}`);
        },
        [canOpenActivityDetails],
    );

    const closeSessionModal = useCallback((): void => {
        setSessionEditorContext(null);
    }, []);

    return {
        sessionEditorContext,
        setSessionEditorContext,
        canManageSessionWrites,
        canManageSessionLinks,
        canOpenActivityDetails,
        openCreateSessionModal,
        openEditSessionModal,
        openActivityDetails,
        closeSessionModal,
    };
}
