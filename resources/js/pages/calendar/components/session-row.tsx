import {
    Activity,
    AlertCircle,
    Bike,
    CheckCircle2,
    Droplets,
    Dumbbell,
    Footprints,
    XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrainingSessionView } from '@/types/training-plans';

const sportConfig: Record<
    string,
    {
        icon: typeof Activity;
        textColor: string;
        borderColor: string;
        title: string;
    }
> = {
    swim: {
        icon: Droplets,
        textColor: 'text-sky-400',
        borderColor: 'bg-sky-400',
        title: 'Intervals',
    },
    bike: {
        icon: Bike,
        textColor: 'text-violet-400',
        borderColor: 'bg-violet-400',
        title: 'Zone 2',
    },
    run: {
        icon: Footprints,
        textColor: 'text-rose-400',
        borderColor: 'bg-rose-400',
        title: 'Intervals',
    },
    gym: {
        icon: Dumbbell,
        textColor: 'text-amber-400',
        borderColor: 'bg-amber-400',
        title: 'Gym',
    },
    strength: {
        icon: Dumbbell,
        textColor: 'text-amber-400',
        borderColor: 'bg-amber-400',
        title: 'Strength',
    },
    rest: {
        icon: Activity,
        textColor: 'text-zinc-500',
        borderColor: 'bg-zinc-500',
        title: 'Rest',
    },
};

type SessionRowProps = {
    session: TrainingSessionView;
    showDate?: boolean;
    compact?: boolean;
    isOverlay?: boolean;
    intensity?: 'easy' | 'steady' | 'tempo' | 'threshold' | 'vo2';
    onClick?: () => void;
};

const intensityConfig: Record<string, string> = {
    easy: 'bg-emerald-500',
    steady: 'bg-sky-500',
    tempo: 'bg-amber-500',
    threshold: 'bg-orange-500',
    vo2: 'bg-red-500',
};

export function SessionRow({
    session,
    showDate = true,
    compact = false,
    isOverlay = false,
    intensity,
    onClick,
}: SessionRowProps) {
    const config = sportConfig[session.sport] ?? sportConfig.rest;
    const SportIcon = config.icon;
    const displayTss = session.plannedTss ?? undefined;
    const displayTitle = config.title;
    const isSkipped = session.status === 'skipped';

    const statusStyle: Record<string, string> = {
        planned:
            'bg-surface border-border hover:border-zinc-600 text-zinc-400 hover:text-zinc-300',
        completed:
            'bg-zinc-800 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-700/80 text-zinc-100 shadow-sm',
        skipped:
            'bg-red-950/5 border-red-900/10 hover:border-red-900/30 text-zinc-600 opacity-80',
        partial:
            'bg-amber-950/10 border-amber-900/20 hover:border-amber-900/40 text-zinc-300',
    };

    let currentStatusStyle = statusStyle[session.status] ?? statusStyle.planned;

    if (isOverlay) {
        currentStatusStyle =
            'bg-transparent border-dashed border-zinc-700/50 opacity-50 hover:opacity-80 hover:border-zinc-500 hover:bg-zinc-900/20';
    }

    return (
        <div
            onClick={(event) => {
                event.stopPropagation();

                if (!isOverlay) {
                    onClick?.();
                }
            }}
            className={cn(
                'group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-md border py-2 pr-2 pl-3 transition-all duration-200',
                currentStatusStyle,
                compact ? 'min-h-[56px] gap-0.5' : 'min-h-[72px] gap-1',
                isOverlay && 'cursor-default',
            )}
        >
            <div
                className={cn(
                    'absolute top-0 bottom-0 left-0 w-1',
                    isOverlay
                        ? 'bg-zinc-700'
                        : isSkipped
                          ? 'bg-red-900/30'
                          : config.borderColor,
                )}
            />

            <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                    <SportIcon
                        className={cn(
                            'h-3.5 w-3.5 shrink-0',
                            isOverlay || isSkipped
                                ? 'text-zinc-500'
                                : config.textColor,
                        )}
                    />
                    <span
                        className={cn(
                            'truncate font-sans font-medium tracking-tight',
                            compact ? 'text-xs' : 'text-sm',
                            isSkipped &&
                                'text-zinc-600 line-through decoration-zinc-700',
                            session.status === 'completed'
                                ? 'text-zinc-100'
                                : 'text-zinc-400',
                        )}
                    >
                        {displayTitle}
                    </span>
                </div>

                {!isOverlay && !compact ? (
                    <div className="shrink-0 pt-0.5">
                        {session.status === 'completed' ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : null}
                        {session.status === 'skipped' ? (
                            <XCircle className="h-3.5 w-3.5 text-red-500/50" />
                        ) : null}
                        {session.status === 'partial' ? (
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        ) : null}
                    </div>
                ) : null}
            </div>

            <div className="mt-auto flex items-baseline gap-3">
                <span
                    className={cn(
                        'font-mono text-sm font-light',
                        session.status === 'completed'
                            ? 'text-white'
                            : 'text-zinc-400',
                        isSkipped && 'text-zinc-600',
                    )}
                >
                    {formatDuration(session.durationMinutes)}
                </span>
                {displayTss !== undefined && displayTss > 0 ? (
                    <span
                        className={cn(
                            'font-mono text-sm font-light',
                            isSkipped ? 'text-zinc-700' : 'text-zinc-500',
                        )}
                    >
                        {displayTss} TSS
                    </span>
                ) : null}
            </div>

            {showDate ? (
                <p className="pl-0 text-[11px] text-zinc-500">
                    {session.scheduledDate}
                </p>
            ) : null}

            {!compact &&
            !isOverlay &&
            !isSkipped &&
            intensity &&
            intensityConfig[intensity] ? (
                <div
                    className={cn(
                        'absolute right-2 bottom-2 h-1.5 w-1.5 rounded-full opacity-60',
                        intensityConfig[intensity],
                    )}
                    title={`Intensity: ${intensity}`}
                />
            ) : null}
        </div>
    );
}

function formatDuration(durationMinutes: number): string {
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (hours > 0) {
        return `${hours}h`;
    }

    return `${minutes}m`;
}
