import {
    mapActivityCollection,
    mapCalendarEntryCollection,
    mapGoalCollection,
    mapTrainingSessionCollection,
} from '@/lib/training-plans';
import { index as listActivities } from '@/routes/activities';
import { index as listCalendarEntries } from '@/routes/calendar-entries';
import { index as listGoals } from '@/routes/goals';
import { compliance as progressCompliance } from '@/routes/progress';
import { index as listTrainingSessions } from '@/routes/training-sessions';
import type {
    ActivityApi,
    ActivityView,
    ApiCollectionResponse,
    ApiPaginatedCollectionResponse,
    CalendarEntryApi,
    CalendarEntryView,
    GoalApi,
    GoalView,
    TrainingSessionApi,
    TrainingSessionView,
} from '@/types/training-plans';
import { ACTIVITIES_PER_PAGE, SESSIONS_PER_PAGE } from './constants';
import {
    addDays,
    parseDate,
    startOfIsoWeek,
    formatDateKey,
} from './lib/calendar-weeks';
import type { CalendarViewMode } from './types';
import type { ProgressCompliancePayload, ProgressComplianceWeek } from './types';

export const resolveWeekStartKey = (dateKey: string): string => {
    return formatDateKey(startOfIsoWeek(parseDate(dateKey)));
};

export const resolveFocusLabel = (
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

export const captureFirstVisibleWeek = (
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

export const resolveAvatarInitials = (name: string): string => {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
};

export const mergeSessions = (
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
};

export const mergeActivities = (
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

        return (left.startedAt ?? '').localeCompare(right.startedAt ?? '');
    });
};

export const mergeCalendarEntries = (
    existingEntries: CalendarEntryView[],
    incomingEntries: CalendarEntryView[],
): CalendarEntryView[] => {
    const entryMap = new Map<number, CalendarEntryView>();

    existingEntries.forEach((entry) => {
        entryMap.set(entry.id, entry);
    });

    incomingEntries.forEach((entry) => {
        entryMap.set(entry.id, entry);
    });

    return Array.from(entryMap.values()).sort((left, right) => {
        if (left.scheduledDate === right.scheduledDate) {
            return left.id - right.id;
        }

        return left.scheduledDate.localeCompare(right.scheduledDate);
    });
};

export const mergeGoals = (
    existingGoals: GoalView[],
    incomingGoals: GoalView[],
): GoalView[] => {
    const goalMap = new Map<number, GoalView>();

    existingGoals.forEach((goal) => {
        goalMap.set(goal.id, goal);
    });

    incomingGoals.forEach((goal) => {
        goalMap.set(goal.id, goal);
    });

    return Array.from(goalMap.values()).sort((left, right) => {
        if (left.targetDate === right.targetDate) {
            return left.id - right.id;
        }

        return (left.targetDate ?? '').localeCompare(right.targetDate ?? '');
    });
};

export const mergeComplianceWeeks = (
    existingWeeks: ProgressComplianceWeek[],
    incomingWeeks: ProgressComplianceWeek[],
): ProgressComplianceWeek[] => {
    const complianceMap = new Map<string, ProgressComplianceWeek>();

    existingWeeks.forEach((week) => {
        complianceMap.set(week.week_starts_at, week);
    });

    incomingWeeks.forEach((week) => {
        complianceMap.set(week.week_starts_at, week);
    });

    return Array.from(complianceMap.values()).sort((left, right) => {
        return left.week_starts_at.localeCompare(right.week_starts_at);
    });
};

export const fetchWindowSessions = async (
    from: string,
    to: string,
): Promise<TrainingSessionView[]> => {
    const collectedSessions: TrainingSessionView[] = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
        const route = listTrainingSessions({
            query: {
                from,
                to,
                per_page: SESSIONS_PER_PAGE,
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
};

export const fetchWindowActivities = async (
    from: string,
    to: string,
): Promise<ActivityView[]> => {
    const collectedActivities: ActivityView[] = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
        const route = listActivities({
            query: {
                from,
                to,
                per_page: ACTIVITIES_PER_PAGE,
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
};

export const fetchWindowCalendarEntries = async (
    from: string,
    to: string,
): Promise<CalendarEntryView[]> => {
    const collectedEntries: CalendarEntryView[] = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
        const route = listCalendarEntries({
            query: {
                from,
                to,
                per_page: ACTIVITIES_PER_PAGE,
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
                `Unable to fetch calendar entries for window ${from} to ${to}.`,
            );
        }

        const payload =
            (await response.json()) as ApiPaginatedCollectionResponse<CalendarEntryApi>;
        const mappedEntries = mapCalendarEntryCollection(
            payload as ApiCollectionResponse<CalendarEntryApi>,
        );
        collectedEntries.push(...mappedEntries);

        const meta = payload.meta;

        if (meta === undefined || meta.current_page >= meta.last_page) {
            hasMorePages = false;
        } else {
            page += 1;
        }
    }

    return collectedEntries;
};

export const fetchWindowGoals = async (
    from: string,
    to: string,
): Promise<GoalView[]> => {
    const collectedGoals: GoalView[] = [];
    let page = 1;
    let hasMorePages = true;

    while (hasMorePages) {
        const route = listGoals({
            query: {
                from,
                to,
                per_page: ACTIVITIES_PER_PAGE,
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
            throw new Error(`Unable to fetch goals for window ${from} to ${to}.`);
        }

        const payload =
            (await response.json()) as ApiPaginatedCollectionResponse<GoalApi>;
        const mappedGoals = mapGoalCollection(
            payload as ApiCollectionResponse<GoalApi>,
        );
        collectedGoals.push(...mappedGoals);

        const meta = payload.meta;

        if (meta === undefined || meta.current_page >= meta.last_page) {
            hasMorePages = false;
        } else {
            page += 1;
        }
    }

    return collectedGoals;
};

export const fetchWindowCompliance = async (
    from: string,
    to: string,
): Promise<ProgressComplianceWeek[]> => {
    const route = progressCompliance({
        query: {
            from,
            to,
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
        throw new Error(`Unable to fetch compliance for window ${from} to ${to}.`);
    }

    const payload = (await response.json()) as ProgressCompliancePayload;

    return payload.weeks;
};
