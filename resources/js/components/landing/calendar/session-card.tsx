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
import type { LucideIcon } from 'lucide-react';
import React from 'react';

import { cn } from '@/lib/utils';

import type { Session, SessionStatus, SportType } from '../types';
import { DataValue } from '../ui/typography';

type SessionCardProps = {
    sport?: SportType;
    title?: string;
    duration?: string | number;
    tss?: number;
    status?: SessionStatus;
    intensity?: 'easy' | 'steady' | 'tempo' | 'threshold' | 'vo2';
    compact?: boolean;
    isOverlay?: boolean;
    onClick?: () => void;
    session?: Session;
};

function formatDuration(minutes: number): string {
    if (minutes <= 0) {
        return '0m';
    }

    const hours = Math.floor(minutes / 60);
    const remainderMinutes = minutes % 60;

    if (hours > 0 && remainderMinutes > 0) {
        return `${hours}h ${remainderMinutes}m`;
    }

    if (hours > 0) {
        return `${hours}h`;
    }

    return `${remainderMinutes}m`;
}

const SPORT_CONFIG: Record<
    SportType,
    { icon: LucideIcon; color: string; border: string }
> = {
    swim: { icon: Droplets, color: 'text-sky-400', border: 'bg-sky-400' },
    bike: { icon: Bike, color: 'text-violet-400', border: 'bg-violet-400' },
    run: { icon: Footprints, color: 'text-rose-400', border: 'bg-rose-400' },
    gym: { icon: Dumbbell, color: 'text-amber-400', border: 'bg-amber-400' },
    rest: { icon: Activity, color: 'text-zinc-500', border: 'bg-zinc-500' },
};

const INTENSITY_CONFIG: Record<
    NonNullable<SessionCardProps['intensity']>,
    string
> = {
    easy: 'bg-emerald-500',
    steady: 'bg-sky-500',
    tempo: 'bg-amber-500',
    threshold: 'bg-orange-500',
    vo2: 'bg-red-500',
};

export function SessionCard({
    sport,
    title,
    duration,
    tss,
    status,
    intensity,
    compact = false,
    isOverlay = false,
    onClick,
    session,
}: SessionCardProps) {
    const displaySport = session?.sport ?? sport ?? 'run';
    const displayTitle = session?.title ?? title ?? '';
    const displayDuration = session?.durationMinutes ?? duration;
    const displayTss = session?.tss ?? tss;
    const displayStatus = session?.status ?? status ?? 'planned';

    const SportIcon = SPORT_CONFIG[displaySport].icon;
    const sportColors = SPORT_CONFIG[displaySport];

    const statusStyles: Record<SessionStatus, string> = {
        planned:
            'border-border bg-surface text-zinc-400 hover:border-zinc-600 hover:text-zinc-300',
        completed:
            'border-zinc-700 bg-zinc-800 text-zinc-100 shadow-sm hover:border-zinc-600 hover:bg-zinc-700/80',
        skipped:
            'border-red-900/10 bg-red-950/5 text-zinc-600 opacity-80 hover:border-red-900/30',
        partial:
            'border-amber-900/20 bg-amber-950/10 text-zinc-300 hover:border-amber-900/40',
    };

    const currentStatusStyle = isOverlay
        ? 'border-zinc-700/50 bg-transparent border-dashed opacity-50 hover:border-zinc-500 hover:bg-zinc-900/20 hover:opacity-80'
        : statusStyles[displayStatus];

    const formattedDuration =
        typeof displayDuration === 'number'
            ? formatDuration(displayDuration)
            : (displayDuration ?? '');

    const isSkipped = displayStatus === 'skipped';

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
                          : sportColors.border,
                )}
            />

            <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                    <SportIcon
                        className={cn(
                            'h-3.5 w-3.5 flex-shrink-0',
                            isOverlay || isSkipped
                                ? 'text-zinc-500'
                                : sportColors.color,
                        )}
                    />

                    <span
                        className={cn(
                            'truncate font-sans text-sm font-medium tracking-tight',
                            compact ? 'text-xs' : 'text-sm',
                            isSkipped &&
                                'text-zinc-600 line-through decoration-zinc-700',
                            displayStatus === 'completed'
                                ? 'text-zinc-100'
                                : 'text-zinc-400',
                        )}
                    >
                        {displayTitle}
                    </span>
                </div>

                {!isOverlay && !compact && (
                    <div className="flex-shrink-0 pt-0.5">
                        {displayStatus === 'completed' && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        )}
                        {displayStatus === 'skipped' && (
                            <XCircle className="h-3.5 w-3.5 text-red-500/50" />
                        )}
                        {displayStatus === 'partial' && (
                            <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        )}
                    </div>
                )}
            </div>

            <div className="mt-auto flex items-baseline gap-3">
                <DataValue
                    size={compact ? 'sm' : 'md'}
                    className={cn(
                        isSkipped
                            ? 'text-zinc-600'
                            : displayStatus === 'completed'
                              ? 'text-white'
                              : 'text-zinc-400',
                    )}
                >
                    {formattedDuration}
                </DataValue>

                {displayTss !== undefined && displayTss > 0 && (
                    <DataValue
                        size={compact ? 'sm' : 'md'}
                        className={cn(
                            isSkipped ? 'text-zinc-700' : 'text-zinc-500',
                        )}
                    >
                        {displayTss} TSS
                    </DataValue>
                )}
            </div>

            {!compact && !isOverlay && !isSkipped && intensity && (
                <div
                    className={cn(
                        'absolute right-2 bottom-2 h-1.5 w-1.5 rounded-full opacity-60',
                        INTENSITY_CONFIG[intensity],
                    )}
                    title={`Intensity: ${intensity}`}
                />
            )}
        </div>
    );
}
