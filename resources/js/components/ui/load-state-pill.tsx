import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type LoadStatePillState = 'low' | 'in_range' | 'high' | 'insufficient';

type LoadStatePillProps = {
    state: LoadStatePillState;
    label?: string;
    className?: string;
};

const stateClasses: Record<LoadStatePillState, string> = {
    low: 'border-amber-500/50 bg-amber-500/10 text-amber-300',
    in_range: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-300',
    high: 'border-rose-500/50 bg-rose-500/10 text-rose-300',
    insufficient: 'border-zinc-700 bg-zinc-900/50 text-zinc-400',
};

const stateLabels: Record<LoadStatePillState, string> = {
    low: 'Low',
    in_range: 'In Range',
    high: 'High',
    insufficient: 'Insufficient',
};

export function LoadStatePill({ state, label, className }: LoadStatePillProps) {
    return (
        <Badge
            variant="outline"
            className={cn(
                'rounded-full px-2 py-0.5 text-[0.625rem] font-medium',
                stateClasses[state],
                className,
            )}
        >
            {label ?? stateLabels[state]}
        </Badge>
    );
}
