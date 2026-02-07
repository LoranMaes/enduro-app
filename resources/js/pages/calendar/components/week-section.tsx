import { Badge } from '@/components/ui/badge';
import type { TrainingWeekView } from '@/types/training-plans';
import { DayColumn } from './day-column';

type WeekSectionProps = {
    week: TrainingWeekView;
};

const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

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

export function WeekSection({ week }: WeekSectionProps) {
    const weekStart = new Date(`${week.startsAt}T00:00:00`);
    const today = dateKey(new Date());

    const sessionsByDay = week.sessions.reduce<Record<string, typeof week.sessions>>(
        (carry, session) => {
            const key = session.scheduledDate;

            if (!carry[key]) {
                carry[key] = [];
            }

            carry[key].push(session);

            return carry;
        },
        {},
    );

    return (
        <section className="bg-surface/40 rounded-lg border border-border">
            <header className="bg-background/70 border-b border-border px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium">
                        Week starting {week.startsAt}
                    </h4>
                    <Badge variant="outline" className="font-mono">
                        {week.sessions.length} session
                        {week.sessions.length === 1 ? '' : 's'}
                    </Badge>
                </div>
            </header>

            <div className="overflow-x-auto">
                <div className="grid min-w-[940px] grid-cols-7 divide-x divide-border">
                    {dayLabels.map((label, index) => {
                        const currentDay = addDays(weekStart, index);
                        const currentDayKey = dateKey(currentDay);
                        const sessions = sessionsByDay[currentDayKey] ?? [];

                        return (
                            <DayColumn
                                key={`${week.id}-${label}`}
                                label={label}
                                dayNumber={dayToken(currentDay)}
                                isToday={today === currentDayKey}
                                sessions={sessions}
                            />
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
