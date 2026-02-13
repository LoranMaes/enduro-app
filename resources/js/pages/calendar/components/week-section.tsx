import { cn } from '@/lib/utils';
import type {
    ActivityView,
    CalendarEntryView,
    GoalView,
    TrainingSessionView,
    TrainingWeekView,
} from '@/types/training-plans';
import type { ProgressComplianceWeek } from '../types';
import { DayColumn } from './day-column';
import { WeekSummary } from './week-summary';

type WeekSectionProps = {
    week: TrainingWeekView;
    activities: ActivityView[];
    calendarEntries: CalendarEntryView[];
    goals: GoalView[];
    compliance: ProgressComplianceWeek | null;
    visibleDayDates: string[] | null;
    summaryRailWidth: number;
    canManageSessions: boolean;
    canManageSessionLinks: boolean;
    canOpenActivityDetails: boolean;
    onCreateSession: (date: string) => void;
    onEditSession: (session: TrainingSessionView) => void;
    onSessionDragStart: (session: TrainingSessionView) => void;
    onSessionDragEnd: () => void;
    onDayDragOver: (date: string) => void;
    onDayDrop: (date: string, targetWeekId: number) => void;
    draggingSessionId: number | null;
    isDayDropTarget: (date: string) => boolean;
    onOpenActivity: (activity: ActivityView) => void;
    onOpenCalendarEntry: (entry: CalendarEntryView) => void;
    onOpenGoal: (goal: GoalView) => void;
    onOpenProgressForWeek: (weekStartsAt: string) => void;
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
    calendarEntries,
    goals,
    compliance,
    visibleDayDates,
    summaryRailWidth,
    canManageSessions,
    canManageSessionLinks,
    canOpenActivityDetails,
    onCreateSession,
    onEditSession,
    onSessionDragStart,
    onSessionDragEnd,
    onDayDragOver,
    onDayDrop,
    draggingSessionId,
    isDayDropTarget,
    onOpenActivity,
    onOpenCalendarEntry,
    onOpenGoal,
    onOpenProgressForWeek,
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

            if (activity.linkedSessionId !== null) {
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
    const calendarEntriesByDay = calendarEntries.reduce<
        Record<string, CalendarEntryView[]>
    >((carry, entry) => {
        if (!carry[entry.scheduledDate]) {
            carry[entry.scheduledDate] = [];
        }

        carry[entry.scheduledDate].push(entry);

        return carry;
    }, {});
    const goalsByDay = goals.reduce<Record<string, GoalView[]>>((carry, goal) => {
        if (goal.targetDate === null) {
            return carry;
        }

        if (!carry[goal.targetDate]) {
            carry[goal.targetDate] = [];
        }

        carry[goal.targetDate].push(goal);

        return carry;
    }, {});

    const plannedSessionsForCompliance = week.sessions.filter((session) => {
        return session.planningSource === 'planned';
    });
    const durationMinutes = week.sessions.reduce(
        (total, session) => total + session.durationMinutes,
        0,
    );
    const plannedLoad = plannedSessionsForCompliance.reduce(
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
    const completedSessions = plannedSessionsForCompliance.filter(
        (session) => session.status === 'completed',
    ).length;
    const resolvedPlannedSessionsCount =
        compliance?.planned_sessions_count ?? plannedSessionsForCompliance.length;
    const resolvedCompletedSessionsCount =
        compliance?.planned_completed_count ?? completedSessions;
    const complianceRatio =
        resolvedPlannedSessionsCount > 0
            ? resolvedCompletedSessionsCount / resolvedPlannedSessionsCount
            : 0;
    const compliancePercentage = Math.round(complianceRatio * 100);
    const recommendationState = resolveRecommendationState(
        compliance?.recommendation_band ?? null,
        compliance?.actual_minutes_total ?? actualDurationMinutes,
    );
    const hasPlannedSessions = plannedSessionsForCompliance.length > 0;
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
                    {!hasPlannedSessions && resolvedPlannedSessionsCount === 0 ? (
                        <p className="text-[0.6875rem] text-zinc-600">
                            No training planned
                        </p>
                    ) : null}
                    {resolvedPlannedSessionsCount > 0 ? (
                        <button
                            type="button"
                            onClick={() => onOpenProgressForWeek(week.startsAt)}
                            className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 text-[0.6875rem] text-zinc-300 transition-colors hover:border-zinc-600 hover:text-zinc-100 focus-visible:ring-1 focus-visible:ring-zinc-500 focus-visible:outline-none"
                            aria-label={`Week compliance ${resolvedCompletedSessionsCount} out of ${resolvedPlannedSessionsCount}. View in progress.`}
                        >
                            <span className="font-mono">
                                {resolvedCompletedSessionsCount}/{resolvedPlannedSessionsCount}
                            </span>
                            <span className="text-zinc-500">{compliancePercentage}%</span>
                        </button>
                    ) : null}
                    {compliance?.recommendation_band !== null ? (
                        <span
                            className={cn(
                                'rounded-full border px-2 py-0.5 text-[0.6875rem]',
                                recommendationState === 'in_range' &&
                                    'border-emerald-500/45 text-emerald-300',
                                recommendationState === 'too_low' &&
                                    'border-zinc-700 text-zinc-400',
                                recommendationState === 'too_high' &&
                                    'border-amber-500/40 text-amber-300',
                            )}
                        >
                            {recommendationState === 'in_range'
                                ? 'In range'
                                : recommendationState === 'too_high'
                                  ? 'High'
                                  : 'Low'}
                        </span>
                    ) : (
                        <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[0.6875rem] text-zinc-600">
                            No baseline
                        </span>
                    )}
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
                    const dayCalendarEntries =
                        calendarEntriesByDay[currentDayKey] ?? [];
                    const dayGoals = goalsByDay[currentDayKey] ?? [];

                    return (
                        <div
                            key={`${week.id}-${currentDayKey}`}
                            className="min-h-[7rem] border-b border-border md:min-h-[11.5rem] md:border-b-0"
                        >
                            <DayColumn
                                dayNumber={dayToken(currentDay)}
                                dayDate={currentDayKey}
                                targetWeekId={week.id}
                                isToday={todayKey === currentDayKey}
                                isPast={
                                    currentDay < new Date() &&
                                    todayKey !== currentDayKey
                                }
                                dropActive={isDayDropTarget(currentDayKey)}
                                draggingSessionId={draggingSessionId}
                                sessions={daySessions}
                                activities={dayActivities}
                                calendarEntries={dayCalendarEntries}
                                goals={dayGoals}
                                canManageSessions={canManageSessions}
                                canManageSessionLinks={canManageSessionLinks}
                                canOpenActivityDetails={canOpenActivityDetails}
                                onCreateSession={onCreateSession}
                                onEditSession={onEditSession}
                                onSessionDragStart={onSessionDragStart}
                                onSessionDragEnd={onSessionDragEnd}
                                onDayDragOver={onDayDragOver}
                                onDayDrop={onDayDrop}
                                onOpenActivity={onOpenActivity}
                                onOpenCalendarEntry={onOpenCalendarEntry}
                                onOpenGoal={onOpenGoal}
                            />
                        </div>
                    );
                })}

                <aside className="border-t border-border bg-surface/30 md:border-t-0 md:bg-transparent">
                    <WeekSummary
                        totalDuration={summaryDuration}
                        totalTss={actualLoad}
                        plannedTss={plannedLoad}
                        completedSessions={resolvedCompletedSessionsCount}
                        plannedSessions={resolvedPlannedSessionsCount}
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

function resolveRecommendationState(
    recommendationBand: { min_minutes: number; max_minutes: number } | null,
    actualMinutes: number,
): 'too_low' | 'in_range' | 'too_high' {
    if (recommendationBand === null) {
        return 'too_low';
    }

    if (actualMinutes < recommendationBand.min_minutes) {
        return 'too_low';
    }

    if (actualMinutes > recommendationBand.max_minutes) {
        return 'too_high';
    }

    return 'in_range';
}
