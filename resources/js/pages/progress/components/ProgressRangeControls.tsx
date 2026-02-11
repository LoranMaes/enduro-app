import { cn } from '@/lib/utils';

type ProgressRangeControlsProps = {
    options: number[];
    selectedWeeks: number;
    isSwitchingRange: boolean;
    onSwitchRange: (weeks: number) => void;
};

export function ProgressRangeControls({
    options,
    selectedWeeks,
    isSwitchingRange,
    onSwitchRange,
}: ProgressRangeControlsProps) {
    return (
        <div className="flex items-center rounded-xl border border-border bg-surface/50 p-1">
            {options.map((option) => (
                <button
                    key={option}
                    type="button"
                    onClick={() => onSwitchRange(option)}
                    disabled={isSwitchingRange}
                    className={cn(
                        'min-w-12 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                        option === selectedWeeks
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300',
                        isSwitchingRange && 'cursor-default opacity-70',
                    )}
                >
                    {option}w
                </button>
            ))}
        </div>
    );
}
