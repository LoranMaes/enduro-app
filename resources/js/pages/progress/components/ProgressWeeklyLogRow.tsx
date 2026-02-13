import { router } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { ProgressWeek } from '../types';
import { calculateCompliance, formatDuration, formatShortDate } from '../utils';

type ProgressWeeklyLogRowProps = {
    week: ProgressWeek;
};

export function ProgressWeeklyLogRow({ week }: ProgressWeeklyLogRowProps) {
    const plannedTss = week.planned_tss ?? 0;
    const actualTss = week.actual_tss ?? 0;
    const compliance = calculateCompliance(plannedTss, actualTss);

    return (
        <button
            type="button"
            onClick={() => {
                router.get(
                    dashboard().url,
                    {
                        starts_from: week.week_start,
                        ends_to: week.week_end,
                    },
                    {
                        preserveScroll: true,
                    },
                );
            }}
            className="group flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-800/50"
        >
            <div className="flex flex-col">
                <span className="text-xs font-medium text-zinc-300">
                    {formatShortDate(week.week_start)} — {formatShortDate(week.week_end)}
                </span>
                <span className="text-[0.625rem] tracking-wider text-zinc-500 uppercase">
                    Planned {formatDuration(week.planned_duration_minutes)} • Actual{' '}
                    {formatDuration(week.actual_duration_minutes)}
                </span>
            </div>

            <div className="flex items-center gap-4">
                <div className="hidden flex-col items-end gap-1 sm:flex">
                    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800">
                        <div
                            className={cn(
                                'h-full',
                                compliance >= 80 && compliance <= 115
                                    ? 'bg-emerald-500'
                                    : compliance > 115
                                      ? 'bg-amber-500'
                                      : 'bg-zinc-500',
                            )}
                            style={{
                                width: `${Math.min(compliance, 100)}%`,
                            }}
                        />
                    </div>
                </div>
                <div className="flex w-20 flex-col items-end">
                    <span className="font-mono text-sm text-zinc-200">{week.actual_tss ?? 0} TSS</span>
                    <span className="text-[0.625rem] text-zinc-500">
                        {plannedTss > 0 ? `${compliance}%` : '—'}
                    </span>
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400" />
            </div>
        </button>
    );
}
