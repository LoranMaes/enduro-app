import { useMemo } from 'react';
import { LoadStatePill, type LoadStatePillState } from '@/components/ui/load-state-pill';
import type { ProgressCompliancePayload, ProgressComplianceWeek } from '../types';
import { formatShortDate } from '../utils';

type ProgressCompliancePanelProps = {
    compliance: ProgressCompliancePayload;
};

const complianceGridColumns =
    'grid-cols-[1.7fr_0.8fr_0.95fr_0.8fr_1.2fr_0.9fr]';

export function ProgressCompliancePanel({
    compliance,
}: ProgressCompliancePanelProps) {
    const weeks = useMemo(() => {
        return [...compliance.weeks].reverse();
    }, [compliance.weeks]);

    const scaleMax = useMemo(() => {
        const values = weeks.flatMap((week) => {
            const tssBand = resolveRecommendedTssBand(week);

            return [week.completed_tss_total, tssBand?.max_tss ?? 0];
        });

        return Math.max(1, ...values);
    }, [weeks]);

    const compliancePercentage = Math.round(compliance.summary.compliance_ratio * 100);

    return (
        <section className="mt-10">
            <h2 className="text-2xl font-medium text-zinc-200">Compliance</h2>
            <p className="mt-1 text-xs text-zinc-500">
                Completed planned sessions only. Recommended TSS range uses planned TSS ±15%.
            </p>

            <div className="mt-4 grid gap-3 lg:grid-cols-[14rem_1fr]">
                <div className="rounded-lg border border-border bg-surface px-4 py-3">
                    <p className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                        Range Compliance
                    </p>
                    <p className="mt-2 font-mono text-3xl text-zinc-100">
                        {compliancePercentage}%
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                        {compliance.summary.total_planned_completed_count}/
                        {compliance.summary.total_planned_sessions_count} planned
                    </p>
                </div>

                <div className="rounded-lg border border-border bg-surface p-2">
                    <div
                        className={`grid ${complianceGridColumns} items-center px-2 py-1 text-[0.625rem] tracking-wide text-zinc-500 uppercase`}
                    >
                        <span>Week</span>
                        <span className="text-right">Compliance</span>
                        <span className="text-right">TSS (C/P)</span>
                        <span className="text-right">Actual TSS</span>
                        <span className="text-right">Recommended TSS</span>
                        <span className="text-right">State</span>
                    </div>

                    <div className="max-h-72 divide-y divide-border overflow-y-auto">
                        {weeks.map((week) => {
                            return (
                                <ProgressComplianceRow
                                    key={week.week_starts_at}
                                    week={week}
                                    scaleMax={scaleMax}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}

function ProgressComplianceRow({
    week,
    scaleMax,
}: {
    week: ProgressComplianceWeek;
    scaleMax: number;
}) {
    const plannedCompleted = `${week.planned_completed_count}/${week.planned_sessions_count}`;
    const tssBand = resolveRecommendedTssBand(week);
    const state = resolveWeekState(week);

    return (
        <div
            className={`grid ${complianceGridColumns} items-center gap-2 px-2 py-2.5 text-xs`}
        >
            <div className="min-w-0">
                <p className="truncate text-zinc-300">
                    {formatShortDate(week.week_starts_at)} —{' '}
                    {formatShortDate(week.week_ends_at)}
                </p>
                <p className="mt-0.5 text-[0.6875rem] text-zinc-500">
                    {plannedCompleted} planned completed
                </p>
            </div>

            <p className="text-right font-mono text-zinc-200">
                {Math.round(week.compliance_ratio * 100)}%
            </p>

            <p className="text-right font-mono text-zinc-300">
                {week.completed_tss_total}/{week.planned_tss_total}
            </p>

            <p className="text-right font-mono text-zinc-300">
                {week.completed_tss_total}
            </p>

            <div className="space-y-1">
                {tssBand !== null ? (
                    <>
                        <div className="relative h-2 rounded-full bg-zinc-800">
                            <span
                                className="absolute top-0 h-2 rounded-full bg-zinc-600/70"
                                style={{
                                    left: `${(tssBand.min_tss / scaleMax) * 100}%`,
                                    width: `${Math.max(3, ((tssBand.max_tss - tssBand.min_tss) / scaleMax) * 100)}%`,
                                }}
                            />
                            <span
                                className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-zinc-900 bg-zinc-100"
                                style={{
                                    left: `calc(${Math.min(100, (week.completed_tss_total / scaleMax) * 100)}% - 0.25rem)`,
                                }}
                            />
                        </div>
                        <p className="text-right font-mono text-[0.6875rem] text-zinc-500">
                            {tssBand.min_tss} - {tssBand.max_tss}
                        </p>
                    </>
                ) : (
                    <p className="text-right text-[0.6875rem] text-zinc-600">—</p>
                )}
            </div>

            <div className="flex justify-end">
                <LoadStatePill state={state} />
            </div>
        </div>
    );
}

function resolveRecommendedTssBand(week: ProgressComplianceWeek): {
    min_tss: number;
    max_tss: number;
} | null {
    if (week.planned_tss_total <= 0) {
        return null;
    }

    const minTss = Math.max(0, Math.round(week.planned_tss_total * 0.85));
    const maxTss = Math.max(minTss, Math.round(week.planned_tss_total * 1.15));

    return {
        min_tss: minTss,
        max_tss: maxTss,
    };
}

function resolveWeekState(week: ProgressComplianceWeek): LoadStatePillState {
    if (
        week.load_state === 'in_range'
        || week.load_state === 'high'
        || week.load_state === 'low'
        || week.load_state === 'insufficient'
    ) {
        return week.load_state;
    }

    if (week.planned_tss_total <= 0) {
        return 'insufficient';
    }

    const ratio = week.completed_tss_total / week.planned_tss_total;

    if (ratio < 0.85) {
        return 'low';
    }

    if (ratio > 1.15) {
        return 'high';
    }

    return 'in_range';
}
