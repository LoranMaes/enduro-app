import { Head, router } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

type ProgressWeek = {
    week_start: string;
    week_end: string;
    planned_duration_minutes: number | null;
    actual_duration_minutes: number | null;
    planned_tss: number | null;
    actual_tss: number | null;
    planned_sessions: number;
    completed_sessions: number;
};

type ProgressPageProps = {
    range: {
        weeks: number;
        options: number[];
    };
    summary: {
        average_weekly_tss: number | null;
        average_weekly_duration_minutes: number | null;
        planned_tss_total: number;
        actual_tss_total: number;
        planned_duration_minutes_total: number;
        actual_duration_minutes_total: number;
        planned_sessions_total: number;
        completed_sessions_total: number;
        consistency_weeks: number;
        current_streak_weeks: number;
    };
    weeks: ProgressWeek[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Training Progress',
        href: '/progress',
    },
];

export default function ProgressIndex({ range, summary, weeks }: ProgressPageProps) {
    const [isSwitchingRange, setIsSwitchingRange] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const hasVisibleLoadData = weeks.some((week) => {
        return week.actual_tss !== null || week.planned_tss !== null;
    });

    const trend = useMemo(() => {
        const chartWidth = 1000;
        const chartHeight = 320;
        const chartPaddingX = 24;
        const chartPaddingY = 24;
        const innerWidth = chartWidth - chartPaddingX * 2;
        const innerHeight = chartHeight - chartPaddingY * 2;
        const maxTss = Math.max(
            100,
            ...weeks.flatMap((week) => [
                week.planned_tss ?? 0,
                week.actual_tss ?? 0,
            ]),
        );
        const yMax = Math.ceil(maxTss * 1.2);
        const stepX = weeks.length > 1 ? innerWidth / (weeks.length - 1) : 0;

        const points = weeks.map((week, index) => {
            const x = chartPaddingX + stepX * index;
            const plannedTss = week.planned_tss;
            const actualTss = week.actual_tss;
            const plannedY =
                plannedTss === null
                    ? null
                    : chartPaddingY + innerHeight - (plannedTss / yMax) * innerHeight;
            const actualY =
                actualTss === null
                    ? null
                    : chartPaddingY + innerHeight - (actualTss / yMax) * innerHeight;

            return {
                x,
                plannedTss,
                actualTss,
                plannedY,
                actualY,
                label: `${formatShortDate(week.week_start)} — ${formatShortDate(week.week_end)}`,
            };
        });

        const actualSegments = buildLineSegments(
            points.map((point) => ({
                x: point.x,
                y: point.actualY,
            })),
        );
        const plannedSegments = buildLineSegments(
            points.map((point) => ({
                x: point.x,
                y: point.plannedY,
            })),
        );

        const targetBands = points
            .slice(0, -1)
            .map((point, index) => {
                const nextPoint = points[index + 1];

                if (
                    point.plannedTss === null ||
                    nextPoint.plannedTss === null ||
                    point.plannedY === null ||
                    nextPoint.plannedY === null
                ) {
                    return null;
                }

                const pointHighY =
                    chartPaddingY +
                    innerHeight -
                    (point.plannedTss * 1.15 * innerHeight) / yMax;
                const pointLowY =
                    chartPaddingY +
                    innerHeight -
                    (point.plannedTss * 0.85 * innerHeight) / yMax;
                const nextPointHighY =
                    chartPaddingY +
                    innerHeight -
                    (nextPoint.plannedTss * 1.15 * innerHeight) / yMax;
                const nextPointLowY =
                    chartPaddingY +
                    innerHeight -
                    (nextPoint.plannedTss * 0.85 * innerHeight) / yMax;

                return `${point.x},${pointHighY} ${nextPoint.x},${nextPointHighY} ${nextPoint.x},${nextPointLowY} ${point.x},${pointLowY}`;
            })
            .filter((segment): segment is string => segment !== null);

        return {
            yMax,
            points,
            actualSegments,
            plannedSegments,
            targetBands,
            chartWidth,
            chartHeight,
            chartPaddingX,
            chartPaddingY,
            innerHeight,
            stepX,
            gridLines: 4,
        };
    }, [weeks]);

    const activePointIndex =
        hoveredIndex === null ? Math.max(0, weeks.length - 1) : hoveredIndex;
    const activePoint = trend.points[activePointIndex];

    const switchRange = (weeksRange: number): void => {
        if (weeksRange === range.weeks || isSwitchingRange) {
            return;
        }

        setIsSwitchingRange(true);

        router.get(
            '/progress',
            {
                weeks: weeksRange,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => {
                    setIsSwitchingRange(false);
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Training Progress" />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
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
                                value={formatDuration(
                                    summary.average_weekly_duration_minutes,
                                )}
                                unit="/wk"
                            />
                        </div>

                        <div className="flex items-center rounded-xl border border-border bg-surface/50 p-1">
                            {range.options.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => switchRange(option)}
                                    disabled={isSwitchingRange}
                                    className={cn(
                                        'min-w-12 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                                        option === range.weeks
                                            ? 'bg-zinc-800 text-zinc-100'
                                            : 'text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300',
                                        isSwitchingRange && 'cursor-default opacity-70',
                                    )}
                                >
                                    {option}w
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                    <section className="rounded-2xl border border-border bg-surface p-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <h2 className="text-[30px] font-medium text-zinc-200">
                                Load Trend
                            </h2>
                            <div className="flex items-center gap-5 text-[11px] text-zinc-500 uppercase">
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-0.5 w-4 bg-emerald-500" />
                                    Actual
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-2 w-4 border border-sky-500/35 bg-sky-500/15" />
                                    Target Range
                                </span>
                            </div>
                        </div>

                        <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                            <p>
                                Planned vs completed:
                                <span className="ml-1 font-mono text-zinc-300">
                                    {summary.planned_tss_total > 0
                                        ? `${summary.actual_tss_total} / ${summary.planned_tss_total} TSS`
                                        : '—'}
                                </span>
                            </p>
                            <p>
                                Sessions:
                                <span className="ml-1 font-mono text-zinc-300">
                                    {summary.planned_sessions_total > 0
                                        ? `${summary.completed_sessions_total} / ${summary.planned_sessions_total}`
                                        : '—'}
                                </span>
                            </p>
                        </div>

                        <div className="relative mt-5 h-[340px] overflow-hidden rounded-xl border border-border/70 bg-background/60">
                            {activePoint !== undefined ? (
                                <div className="pointer-events-none absolute top-3 right-3 z-10 rounded-md border border-zinc-800 bg-zinc-950/85 px-2.5 py-1.5 text-[11px]">
                                    <p className="text-zinc-400">
                                        {activePoint.label}
                                    </p>
                                    <div className="mt-1 flex items-center gap-3">
                                        <span className="inline-flex items-center gap-1 text-zinc-300">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                            <span>Actual</span>
                                            <span className="font-mono">
                                                {activePoint.actualTss ?? '—'}
                                            </span>
                                        </span>
                                        <span className="inline-flex items-center gap-1 text-sky-300">
                                            <span className="h-2 w-2 rounded-full bg-sky-500/60" />
                                            <span>Planned</span>
                                            <span className="font-mono">
                                                {activePoint.plannedTss ?? '—'}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            ) : null}

                            {hasVisibleLoadData ? (
                                <svg
                                    viewBox={`0 0 ${trend.chartWidth} ${trend.chartHeight}`}
                                    className="h-full w-full"
                                    preserveAspectRatio="xMidYMid meet"
                                    role="img"
                                    aria-label="Training load trend chart"
                                    onMouseLeave={() => setHoveredIndex(null)}
                                >
                                    {Array.from(
                                        { length: trend.gridLines + 1 },
                                        (_, index) => {
                                            const y =
                                                trend.chartPaddingY +
                                                (trend.innerHeight / trend.gridLines) * index;

                                            return (
                                                <line
                                                    key={index}
                                                    x1={trend.chartPaddingX}
                                                    y1={y}
                                                    x2={trend.chartWidth - trend.chartPaddingX}
                                                    y2={y}
                                                    stroke="rgba(39,39,42,0.6)"
                                                    strokeWidth={1}
                                                />
                                            );
                                        },
                                    )}

                                    {trend.points.map((point, index) => {
                                        if (point === undefined) {
                                            return null;
                                        }

                                        const hitWidth =
                                            weeks.length > 1
                                                ? Math.max(14, trend.stepX)
                                                : trend.chartWidth - trend.chartPaddingX * 2;
                                        const startX = Math.max(
                                            trend.chartPaddingX,
                                            point.x - hitWidth / 2,
                                        );
                                        const maxStartX =
                                            trend.chartWidth -
                                            trend.chartPaddingX -
                                            hitWidth;

                                        return (
                                            <rect
                                                key={`hover-hit-${point.label}`}
                                                x={Math.min(startX, maxStartX)}
                                                y={trend.chartPaddingY}
                                                width={hitWidth}
                                                height={trend.innerHeight}
                                                fill="transparent"
                                                onMouseEnter={() =>
                                                    setHoveredIndex(index)
                                                }
                                            />
                                        );
                                    })}

                                    {trend.targetBands.map((segment, index) => (
                                        <polygon
                                            key={index}
                                            points={segment}
                                            fill="rgba(14,116,144,0.18)"
                                        />
                                    ))}

                                    {trend.plannedSegments.map((segment, index) => (
                                        <path
                                            key={`planned-${index}`}
                                            d={segment}
                                            fill="none"
                                            stroke="rgb(14,116,144)"
                                            strokeOpacity={0.9}
                                            strokeWidth={1.8}
                                            strokeDasharray="6 6"
                                        />
                                    ))}

                                    {trend.actualSegments.map((segment, index) => (
                                        <path
                                            key={index}
                                            d={segment}
                                            fill="none"
                                            stroke="rgb(16,185,129)"
                                            strokeWidth={2}
                                        />
                                    ))}

                                    {activePoint !== undefined &&
                                    activePointIndex >= 0 ? (
                                        <line
                                            x1={activePoint.x}
                                            y1={trend.chartPaddingY}
                                            x2={activePoint.x}
                                            y2={
                                                trend.chartPaddingY +
                                                trend.innerHeight
                                            }
                                            stroke="rgba(113,113,122,0.6)"
                                            strokeWidth={1}
                                            strokeDasharray="3 3"
                                        />
                                    ) : null}

                                    {trend.points.map((point, index) => {
                                        if (point.actualY === null) {
                                            return null;
                                        }

                                        return (
                                            <circle
                                                key={index}
                                                cx={point.x}
                                                cy={point.actualY}
                                                r={4}
                                                fill="rgb(16,185,129)"
                                                stroke="rgb(24,24,27)"
                                                strokeWidth={2}
                                            />
                                        );
                                    })}

                                    {activePoint !== undefined &&
                                    activePoint.actualY !== null ? (
                                        <circle
                                            cx={activePoint.x}
                                            cy={activePoint.actualY}
                                            r={5}
                                            fill="rgb(16,185,129)"
                                            stroke="rgb(24,24,27)"
                                            strokeWidth={2}
                                        />
                                    ) : null}

                                    {activePoint !== undefined &&
                                    activePoint.plannedY !== null ? (
                                        <circle
                                            cx={activePoint.x}
                                            cy={activePoint.plannedY}
                                            r={4}
                                            fill="rgb(14,116,144)"
                                            stroke="rgb(24,24,27)"
                                            strokeWidth={1.5}
                                        />
                                    ) : null}

                                    <text
                                        x={trend.chartPaddingX}
                                        y={trend.chartPaddingY - 8}
                                        fill="rgb(113,113,122)"
                                        fontSize={11}
                                    >
                                        {trend.yMax} TSS
                                    </text>
                                </svg>
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <p className="text-sm text-zinc-500">
                                        No training load data in this range.
                                    </p>
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="mt-8">
                        <h2 className="text-2xl font-medium text-zinc-200">
                            Consistency
                        </h2>

                        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-border bg-surface p-6">
                                <p className="text-[11px] tracking-wider text-zinc-500 uppercase">
                                    Consistency
                                </p>
                                <p className="mt-2 font-mono text-5xl text-zinc-100">
                                    {summary.consistency_weeks}
                                    <span className="ml-2 text-lg text-zinc-500">
                                        wks
                                    </span>
                                </p>
                                <p className="mt-4 border-t border-border pt-3 text-sm text-zinc-500">
                                    of {range.weeks} weeks
                                </p>
                            </div>

                            <div className="rounded-2xl border border-emerald-900/30 bg-emerald-950/10 p-6">
                                <p className="text-[11px] tracking-wider text-zinc-500 uppercase">
                                    Current Streak
                                </p>
                                <p className="mt-2 font-mono text-5xl text-zinc-100">
                                    {summary.current_streak_weeks}
                                    <span className="ml-2 text-lg text-zinc-500">
                                        wks
                                    </span>
                                </p>
                                <p className="mt-4 border-t border-border pt-3 text-sm text-zinc-500">
                                    {summary.current_streak_weeks > 0
                                        ? 'Consistent completion cadence.'
                                        : 'No active streak in this range.'}
                                </p>
                            </div>
                        </div>
                    </section>

                    <section className="mt-10">
                        <h2 className="text-2xl font-medium text-zinc-200">
                            Weekly Logs
                        </h2>

                        <div className="mt-4 flex flex-col gap-2">
                            {[...weeks].reverse().map((week) => {
                                const plannedTss = week.planned_tss ?? 0;
                                const actualTss = week.actual_tss ?? 0;
                                const compliance =
                                    plannedTss > 0
                                        ? Math.round(
                                              (actualTss / plannedTss) * 100,
                                          )
                                        : 0;

                                return (
                                    <button
                                        key={week.week_start}
                                        type="button"
                                        onClick={() => {
                                            router.get(
                                                '/dashboard',
                                                {
                                                    starts_from:
                                                        week.week_start,
                                                    ends_to: week.week_end,
                                                },
                                                {
                                                    preserveScroll: true,
                                                },
                                            );
                                        }}
                                        className="group flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-zinc-600 hover:bg-zinc-800/50"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-zinc-300">
                                                {formatShortDate(
                                                    week.week_start,
                                                )}{' '}
                                                —{' '}
                                                {formatShortDate(
                                                    week.week_end,
                                                )}
                                            </span>
                                            <span className="text-[10px] tracking-wider text-zinc-500 uppercase">
                                                Planned{' '}
                                                {formatDuration(
                                                    week.planned_duration_minutes,
                                                )}{' '}
                                                • Actual{' '}
                                                {formatDuration(
                                                    week.actual_duration_minutes,
                                                )}
                                            </span>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="hidden flex-col items-end gap-1 sm:flex">
                                                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800">
                                                    <div
                                                        className={cn(
                                                            'h-full',
                                                            compliance >= 80 &&
                                                                compliance <=
                                                                    115
                                                                ? 'bg-emerald-500'
                                                                : compliance >
                                                                    115
                                                                  ? 'bg-amber-500'
                                                                  : 'bg-zinc-500',
                                                        )}
                                                        style={{
                                                            width: `${Math.min(
                                                                compliance,
                                                                100,
                                                            )}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex w-20 flex-col items-end">
                                                <span className="font-mono text-sm text-zinc-200">
                                                    {week.actual_tss ?? 0} TSS
                                                </span>
                                                <span className="text-[10px] text-zinc-500">
                                                    {plannedTss > 0
                                                        ? `${compliance}%`
                                                        : '—'}
                                                </span>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                </div>
            </div>
        </AppLayout>
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

function formatDuration(durationMinutes: number | null): string {
    if (durationMinutes === null || Number.isNaN(durationMinutes)) {
        return '—';
    }

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours <= 0) {
        return `${minutes}m`;
    }

    return `${hours}h ${minutes}m`;
}

function formatShortDate(date: string): string {
    return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
    });
}

function buildLineSegments(points: Array<{ x: number; y: number | null }>): string[] {
    const segments: string[] = [];
    let currentSegment = '';

    points.forEach((point, index) => {
        if (point.y === null) {
            if (currentSegment !== '') {
                segments.push(currentSegment);
                currentSegment = '';
            }
            return;
        }

        if (currentSegment === '') {
            currentSegment = `M ${point.x} ${point.y}`;
            return;
        }

        currentSegment += ` L ${point.x} ${point.y}`;

        if (index === points.length - 1) {
            segments.push(currentSegment);
        }
    });

    if (currentSegment !== '' && segments[segments.length - 1] !== currentSegment) {
        segments.push(currentSegment);
    }

    return segments;
}
