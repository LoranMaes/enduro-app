import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrainingSessionView } from '@/types/training-plans';
import { SessionRow } from './session-row';

type DayColumnProps = {
    dayNumber: string;
    dayDate: string;
    trainingWeekId: number;
    isToday: boolean;
    isPast: boolean;
    sessions: TrainingSessionView[];
    canManageSessions: boolean;
    onCreateSession: (trainingWeekId: number, date: string) => void;
    onEditSession: (
        trainingWeekId: number,
        session: TrainingSessionView,
    ) => void;
};

export function DayColumn({
    dayNumber,
    dayDate,
    trainingWeekId,
    isToday,
    isPast,
    sessions,
    canManageSessions,
    onCreateSession,
    onEditSession,
}: DayColumnProps) {
    const canOpenCreateModal = canManageSessions && sessions.length === 0;
    const isReadOnly = !canManageSessions;

    const openCreateSession = (): void => {
        if (!canOpenCreateModal) {
            return;
        }

        onCreateSession(trainingWeekId, dayDate);
    };

    return (
        <div
            onClick={openCreateSession}
            onKeyDown={(event) => {
                if (!canOpenCreateModal) {
                    return;
                }

                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openCreateSession();
                }
            }}
            role={canOpenCreateModal ? 'button' : undefined}
            tabIndex={canOpenCreateModal ? 0 : undefined}
            className={cn(
                'group/day relative flex h-full flex-col px-2 pt-1.5 pb-2 transition-all duration-200',
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
                    <button
                        type="button"
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onCreateSession(trainingWeekId, dayDate);
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
                ) : null}
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
                {sessions.map((session) => (
                    <SessionRow
                        key={session.id}
                        session={session}
                        showDate={false}
                        isInteractive={canManageSessions}
                        onClick={() => {
                            if (canManageSessions) {
                                onEditSession(trainingWeekId, session);
                            }
                        }}
                    />
                ))}

                {sessions.length === 0 ? (
                    <div className="flex min-h-[40px] w-full flex-1 items-start px-1 pt-0.5">
                        <p className="text-[10px] text-zinc-700">
                            No training planned
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
