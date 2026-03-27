import {
    Activity,
    Bike,
    Copy,
    Clock3,
    Droplets,
    Dumbbell,
    ExternalLink,
    Footprints,
    Link2,
    Link2Off,
    Trash2,
} from 'lucide-react';
import { type MouseEvent, useState } from 'react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
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
    canManageQuickActions?: boolean;
    isActionLoading?: boolean;
    showPossibleMatch?: boolean;
    onClick?: () => void;
    onCopyActivity?: () => void;
    onRequestDeleteActivity?: () => void;
    onOpenLinkFlow?: () => void;
    onUnlinkActivity?: () => void;
};

export function ActivityRow({
    activity,
    isInteractive = false,
    canManageQuickActions = false,
    isActionLoading = false,
    showPossibleMatch = false,
    onClick,
    onCopyActivity,
    onRequestDeleteActivity,
    onOpenLinkFlow,
    onUnlinkActivity,
}: ActivityRowProps) {
    const config = sportConfig[activity.sport] ?? sportConfig.other;
    const SportIcon = config.icon;
    const startedAtLabel = formatStartTime(activity.startedAt);
    const durationLabel = formatDuration(activity.durationSeconds);
    const distanceLabel = formatDistance(activity.distanceMeters);
    const isLinked = activity.linkedSessionId !== null;
    const [contextMenuOpen, setContextMenuOpen] = useState(false);
    const canOpenDetails = isInteractive && typeof onClick === 'function';
    const hasMenuActions = canOpenDetails || canManageQuickActions;

    const activate = (): void => {
        if (!isInteractive) {
            return;
        }

        onClick?.();
    };

    const Container = isInteractive ? 'button' : 'div';

    const openContextMenu = (): void => {
        if (!hasMenuActions) {
            return;
        }

        setContextMenuOpen(true);
    };

    const handleContextMenu = (event: MouseEvent<HTMLElement>): void => {
        if (!hasMenuActions) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        openContextMenu();
    };

    const content = (
        <Container
            {...(isInteractive
                ? {
                      type: 'button' as const,
                      onClick: (event) => {
                          event.stopPropagation();
                          activate();
                      },
                  }
                : {})}
            className={cn(
                'relative flex w-full flex-col overflow-hidden rounded-md border border-zinc-800/80 bg-zinc-900/60 px-3 py-2 text-left',
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
                        'inline-flex items-center rounded-full border px-1.5 py-0.5 text-[0.625rem]',
                        isLinked
                            ? 'border-zinc-600 text-zinc-300'
                            : 'border-zinc-700 text-zinc-500',
                    )}
                >
                    {isLinked ? 'Linked' : 'Unlinked'}
                </span>
            </div>

            {!isLinked && showPossibleMatch ? (
                <p className="mt-1 text-[0.625rem] text-amber-300/80">
                    Possible match
                </p>
            ) : null}

            <div className="mt-1 flex items-center gap-2 text-[0.625rem] text-zinc-500">
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
        </Container>
    );

    const wrapper = (
        <div
            onContextMenu={handleContextMenu}
            onKeyDown={(event) => {
                if (!hasMenuActions) {
                    return;
                }

                if (
                    event.key !== 'ContextMenu' &&
                    !(event.shiftKey && event.key === 'F10')
                ) {
                    return;
                }

                event.preventDefault();
                openContextMenu();
            }}
        >
            {content}
        </div>
    );

    if (!hasMenuActions) {
        return wrapper;
    }

    return (
        <ContextMenu
            open={contextMenuOpen}
            onOpenChange={setContextMenuOpen}
            modal={false}
        >
            <ContextMenuTrigger asChild>{wrapper}</ContextMenuTrigger>
            <ContextMenuContent
                align="start"
                sideOffset={6}
                className="w-52 border-border bg-surface p-1 text-zinc-200"
            >
                {canOpenDetails ? (
                    <ContextMenuItem
                        onSelect={() => {
                            onClick?.();
                        }}
                    >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open details
                    </ContextMenuItem>
                ) : null}

                {canManageQuickActions ? (
                    <>
                        {canOpenDetails ? <ContextMenuSeparator /> : null}
                        <ContextMenuItem
                            disabled={isActionLoading}
                            onSelect={() => {
                                onCopyActivity?.();
                            }}
                        >
                            <Copy className="h-3.5 w-3.5" />
                            Copy activity
                        </ContextMenuItem>
                        {!isLinked ? (
                            <ContextMenuItem
                                disabled={isActionLoading}
                                onSelect={() => {
                                    onOpenLinkFlow?.();
                                }}
                            >
                                <Link2 className="h-3.5 w-3.5" />
                                Link activity
                            </ContextMenuItem>
                        ) : (
                            <ContextMenuItem
                                disabled={isActionLoading}
                                onSelect={() => {
                                    onUnlinkActivity?.();
                                }}
                            >
                                <Link2Off className="h-3.5 w-3.5" />
                                Unlink activity
                            </ContextMenuItem>
                        )}
                        <ContextMenuSeparator />
                        <ContextMenuItem
                            variant="destructive"
                            disabled={isActionLoading}
                            onSelect={() => {
                                onRequestDeleteActivity?.();
                            }}
                        >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete activity
                        </ContextMenuItem>
                    </>
                ) : null}
            </ContextMenuContent>
        </ContextMenu>
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
