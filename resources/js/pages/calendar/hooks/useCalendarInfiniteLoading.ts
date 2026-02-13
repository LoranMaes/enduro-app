import {
    useCallback,
    useEffect,
    type RefObject,
    useRef,
    useState,
    type Dispatch,
    type SetStateAction,
} from 'react';
import type {
    ActivityView,
    CalendarEntryView,
    GoalView,
    TrainingSessionView,
} from '@/types/training-plans';
import { WINDOW_EXTENSION_WEEKS } from '../constants';
import type { ProgressComplianceWeek } from '../types';
import {
    addDays,
    addWeeks,
    formatDateKey,
    parseDate,
    type CalendarWindow,
} from '../lib/calendar-weeks';
import { captureFirstVisibleWeek } from '../utils';

export function useCalendarInfiniteLoading({
    calendarViewMode,
    calendarWindow,
    scrollContainerRef,
    fetchWindowSessions,
    fetchWindowActivities,
    fetchWindowCalendarEntries,
    fetchWindowGoals,
    fetchWindowCompliance,
    mergeSessions,
    mergeActivities,
    mergeCalendarEntries,
    mergeGoals,
    mergeComplianceWeeks,
    setSessions,
    setActivities,
    setCalendarEntries,
    setGoals,
    setComplianceWeeks,
    setCalendarWindow,
}: {
    calendarViewMode: 'infinite' | 'day' | 'week' | 'month';
    calendarWindow: CalendarWindow;
    scrollContainerRef: RefObject<HTMLElement | null>;
    fetchWindowSessions: (from: string, to: string) => Promise<TrainingSessionView[]>;
    fetchWindowActivities: (from: string, to: string) => Promise<ActivityView[]>;
    fetchWindowCalendarEntries: (
        from: string,
        to: string,
    ) => Promise<CalendarEntryView[]>;
    fetchWindowGoals: (from: string, to: string) => Promise<GoalView[]>;
    fetchWindowCompliance: (
        from: string,
        to: string,
    ) => Promise<ProgressComplianceWeek[]>;
    mergeSessions: (
        existingSessions: TrainingSessionView[],
        incomingSessions: TrainingSessionView[],
    ) => TrainingSessionView[];
    mergeActivities: (
        existingActivities: ActivityView[],
        incomingActivities: ActivityView[],
    ) => ActivityView[];
    mergeCalendarEntries: (
        existingEntries: CalendarEntryView[],
        incomingEntries: CalendarEntryView[],
    ) => CalendarEntryView[];
    mergeGoals: (
        existingGoals: GoalView[],
        incomingGoals: GoalView[],
    ) => GoalView[];
    mergeComplianceWeeks: (
        existingWeeks: ProgressComplianceWeek[],
        incomingWeeks: ProgressComplianceWeek[],
    ) => ProgressComplianceWeek[];
    setSessions: Dispatch<SetStateAction<TrainingSessionView[]>>;
    setActivities: Dispatch<SetStateAction<ActivityView[]>>;
    setCalendarEntries: Dispatch<SetStateAction<CalendarEntryView[]>>;
    setGoals: Dispatch<SetStateAction<GoalView[]>>;
    setComplianceWeeks: Dispatch<SetStateAction<ProgressComplianceWeek[]>>;
    setCalendarWindow: Dispatch<SetStateAction<CalendarWindow>>;
}) {
    const topSentinelRef = useRef<HTMLDivElement | null>(null);
    const bottomSentinelRef = useRef<HTMLDivElement | null>(null);
    const loadingPastRef = useRef(false);
    const loadingFutureRef = useRef(false);

    const [isLoadingPast, setIsLoadingPast] = useState(false);
    const [isLoadingFuture, setIsLoadingFuture] = useState(false);

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
                          addWeeks(startsAtDate, -WINDOW_EXTENSION_WEEKS),
                      )
                    : formatDateKey(addDays(endsAtDate, 1));
            const fetchTo =
                direction === 'past'
                    ? formatDateKey(addDays(startsAtDate, -1))
                    : formatDateKey(
                          addWeeks(endsAtDate, WINDOW_EXTENSION_WEEKS),
                      );

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
                const [
                    fetchedSessions,
                    fetchedActivities,
                    fetchedEntries,
                    fetchedGoals,
                    fetchedCompliance,
                ] =
                    await Promise.all([
                        fetchWindowSessions(fetchFrom, fetchTo),
                        fetchWindowActivities(fetchFrom, fetchTo),
                        fetchWindowCalendarEntries(fetchFrom, fetchTo),
                        fetchWindowGoals(fetchFrom, fetchTo),
                        fetchWindowCompliance(fetchFrom, fetchTo),
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
                setCalendarEntries((currentEntries) => {
                    return mergeCalendarEntries(currentEntries, fetchedEntries);
                });
                setGoals((currentGoals) => {
                    return mergeGoals(currentGoals, fetchedGoals);
                });
                setComplianceWeeks((currentWeeks) => {
                    return mergeComplianceWeeks(currentWeeks, fetchedCompliance);
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
            fetchWindowCalendarEntries,
            fetchWindowCompliance,
            fetchWindowGoals,
            fetchWindowSessions,
            isLoadingFuture,
            isLoadingPast,
            mergeActivities,
            mergeCalendarEntries,
            mergeGoals,
            mergeComplianceWeeks,
            mergeSessions,
            calendarWindow.ends_at,
            calendarWindow.starts_at,
            scrollContainerRef,
            setActivities,
            setCalendarEntries,
            setCalendarWindow,
            setGoals,
            setComplianceWeeks,
            setSessions,
        ],
    );

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
    }, [calendarViewMode, loadMoreWeeks, scrollContainerRef]);

    return {
        topSentinelRef,
        bottomSentinelRef,
        isLoadingPast,
        isLoadingFuture,
        loadMoreWeeks,
    };
}
