import { cn } from '@/lib/utils';

type WeekSummaryProps = {
    totalDuration: number;
    totalTss: number;
    plannedTss?: number;
    completedSessions: number;
    plannedSessions: number;
    activityVolumeBySport?: Array<{
        sport: string;
        minutes: number;
    }>;
    isCurrentWeek?: boolean;
};

export function WeekSummary({
    totalDuration,
    totalTss,
    plannedTss = 0,
    completedSessions,
    plannedSessions,
    activityVolumeBySport = [],
    isCurrentWeek = false,
}: WeekSummaryProps) {
    const compliance =
        plannedTss > 0 ? Math.round((totalTss / plannedTss) * 100) : 0;
    const hasData = totalDuration > 0 || totalTss > 0 || plannedTss > 0;

    let statusColor = 'text-zinc-500';
    let barColor = 'bg-zinc-700';

    if (plannedTss > 0) {
        if (compliance > 115) {
            statusColor = 'text-status-warning';
            barColor = 'bg-status-warning';
        } else if (compliance < 80) {
            statusColor = 'text-zinc-400';
            barColor = 'bg-zinc-600';
        } else {
            statusColor = 'text-status-completed';
            barColor = 'bg-status-completed';
        }
    }

    return (
        <div
            className={cn(
                'flex h-full min-h-[140px] flex-col justify-center gap-5 p-4 transition-colors',
                isCurrentWeek
                    ? 'bg-zinc-900/30'
                    : 'bg-transparent hover:bg-zinc-900/10',
            )}
        >
            <div className="flex flex-col">
                <p className="mb-1 font-sans text-[10px] tracking-wider text-zinc-600 uppercase">
                    Volume
                </p>
                <span
                    className={cn(
                        'font-mono text-sm font-light',
                        hasData ? 'text-zinc-200' : 'text-zinc-700',
                    )}
                >
                    {hasData ? formatDuration(totalDuration) : '—'}
                </span>
                {activityVolumeBySport.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                        {activityVolumeBySport.map((item) => (
                            <span
                                key={item.sport}
                                className="rounded border border-border/70 bg-zinc-900/40 px-1.5 py-0.5 font-mono text-[9px] text-zinc-400"
                            >
                                {formatSportLabel(item.sport)}{' '}
                                {formatDurationShort(item.minutes)}
                            </span>
                        ))}
                    </div>
                ) : null}
            </div>

            <div className="flex flex-col">
                <p className="mb-1 font-sans text-[10px] tracking-wider text-zinc-600 uppercase">
                    Load
                </p>
                <div className="flex items-baseline gap-1.5">
                    <span
                        className={cn(
                            'font-mono text-sm font-medium transition-colors',
                            hasData ? statusColor : 'text-zinc-700',
                        )}
                    >
                        {hasData ? totalTss : '—'}
                    </span>
                    {plannedTss > 0 ? (
                        <span className="font-mono text-[10px] text-zinc-600">
                            / {plannedTss}
                        </span>
                    ) : null}
                </div>
            </div>

            <div className="mt-auto flex flex-col border-t border-border pt-3">
                <div className="mb-2 flex items-center justify-between">
                    <p className="font-sans text-[10px] tracking-wider text-zinc-600 uppercase">
                        Compliance
                    </p>
                    <span
                        className={cn(
                            'font-mono text-[9px]',
                            hasData ? 'text-zinc-500' : 'text-zinc-800',
                        )}
                    >
                        {completedSessions}/{plannedSessions}
                    </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800/50">
                    {plannedTss > 0 ? (
                        <div
                            className={cn(
                                'h-full rounded-full transition-all duration-500',
                                barColor,
                            )}
                            style={{ width: `${Math.min(compliance, 100)}%` }}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function formatDuration(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
}

function formatDurationShort(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours <= 0) {
        return `${minutes}m`;
    }

    if (minutes <= 0) {
        return `${hours}h`;
    }

    return `${hours}h${minutes}`;
}

function formatSportLabel(sport: string): string {
    return sport.toUpperCase();
}
