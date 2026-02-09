import {
    Activity,
    Bike,
    Clock3,
    Droplets,
    Dumbbell,
    Footprints,
    Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityView } from '@/types/training-plans';

const sportConfig: Record<
    string,
    {
        icon: typeof Activity;
        textColor: string;
        borderColor: string;
        label: string;
    }
> = {
    swim: {
        icon: Droplets,
        textColor: 'text-sky-400',
        borderColor: 'bg-sky-400',
        label: 'Swim activity',
    },
    bike: {
        icon: Bike,
        textColor: 'text-violet-400',
        borderColor: 'bg-violet-400',
        label: 'Bike activity',
    },
    run: {
        icon: Footprints,
        textColor: 'text-rose-400',
        borderColor: 'bg-rose-400',
        label: 'Run activity',
    },
    gym: {
        icon: Dumbbell,
        textColor: 'text-amber-400',
        borderColor: 'bg-amber-400',
        label: 'Gym activity',
    },
    other: {
        icon: Activity,
        textColor: 'text-zinc-400',
        borderColor: 'bg-zinc-500',
        label: 'Activity',
    },
};

type ActivityRowProps = {
    activity: ActivityView;
    isInteractive?: boolean;
    onClick?: () => void;
};

export function ActivityRow({
    activity,
    isInteractive = false,
    onClick,
}: ActivityRowProps) {
    const config = sportConfig[activity.sport] ?? sportConfig.other;
    const SportIcon = config.icon;
    const startedAtLabel = formatStartTime(activity.startedAt);
    const durationLabel = formatDuration(activity.durationSeconds);
    const distanceLabel = formatDistance(activity.distanceMeters);
    const isLinked = activity.linkedSessionId !== null;

    const activate = (): void => {
        if (!isInteractive) {
            return;
        }

        onClick?.();
    };

    return (
        <div
            onClick={(event) => {
                event.stopPropagation();
                activate();
            }}
            onKeyDown={(event) => {
                if (!isInteractive) {
                    return;
                }

                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    activate();
                }
            }}
            role={isInteractive ? 'button' : undefined}
            tabIndex={isInteractive ? 0 : undefined}
            className={cn(
                'relative flex w-full flex-col overflow-hidden rounded-md border border-zinc-800/80 bg-zinc-900/60 px-3 py-2',
                isInteractive &&
                    'cursor-pointer transition-colors hover:border-zinc-700 focus-visible:ring-1 focus-visible:ring-zinc-600 focus-visible:ring-offset-0 focus-visible:outline-none',
            )}
        >
            <span
                className={cn(
                    'absolute top-0 bottom-0 left-0 w-1',
                    config.borderColor,
                )}
            />
            <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <SportIcon
                        className={cn('h-3.5 w-3.5 shrink-0', config.textColor)}
                    />
                    <p className="truncate text-xs font-medium text-zinc-300">
                        {config.label}
                    </p>
                </div>
                <span
                    className={cn(
                        'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[10px]',
                        isLinked
                            ? 'border-zinc-600 text-zinc-300'
                            : 'border-zinc-700 text-zinc-500',
                    )}
                >
                    {isLinked ? 'Linked' : 'Unlinked'}
                </span>
            </div>

            <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-500">
                <span className="inline-flex items-center gap-1">
                    <Clock3 className="h-3 w-3" />
                    {startedAtLabel}
                </span>
                <span className="font-mono text-zinc-400">{durationLabel}</span>
                {distanceLabel !== null ? (
                    <span className="font-mono text-zinc-500">
                        {distanceLabel}
                    </span>
                ) : null}
                <span className="inline-flex items-center gap-1 text-zinc-500">
                    <Link2 className="h-3 w-3" />
                    {activity.provider}
                </span>
            </div>
        </div>
    );
}

function formatStartTime(startedAt: string | null): string {
    if (startedAt === null || startedAt.trim() === '') {
        return 'Unknown time';
    }

    const date = new Date(startedAt);

    if (Number.isNaN(date.getTime())) {
        return 'Unknown time';
    }

    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    });
}

function formatDuration(durationSeconds: number | null): string {
    if (durationSeconds === null || durationSeconds <= 0) {
        return '0m';
    }

    const roundedMinutes = Math.round(durationSeconds / 60);
    const hours = Math.floor(roundedMinutes / 60);
    const minutes = roundedMinutes % 60;

    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (hours > 0) {
        return `${hours}h`;
    }

    return `${minutes}m`;
}

function formatDistance(distanceMeters: number | null): string | null {
    if (distanceMeters === null || distanceMeters <= 0) {
        return null;
    }

    return `${(distanceMeters / 1000).toFixed(1)} km`;
}
