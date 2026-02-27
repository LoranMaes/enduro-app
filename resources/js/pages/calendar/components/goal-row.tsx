import { Flag } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { GoalView } from '@/types/training-plans';

type GoalRowProps = {
    goal: GoalView;
    isInteractive?: boolean;
    onClick?: () => void;
};

const statusLabel: Record<string, string> = {
    active: 'Active',
    completed: 'Done',
    cancelled: 'Cancelled',
};

export function GoalRow({
    goal,
    isInteractive = false,
    onClick,
}: GoalRowProps) {
    const title = goal.title.trim() === '' ? 'Goal' : goal.title;
    const status = statusLabel[goal.status] ?? goal.status;

    const Container = isInteractive ? 'button' : 'div';

    return (
        <Container
            {...(isInteractive
                ? {
                      type: 'button' as const,
                      onClick: (event) => {
                          event.stopPropagation();
                          onClick?.();
                      },
                  }
                : {})}
            className={cn(
                'relative flex w-full flex-col overflow-hidden rounded-md border border-amber-900/50 bg-amber-950/15 px-3 py-2 text-left',
                isInteractive &&
                    'cursor-pointer transition-colors hover:border-amber-700/60 focus-visible:ring-1 focus-visible:ring-amber-500/60 focus-visible:outline-none',
            )}
        >
            <span className="absolute top-0 bottom-0 left-0 w-1 bg-amber-400/80" />
            <div className="flex items-center gap-2">
                <Flag className="h-3.5 w-3.5 shrink-0 text-amber-300" />
                <p className="truncate text-xs font-medium text-amber-200">
                    {title}
                </p>
                <span className="ml-auto text-[0.625rem] text-amber-300/80 uppercase">
                    Goal
                </span>
            </div>
            <p className="mt-1 truncate pl-[0.125rem] text-[0.625rem] text-amber-100/70">
                {status}
            </p>
        </Container>
    );
}
