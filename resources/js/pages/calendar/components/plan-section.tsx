import { usePage } from '@inertiajs/react';
import { Layers } from 'lucide-react';
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { mapTrainingSessionCollection } from '@/lib/training-plans';
import { cn } from '@/lib/utils';
import { index as listTrainingSessions } from '@/routes/training-sessions';
import type { SharedData } from '@/types';
import type {
    ApiPaginatedCollectionResponse,
    TrainingSessionApi,
    TrainingSessionView,
} from '@/types/training-plans';
import {
    addDays,
    addWeeks,
    buildCalendarWeeks,
    formatDateKey,
    parseDate,
    resolveCurrentWeekStartKey,
    type CalendarWindow,
} from '../lib/calendar-weeks';
import {
    SessionEditorModal,
    type SessionEditorContext,
} from './session-editor-modal';
import { WeekSection } from './week-section';

type PlanSectionProps = {
    initialSessions: TrainingSessionView[];
    initialWindow: CalendarWindow;
    viewingAthleteName?: string | null;
};

const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const windowExtensionWeeks = 4;
const sessionsPerPage = 100;

export function PlanSection({
    initialSessions,
    initialWindow,
    viewingAthleteName = null,
}: PlanSectionProps) {
    const { auth } = usePage<SharedData>().props;
    const scrollContainerRef = useRef<HTMLElement | null>(null);
    const topSentinelRef = useRef<HTMLDivElement | null>(null);
    const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
    const weekElementsRef = useRef<Record<string, HTMLDivElement | null>>({});
    const hasCenteredCurrentWeekRef = useRef(false);
    const [sessionEditorContext, setSessionEditorContext] =
        useState<SessionEditorContext | null>(null);
    const [calendarWindow, setCalendarWindow] =
        useState<CalendarWindow>(initialWindow);
    const [sessions, setSessions] =
        useState<TrainingSessionView[]>(initialSessions);
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
    const weeks = useMemo(() => {
        return buildCalendarWeeks(calendarWindow, sessions);
    }, [calendarWindow, sessions]);

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

    const loadMoreWeeks = useCallback(
        async (direction: 'past' | 'future'): Promise<void> => {
            if (direction === 'past' && isLoadingPast) {
                return;
            }

            if (direction === 'future' && isLoadingFuture) {
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

            if (direction === 'past') {
                setIsLoadingPast(true);
            } else {
                setIsLoadingFuture(true);
            }

            try {
                const fetchedSessions = await fetchWindowSessions(
                    fetchFrom,
                    fetchTo,
                );

                setSessions((currentSessions) => {
                    return mergeSessions(currentSessions, fetchedSessions);
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

                        const heightDifference =
                            container.scrollHeight - previousScrollHeight;
                        container.scrollTop += heightDifference;
                    });
                }
            } catch (error) {
                console.error(error);
            } finally {
                if (direction === 'past') {
                    setIsLoadingPast(false);
                } else {
                    setIsLoadingFuture(false);
                }
            }
        },
        [
            fetchWindowSessions,
            isLoadingFuture,
            isLoadingPast,
            mergeSessions,
            calendarWindow.ends_at,
            calendarWindow.starts_at,
        ],
    );

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

            setSessionEditorContext({
                mode: 'edit',
                trainingWeekId: session.trainingWeekId,
                date: session.scheduledDate,
                session,
            });
        },
        [canManageSessionLinks],
    );

    const closeSessionModal = useCallback((): void => {
        setSessionEditorContext(null);
    }, []);

    const refreshCalendarData = useCallback((): void => {
        setIsRefreshing(true);

        void fetchWindowSessions(
            calendarWindow.starts_at,
            calendarWindow.ends_at,
        )
            .then((freshSessions) => {
                setSessions(freshSessions);
            })
            .catch((error) => {
                console.error(error);
            })
            .finally(() => {
                setIsRefreshing(false);
            });
    }, [fetchWindowSessions, calendarWindow.ends_at, calendarWindow.starts_at]);

    useEffect(() => {
        setCalendarWindow(initialWindow);
        setSessions(initialSessions);
        hasCenteredCurrentWeekRef.current = false;
    }, [initialSessions, initialWindow]);

    useLayoutEffect(() => {
        if (hasCenteredCurrentWeekRef.current) {
            return;
        }

        const container = scrollContainerRef.current;
        const currentWeekElement =
            weekElementsRef.current[resolveCurrentWeekStartKey()];

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
    }, [weeks]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        const topSentinel = topSentinelRef.current;
        const bottomSentinel = bottomSentinelRef.current;

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
    }, [loadMoreWeeks]);

    return (
        <section
            ref={scrollContainerRef}
            className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-background [--calendar-days-height:2.75rem] [--calendar-header-height:4rem] [--calendar-week-sticky:6.75rem]"
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

                <div className="flex items-center gap-4">
                    {isRefreshing ? (
                        <p
                            className="flex items-center gap-1.5 text-[11px] text-zinc-500"
                            aria-live="polite"
                        >
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500" />
                            Refreshing
                        </p>
                    ) : null}
                    <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                        <span className="text-zinc-400">
                            Garmin Sync Active
                        </span>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-200">
                        {avatarInitials || 'U'}
                    </div>
                </div>
            </header>

            <div className="sticky top-16 z-30 grid h-11 grid-cols-[repeat(7,1fr)_140px] items-center border-b border-border bg-background/95 backdrop-blur-md">
                {dayHeaders.map((day) => (
                    <div
                        key={day}
                        className="flex h-11 items-center justify-center border-r border-border/30 px-2 text-center text-[10px] font-medium tracking-wider text-zinc-500 uppercase"
                    >
                        {day}
                    </div>
                ))}
                <div className="flex h-11 items-center justify-center border-l border-border px-3 py-1">
                    <div
                        className={cn(
                            'group flex max-w-full min-w-0 items-center gap-2 rounded-lg border px-2 py-1.5',
                            'border-border bg-surface/50',
                        )}
                    >
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
                    <p className="border-b border-border/50 px-4 py-1 text-[10px] text-zinc-500 uppercase">
                        Loading earlier weeks...
                    </p>
                ) : null}
                {weeks.map((week) => (
                    <div
                        key={week.id}
                        ref={(element) => {
                            weekElementsRef.current[week.startsAt] = element;
                        }}
                    >
                        <WeekSection
                            week={week}
                            canManageSessions={canManageSessionWrites}
                            canManageSessionLinks={canManageSessionLinks}
                            onCreateSession={openCreateSessionModal}
                            onEditSession={openEditSessionModal}
                        />
                    </div>
                ))}
                {isLoadingFuture ? (
                    <p className="border-t border-border/50 px-4 py-1 text-[10px] text-zinc-500 uppercase">
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
                onSaved={refreshCalendarData}
            />
        </section>
    );
}
