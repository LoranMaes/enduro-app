import { cn } from '@/lib/utils';
import { ATP_BAR_MAX_HEIGHT } from '../constants';
import type { AtpWeek } from '../types';

type AtpHeaderChartProps = {
    weeks: AtpWeek[];
    onSelectWeek: (weekStart: string) => void;
};

export function AtpHeaderChart({ weeks, onSelectWeek }: AtpHeaderChartProps) {
    const peakMinutes = Math.max(
        1,
        ...weeks.map((week) =>
            Math.max(week.planned_minutes, week.completed_minutes),
        ),
    );

    return (
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <div
                className="grid min-w-[52rem] items-end gap-1"
                style={{
                    gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
                }}
                role="list"
                aria-label="Annual weekly plan and completion chart"
            >
                {weeks.map((week) => {
                    const plannedHeight = Math.max(
                        0.35,
                        (week.planned_minutes / peakMinutes) *
                            ATP_BAR_MAX_HEIGHT,
                    );
                    const completedHeight = Math.max(
                        0.25,
                        (week.completed_minutes / peakMinutes) *
                            ATP_BAR_MAX_HEIGHT,
                    );

                    return (
                        <button
                            key={week.week_start_date}
                            type="button"
                            role="listitem"
                            onClick={() => {
                                onSelectWeek(week.week_start_date);
                            }}
                            className="group flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-zinc-900/60 focus-visible:bg-zinc-900/60 focus-visible:outline-none"
                            aria-label={`Open calendar week starting ${week.week_start_date}`}
                        >
                            <div className="relative flex h-28 w-full items-end justify-center">
                                <div
                                    className="w-2 rounded-t-sm bg-zinc-600/80"
                                    style={{ height: `${plannedHeight}rem` }}
                                    aria-hidden="true"
                                />
                                <div
                                    className="absolute bottom-0 w-2 rounded-t-sm bg-emerald-400"
                                    style={{ height: `${completedHeight}rem` }}
                                    aria-hidden="true"
                                />
                            </div>
                            <span
                                className={cn(
                                    'text-[0.625rem] text-zinc-500 transition-colors',
                                    'group-hover:text-zinc-300 group-focus-visible:text-zinc-300',
                                )}
                            >
                                {week.iso_week}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
