import { useCallback, useMemo, useState } from 'react';
import { copy as copyActivity, destroy as destroyActivity } from '@/routes/activities';
import { unlinkActivity as unlinkActivityFromSession } from '@/routes/training-sessions';
import type { ActivityView } from '@/types/training-plans';
import type { CalendarWindow } from '../lib/calendar-weeks';

type UseCalendarActivityActionsParams = {
    calendarWindow: CalendarWindow;
    canManageActivityActions: boolean;
    refreshCalendarData: (calendarWindow: CalendarWindow) => void;
    onOpenActivityDetails: (activity: ActivityView) => void;
};

const toActivityKey = (activity: ActivityView | null): string | null => {
    if (activity === null) {
        return null;
    }

    return String(activity.id);
};

const extractErrorMessage = (payload: unknown): string | null => {
    if (
        typeof payload === 'object' &&
        payload !== null &&
        'message' in payload &&
        typeof payload.message === 'string'
    ) {
        return payload.message;
    }

    return null;
};

export function useCalendarActivityActions({
    calendarWindow,
    canManageActivityActions,
    refreshCalendarData,
    onOpenActivityDetails,
}: UseCalendarActivityActionsParams) {
    const [activityError, setActivityError] = useState<string | null>(null);
    const [pendingDeleteActivity, setPendingDeleteActivity] =
        useState<ActivityView | null>(null);
    const [processingActivityKeys, setProcessingActivityKeys] = useState<
        Record<string, true>
    >({});

    const withProcessing = useCallback(
        async (
            activity: ActivityView,
            callback: () => Promise<void>,
        ): Promise<void> => {
            const key = toActivityKey(activity);

            if (key === null) {
                return;
            }

            let alreadyProcessing = false;
            setProcessingActivityKeys((current) => {
                if (current[key] === true) {
                    alreadyProcessing = true;

                    return current;
                }

                return {
                    ...current,
                    [key]: true,
                };
            });

            if (alreadyProcessing) {
                return;
            }

            try {
                await callback();
            } finally {
                setProcessingActivityKeys((current) => {
                    const next = { ...current };
                    delete next[key];

                    return next;
                });
            }
        },
        [],
    );

    const clearActivityError = useCallback((): void => {
        setActivityError(null);
    }, []);

    const openActivityDetails = useCallback(
        (activity: ActivityView): void => {
            setActivityError(null);
            onOpenActivityDetails(activity);
        },
        [onOpenActivityDetails],
    );

    const openActivityLinkFlow = useCallback(
        (activity: ActivityView): void => {
            setActivityError(null);
            onOpenActivityDetails(activity);
        },
        [onOpenActivityDetails],
    );

    const copyActivityToPlannedSession = useCallback(
        async (activity: ActivityView): Promise<void> => {
            if (!canManageActivityActions) {
                return;
            }

            await withProcessing(activity, async () => {
                setActivityError(null);
                const route = copyActivity(String(activity.id));
                const response = await fetch(route.url, {
                    method: route.method.toUpperCase(),
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    const payload = await response.json().catch(() => null);
                    setActivityError(
                        extractErrorMessage(payload) ??
                            'Unable to copy activity.',
                    );

                    return;
                }

                refreshCalendarData(calendarWindow);
            });
        },
        [
            calendarWindow,
            canManageActivityActions,
            refreshCalendarData,
            withProcessing,
        ],
    );

    const requestDeleteActivity = useCallback(
        (activity: ActivityView): void => {
            if (!canManageActivityActions) {
                return;
            }

            setActivityError(null);
            setPendingDeleteActivity(activity);
        },
        [canManageActivityActions],
    );

    const cancelDeleteActivity = useCallback((): void => {
        if (pendingDeleteActivity !== null) {
            const activityKey = toActivityKey(pendingDeleteActivity);

            if (
                activityKey !== null &&
                processingActivityKeys[activityKey] === true
            ) {
                return;
            }
        }

        setPendingDeleteActivity(null);
    }, [pendingDeleteActivity, processingActivityKeys]);

    const confirmDeleteActivity = useCallback(async (): Promise<void> => {
        if (!canManageActivityActions || pendingDeleteActivity === null) {
            return;
        }

        await withProcessing(pendingDeleteActivity, async () => {
            setActivityError(null);
            const route = destroyActivity(String(pendingDeleteActivity.id));
            const response = await fetch(route.url, {
                method: route.method.toUpperCase(),
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                setActivityError(
                    extractErrorMessage(payload) ??
                        'Unable to delete activity.',
                );

                return;
            }

            setPendingDeleteActivity(null);
            refreshCalendarData(calendarWindow);
        });
    }, [
        calendarWindow,
        canManageActivityActions,
        pendingDeleteActivity,
        refreshCalendarData,
        withProcessing,
    ]);

    const unlinkActivity = useCallback(
        async (activity: ActivityView): Promise<void> => {
            if (!canManageActivityActions || activity.linkedSessionId === null) {
                return;
            }

            await withProcessing(activity, async () => {
                setActivityError(null);
                const route = unlinkActivityFromSession(
                    String(activity.linkedSessionId),
                );
                const response = await fetch(route.url, {
                    method: route.method.toUpperCase(),
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    const payload = await response.json().catch(() => null);
                    setActivityError(
                        extractErrorMessage(payload) ??
                            'Unable to unlink activity.',
                    );

                    return;
                }

                refreshCalendarData(calendarWindow);
            });
        },
        [
            calendarWindow,
            canManageActivityActions,
            refreshCalendarData,
            withProcessing,
        ],
    );

    const isDeleteProcessing = useMemo(() => {
        const key = toActivityKey(pendingDeleteActivity);

        if (key === null) {
            return false;
        }

        return processingActivityKeys[key] === true;
    }, [pendingDeleteActivity, processingActivityKeys]);

    const isActivityProcessing = useCallback(
        (activity: ActivityView): boolean => {
            const key = toActivityKey(activity);

            if (key === null) {
                return false;
            }

            return processingActivityKeys[key] === true;
        },
        [processingActivityKeys],
    );

    return {
        activityError,
        pendingDeleteActivity,
        isDeleteProcessing,
        clearActivityError,
        openActivityDetails,
        openActivityLinkFlow,
        copyActivityToPlannedSession,
        requestDeleteActivity,
        cancelDeleteActivity,
        confirmDeleteActivity,
        unlinkActivity,
        isActivityProcessing,
    };
}
