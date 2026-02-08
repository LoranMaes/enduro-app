import { cn } from '@/lib/utils';
import type {
    TrainingSessionView,
    TrainingWeekView,
} from '@/types/training-plans';
import { DayColumn } from './day-column';
import { WeekSummary } from './week-summary';

type WeekSectionProps = {
    week: TrainingWeekView;
    canManageSessions: boolean;
    onCreateSession: (trainingWeekId: number, date: string) => void;
    onEditSession: (
        trainingWeekId: number,
        session: TrainingSessionView,
    ) => void;
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
    canManageSessions,
    onCreateSession,
    onEditSession,
}: WeekSectionProps) {
    const weekStart = new Date(`${week.startsAt}T00:00:00`);
    const todayKey = dateKey(new Date());

    const sessionsByDay = week.sessions.reduce<
        Record<string, typeof week.sessions>
    >((carry, session) => {
        const key = session.scheduledDate;

        if (!carry[key]) {
            carry[key] = [];
        }

        carry[key].push(session);

        return carry;
    }, {});

    const durationMinutes = week.sessions.reduce(
        (total, session) => total + session.durationMinutes,
        0,
    );
    const plannedLoad = week.sessions.reduce(
        (total, session) => total + (session.plannedTss ?? 0),
        0,
    );
    const actualLoad = week.sessions.reduce((total, session) => {
        if (session.status !== 'completed') {
            return total;
        }

        return total + (session.actualTss ?? session.plannedTss ?? 0);
    }, 0);
    const completedSessions = week.sessions.filter(
        (session) => session.status === 'completed',
    ).length;
    const isCurrentWeek = isDateInWeek(weekStart, new Date());

    return (
        <section className="flex flex-col border-b border-border bg-background">
            <header
                className={cn(
                    'sticky top-[var(--calendar-week-sticky)] z-20 flex w-full items-center justify-between border-b border-border bg-background/95 px-4 py-1.5 backdrop-blur-sm',
                )}
            >
                <p
                    className={cn(
                        'font-sans text-[10px] font-medium tracking-wider text-zinc-500 uppercase',
                        isCurrentWeek && 'text-zinc-200',
                    )}
                >
                    Week of {formatWeekRange(weekStart)}
                </p>
                {isCurrentWeek ? (
                    <span className="flex h-1.5 w-1.5 rounded-full bg-accent" />
                ) : null}
            </header>

            <div className="flex flex-col md:grid md:grid-cols-[repeat(7,minmax(0,1fr))_156px] md:divide-x md:divide-border">
                {Array.from({ length: 7 }, (_, index) => {
                    const currentDay = addDays(weekStart, index);
                    const currentDayKey = dateKey(currentDay);
                    const sessions = sessionsByDay[currentDayKey] ?? [];

                    return (
                        <div
                            key={`${week.id}-${currentDayKey}`}
                            className="min-h-[112px] border-b border-border md:min-h-[184px] md:border-b-0"
                        >
                            <DayColumn
                                dayNumber={dayToken(currentDay)}
                                dayDate={currentDayKey}
                                trainingWeekId={week.id}
                                isToday={todayKey === currentDayKey}
                                isPast={
                                    currentDay < new Date() &&
                                    todayKey !== currentDayKey
                                }
                                sessions={sessions}
                                canManageSessions={canManageSessions}
                                onCreateSession={onCreateSession}
                                onEditSession={onEditSession}
                            />
                        </div>
                    );
                })}

                <aside className="border-t border-border bg-surface/30 md:border-t-0 md:bg-transparent">
                    <WeekSummary
                        totalDuration={durationMinutes}
                        totalTss={actualLoad}
                        plannedTss={plannedLoad}
                        completedSessions={completedSessions}
                        plannedSessions={week.sessions.length}
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
