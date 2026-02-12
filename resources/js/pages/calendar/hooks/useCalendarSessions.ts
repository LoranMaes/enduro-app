import { router } from '@inertiajs/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { initializeEcho } from '@/lib/echo';
import { sync as syncActivityProvider } from '@/routes/activity-providers';
import type {
    ActivityView,
    CalendarEntryView,
    TrainingSessionView,
} from '@/types/training-plans';
import {
    SYNC_PENDING_STATUSES,
    SYNC_POLLING_STATUSES,
} from '../constants';
import type { CalendarWindow } from '../lib/calendar-weeks';
import type { ProviderStatus } from '../types';
import {
    fetchWindowCalendarEntries as fetchWindowCalendarEntriesRequest,
    fetchWindowActivities as fetchWindowActivitiesRequest,
    fetchWindowSessions as fetchWindowSessionsRequest,
    mergeActivities as mergeActivitiesState,
    mergeCalendarEntries as mergeCalendarEntriesState,
    mergeSessions as mergeSessionsState,
} from '../utils';
export function useCalendarSessions({
    initialSessions,
    initialActivities,
    initialEntries,
    initialWindow,
    providerStatus,
    authUserId,
    canManageSessionWrites,
}: {
    initialSessions: TrainingSessionView[];
    initialActivities: ActivityView[];
    initialEntries: CalendarEntryView[];
    initialWindow: CalendarWindow;
    providerStatus: ProviderStatus;
    authUserId: number;
    canManageSessionWrites: boolean;
}) {
    const hydratedWindowRef = useRef(
        `${initialWindow.starts_at}:${initialWindow.ends_at}`,
    );

    const [sessions, setSessions] =
        useState<TrainingSessionView[]>(initialSessions);
    const [activities, setActivities] =
        useState<ActivityView[]>(initialActivities);
    const [calendarEntries, setCalendarEntries] =
        useState<CalendarEntryView[]>(initialEntries);
    const [providerStatusState, setProviderStatusState] =
        useState(providerStatus);
    const [isSyncDispatching, setIsSyncDispatching] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const stravaStatus = providerStatusState?.strava ?? null;
    const stravaSyncStatus = stravaStatus?.last_sync_status ?? null;
    const isStravaSyncInProgress = SYNC_PENDING_STATUSES.has(
        stravaSyncStatus ?? '',
    );

    const integrationLabel =
        stravaStatus === null
            ? 'Integrations Unavailable'
            : !stravaStatus.connected
              ? 'Strava Disconnected'
              : stravaSyncStatus === 'queued'
                ? 'Strava Sync Queued'
                : stravaSyncStatus === 'running'
                  ? 'Strava Syncing'
                  : stravaSyncStatus === 'failed'
                    ? 'Strava Sync Failed'
                    : stravaSyncStatus === 'rate_limited'
                      ? 'Strava Rate Limited'
                      : 'Strava Connected';

    const integrationDotClass =
        stravaStatus !== null && stravaStatus.connected
            ? stravaSyncStatus === 'queued' ||
              stravaSyncStatus === 'running' ||
              stravaSyncStatus === 'rate_limited'
                ? 'bg-amber-500'
                : stravaSyncStatus === 'failed'
                  ? 'bg-red-500'
                  : 'bg-emerald-500'
            : 'bg-zinc-500';

    const mergeSessions = useCallback(mergeSessionsState, []);

    const mergeActivities = useCallback(mergeActivitiesState, []);
    const mergeCalendarEntries = useCallback(mergeCalendarEntriesState, []);

    const fetchWindowSessions = useCallback(
        async (from: string, to: string): Promise<TrainingSessionView[]> => {
            return fetchWindowSessionsRequest(from, to);
        },
        [],
    );

    const fetchWindowActivities = useCallback(
        async (from: string, to: string): Promise<ActivityView[]> => {
            return fetchWindowActivitiesRequest(from, to);
        },
        [],
    );

    const fetchWindowCalendarEntries = useCallback(
        async (from: string, to: string): Promise<CalendarEntryView[]> => {
            return fetchWindowCalendarEntriesRequest(from, to);
        },
        [],
    );

    const refreshCalendarData = useCallback(
        (calendarWindow: CalendarWindow): void => {
            setIsRefreshing(true);

            void Promise.all([
                fetchWindowSessions(
                    calendarWindow.starts_at,
                    calendarWindow.ends_at,
                ),
                fetchWindowActivities(
                    calendarWindow.starts_at,
                    calendarWindow.ends_at,
                ),
                fetchWindowCalendarEntries(
                    calendarWindow.starts_at,
                    calendarWindow.ends_at,
                ),
            ])
                .then(([freshSessions, freshActivities, freshEntries]) => {
                    setSessions(freshSessions);
                    setActivities(freshActivities);
                    setCalendarEntries(freshEntries);
                })
                .catch((error) => {
                    console.error(error);
                })
                .finally(() => {
                    setIsRefreshing(false);
                });
        },
        [
            fetchWindowActivities,
            fetchWindowCalendarEntries,
            fetchWindowSessions,
        ],
    );

    const triggerProviderSync = useCallback(async (): Promise<void> => {
        if (
            isSyncDispatching ||
            !canManageSessionWrites ||
            stravaStatus === null ||
            !stravaStatus.connected
        ) {
            return;
        }

        setIsSyncDispatching(true);

        try {
            const route = syncActivityProvider('strava');
            const response = await fetch(route.url, {
                method: route.method.toUpperCase(),
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (!response.ok) {
                return;
            }

            setProviderStatusState((currentStatus) => {
                if (currentStatus === null || currentStatus.strava === undefined) {
                    return currentStatus;
                }

                return {
                    ...currentStatus,
                    strava: {
                        ...currentStatus.strava,
                        last_sync_status: 'queued',
                    },
                };
            });
        } catch (error) {
            console.error(error);
        } finally {
            setIsSyncDispatching(false);
        }
    }, [canManageSessionWrites, isSyncDispatching, stravaStatus]);

    useEffect(() => {
        const nextSignature = `${initialWindow.starts_at}:${initialWindow.ends_at}`;

        if (hydratedWindowRef.current === nextSignature) {
            return;
        }

        hydratedWindowRef.current = nextSignature;
        setSessions(initialSessions);
        setActivities(initialActivities);
        setCalendarEntries(initialEntries);
    }, [
        initialEntries,
        initialActivities,
        initialSessions,
        initialWindow.ends_at,
        initialWindow.starts_at,
    ]);

    useEffect(() => {
        setProviderStatusState(providerStatus);
    }, [providerStatus]);

    useEffect(() => {
        const echo = initializeEcho();

        if (echo === null) {
            return;
        }

        const channelName = `App.Models.User.${authUserId}`;
        const eventName = '.activity-provider.sync-status-updated';
        const channel = echo.private(channelName);

        channel.listen(
            eventName,
            (event: {
                provider?: string;
                status?: string;
                synced_at?: string | null;
            }) => {
                if (
                    typeof event.provider !== 'string' ||
                    event.provider.trim() === ''
                ) {
                    return;
                }

                const providerKey = event.provider.trim().toLowerCase();

                setProviderStatusState((currentStatus) => {
                    if (currentStatus === null) {
                        return currentStatus;
                    }

                    const currentProviderStatus =
                        currentStatus[providerKey] ?? null;

                    if (currentProviderStatus === null) {
                        return currentStatus;
                    }

                    return {
                        ...currentStatus,
                        [providerKey]: {
                            ...currentProviderStatus,
                            last_sync_status:
                                typeof event.status === 'string' &&
                                event.status.trim() !== ''
                                    ? event.status
                                    : currentProviderStatus.last_sync_status,
                            last_synced_at:
                                typeof event.synced_at === 'string'
                                    ? event.synced_at
                                    : currentProviderStatus.last_synced_at,
                        },
                    };
                });

            },
        );

        return () => {
            channel.stopListening(eventName);
            echo.leave(channelName);
        };
    }, [authUserId]);

    useEffect(() => {
        if (stravaStatus === null || !stravaStatus.connected) {
            return;
        }

        if (!SYNC_POLLING_STATUSES.has(stravaStatus.last_sync_status ?? '')) {
            return;
        }

        const intervalId = window.setInterval(() => {
            router.reload({
                only: ['providerStatus'],
            });
        }, 4000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [stravaStatus]);

    return {
        sessions,
        setSessions,
        activities,
        setActivities,
        calendarEntries,
        setCalendarEntries,
        providerStatusState,
        setProviderStatusState,
        isSyncDispatching,
        isRefreshing,
        stravaStatus,
        stravaSyncStatus,
        isStravaSyncInProgress,
        integrationLabel,
        integrationDotClass,
        mergeSessions,
        mergeActivities,
        mergeCalendarEntries,
        fetchWindowSessions,
        fetchWindowActivities,
        fetchWindowCalendarEntries,
        refreshCalendarData,
        triggerProviderSync,
    };
}
