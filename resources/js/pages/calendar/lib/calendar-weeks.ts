import type {
    TrainingSessionView,
    TrainingWeekView,
} from '@/types/training-plans';

export type CalendarWindow = {
    starts_at: string;
    ends_at: string;
};

export function buildCalendarWeeks(
    window: CalendarWindow,
    sessions: TrainingSessionView[],
): TrainingWeekView[] {
    const baseStart = parseDate(window.starts_at);
    const baseEnd = parseDate(window.ends_at);

    if (baseStart > baseEnd) {
        return [];
    }

    const windowStart = startOfIsoWeek(baseStart);
    const windowEnd = endOfIsoWeek(baseEnd);
    const sessionsByDate = new Map<string, TrainingSessionView[]>();

    sessions
        .slice()
        .sort((left, right) => {
            if (left.scheduledDate === right.scheduledDate) {
                return left.id - right.id;
            }

            return left.scheduledDate.localeCompare(right.scheduledDate);
        })
        .forEach((session) => {
            const current = sessionsByDate.get(session.scheduledDate) ?? [];
            current.push(session);
            sessionsByDate.set(session.scheduledDate, current);
        });

    const weeks: TrainingWeekView[] = [];

    for (
        let cursor = new Date(windowStart);
        cursor <= windowEnd;
        cursor = addDays(cursor, 7)
    ) {
        const weekStart = new Date(cursor);
        const weekEnd = addDays(weekStart, 6);
        const weekSessions: TrainingSessionView[] = [];

        for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
            const dayKey = formatDateKey(addDays(weekStart, dayOffset));
            const daySessions = sessionsByDate.get(dayKey) ?? [];
            weekSessions.push(...daySessions);
        }

        weeks.push({
            id: Number.parseInt(formatDateKey(weekStart).replaceAll('-', ''), 10),
            startsAt: formatDateKey(weekStart),
            endsAt: formatDateKey(weekEnd),
            sessions: weekSessions,
        });
    }

    return weeks;
}

export function parseDate(date: string): Date {
    return new Date(`${date}T00:00:00`);
}

export function addDays(baseDate: Date, offset: number): Date {
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + offset);
    return nextDate;
}

export function addWeeks(baseDate: Date, offset: number): Date {
    return addDays(baseDate, offset * 7);
}

export function startOfIsoWeek(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    const dayOffset = (normalized.getDay() + 6) % 7;
    normalized.setDate(normalized.getDate() - dayOffset);
    return normalized;
}

export function endOfIsoWeek(date: Date): Date {
    const start = startOfIsoWeek(date);
    return addDays(start, 6);
}

export function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export function resolveCurrentWeekStartKey(): string {
    return formatDateKey(startOfIsoWeek(new Date()));
}
