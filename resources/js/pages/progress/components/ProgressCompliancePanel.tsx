import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { ProgressCompliancePayload, ProgressComplianceWeek } from '../types';
import { formatShortDate } from '../utils';

type ProgressCompliancePanelProps = {
    compliance: ProgressCompliancePayload;
};

type RecommendationState = 'insufficient' | 'too_low' | 'in_range' | 'too_high';

const recommendationStateLabel: Record<RecommendationState, string> = {
    insufficient: 'No baseline',
    too_low: 'Too low',
    in_range: 'In range',
    too_high: 'Too high',
};

export function ProgressCompliancePanel({ compliance }: ProgressCompliancePanelProps) {
    const weeks = useMemo(() => {
        return [...compliance.weeks].reverse();
    }, [compliance.weeks]);

    const scaleMax = useMemo(() => {
        const values = weeks.flatMap((week) => {
            const recommendationMax = week.recommendation_band?.max_minutes ?? 0;

            return [week.actual_minutes_total, recommendationMax];
        });

        return Math.max(1, ...values);
    }, [weeks]);

    const compliancePercentage = Math.round(compliance.summary.compliance_ratio * 100);

    return (
        <section className="mt-10">
            <h2 className="text-2xl font-medium text-zinc-200">Compliance</h2>
            <p className="mt-1 text-xs text-zinc-500">
                Completed planned sessions only. Recommended range is placeholder minutes-based scaffolding.
            </p>

            <div className="mt-4 grid gap-3 lg:grid-cols-[14rem_1fr]">
                <div className="rounded-lg border border-border bg-surface px-4 py-3">
                    <p className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">Range Compliance</p>
                    <p className="mt-2 font-mono text-3xl text-zinc-100">{compliancePercentage}%</p>
                    <p className="mt-1 text-xs text-zinc-400">
                        {compliance.summary.total_planned_completed_count}/
                        {compliance.summary.total_planned_sessions_count} planned
                    </p>
                </div>

                <div className="rounded-lg border border-border bg-surface p-2">
                    <div className="grid grid-cols-[1.8fr_0.8fr_0.9fr_1.4fr_0.8fr] items-center px-2 py-1 text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                        <span>Week</span>
                        <span className="text-right">Compliance</span>
                        <span className="text-right">Actual</span>
                        <span className="text-right">Recommended range (placeholder)</span>
                        <span className="text-right">State</span>
                    </div>

                    <div className="max-h-72 divide-y divide-border overflow-y-auto">
                        {weeks.map((week) => {
                            const state = resolveRecommendationState(week);

                            return (
                                <ProgressComplianceRow
                                    key={week.week_starts_at}
                                    week={week}
                                    state={state}
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
    state,
    scaleMax,
}: {
    week: ProgressComplianceWeek;
    state: RecommendationState;
    scaleMax: number;
}) {
    const plannedCompleted = `${week.planned_completed_count}/${week.planned_sessions_count}`;
    const recommendation = week.recommendation_band;

    return (
        <div className="grid grid-cols-[1.8fr_0.8fr_0.9fr_1.4fr_0.8fr] items-center gap-2 px-2 py-2.5 text-xs">
            <div className="min-w-0">
                <p className="truncate text-zinc-300">
                    {formatShortDate(week.week_starts_at)} — {formatShortDate(week.week_ends_at)}
                </p>
                <p className="mt-0.5 text-[0.6875rem] text-zinc-500">{plannedCompleted} planned completed</p>
            </div>

            <p className="text-right font-mono text-zinc-200">{Math.round(week.compliance_ratio * 100)}%</p>

            <p className="text-right font-mono text-zinc-300">{week.actual_minutes_total}m</p>

            <div className="space-y-1">
                {recommendation !== null ? (
                    <>
                        <div className="relative h-2 rounded-full bg-zinc-800">
                            <span
                                className="absolute top-0 h-2 rounded-full bg-zinc-600/70"
                                style={{
                                    left: `${(recommendation.min_minutes / scaleMax) * 100}%`,
                                    width: `${Math.max(3, ((recommendation.max_minutes - recommendation.min_minutes) / scaleMax) * 100)}%`,
                                }}
                            />
                            <span
                                className="absolute top-1/2 h-2 w-2 -translate-y-1/2 rounded-full border border-zinc-900 bg-zinc-100"
                                style={{
                                    left: `calc(${Math.min(100, (week.actual_minutes_total / scaleMax) * 100)}% - 0.25rem)`,
                                }}
                            />
                        </div>
                        <p className="text-right font-mono text-[0.6875rem] text-zinc-500">
                            {recommendation.min_minutes}m - {recommendation.max_minutes}m
                        </p>
                    </>
                ) : (
                    <p className="text-right text-[0.6875rem] text-zinc-600">Insufficient history</p>
                )}
            </div>

            <p
                className={cn(
                    'text-right text-[0.6875rem]',
                    state === 'in_range' && 'text-emerald-300',
                    state === 'too_low' && 'text-zinc-400',
                    state === 'too_high' && 'text-amber-300',
                    state === 'insufficient' && 'text-zinc-600',
                )}
            >
                {recommendationStateLabel[state]}
            </p>
        </div>
    );
}

function resolveRecommendationState(week: ProgressComplianceWeek): RecommendationState {
    const recommendation = week.recommendation_band;

    if (recommendation === null) {
        return 'insufficient';
    }

    if (week.actual_minutes_total < recommendation.min_minutes) {
        return 'too_low';
    }

    if (week.actual_minutes_total > recommendation.max_minutes) {
        return 'too_high';
    }

    return 'in_range';
}
