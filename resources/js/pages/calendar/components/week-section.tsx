import { cn } from '@/lib/utils';
import type {
    ActivityView,
    TrainingSessionView,
    TrainingWeekView,
} from '@/types/training-plans';
import { DayColumn } from './day-column';
import { WeekSummary } from './week-summary';

type WeekSectionProps = {
    week: TrainingWeekView;
    activities: ActivityView[];
    visibleDayDates: string[] | null;
    summaryRailWidth: number;
    canManageSessions: boolean;
    canManageSessionLinks: boolean;
    canOpenActivityDetails: boolean;
    onCreateSession: (date: string) => void;
    onEditSession: (session: TrainingSessionView) => void;
    onOpenActivity: (activity: ActivityView) => void;
};

const dateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const addDays = (baseDate: Date, offset: number): Date => {
    const copy = new Date(baseDate);
    copy.setDate(copy.getDate() + offset);
    return copy;
};

const dayToken = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
};

export function WeekSection({
    week,
    activities,
    visibleDayDates,
    summaryRailWidth,
    canManageSessions,
    canManageSessionLinks,
    canOpenActivityDetails,
    onCreateSession,
    onEditSession,
    onOpenActivity,
}: WeekSectionProps) {
    const weekStart = new Date(`${week.startsAt}T00:00:00`);
    const todayKey = dateKey(new Date());
    const weekDayDates = Array.from({ length: 7 }, (_, index) => {
        return dateKey(addDays(weekStart, index));
    });

    const resolvedDayDates =
        visibleDayDates !== null && visibleDayDates.length > 0
            ? weekDayDates.filter((dayDate) =>
                  visibleDayDates.includes(dayDate),
              )
            : weekDayDates;
    const dayDates =
        resolvedDayDates.length > 0 ? resolvedDayDates : weekDayDates;

    const sessionsByDay = week.sessions.reduce<
        Record<string, TrainingSessionView[]>
    >((carry, session) => {
        const key = session.scheduledDate;

        if (!carry[key]) {
            carry[key] = [];
        }

        carry[key].push(session);

        return carry;
    }, {});

    const activitiesByDay = activities.reduce<Record<string, ActivityView[]>>(
        (carry, activity) => {
            if (activity.startedDate === null) {
                return carry;
            }

            if (!carry[activity.startedDate]) {
                carry[activity.startedDate] = [];
            }

            carry[activity.startedDate].push(activity);

            return carry;
        },
        {},
    );

    const durationMinutes = week.sessions.reduce(
        (total, session) => total + session.durationMinutes,
        0,
    );
    const plannedLoad = week.sessions.reduce(
        (total, session) => total + (session.plannedTss ?? 0),
        0,
    );
    const sessionFallbackLoad = week.sessions.reduce((total, session) => {
        if (session.linkedActivityId !== null) {
            return total;
        }

        if (session.actualTss !== null) {
            return total + session.actualTss;
        }

        if (session.status === 'completed') {
            return total + (session.plannedTss ?? 0);
        }

        return total;
    }, 0);
    const sessionFallbackDurationMinutes = week.sessions.reduce((total, session) => {
        if (session.linkedActivityId !== null) {
            return total;
        }

        if (session.actualDurationMinutes !== null) {
            return total + session.actualDurationMinutes;
        }

        if (session.status === 'completed') {
            return total + session.durationMinutes;
        }

        return total;
    }, 0);
    const activityLoad = activities.reduce((total, activity) => {
        return total + (activity.resolvedTss ?? 0);
    }, 0);
    const activityDurationMinutes = activities.reduce(
        (total, activity) => {
            if (activity.durationSeconds === null || activity.durationSeconds <= 0) {
                return total;
            }

            return total + Math.max(1, Math.round(activity.durationSeconds / 60));
        },
        0,
    );
    const activityVolumeBySportMap = activities.reduce<Map<string, number>>(
        (carry, activity) => {
            if (activity.durationSeconds === null || activity.durationSeconds <= 0) {
                return carry;
            }

            const sportKey = normalizeSport(activity.sport);
            const duration = Math.max(1, Math.round(activity.durationSeconds / 60));
            carry.set(sportKey, (carry.get(sportKey) ?? 0) + duration);

            return carry;
        },
        new Map<string, number>(),
    );
    const activityVolumeBySport = Array.from(activityVolumeBySportMap.entries())
        .map(([sport, minutes]) => {
            return {
                sport,
                minutes,
            };
        })
        .sort((left, right) => {
            const order = sportSortOrder(left.sport) - sportSortOrder(right.sport);

            if (order !== 0) {
                return order;
            }

            return right.minutes - left.minutes;
        });
    const actualDurationMinutes =
        activityDurationMinutes + sessionFallbackDurationMinutes;
    const actualLoad = activityLoad + sessionFallbackLoad;
    const summaryDuration =
        actualDurationMinutes > 0 ? actualDurationMinutes : durationMinutes;
    const completedSessions = week.sessions.filter(
        (session) => session.status === 'completed',
    ).length;
    const hasPlannedSessions = week.sessions.length > 0;
    const isCurrentWeek = isDateInWeek(weekStart, new Date());
    const gridTemplateColumns = `repeat(${Math.max(1, dayDates.length)}, minmax(0, 1fr)) ${summaryRailWidth}px`;

    return (
        <section className="flex flex-col border-b border-border bg-background">
            <header
                className={cn(
                    'sticky top-[var(--calendar-week-sticky)] z-20 flex w-full items-center justify-between border-b border-border bg-background/95 px-4 py-1.5 backdrop-blur-sm',
                )}
            >
                <p
                    className={cn(
                        'font-sans text-[0.625rem] font-medium tracking-wider text-zinc-500 uppercase',
                        isCurrentWeek && 'text-zinc-200',
                    )}
                >
                    Week of {formatWeekRange(weekStart)}
                </p>
                <div className="flex items-center gap-2">
                    {!hasPlannedSessions ? (
                        <p className="text-[0.625rem] text-zinc-600">
                            No training planned
                        </p>
                    ) : null}
                    {isCurrentWeek ? (
                        <span className="flex h-1.5 w-1.5 rounded-full bg-accent" />
                    ) : null}
                </div>
            </header>

            <div
                className="flex flex-col md:grid md:divide-x md:divide-border"
                style={{ gridTemplateColumns }}
            >
                {dayDates.map((currentDayKey) => {
                    const currentDay = new Date(`${currentDayKey}T00:00:00`);
                    const daySessions = sessionsByDay[currentDayKey] ?? [];
                    const dayActivities = activitiesByDay[currentDayKey] ?? [];

                    return (
                        <div
                            key={`${week.id}-${currentDayKey}`}
                            className="min-h-[7rem] border-b border-border md:min-h-[11.5rem] md:border-b-0"
                        >
                            <DayColumn
                                dayNumber={dayToken(currentDay)}
                                dayDate={currentDayKey}
                                isToday={todayKey === currentDayKey}
                                isPast={
                                    currentDay < new Date() &&
                                    todayKey !== currentDayKey
                                }
                                sessions={daySessions}
                                activities={dayActivities}
                                canManageSessions={canManageSessions}
                                canManageSessionLinks={canManageSessionLinks}
                                canOpenActivityDetails={canOpenActivityDetails}
                                onCreateSession={onCreateSession}
                                onEditSession={onEditSession}
                                onOpenActivity={onOpenActivity}
                            />
                        </div>
                    );
                })}

                <aside className="border-t border-border bg-surface/30 md:border-t-0 md:bg-transparent">
                    <WeekSummary
                        totalDuration={summaryDuration}
                        totalTss={actualLoad}
                        plannedTss={plannedLoad}
                        completedSessions={completedSessions}
                        plannedSessions={week.sessions.length}
                        activityVolumeBySport={activityVolumeBySport}
                        isCurrentWeek={isCurrentWeek}
                    />
                </aside>
            </div>
        </section>
    );
}

function formatWeekRange(weekStart: Date): string {
    const weekEnd = addDays(weekStart, 6);

    const formatOptions: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
    };

    return `${weekStart.toLocaleDateString('en-US', formatOptions)} — ${weekEnd.toLocaleDateString('en-US', formatOptions)}`;
}

function isDateInWeek(weekStart: Date, currentDate: Date): boolean {
    const weekEndExclusive = addDays(weekStart, 7);

    return weekStart <= currentDate && currentDate < weekEndExclusive;
}

function normalizeSport(sport: string): string {
    const normalized = sport.trim().toLowerCase();

    if (normalized === 'ride' || normalized === 'cycling') {
        return 'bike';
    }

    if (normalized === 'strength') {
        return 'gym';
    }

    if (normalized === '') {
        return 'other';
    }

    return normalized;
}

function sportSortOrder(sport: string): number {
    return {
        swim: 0,
        bike: 1,
        run: 2,
        gym: 3,
        other: 4,
    }[sport] ?? 5;
}
