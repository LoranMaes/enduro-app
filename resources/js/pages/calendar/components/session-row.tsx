import {
    Activity,
    AlertCircle,
    Bike,
    CheckCircle2,
    Droplets,
    Dumbbell,
    Footprints,
    Link2,
    XCircle,
} from 'lucide-react';
import type { DragEvent as ReactDragEvent } from 'react';
import { cn } from '@/lib/utils';
import type { TrainingSessionView } from '@/types/training-plans';
import {
    isSessionAdjusted,
    isSessionCompleted,
    isSessionReadyToComplete,
} from './session-reconciliation';

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
    mtn_bike: {
        icon: Bike,
        textColor: 'text-violet-400',
        borderColor: 'bg-violet-400',
        title: 'MTB',
    },
    run: {
        icon: Footprints,
        textColor: 'text-rose-400',
        borderColor: 'bg-rose-400',
        title: 'Intervals',
    },
    walk: {
        icon: Footprints,
        textColor: 'text-emerald-400',
        borderColor: 'bg-emerald-400',
        title: 'Walk',
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
    day_off: {
        icon: Activity,
        textColor: 'text-zinc-500',
        borderColor: 'bg-zinc-500',
        title: 'Day Off',
    },
    custom: {
        icon: Activity,
        textColor: 'text-zinc-300',
        borderColor: 'bg-zinc-400',
        title: 'Custom',
    },
    other: {
        icon: Activity,
        textColor: 'text-zinc-300',
        borderColor: 'bg-zinc-400',
        title: 'Workout',
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
    isInteractive?: boolean;
    isDraggable?: boolean;
    isDragging?: boolean;
    intensity?: 'easy' | 'steady' | 'tempo' | 'threshold' | 'vo2';
    onClick?: () => void;
    onDragStart?: (event: ReactDragEvent<HTMLElement>) => void;
    onDragEnd?: (event: ReactDragEvent<HTMLElement>) => void;
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
    isInteractive = true,
    isDraggable = false,
    isDragging = false,
    intensity,
    onClick,
    onDragStart,
    onDragEnd,
}: SessionRowProps) {
    const config = sportConfig[session.sport] ?? sportConfig.rest;
    const SportIcon = config.icon;
    const isCompleted = isSessionCompleted(session);
    const isAdjusted = isSessionAdjusted(session);
    const isReadyToComplete = isSessionReadyToComplete(session);
    const displayDurationMinutes =
        isCompleted && session.actualDurationMinutes !== null
            ? session.actualDurationMinutes
            : session.durationMinutes;
    const displayTss = isCompleted
        ? (session.actualTss ?? undefined)
        : (session.plannedTss ?? undefined);
    const displayTitle = session.title?.trim() !== '' ? session.title : config.title;
    const isSkipped = session.status === 'skipped';
    const isPlanned = session.status === 'planned';
    const isLinked = session.linkedActivityId !== null;
    const isPlannedWithoutActivity = isPlanned && !isLinked;
    const isAutoCompleted =
        isCompleted && session.completionSource === 'provider_auto';
    const isManualCompleted =
        isCompleted &&
        (session.completionSource === 'manual' || session.completionSource === null);
    const durationParts = formatDurationParts(displayDurationMinutes);

    const interactiveStatusStyle: Record<string, string> = {
        planned:
            'bg-surface border-border hover:border-zinc-600 text-zinc-400 hover:text-zinc-300',
        completed:
            'bg-zinc-800 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-700/80 text-zinc-100 shadow-sm',
        skipped:
            'bg-red-950/5 border-red-900/10 hover:border-red-900/30 text-zinc-600 opacity-80',
        partial:
            'bg-amber-950/10 border-amber-900/20 hover:border-amber-900/40 text-zinc-300',
    };
    const readOnlyStatusStyle: Record<string, string> = {
        planned: 'bg-surface border-border text-zinc-400',
        completed: 'bg-zinc-800 border-zinc-700 text-zinc-100',
        skipped: 'bg-red-950/5 border-red-900/10 text-zinc-600 opacity-80',
        partial: 'bg-amber-950/10 border-amber-900/20 text-zinc-300',
    };

    let currentStatusStyle =
        (isInteractive ? interactiveStatusStyle : readOnlyStatusStyle)[
            session.status
        ] ?? readOnlyStatusStyle.planned;

    if (isOverlay) {
        currentStatusStyle =
            'bg-transparent border-dashed border-zinc-700/50 opacity-50 hover:opacity-80 hover:border-zinc-500 hover:bg-zinc-900/20';
    }

    const reconciliationStateStyle = cn(
        isReadyToComplete &&
            (isInteractive
                ? 'border-sky-500/35 hover:border-sky-400/55'
                : 'border-sky-500/35'),
        isAdjusted &&
            (isInteractive
                ? 'border-zinc-600/90 hover:border-zinc-500'
                : 'border-zinc-600/90'),
    );

    const activate = (): void => {
        if (isOverlay || !isInteractive) {
            return;
        }

        onClick?.();
    };

    const isClickableCard = isInteractive && !isOverlay;
    const Container = isClickableCard ? 'button' : 'div';
    const canDrag = isDraggable && !isOverlay;

    return (
        <Container
            {...(isClickableCard
                ? {
                      type: 'button' as const,
                      onClick: (event) => {
                          event.stopPropagation();
                          activate();
                      },
                  }
                : {})}
            draggable={canDrag}
            onDragStart={(event) => {
                if (!canDrag) {
                    return;
                }

                event.stopPropagation();
                onDragStart?.(event as ReactDragEvent<HTMLElement>);
            }}
            onDragEnd={(event) => {
                if (!canDrag) {
                    return;
                }

                event.stopPropagation();
                onDragEnd?.(event as ReactDragEvent<HTMLElement>);
            }}
            className={cn(
                'group relative flex w-full flex-col overflow-hidden rounded-md border py-2 pr-2 pl-3 text-left transition-all duration-200',
                currentStatusStyle,
                reconciliationStateStyle,
                compact ? 'min-h-[3.5rem] gap-0.5' : 'min-h-[4.5rem] gap-1',
                isOverlay && 'cursor-default',
                !isOverlay && !isInteractive && 'cursor-default',
                !isOverlay && isInteractive && 'cursor-pointer',
                !isOverlay && !isInteractive && 'opacity-90',
                !isOverlay &&
                    isInteractive &&
                    'focus-visible:ring-1 focus-visible:ring-zinc-500 focus-visible:outline-none focus-visible:ring-inset',
                canDrag && 'cursor-grab active:cursor-grabbing',
                isDragging && 'opacity-60',
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
                            isCompleted && 'text-zinc-100',
                            isPlanned && 'text-zinc-100',
                            !isPlanned &&
                                !isCompleted &&
                                'text-zinc-300',
                        )}
                    >
                        {displayTitle}
                    </span>
                </div>

                {!isOverlay && !compact ? (
                    <div className="flex shrink-0 items-center gap-1 pt-0.5">
                        {isCompleted && !isAdjusted ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : null}
                        {session.status === 'skipped' ? (
                            <XCircle className="h-3.5 w-3.5 text-red-500/50" />
                        ) : null}
                        {session.status === 'partial' ? (
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        ) : null}
                        {isAdjusted ? (
                            <span className="inline-flex items-center rounded-full border border-zinc-600/80 bg-zinc-800/70 px-1.5 py-0.5 text-[0.625rem] text-zinc-300">
                                Adjusted
                            </span>
                        ) : null}
                        {isAutoCompleted ? (
                            <span className="inline-flex items-center rounded-full border border-sky-500/45 bg-sky-500/10 px-1.5 py-0.5 text-[0.625rem] text-sky-200">
                                Auto-completed
                            </span>
                        ) : null}
                        {isManualCompleted && !isAdjusted ? (
                            <span className="inline-flex items-center rounded-full border border-emerald-500/50 bg-emerald-950/30 px-1.5 py-0.5 text-[0.625rem] text-emerald-300">
                                Completed
                            </span>
                        ) : null}
                        {isReadyToComplete ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/45 bg-sky-500/10 px-1.5 py-0.5 text-[0.625rem] text-sky-200">
                                <Link2 className="h-2.5 w-2.5" />
                                Ready
                            </span>
                        ) : null}
                        {isPlannedWithoutActivity ? (
                            <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-emerald-500/80">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/85" />
                            </span>
                        ) : null}
                        {isLinked && !isReadyToComplete && !isAdjusted ? (
                            <span
                                className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-sky-400/45 bg-sky-500/10 text-sky-300"
                                aria-label="Linked activity"
                                title="Linked activity"
                            >
                                <Link2 className="h-2.5 w-2.5" />
                            </span>
                        ) : null}
                    </div>
                ) : null}
            </div>

            <div className="mt-auto flex items-start gap-3">
                <div className="flex min-w-[2.125rem] flex-col leading-[1.1]">
                    <span
                        className={cn(
                            'font-mono text-sm font-medium',
                            isCompleted && 'text-white',
                            isPlanned && 'text-zinc-100',
                            !isPlanned &&
                                !isCompleted &&
                                'text-zinc-300',
                            isSkipped && 'text-zinc-600',
                        )}
                    >
                        {durationParts.primary}
                    </span>
                    <span
                        className={cn(
                            'font-mono text-xs',
                            isSkipped ? 'text-zinc-700' : 'text-zinc-500',
                        )}
                    >
                        {durationParts.secondary}
                    </span>
                </div>

                {displayTss !== undefined && displayTss > 0 ? (
                    <div className="flex min-w-[1.75rem] flex-col leading-[1.1]">
                        <span
                            className={cn(
                                'font-mono text-sm font-light',
                                isSkipped ? 'text-zinc-700' : 'text-zinc-500',
                            )}
                        >
                            {displayTss}
                        </span>
                        <span className="font-mono text-[0.625rem] tracking-wide text-zinc-600 uppercase">
                            TSS
                        </span>
                    </div>
                ) : null}
            </div>

            {!compact && !isOverlay && isReadyToComplete ? (
                <p className="text-[0.625rem] text-zinc-400">Ready to complete</p>
            ) : null}
            {!compact && !isOverlay && isAdjusted ? (
                <p className="text-[0.625rem] text-zinc-400">
                    Completed with adjusted values
                </p>
            ) : null}
            {!compact && !isOverlay && isAutoCompleted ? (
                <p className="text-[0.625rem] text-sky-300">
                    Auto-completed from linked activity
                </p>
            ) : null}

            {showDate ? (
                <p className="pl-0 text-[0.6875rem] text-zinc-500">
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
        </Container>
    );
}

function formatDurationParts(durationMinutes: number): {
    primary: string;
    secondary: string;
} {
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours > 0 && minutes > 0) {
        return {
            primary: `${hours}h`,
            secondary: `${minutes}m`,
        };
    }

    if (hours > 0) {
        return {
            primary: `${hours}h`,
            secondary: '\u00a0',
        };
    }

    return {
        primary: `${minutes}m`,
        secondary: '\u00a0',
    };
}
