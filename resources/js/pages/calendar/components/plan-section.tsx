import { router, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Layers, RefreshCw } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { initializeEcho } from '@/lib/echo';
import {
    mapActivityCollection,
    mapTrainingSessionCollection,
} from '@/lib/training-plans';
import { cn } from '@/lib/utils';
import { index as listActivities } from '@/routes/activities';
import { sync as syncActivityProvider } from '@/routes/activity-providers';
import { index as listTrainingSessions } from '@/routes/training-sessions';
import type { SharedData } from '@/types';
import type {
    ActivityApi,
    ActivityView,
    ApiCollectionResponse,
    ApiPaginatedCollectionResponse,
    TrainingSessionApi,
    TrainingSessionView,
} from '@/types/training-plans';
import {
    addDays,
    addWeeks,
    buildCalendarWeeks,
    endOfIsoWeek,
    formatDateKey,
    parseDate,
    resolveCurrentWeekStartKey,
    startOfIsoWeek,
    type CalendarWindow,
} from '../lib/calendar-weeks';
import {
    SessionEditorModal,
    type AthleteTrainingTargets,
    type SessionEditorContext,
} from './session-editor-modal';
import { WeekSection } from './week-section';

type PlanSectionProps = {
    initialSessions: TrainingSessionView[];
    initialActivities: ActivityView[];
    initialWindow: CalendarWindow;
    providerStatus: Record<
        string,
        {
            connected: boolean;
            last_synced_at: string | null;
            last_sync_status: string | null;
            provider_athlete_id: string | null;
        }
    > | null;
    athleteTrainingTargets: AthleteTrainingTargets | null;
    viewingAthleteId?: number | null;
    viewingAthleteName?: string | null;
};

const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const windowExtensionWeeks = 4;
const sessionsPerPage = 100;
const activitiesPerPage = 100;
const summaryRailWidth = 156;
const viewModes = ['infinite', 'day', 'week', 'month'] as const;
type CalendarViewMode = (typeof viewModes)[number];

const syncPendingStatuses = new Set(['queued', 'running']);
const syncPollingStatuses = new Set(['queued', 'running', 'rate_limited']);

const resolveWeekStartKey = (dateKey: string): string => {
    return formatDateKey(startOfIsoWeek(parseDate(dateKey)));
};

const resolveFocusLabel = (
    mode: CalendarViewMode,
    focusDate: string,
): string => {
    const date = parseDate(focusDate);

    if (mode === 'day') {
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    }

    if (mode === 'month') {
        return date.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
    }

    const weekStart = startOfIsoWeek(date);
    const weekEnd = addDays(weekStart, 6);

    return `${weekStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    })} — ${weekEnd.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    })}`;
};

const captureFirstVisibleWeek = (
    container: HTMLElement | null,
): {
    weekStart: string;
    offsetFromTop: number;
} | null => {
    if (container === null) {
        return null;
    }

    const weekElements = Array.from(
        container.querySelectorAll<HTMLDivElement>('[data-week-start]'),
    );
    const viewportTop = container.scrollTop;

    for (const weekElement of weekElements) {
        const weekBottom = weekElement.offsetTop + weekElement.offsetHeight;

        if (weekBottom < viewportTop + 1) {
            continue;
        }

        const weekStart = weekElement.dataset.weekStart;

        if (weekStart === undefined || weekStart.trim() === '') {
            continue;
        }

        return {
            weekStart,
            offsetFromTop: weekElement.offsetTop - viewportTop,
        };
    }

    return null;
};

export function PlanSection({
    initialSessions,
    initialActivities,
    initialWindow,
    providerStatus,
    athleteTrainingTargets,
    viewingAthleteId = null,
    viewingAthleteName = null,
}: PlanSectionProps) {
    const { auth } = usePage<SharedData>().props;
    const scrollContainerRef = useRef<HTMLElement | null>(null);
    const topSentinelRef = useRef<HTMLDivElement | null>(null);
    const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
    const weekElementsRef = useRef<Record<string, HTMLDivElement | null>>({});
    const hasCenteredCurrentWeekRef = useRef(false);
    const previousSyncStatusRef = useRef<string | null>(null);
    const loadingPastRef = useRef(false);
    const loadingFutureRef = useRef(false);
    const hydratedWindowRef = useRef(
        `${initialWindow.starts_at}:${initialWindow.ends_at}`,
    );

    const [sessionEditorContext, setSessionEditorContext] =
        useState<SessionEditorContext | null>(null);
    const [calendarWindow, setCalendarWindow] =
        useState<CalendarWindow>(initialWindow);
    const [sessions, setSessions] =
        useState<TrainingSessionView[]>(initialSessions);
    const [activities, setActivities] =
        useState<ActivityView[]>(initialActivities);
    const [providerStatusState, setProviderStatusState] =
        useState(providerStatus);
    const [calendarViewMode, setCalendarViewMode] =
        useState<CalendarViewMode>('infinite');
    const [focusDate, setFocusDate] = useState<string>(() =>
        formatDateKey(new Date()),
    );
    const [isCurrentWeekVisible, setIsCurrentWeekVisible] = useState(true);
    const [isSyncDispatching, setIsSyncDispatching] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isLoadingPast, setIsLoadingPast] = useState(false);
    const [isLoadingFuture, setIsLoadingFuture] = useState(false);

    const avatarInitials = auth.user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');

    const canManageSessionWrites =
        auth.user.role === 'athlete' && !(auth.impersonating ?? false);
    const canManageSessionLinks = auth.user.role === 'athlete';
    const canOpenActivityDetails = auth.user.role === 'athlete';
    const stravaStatus = providerStatusState?.strava ?? null;
    const stravaSyncStatus = stravaStatus?.last_sync_status ?? null;
    const isStravaSyncInProgress = syncPendingStatuses.has(
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

    const weeks = useMemo(() => {
        return buildCalendarWeeks(calendarWindow, sessions);
    }, [calendarWindow, sessions]);

    const focusWeekStart = useMemo(() => {
        return resolveWeekStartKey(focusDate);
    }, [focusDate]);

    const currentWeekStart = useMemo(() => resolveCurrentWeekStartKey(), []);

    const weekActivities = useMemo(() => {
        const activitiesByWeek = new Map<string, ActivityView[]>();

        activities.forEach((activity) => {
            if (activity.startedDate === null) {
                return;
            }

            const weekStart = formatDateKey(
                startOfIsoWeek(parseDate(activity.startedDate)),
            );
            const currentWeekActivities = activitiesByWeek.get(weekStart) ?? [];
            currentWeekActivities.push(activity);
            activitiesByWeek.set(weekStart, currentWeekActivities);
        });

        activitiesByWeek.forEach((items, key) => {
            activitiesByWeek.set(
                key,
                items.slice().sort((left, right) => {
                    if (left.startedAt === right.startedAt) {
                        return left.id - right.id;
                    }

                    return (left.startedAt ?? '').localeCompare(
                        right.startedAt ?? '',
                    );
                }),
            );
        });

        return activitiesByWeek;
    }, [activities]);

    const visibleWeeks = useMemo(() => {
        if (calendarViewMode === 'infinite') {
            return weeks;
        }

        if (calendarViewMode === 'week' || calendarViewMode === 'day') {
            return weeks.filter((week) => week.startsAt === focusWeekStart);
        }

        const monthCursor = parseDate(focusDate);
        const monthStart = new Date(
            monthCursor.getFullYear(),
            monthCursor.getMonth(),
            1,
        );
        const monthEnd = new Date(
            monthCursor.getFullYear(),
            monthCursor.getMonth() + 1,
            0,
        );

        return weeks.filter((week) => {
            const weekStart = parseDate(week.startsAt);
            const weekEnd = parseDate(week.endsAt);

            return weekStart <= monthEnd && weekEnd >= monthStart;
        });
    }, [calendarViewMode, focusDate, focusWeekStart, weeks]);

    const activeDayDates = useMemo(() => {
        if (calendarViewMode !== 'day') {
            return null;
        }

        return [focusDate];
    }, [calendarViewMode, focusDate]);

    const activeDayHeaders = useMemo(() => {
        if (calendarViewMode !== 'day') {
            return dayHeaders;
        }

        const dayLabel = parseDate(focusDate).toLocaleDateString('en-US', {
            weekday: 'short',
        });

        return [dayLabel];
    }, [calendarViewMode, focusDate]);

    const headerGridTemplateColumns = useMemo(() => {
        return `repeat(${Math.max(1, activeDayHeaders.length)}, minmax(0, 1fr)) ${summaryRailWidth}px`;
    }, [activeDayHeaders.length]);

    const jumpButtonVisible =
        calendarViewMode === 'infinite'
            ? !isCurrentWeekVisible
            : focusWeekStart !== currentWeekStart;

    const focusLabel = useMemo(() => {
        return resolveFocusLabel(calendarViewMode, focusDate);
    }, [calendarViewMode, focusDate]);

    const mergeSessions = useCallback(
        (
            existingSessions: TrainingSessionView[],
            incomingSessions: TrainingSessionView[],
        ): TrainingSessionView[] => {
            const sessionMap = new Map<number, TrainingSessionView>();

            existingSessions.forEach((session) => {
                sessionMap.set(session.id, session);
            });

            incomingSessions.forEach((session) => {
                sessionMap.set(session.id, session);
            });

            return Array.from(sessionMap.values()).sort((left, right) => {
                if (left.scheduledDate === right.scheduledDate) {
                    return left.id - right.id;
                }

                return left.scheduledDate.localeCompare(right.scheduledDate);
            });
        },
        [],
    );

    const mergeActivities = useCallback(
        (
            existingActivities: ActivityView[],
            incomingActivities: ActivityView[],
        ): ActivityView[] => {
            const activityMap = new Map<number, ActivityView>();

            existingActivities.forEach((activity) => {
                activityMap.set(activity.id, activity);
            });

            incomingActivities.forEach((activity) => {
                activityMap.set(activity.id, activity);
            });

            return Array.from(activityMap.values()).sort((left, right) => {
                if (left.startedAt === right.startedAt) {
                    return left.id - right.id;
                }

                return (left.startedAt ?? '').localeCompare(
                    right.startedAt ?? '',
                );
            });
        },
        [],
    );

    const fetchWindowSessions = useCallback(
        async (from: string, to: string): Promise<TrainingSessionView[]> => {
            const collectedSessions: TrainingSessionView[] = [];
            let page = 1;
            let hasMorePages = true;

            while (hasMorePages) {
                const route = listTrainingSessions({
                    query: {
                        from,
                        to,
                        per_page: sessionsPerPage,
                        page,
                    },
                });
                const response = await fetch(route.url, {
                    method: route.method.toUpperCase(),
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    throw new Error(
                        `Unable to fetch sessions for window ${from} to ${to}.`,
                    );
                }

                const payload =
                    (await response.json()) as ApiPaginatedCollectionResponse<TrainingSessionApi>;
                const mappedSessions = mapTrainingSessionCollection(payload);
                collectedSessions.push(...mappedSessions);

                const meta = payload.meta;

                if (meta === undefined || meta.current_page >= meta.last_page) {
                    hasMorePages = false;
                } else {
                    page += 1;
                }
            }

            return collectedSessions;
        },
        [],
    );

    const fetchWindowActivities = useCallback(
        async (from: string, to: string): Promise<ActivityView[]> => {
            const collectedActivities: ActivityView[] = [];
            let page = 1;
            let hasMorePages = true;

            while (hasMorePages) {
                const route = listActivities({
                    query: {
                        from,
                        to,
                        per_page: activitiesPerPage,
                        page,
                    },
                });
                const response = await fetch(route.url, {
                    method: route.method.toUpperCase(),
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (!response.ok) {
                    throw new Error(
                        `Unable to fetch activities for window ${from} to ${to}.`,
                    );
                }

                const payload =
                    (await response.json()) as ApiPaginatedCollectionResponse<ActivityApi>;
                const mappedActivities = mapActivityCollection(
                    payload as ApiCollectionResponse<ActivityApi>,
                );
                collectedActivities.push(...mappedActivities);

                const meta = payload.meta;

                if (meta === undefined || meta.current_page >= meta.last_page) {
                    hasMorePages = false;
                } else {
                    page += 1;
                }
            }

            return collectedActivities;
        },
        [],
    );

    const loadMoreWeeks = useCallback(
        async (direction: 'past' | 'future'): Promise<void> => {
            if (calendarViewMode !== 'infinite') {
                return;
            }

            if (
                direction === 'past' &&
                (isLoadingPast || loadingPastRef.current)
            ) {
                return;
            }

            if (
                direction === 'future' &&
                (isLoadingFuture || loadingFutureRef.current)
            ) {
                return;
            }

            const startsAtDate = parseDate(calendarWindow.starts_at);
            const endsAtDate = parseDate(calendarWindow.ends_at);

            const fetchFrom =
                direction === 'past'
                    ? formatDateKey(
                          addWeeks(startsAtDate, -windowExtensionWeeks),
                      )
                    : formatDateKey(addDays(endsAtDate, 1));
            const fetchTo =
                direction === 'past'
                    ? formatDateKey(addDays(startsAtDate, -1))
                    : formatDateKey(addWeeks(endsAtDate, windowExtensionWeeks));

            const container = scrollContainerRef.current;
            const previousScrollHeight =
                direction === 'past' ? (container?.scrollHeight ?? null) : null;
            const scrollAnchor =
                direction === 'past'
                    ? captureFirstVisibleWeek(container)
                    : null;

            if (direction === 'past') {
                loadingPastRef.current = true;
                setIsLoadingPast(true);
            } else {
                loadingFutureRef.current = true;
                setIsLoadingFuture(true);
            }

            try {
                const [fetchedSessions, fetchedActivities] = await Promise.all([
                    fetchWindowSessions(fetchFrom, fetchTo),
                    fetchWindowActivities(fetchFrom, fetchTo),
                ]);

                setSessions((currentSessions) => {
                    return mergeSessions(currentSessions, fetchedSessions);
                });
                setActivities((currentActivities) => {
                    return mergeActivities(
                        currentActivities,
                        fetchedActivities,
                    );
                });
                setCalendarWindow((currentWindow) => {
                    return direction === 'past'
                        ? {
                              starts_at: fetchFrom,
                              ends_at: currentWindow.ends_at,
                          }
                        : {
                              starts_at: currentWindow.starts_at,
                              ends_at: fetchTo,
                          };
                });

                if (direction === 'past' && previousScrollHeight !== null) {
                    globalThis.requestAnimationFrame(() => {
                        if (container === null) {
                            return;
                        }

                        if (scrollAnchor !== null) {
                            const anchoredWeekElement =
                                container.querySelector<HTMLDivElement>(
                                    `[data-week-start="${scrollAnchor.weekStart}"]`,
                                );

                            if (anchoredWeekElement !== null) {
                                container.scrollTop =
                                    anchoredWeekElement.offsetTop -
                                    scrollAnchor.offsetFromTop;

                                return;
                            }
                        }

                        const heightDifference =
                            container.scrollHeight - previousScrollHeight;
                        container.scrollTop += heightDifference;
                    });
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (direction === 'past') {
                    loadingPastRef.current = false;
                    setIsLoadingPast(false);
                } else {
                    loadingFutureRef.current = false;
                    setIsLoadingFuture(false);
                }
            }
        },
        [
            calendarViewMode,
            fetchWindowActivities,
            fetchWindowSessions,
            isLoadingFuture,
            isLoadingPast,
            mergeActivities,
            mergeSessions,
            calendarWindow.ends_at,
            calendarWindow.starts_at,
            loadingFutureRef,
            loadingPastRef,
        ],
    );

    const refreshCalendarData = useCallback((): void => {
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
        ])
            .then(([freshSessions, freshActivities]) => {
                setSessions(freshSessions);
                setActivities(freshActivities);
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                setIsRefreshing(false);
            });
    }, [
        fetchWindowActivities,
        fetchWindowSessions,
        calendarWindow.ends_at,
        calendarWindow.starts_at,
    ]);

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
                if (
                    currentStatus === null ||
                    currentStatus.strava === undefined
                ) {
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

    const shiftFocusDate = useCallback(
        (direction: 'previous' | 'next'): void => {
            const multiplier = direction === 'next' ? 1 : -1;

            setFocusDate((currentFocusDate) => {
                const currentDate = parseDate(currentFocusDate);

                if (calendarViewMode === 'day') {
                    return formatDateKey(addDays(currentDate, multiplier));
                }

                if (calendarViewMode === 'week') {
                    return formatDateKey(addWeeks(currentDate, multiplier));
                }

                if (calendarViewMode === 'month') {
                    const shiftedMonth = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth() + multiplier,
                        1,
                    );

                    return formatDateKey(shiftedMonth);
                }

                return currentFocusDate;
            });
        },
        [calendarViewMode],
    );

    const jumpToCurrentWeek = useCallback((): void => {
        if (calendarViewMode !== 'infinite') {
            setFocusDate(formatDateKey(new Date()));

            return;
        }

        const container = scrollContainerRef.current;
        const currentWeekElement = weekElementsRef.current[currentWeekStart];

        if (
            container === null ||
            currentWeekElement === null ||
            currentWeekElement === undefined
        ) {
            return;
        }

        container.scrollTo({
            top: Math.max(
                0,
                currentWeekElement.offsetTop -
                    (container.clientHeight - currentWeekElement.offsetHeight) /
                        2,
            ),
            behavior: 'smooth',
        });
    }, [calendarViewMode, currentWeekStart]);

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

    useEffect(() => {
        const nextSignature = `${initialWindow.starts_at}:${initialWindow.ends_at}`;

        if (hydratedWindowRef.current === nextSignature) {
            return;
        }

        hydratedWindowRef.current = nextSignature;
        hasCenteredCurrentWeekRef.current = false;
        setCalendarWindow(initialWindow);
        setSessions(initialSessions);
        setActivities(initialActivities);
    }, [
        initialActivities,
        initialSessions,
        initialWindow.ends_at,
        initialWindow.starts_at,
    ]);

    useEffect(() => {
        setProviderStatusState(providerStatus);
    }, [providerStatus]);

    useEffect(() => {
        if (auth.user.id === undefined) {
            return;
        }

        const echo = initializeEcho();

        if (echo === null) {
            return;
        }

        const channelName = `App.Models.User.${auth.user.id}`;
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

                if (event.status === 'success') {
                    refreshCalendarData();
                }
            },
        );

        return () => {
            channel.stopListening(eventName);
            echo.leave(channelName);
        };
    }, [auth.user.id, refreshCalendarData]);

    useEffect(() => {
        const currentStatus = stravaStatus?.last_sync_status ?? null;
        const previousStatus = previousSyncStatusRef.current;

        if (
            previousStatus !== null &&
            previousStatus !== currentStatus &&
            currentStatus === 'success'
        ) {
            refreshCalendarData();
        }

        previousSyncStatusRef.current = currentStatus;
    }, [refreshCalendarData, stravaStatus?.last_sync_status]);

    useEffect(() => {
        if (stravaStatus === null || !stravaStatus.connected) {
            return;
        }

        if (!syncPollingStatuses.has(stravaStatus.last_sync_status ?? '')) {
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

    useLayoutEffect(() => {
        if (calendarViewMode !== 'infinite') {
            return;
        }

        if (hasCenteredCurrentWeekRef.current) {
            return;
        }

        const container = scrollContainerRef.current;
        const currentWeekElement = weekElementsRef.current[currentWeekStart];

        if (
            container === null ||
            currentWeekElement === undefined ||
            currentWeekElement === null
        ) {
            return;
        }

        const targetScrollTop =
            currentWeekElement.offsetTop -
            (container.clientHeight - currentWeekElement.offsetHeight) / 2;

        container.scrollTop = Math.max(0, targetScrollTop);
        hasCenteredCurrentWeekRef.current = true;
    }, [calendarViewMode, currentWeekStart, weeks]);

    useEffect(() => {
        if (calendarViewMode === 'infinite') {
            return;
        }

        const focus = parseDate(focusDate);
        const windowStart = parseDate(calendarWindow.starts_at);
        const windowEnd = parseDate(calendarWindow.ends_at);

        if (windowStart <= focus && focus <= windowEnd) {
            return;
        }

        const focusedWeekStart = startOfIsoWeek(focus);
        const nextWindow = {
            starts_at: formatDateKey(
                addWeeks(focusedWeekStart, -windowExtensionWeeks),
            ),
            ends_at: formatDateKey(
                addWeeks(endOfIsoWeek(focus), windowExtensionWeeks),
            ),
        };

        setIsRefreshing(true);

        void Promise.all([
            fetchWindowSessions(nextWindow.starts_at, nextWindow.ends_at),
            fetchWindowActivities(nextWindow.starts_at, nextWindow.ends_at),
        ])
            .then(([fetchedSessions, fetchedActivities]) => {
                setCalendarWindow(nextWindow);
                setSessions(fetchedSessions);
                setActivities(fetchedActivities);
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                setIsRefreshing(false);
            });
    }, [
        calendarViewMode,
        focusDate,
        fetchWindowActivities,
        fetchWindowSessions,
        calendarWindow.ends_at,
        calendarWindow.starts_at,
    ]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        const topSentinel = topSentinelRef.current;
        const bottomSentinel = bottomSentinelRef.current;

        if (calendarViewMode !== 'infinite') {
            return;
        }

        if (
            container === null ||
            topSentinel === null ||
            bottomSentinel === null
        ) {
            return;
        }

        const observerOptions = {
            root: container,
            rootMargin: '400px 0px',
            threshold: 0,
        };

        const topObserver = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                void loadMoreWeeks('past');
            }
        }, observerOptions);

        const bottomObserver = new IntersectionObserver((entries) => {
            if (entries.some((entry) => entry.isIntersecting)) {
                void loadMoreWeeks('future');
            }
        }, observerOptions);

        topObserver.observe(topSentinel);
        bottomObserver.observe(bottomSentinel);

        return () => {
            topObserver.disconnect();
            bottomObserver.disconnect();
        };
    }, [calendarViewMode, loadMoreWeeks]);

    useEffect(() => {
        if (calendarViewMode !== 'infinite') {
            setIsCurrentWeekVisible(focusWeekStart === currentWeekStart);

            return;
        }

        const container = scrollContainerRef.current;
        const currentWeekElement = weekElementsRef.current[currentWeekStart];

        if (
            container === null ||
            currentWeekElement === undefined ||
            currentWeekElement === null
        ) {
            setIsCurrentWeekVisible(false);

            return;
        }

        const evaluateVisibility = (): void => {
            const viewportTop = container.scrollTop;
            const viewportBottom = viewportTop + container.clientHeight;
            const weekTop = currentWeekElement.offsetTop;
            const weekBottom = weekTop + currentWeekElement.offsetHeight;
            const verticalOffset = 40;

            setIsCurrentWeekVisible(
                weekBottom >= viewportTop + verticalOffset &&
                    weekTop <= viewportBottom - verticalOffset,
            );
        };

        evaluateVisibility();

        container.addEventListener('scroll', evaluateVisibility, {
            passive: true,
        });
        window.addEventListener('resize', evaluateVisibility);

        return () => {
            container.removeEventListener('scroll', evaluateVisibility);
            window.removeEventListener('resize', evaluateVisibility);
        };
    }, [calendarViewMode, currentWeekStart, focusWeekStart, weeks]);

    return (
        <section
            ref={scrollContainerRef}
            className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-background [--calendar-controls-height:2.5rem] [--calendar-days-height:2.75rem] [--calendar-header-height:4rem] [--calendar-week-sticky:calc(var(--calendar-header-height)+var(--calendar-controls-height)+var(--calendar-days-height))]"
        >
            <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
                <div>
                    <h1 className="text-sm font-semibold text-white">
                        Training Calendar
                    </h1>
                    <p className="text-xs text-zinc-500">
                        {viewingAthleteName !== null
                            ? `Viewing athlete: ${viewingAthleteName}`
                            : 'Season 2026 • Build Phase 1'}
                        {!canManageSessionWrites ? ' • Read-only' : null}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {isRefreshing ? (
                        <p
                            className="flex items-center gap-1.5 text-[0.6875rem] text-zinc-500"
                            aria-live="polite"
                        >
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500" />
                            Refreshing
                        </p>
                    ) : null}
                    <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs">
                        <span
                            className={cn(
                                'h-2 w-2 rounded-full',
                                integrationDotClass,
                                stravaSyncStatus === 'running' &&
                                    'animate-pulse',
                            )}
                        />
                        <span className="text-zinc-400">
                            {integrationLabel}
                        </span>
                    </div>
                    {canManageSessionWrites && stravaStatus?.connected ? (
                        <button
                            type="button"
                            onClick={() => {
                                void triggerProviderSync();
                            }}
                            disabled={
                                isSyncDispatching || isStravaSyncInProgress
                            }
                            className={cn(
                                'inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-zinc-300 transition-colors',
                                isSyncDispatching || isStravaSyncInProgress
                                    ? 'cursor-not-allowed opacity-70'
                                    : 'hover:border-zinc-600 hover:text-white',
                            )}
                        >
                            <RefreshCw
                                className={cn(
                                    'h-3.5 w-3.5',
                                    (isSyncDispatching ||
                                        isStravaSyncInProgress) &&
                                        'animate-spin',
                                )}
                            />
                            {isSyncDispatching || isStravaSyncInProgress
                                ? 'Syncing'
                                : 'Sync'}
                        </button>
                    ) : null}
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-200">
                        {avatarInitials || 'U'}
                    </div>
                </div>
            </header>

            <div
                className="sticky z-[35] flex h-10 items-center justify-between border-b border-border bg-background px-6"
                style={{ top: 'var(--calendar-header-height)' }}
            >
                <div className="inline-flex items-center rounded-lg border border-border bg-surface/40 p-1">
                    {viewModes.map((mode) => {
                        const isActive = calendarViewMode === mode;

                        return (
                            <button
                                key={mode}
                                type="button"
                                onClick={() => {
                                    setCalendarViewMode(mode);
                                }}
                                className={cn(
                                    'rounded-md px-2.5 py-1 text-[0.6875rem] font-medium transition-colors',
                                    isActive
                                        ? 'bg-zinc-800 text-zinc-100'
                                        : 'text-zinc-500 hover:text-zinc-300',
                                )}
                            >
                                {mode === 'infinite'
                                    ? 'Infinite'
                                    : mode.charAt(0).toUpperCase() +
                                      mode.slice(1)}
                            </button>
                        );
                    })}
                </div>

                <div className="flex items-center gap-2">
                    {calendarViewMode !== 'infinite' ? (
                        <>
                            <button
                                type="button"
                                onClick={() => {
                                    shiftFocusDate('previous');
                                }}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface/40 text-zinc-400 transition-colors hover:text-zinc-200"
                                aria-label="Previous range"
                            >
                                <ChevronLeft className="h-3.5 w-3.5" />
                            </button>
                            <p className="min-w-[7.5rem] text-center text-[0.6875rem] text-zinc-400">
                                {focusLabel}
                            </p>
                            <button
                                type="button"
                                onClick={() => {
                                    shiftFocusDate('next');
                                }}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface/40 text-zinc-400 transition-colors hover:text-zinc-200"
                                aria-label="Next range"
                            >
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </>
                    ) : null}

                    {jumpButtonVisible ? (
                        <button
                            type="button"
                            onClick={jumpToCurrentWeek}
                            className="rounded-md border border-zinc-700/80 bg-zinc-900/70 px-2.5 py-1 text-[0.6875rem] text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100"
                        >
                            Jump to current week
                        </button>
                    ) : null}
                </div>
            </div>

            <div
                className="sticky z-30 grid h-11 items-center border-b border-border bg-background"
                style={{
                    top: 'calc(var(--calendar-header-height) + var(--calendar-controls-height))',
                    gridTemplateColumns: headerGridTemplateColumns,
                }}
            >
                {activeDayHeaders.map((day) => (
                    <div
                        key={day}
                        className="flex h-11 items-center justify-center border-r border-border/30 px-2 text-center text-[0.625rem] font-medium tracking-wider text-zinc-500 uppercase"
                    >
                        {day}
                    </div>
                ))}
                <div className="flex h-11 items-center justify-center border-l border-border px-3 py-1">
                    <div className="group flex max-w-full min-w-0 items-center gap-2 rounded-lg border border-border bg-surface/50 px-2 py-1.5">
                        <button
                            type="button"
                            className="flex shrink-0 items-center gap-2 rounded-md px-2 py-1 text-zinc-400"
                            aria-label="Overlay plan (coming later)"
                            onClick={() => {}}
                        >
                            <Layers className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium whitespace-nowrap">
                                Overlay Plan
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <div
                className={cn(
                    'flex-1 transition-opacity',
                    isRefreshing && 'opacity-80',
                )}
            >
                <div ref={topSentinelRef} className="h-px w-full" />
                {isLoadingPast ? (
                    <p className="border-b border-border/50 px-4 py-1 text-[0.625rem] text-zinc-500 uppercase">
                        Loading earlier weeks...
                    </p>
                ) : null}
                {visibleWeeks.map((week) => (
                    <div
                        key={week.id}
                        data-week-start={week.startsAt}
                        ref={(element) => {
                            weekElementsRef.current[week.startsAt] = element;
                        }}
                    >
                        <WeekSection
                            week={week}
                            activities={weekActivities.get(week.startsAt) ?? []}
                            visibleDayDates={activeDayDates}
                            summaryRailWidth={summaryRailWidth}
                            canManageSessions={canManageSessionWrites}
                            canManageSessionLinks={canManageSessionLinks}
                            canOpenActivityDetails={canOpenActivityDetails}
                            onCreateSession={openCreateSessionModal}
                            onEditSession={openEditSessionModal}
                            onOpenActivity={openActivityDetails}
                        />
                    </div>
                ))}
                {visibleWeeks.length === 0 ? (
                    <div className="border-b border-border px-4 py-8">
                        <p className="text-xs text-zinc-500">
                            No training planned.
                        </p>
                    </div>
                ) : null}
                {isLoadingFuture ? (
                    <p className="border-t border-border/50 px-4 py-1 text-[0.625rem] text-zinc-500 uppercase">
                        Loading upcoming weeks...
                    </p>
                ) : null}
                <div ref={bottomSentinelRef} className="h-px w-full" />
            </div>

            <div className="h-16" />

            <SessionEditorModal
                open={sessionEditorContext !== null}
                context={sessionEditorContext}
                onOpenChange={(open) => {
                    if (!open) {
                        closeSessionModal();
                    }
                }}
                canManageSessionWrites={canManageSessionWrites}
                canManageSessionLinks={canManageSessionLinks}
                athleteTrainingTargets={athleteTrainingTargets}
                onSaved={refreshCalendarData}
            />
        </section>
    );
}
