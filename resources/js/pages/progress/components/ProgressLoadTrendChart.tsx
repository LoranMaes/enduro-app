import type { ProgressSummary, ProgressTrend } from '../types';
import { ProgressEmptyState } from './ProgressEmptyState';

type ProgressLoadTrendChartProps = {
    summary: ProgressSummary;
    trend: ProgressTrend;
    hasVisibleLoadData: boolean;
    activePointIndex: number;
    activePoint: ProgressTrend['points'][number] | undefined;
    weeksCount: number;
    onSetHoveredIndex: (index: number | null) => void;
};

export function ProgressLoadTrendChart({
    summary,
    trend,
    hasVisibleLoadData,
    activePointIndex,
    activePoint,
    weeksCount,
    onSetHoveredIndex,
}: ProgressLoadTrendChartProps) {
    return (
        <section className="rounded-2xl border border-border bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-[30px] font-medium text-zinc-200">Load Trend</h2>
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
                        <p className="text-zinc-400">{activePoint.label}</p>
                        <div className="mt-1 flex items-center gap-3">
                            <span className="inline-flex items-center gap-1 text-zinc-300">
                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                <span>Actual</span>
                                <span className="font-mono">{activePoint.actualTss ?? '—'}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-sky-300">
                                <span className="h-2 w-2 rounded-full bg-sky-500/60" />
                                <span>Planned</span>
                                <span className="font-mono">{activePoint.plannedTss ?? '—'}</span>
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
                                    stroke="rgb(24,24,27)"
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
                                stroke="rgb(24,24,27)"
                                strokeWidth={2}
                            />
                        ) : null}

                        {activePoint !== undefined && activePoint.plannedY !== null ? (
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
                    <ProgressEmptyState message="No training load data in this range." />
                )}
            </div>
        </section>
    );
}
