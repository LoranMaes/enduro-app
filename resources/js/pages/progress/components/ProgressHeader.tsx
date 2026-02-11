import type { ProgressRange, ProgressSummary } from '../types';
import { formatDuration } from '../utils';
import { ProgressRangeControls } from './ProgressRangeControls';

type ProgressHeaderProps = {
    range: ProgressRange;
    summary: ProgressSummary;
    isSwitchingRange: boolean;
    onSwitchRange: (weeks: number) => void;
};

export function ProgressHeader({
    range,
    summary,
    isSwitchingRange,
    onSwitchRange,
}: ProgressHeaderProps) {
    return (
        <header className="flex shrink-0 items-end justify-between gap-6 border-b border-border px-6 pt-5 pb-6">
            <div>
                <p className="text-[11px] tracking-wider text-zinc-500 uppercase">
                    Long Term Analysis
                </p>
                <h1 className="mt-1 text-4xl font-medium text-zinc-100">
                    Training Progress
                </h1>
            </div>

            <div className="flex flex-col items-end gap-4 md:flex-row md:items-end md:gap-6">
                <div className="flex items-end gap-6 border-r border-border pr-6">
                    <MetricLabel
                        label="Avg Load"
                        value={
                            summary.average_weekly_tss !== null
                                ? `${summary.average_weekly_tss}`
                                : '—'
                        }
                        unit="TSS/wk"
                    />
                    <MetricLabel
                        label="Avg Vol"
                        value={formatDuration(summary.average_weekly_duration_minutes)}
                        unit="/wk"
                    />
                </div>

                <ProgressRangeControls
                    options={range.options}
                    selectedWeeks={range.weeks}
                    isSwitchingRange={isSwitchingRange}
                    onSwitchRange={onSwitchRange}
                />
            </div>
        </header>
    );
}

function MetricLabel({
    label,
    value,
    unit,
}: {
    label: string;
    value: string;
    unit: string;
}) {
    return (
        <div>
            <p className="text-[11px] tracking-wider text-zinc-500 uppercase">
                {label}
            </p>
            <p className="mt-1 flex items-end gap-1 font-mono text-4xl text-zinc-100">
                <span>{value}</span>
                <span className="mb-1 text-xs text-zinc-500">{unit}</span>
            </p>
        </div>
    );
}
