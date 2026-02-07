import { Layers } from 'lucide-react';
import { usePage } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import type { SharedData } from '@/types';
import type { TrainingPlanView } from '@/types/training-plans';
import { WeekSection } from './week-section';

type PlanSectionProps = {
    plan: TrainingPlanView;
    additionalPlanCount: number;
};

const dayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function PlanSection({ plan, additionalPlanCount }: PlanSectionProps) {
    void additionalPlanCount;

    const { auth } = usePage<SharedData>().props;
    const avatarInitials = auth.user.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');

    return (
        <section className="relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-background [--calendar-days-height:2.75rem] [--calendar-header-height:4rem] [--calendar-week-sticky:6.75rem]">
            <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6">
                <div>
                    <h1 className="text-sm font-semibold text-white">
                        Training Calendar
                    </h1>
                    <p className="text-xs text-zinc-500">
                        Season 2024 • Build Phase 1
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
                        <span className="text-zinc-400">
                            Garmin Sync Active
                        </span>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-medium text-zinc-200">
                        {avatarInitials || 'U'}
                    </div>
                </div>
            </header>

            <div className="sticky top-16 z-30 grid h-11 grid-cols-[repeat(7,1fr)_140px] items-center border-b border-border bg-background/95 backdrop-blur-md">
                {dayHeaders.map((day) => (
                    <div
                        key={day}
                        className="flex h-11 items-center justify-center border-r border-border/30 px-2 text-center text-[10px] font-medium tracking-wider text-zinc-500 uppercase"
                    >
                        {day}
                    </div>
                ))}
                <div className="flex h-11 items-center justify-center border-l border-border px-3 py-1">
                    <div
                        className={cn(
                            'group flex max-w-full min-w-0 items-center gap-2 rounded-lg border px-2 py-1.5',
                            'border-border bg-surface/50',
                        )}
                    >
                        <button
                            type="button"
                            className="flex shrink-0 items-center gap-2 rounded-md px-2 py-1 text-zinc-400"
                            aria-label="Overlay plan (coming later)"
                            onClick={() => {}}
                        >
                            <Layers className="h-3.5 w-3.5" />
                            <span className="text-xs font-medium whitespace-nowrap">
                                Overlay Plan
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1">
                {plan.weeks.map((week) => (
                    <WeekSection key={week.id} week={week} />
                ))}
            </div>

            <div className="h-16" />
        </section>
    );
}
