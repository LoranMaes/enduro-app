import { usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Flag } from 'lucide-react';
import type { SharedData } from '@/types';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { ATP_BAR_MAX_HEIGHT, ATP_WEEK_TYPE_STYLES } from '../constants';
import type { AtpWeek } from '../types';
import { formatAtpDate, minutesToHourLabel } from '../utils';

type AtpHeaderChartProps = {
    weeks: AtpWeek[];
    onSelectWeek: (weekStart: string) => void;
};

export function AtpHeaderChart({ weeks, onSelectWeek }: AtpHeaderChartProps) {
    const { auth } = usePage<SharedData>().props;
    const timezone =
        typeof auth.user.timezone === 'string' ? auth.user.timezone : null;

    const peakMinutes = Math.max(
        1,
        ...weeks.map((week) =>
            Math.max(week.planned_minutes, week.completed_minutes),
        ),
    );

    return (
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <div
                className="grid min-w-[44rem] items-end gap-1"
                style={{
                    gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))`,
                }}
                role="list"
                aria-label="Annual weekly plan and completion chart"
            >
                {weeks.map((week) => {
                    const weekTypeStyle =
                        ATP_WEEK_TYPE_STYLES[week.week_type] ??
                        ATP_WEEK_TYPE_STYLES.default;
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

                    const loadStateClass =
                        week.load_state === 'in_range'
                            ? 'text-emerald-300'
                            : week.load_state === 'high'
                              ? 'text-amber-300'
                              : week.load_state === 'low'
                                ? 'text-zinc-300'
                                : 'text-zinc-500';

                    return (
                        <Tooltip key={week.week_start_date}>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    role="listitem"
                                    onClick={() => {
                                        onSelectWeek(week.week_start_date);
                                    }}
                                    className={cn(
                                        'group flex min-w-0 flex-col items-center gap-1 rounded-md px-1 py-1.5 text-left transition-colors hover:bg-zinc-900/60 focus-visible:bg-zinc-900/60 focus-visible:outline-none',
                                        week.is_current_week && 'bg-zinc-900/70 ring-1 ring-zinc-600/80',
                                    )}
                                    aria-label={`Open calendar week starting ${week.week_start_date}`}
                                >
                                    <div className="relative flex h-28 w-full items-end justify-center">
                                        <div
                                            className={cn(
                                                'w-2 rounded-t-sm',
                                                weekTypeStyle.barClassName,
                                            )}
                                            style={{ height: `${plannedHeight}rem` }}
                                            aria-hidden="true"
                                        />
                                        <div
                                            className={cn(
                                                'absolute bottom-0 w-2 rounded-t-sm',
                                                week.load_state === 'in_range'
                                                    ? 'bg-emerald-400'
                                                    : week.load_state === 'high'
                                                      ? 'bg-amber-400'
                                                      : week.load_state === 'low'
                                                        ? 'bg-zinc-300'
                                                        : 'bg-zinc-500',
                                            )}
                                            style={{ height: `${completedHeight}rem` }}
                                            aria-hidden="true"
                                        />
                                    </div>
                                    <span
                                        className={cn(
                                            'text-[0.625rem] text-zinc-500 transition-colors',
                                            'group-hover:text-zinc-300 group-focus-visible:text-zinc-300',
                                            week.is_current_week && 'text-zinc-200',
                                        )}
                                    >
                                        {week.iso_week}
                                    </span>
                                    {week.goal_marker !== null ? (
                                        <span className="text-zinc-300">
                                            <Flag className="h-3 w-3" />
                                        </span>
                                    ) : (
                                        <span className="h-3" aria-hidden="true" />
                                    )}
                                </button>
                            </TooltipTrigger>
                            <TooltipContent className="border border-border bg-surface text-zinc-200">
                                <div className="space-y-0.5 text-[0.6875rem]">
                                    <p className="font-medium text-zinc-100">
                                        Week {week.iso_week} •{' '}
                                        {formatAtpDate(week.week_start_date, timezone)} —{' '}
                                        {formatAtpDate(week.week_end_date, timezone)}
                                    </p>
                                    <p className="text-zinc-400">
                                        Planned: {minutesToHourLabel(week.planned_minutes)} • {week.planned_tss ?? 0} TSS
                                    </p>
                                    <p className="text-zinc-400">
                                        Completed: {minutesToHourLabel(week.completed_minutes)} • {week.completed_tss ?? 0} TSS
                                    </p>
                                    <p className={cn('font-medium', loadStateClass)}>
                                        State: {week.load_state.replace('_', ' ')}
                                        {week.load_state_ratio !== null
                                            ? ` (${Math.round(week.load_state_ratio * 100)}%)`
                                            : ''}
                                    </p>
                                    <p className={cn('font-medium', weekTypeStyle.textClassName)}>
                                        Type: {week.week_type.replace('_', ' ')}
                                    </p>
                                    {week.goal_marker !== null ? (
                                        <p className="text-zinc-300">
                                            Goal: {week.goal_marker.title}
                                        </p>
                                    ) : null}
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
}
