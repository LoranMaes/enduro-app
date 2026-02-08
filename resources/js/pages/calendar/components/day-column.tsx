import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TrainingSessionView } from '@/types/training-plans';
import { SessionRow } from './session-row';

type DayColumnProps = {
    dayNumber: string;
    isToday: boolean;
    isPast: boolean;
    sessions: TrainingSessionView[];
};

export function DayColumn({
    dayNumber,
    isToday,
    isPast,
    sessions,
}: DayColumnProps) {
    return (
        <div
            className={cn(
                'group/day relative flex h-full flex-col px-2 pt-1.5 pb-2 transition-all duration-200',
                isToday
                    ? 'bg-zinc-900/40 ring-1 ring-white/5 ring-inset'
                    : 'bg-transparent',
                !isToday && isPast ? 'bg-zinc-950/30' : 'hover:bg-zinc-900/30',
            )}
        >
            <div className="mb-2 flex items-start justify-between px-1">
                <span
                    className={cn(
                        'text-xs font-medium tabular-nums transition-colors',
                        isToday
                            ? 'flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow-sm'
                            : 'text-zinc-500 group-hover/day:text-zinc-300',
                        isPast && !isToday && 'text-zinc-700',
                    )}
                >
                    {dayNumber.replace(/^\w+\s/, '')}
                </span>
                <button
                    type="button"
                    onClick={(event) => event.preventDefault()}
                    className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 opacity-0 transition-all group-hover/day:opacity-100 hover:text-white',
                        isPast ? 'hover:bg-zinc-800/50' : 'hover:bg-zinc-800',
                    )}
                    aria-label="Add session (coming later)"
                >
                    <Plus className="h-3.5 w-3.5" />
                </button>
            </div>

            <div className="flex flex-1 flex-col gap-1.5">
                {sessions.map((session) => (
                    <SessionRow
                        key={session.id}
                        session={session}
                        showDate={false}
                    />
                ))}

                {sessions.length === 0 ? (
                    <div className="min-h-[40px] w-full flex-1" />
                ) : null}
            </div>
        </div>
    );
}
