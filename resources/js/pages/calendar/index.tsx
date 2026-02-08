import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { mapTrainingSessionCollection } from '@/lib/training-plans';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type {
    ApiCollectionResponse,
    ApiPaginatedCollectionResponse,
    TrainingPlanApi,
    TrainingSessionApi,
    TrainingSessionView,
    TrainingWeekView,
} from '@/types/training-plans';
import { PlanSection } from './components/plan-section';

type CalendarPageProps = {
    trainingPlans: ApiPaginatedCollectionResponse<TrainingPlanApi>;
    trainingSessions: ApiCollectionResponse<TrainingSessionApi>;
    calendarWindow: {
        starts_at: string;
        ends_at: string;
    };
    viewingAthlete?: {
        id: number;
        name: string;
    } | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Calendar',
        href: dashboard().url,
    },
];

export default function CalendarPage({
    trainingPlans: _trainingPlans,
    trainingSessions,
    calendarWindow,
    viewingAthlete = null,
}: CalendarPageProps) {
    void _trainingPlans;
    const sessions = mapTrainingSessionCollection(trainingSessions);
    const calendarWeeks = buildCalendarWeeks(calendarWindow, sessions);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Calendar" />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                    <PlanSection
                        weeks={calendarWeeks}
                        viewingAthleteName={viewingAthlete?.name ?? null}
                    />
                </div>
            </div>
        </AppLayout>
    );
}

function buildCalendarWeeks(
    window: {
        starts_at: string;
        ends_at: string;
    },
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

function parseDate(value: string): Date {
    return new Date(`${value}T00:00:00`);
}

function addDays(baseDate: Date, offset: number): Date {
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + offset);
    return nextDate;
}

function startOfIsoWeek(date: Date): Date {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    const dayOffset = (normalized.getDay() + 6) % 7;
    normalized.setDate(normalized.getDate() - dayOffset);
    return normalized;
}

function endOfIsoWeek(date: Date): Date {
    const start = startOfIsoWeek(date);
    return addDays(start, 6);
}

function formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}
