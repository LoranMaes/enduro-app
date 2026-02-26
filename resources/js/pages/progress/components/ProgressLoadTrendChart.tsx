import type { ProgressSummary, ProgressTrend } from '../types';
import { ProgressEmptyState } from './ProgressEmptyState';

type ProgressLoadTrendChartProps = {
    summary: ProgressSummary;
    trend: ProgressTrend;
    hasVisibleLoadData: boolean;
    activePointIndex: number;
    activePoint: ProgressTrend['points'][number] | undefined;
    weeksCount: number;
    todaySnapshot: {
        date: string;
        actual_tss_today: number;
        planned_tss_today: number;
        suggested_min_tss_today: number;
        suggested_max_tss_today: number;
    };
    onSetHoveredIndex: (index: number | null) => void;
};

export function ProgressLoadTrendChart({
    summary,
    trend,
    hasVisibleLoadData,
    activePointIndex,
    activePoint,
    weeksCount,
    todaySnapshot,
    onSetHoveredIndex,
}: ProgressLoadTrendChartProps) {
    const todayLabel = new Date(`${todaySnapshot.date}T00:00:00`)
        .toLocaleDateString(undefined, {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });

    return (
        <section className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-[1.875rem] font-medium text-foreground">Load Trend</h2>
                <div className="flex items-center gap-5 text-[0.6875rem] text-muted-foreground uppercase">
                    <span className="inline-flex items-center gap-2">
                        <span className="h-0.5 w-4 bg-emerald-500" />
                        Actual
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="h-0.5 w-4 border-t border-dashed border-sky-400" />
                        Planned
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <span className="h-2 w-4 border border-emerald-500/35 bg-emerald-500/20" />
                        Suggested Range
                    </span>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 rounded-lg border border-border bg-background/60 px-3 py-2 md:grid-cols-3">
                <div className="space-y-1">
                    <p className="text-[0.625rem] tracking-wide text-muted-foreground uppercase">
                        Today Actual TSS
                    </p>
                    <p className="font-mono text-sm text-foreground">
                        {todaySnapshot.actual_tss_today}
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-[0.625rem] tracking-wide text-muted-foreground uppercase">
                        Today Planned TSS
                    </p>
                    <p className="font-mono text-sm text-foreground">
                        {todaySnapshot.planned_tss_today}
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-[0.625rem] tracking-wide text-muted-foreground uppercase">
                        Suggested Today Range
                    </p>
                    <p className="font-mono text-sm text-foreground">
                        {todaySnapshot.suggested_min_tss_today}
                        {' - '}
                        {todaySnapshot.suggested_max_tss_today}
                        {' '}
                        TSS
                    </p>
                    <p className="text-[0.625rem] text-muted-foreground">{todayLabel}</p>
                </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <p>
                    Planned vs completed:
                    <span className="ml-1 font-mono text-foreground">
                        {summary.planned_tss_total > 0
                            ? `${summary.actual_tss_total} / ${summary.planned_tss_total} TSS`
                            : '—'}
                    </span>
                </p>
                <p>
                    Sessions:
                    <span className="ml-1 font-mono text-foreground">
                        {summary.planned_sessions_total > 0
                            ? `${summary.completed_sessions_total} / ${summary.planned_sessions_total}`
                            : '—'}
                    </span>
                </p>
            </div>
            <p className="mt-1 text-[0.6875rem] text-muted-foreground">
                Suggested range: trailing 4-week actual TSS band (±15%).
            </p>

            <div className="relative mt-5 h-[21.25rem] overflow-hidden rounded-xl border border-border/80 bg-background/70">
                {activePoint !== undefined ? (
                    <div className="pointer-events-none absolute top-3 right-3 z-10 rounded-md border border-border bg-popover/95 px-2.5 py-1.5 text-[0.6875rem] shadow-sm">
                        <p className="text-muted-foreground">{activePoint.label}</p>
                        <div className="mt-1 flex items-center gap-3">
                            <span className="inline-flex items-center gap-1 text-foreground">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span>Actual</span>
                                <span className="font-mono">{activePoint.actualTss ?? '—'}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-sky-300">
                                <span className="h-2 w-2 rounded-full bg-sky-500/60" />
                                <span>Planned</span>
                                <span className="font-mono">{activePoint.plannedTss ?? '—'}</span>
                            </span>
                            {activePoint.suggestedMinTss !== null
                            && activePoint.suggestedMaxTss !== null ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
                                    <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
                                    <span>Range</span>
                                    <span className="font-mono">
                                        {activePoint.suggestedMinTss}–{activePoint.suggestedMaxTss}
                                    </span>
                                </span>
                            ) : null}
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
                        onMouseLeave={() => onSetHoveredIndex(null)}
                    >
                        {Array.from({ length: trend.gridLines + 1 }, (_, index) => {
                            const y =
                                trend.chartPaddingY + (trend.innerHeight / trend.gridLines) * index;

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
                        })}

                        {trend.points.map((point, index) => {
                            if (point === undefined) {
                                return null;
                            }

                            const hitWidth =
                                weeksCount > 1
                                    ? Math.max(14, trend.stepX)
                                    : trend.chartWidth - trend.chartPaddingX * 2;
                            const startX = Math.max(
                                trend.chartPaddingX,
                                point.x - hitWidth / 2,
                            );
                            const maxStartX =
                                trend.chartWidth - trend.chartPaddingX - hitWidth;

                            return (
                                <rect
                                    key={`hover-hit-${point.label}`}
                                    x={Math.min(startX, maxStartX)}
                                    y={trend.chartPaddingY}
                                    width={hitWidth}
                                    height={trend.innerHeight}
                                    fill="transparent"
                                    onMouseEnter={() => onSetHoveredIndex(index)}
                                />
                            );
                        })}

                        {trend.targetBands.map((segment, index) => (
                            <polygon
                                key={index}
                                points={segment}
                                fill="rgba(74,222,128,0.32)"
                            />
                        ))}

                        {trend.targetBandColumns.map((column, index) => (
                            <rect
                                key={`target-column-${index}`}
                                x={column.x}
                                y={column.y}
                                width={column.width}
                                height={column.height}
                                fill="rgba(74,222,128,0.32)"
                                stroke="rgba(74,222,128,0.85)"
                                strokeWidth={0.8}
                                rx={1}
                            />
                        ))}

                        {trend.targetBandUpperSegments.map((segment, index) => (
                            <path
                                key={`target-upper-${index}`}
                                d={segment}
                                fill="none"
                                stroke="rgba(74,222,128,0.95)"
                                strokeWidth={1.4}
                            />
                        ))}

                        {trend.targetBandLowerSegments.map((segment, index) => (
                            <path
                                key={`target-lower-${index}`}
                                d={segment}
                                fill="none"
                                stroke="rgba(74,222,128,0.95)"
                                strokeWidth={1.4}
                            />
                        ))}

                        {trend.plannedSegments.map((segment, index) => (
                            <path
                                key={`planned-${index}`}
                                d={segment}
                                fill="none"
                                stroke="rgba(56,189,248,0.95)"
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

                        {activePoint !== undefined && activePointIndex >= 0 ? (
                            <line
                                x1={activePoint.x}
                                y1={trend.chartPaddingY}
                                x2={activePoint.x}
                                y2={trend.chartPaddingY + trend.innerHeight}
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
                                    stroke="var(--background)"
                                    strokeWidth={2}
                                />
                            );
                        })}

                        {activePoint !== undefined && activePoint.actualY !== null ? (
                            <circle
                                cx={activePoint.x}
                                cy={activePoint.actualY}
                                r={5}
                                fill="rgb(16,185,129)"
                                stroke="var(--background)"
                                strokeWidth={2}
                            />
                        ) : null}

                        {activePoint !== undefined && activePoint.plannedY !== null ? (
                            <circle
                                cx={activePoint.x}
                                cy={activePoint.plannedY}
                                r={4}
                                fill="rgb(14,116,144)"
                                stroke="var(--background)"
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
                    <ProgressEmptyState message="No training load data in this range." />
                )}
            </div>
        </section>
    );
}
