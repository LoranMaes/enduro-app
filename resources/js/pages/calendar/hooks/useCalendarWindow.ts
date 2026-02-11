import { useCallback, useMemo, useState } from 'react';
import {
    DAY_HEADERS,
    SUMMARY_RAIL_WIDTH,
    WINDOW_EXTENSION_WEEKS,
} from '../constants';
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
import type { CalendarViewMode } from '../types';
import { resolveFocusLabel, resolveWeekStartKey } from '../utils';
import type { TrainingSessionView } from '@/types/training-plans';

export function useCalendarWindow(
    initialWindow: CalendarWindow,
    sessions: TrainingSessionView[],
) {
    const [calendarWindow, setCalendarWindow] =
        useState<CalendarWindow>(initialWindow);
    const [calendarViewMode, setCalendarViewMode] =
        useState<CalendarViewMode>('infinite');
    const [focusDate, setFocusDate] = useState<string>(() =>
        formatDateKey(new Date()),
    );

    const weeks = useMemo(() => {
        return buildCalendarWeeks(calendarWindow, sessions);
    }, [calendarWindow, sessions]);

    const focusWeekStart = useMemo(() => {
        return resolveWeekStartKey(focusDate);
    }, [focusDate]);

    const currentWeekStart = useMemo(() => resolveCurrentWeekStartKey(), []);

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
            return DAY_HEADERS;
        }

        const dayLabel = parseDate(focusDate).toLocaleDateString('en-US', {
            weekday: 'short',
        });

        return [dayLabel];
    }, [calendarViewMode, focusDate]);

    const headerGridTemplateColumns = useMemo(() => {
        return `repeat(${Math.max(1, activeDayHeaders.length)}, minmax(0, 1fr)) ${SUMMARY_RAIL_WIDTH}px`;
    }, [activeDayHeaders.length]);

    const focusLabel = useMemo(() => {
        return resolveFocusLabel(calendarViewMode, focusDate);
    }, [calendarViewMode, focusDate]);

    const shiftFocusDate = useCallback((direction: 'previous' | 'next'): void => {
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
    }, [calendarViewMode]);

    const ensureFocusWithinWindow = useCallback((): CalendarWindow | null => {
        if (calendarViewMode === 'infinite') {
            return null;
        }

        const focus = parseDate(focusDate);
        const windowStart = parseDate(calendarWindow.starts_at);
        const windowEnd = parseDate(calendarWindow.ends_at);

        if (windowStart <= focus && focus <= windowEnd) {
            return null;
        }

        const focusedWeekStart = startOfIsoWeek(focus);

        return {
            starts_at: formatDateKey(
                addWeeks(focusedWeekStart, -WINDOW_EXTENSION_WEEKS),
            ),
            ends_at: formatDateKey(
                addWeeks(endOfIsoWeek(focus), WINDOW_EXTENSION_WEEKS),
            ),
        };
    }, [
        calendarViewMode,
        calendarWindow.ends_at,
        calendarWindow.starts_at,
        focusDate,
    ]);

    return {
        calendarWindow,
        setCalendarWindow,
        calendarViewMode,
        setCalendarViewMode,
        focusDate,
        setFocusDate,
        weeks,
        visibleWeeks,
        focusWeekStart,
        currentWeekStart,
        activeDayDates,
        activeDayHeaders,
        headerGridTemplateColumns,
        focusLabel,
        shiftFocusDate,
        ensureFocusWithinWindow,
    };
}
