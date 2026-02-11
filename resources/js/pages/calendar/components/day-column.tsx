import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ActivityView, TrainingSessionView } from '@/types/training-plans';
import { ActivityRow } from './activity-row';
import { SessionRow } from './session-row';

type DayColumnProps = {
    dayNumber: string;
    dayDate: string;
    isToday: boolean;
    isPast: boolean;
    sessions: TrainingSessionView[];
    activities: ActivityView[];
    canManageSessions: boolean;
    canManageSessionLinks: boolean;
    canOpenActivityDetails: boolean;
    onCreateSession: (date: string) => void;
    onEditSession: (session: TrainingSessionView) => void;
    onOpenActivity: (activity: ActivityView) => void;
};

export function DayColumn({
    dayNumber,
    dayDate,
    isToday,
    isPast,
    sessions,
    activities,
    canManageSessions,
    canManageSessionLinks,
    canOpenActivityDetails,
    onCreateSession,
    onEditSession,
    onOpenActivity,
}: DayColumnProps) {
    const canOpenCreateModal = canManageSessions && sessions.length === 0;
    const canOpenEditModal = canManageSessions || canManageSessionLinks;
    const isReadOnly = !canManageSessions && !canManageSessionLinks;
    const hasEntries = sessions.length > 0 || activities.length > 0;

    const sortedActivities = activities.slice().sort((left, right) => {
        if (left.startedAt === right.startedAt) {
            return left.id - right.id;
        }

        return (left.startedAt ?? '').localeCompare(right.startedAt ?? '');
    });

    const openCreateSession = (): void => {
        if (!canOpenCreateModal) {
            return;
        }

        onCreateSession(dayDate);
    };

    const isCreateClickable = canOpenCreateModal;
    const canUseSemanticButton = isCreateClickable && !hasEntries;
    const DayContainer = canUseSemanticButton ? 'button' : 'div';

    return (
        <DayContainer
            {...(canUseSemanticButton
                ? {
                      type: 'button' as const,
                      onClick: openCreateSession,
                  }
                : isCreateClickable
                  ? {
                        onClick: openCreateSession,
                        onKeyDown: (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                openCreateSession();
                            }
                        },
                        role: 'button' as const,
                        tabIndex: 0,
                    }
                : {})}
            className={cn(
                'group/day relative flex h-full flex-col px-2 pt-1.5 pb-2 text-left transition-all duration-200',
                isToday
                    ? 'bg-zinc-900/40 ring-1 ring-white/5 ring-inset'
                    : 'bg-transparent',
                !isToday && isPast ? 'bg-zinc-950/30' : 'bg-transparent',
                canManageSessions &&
                    !isPast &&
                    !isToday &&
                    'hover:bg-zinc-900/30',
                canOpenCreateModal && 'cursor-pointer',
                canOpenCreateModal &&
                    'focus-visible:ring-1 focus-visible:ring-zinc-600 focus-visible:outline-none focus-visible:ring-inset',
                isReadOnly && 'cursor-default',
            )}
        >
            <div className="mb-2 flex items-start justify-between px-1">
                <span
                    className={cn(
                        'text-xs font-medium tabular-nums transition-colors',
                        isToday
                            ? 'flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow-sm'
                            : canManageSessions
                              ? 'text-zinc-500 group-hover/day:text-zinc-300'
                              : 'text-zinc-500',
                        isPast && !isToday && 'text-zinc-700',
                    )}
                >
                    {dayNumber.replace(/^\w+\s/, '')}
                </span>
                {canManageSessions ? (
                    isCreateClickable ? (
                        <span
                            className={cn(
                                'flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 opacity-0 transition-all group-hover/day:opacity-100',
                                isPast
                                    ? 'group-hover/day:bg-zinc-800/50'
                                    : 'group-hover/day:bg-zinc-800',
                            )}
                            aria-hidden="true"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </span>
                    ) : (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.preventDefault();
                                event.stopPropagation();
                                onCreateSession(dayDate);
                            }}
                            className={cn(
                                'flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 opacity-0 transition-all group-hover/day:opacity-100 hover:text-white',
                                isPast
                                    ? 'hover:bg-zinc-800/50'
                                    : 'hover:bg-zinc-800',
                                'focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-zinc-600 focus-visible:outline-none',
                            )}
                            aria-label="Add session"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    )
                ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
                {sessions.map((session) => (
                    <SessionRow
                        key={session.id}
                        session={session}
                        showDate={false}
                        isInteractive={canOpenEditModal}
                        onClick={() => {
                            if (canOpenEditModal) {
                                onEditSession(session);
                            }
                        }}
                    />
                ))}

                {sortedActivities.map((activity) => (
                    <ActivityRow
                        key={activity.id}
                        activity={activity}
                        isInteractive={canOpenActivityDetails}
                        onClick={() => {
                            if (canOpenActivityDetails) {
                                onOpenActivity(activity);
                            }
                        }}
                    />
                ))}

                {!hasEntries ? (
                    <div className="flex min-h-[2.5rem] w-full flex-1 items-start px-1 pt-0.5">
                        <p className="text-[0.625rem] text-zinc-700">
                            No training planned
                        </p>
                    </div>
                ) : null}
            </div>
        </DayContainer>
    );
}
