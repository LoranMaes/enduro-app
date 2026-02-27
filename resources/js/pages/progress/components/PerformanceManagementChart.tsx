import { useMemo, useState } from 'react';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@/components/ui/toggle-group';
import type {
    LoadSeriesPoint,
    PerformanceLineKey,
    ProgressLoadHistoryPayload,
} from '../types';
import { usePerformanceChartModel } from '../hooks/usePerformanceChartModel';
import { usePerformanceForecast } from '../hooks/usePerformanceForecast';
import {
    PerformanceSnapshotRow,
    resolveTodaySnapshot,
} from './PerformanceSnapshotRow';
import { PerformanceManagementLegend } from './PerformanceManagementLegend';
import { ProgressEmptyState } from './ProgressEmptyState';

type PerformanceManagementChartProps = {
    data: ProgressLoadHistoryPayload | null;
    loading: boolean;
    error: string | null;
    selectedWeeks: number;
};

type SeriesKey = 'combined' | 'run' | 'bike' | 'swim' | 'other';

const seriesLabels: Record<SeriesKey, string> = {
    combined: 'Combined',
    run: 'Run',
    bike: 'Bike',
    swim: 'Swim',
    other: 'Other',
};

const lineColors: Record<PerformanceLineKey, string> = {
    ctl: 'rgb(34,211,238)',
    atl: 'rgb(251,191,36)',
    tsb: 'rgb(232,121,249)',
};

export function PerformanceManagementChart({
    data,
    loading,
    error,
    selectedWeeks,
}: PerformanceManagementChartProps) {
    const [seriesKey, setSeriesKey] = useState<SeriesKey>('combined');
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const [visibleLineKeys, setVisibleLineKeys] = useState<PerformanceLineKey[]>([
        'ctl',
        'atl',
        'tsb',
    ]);

    const historicalSeries = useMemo(() => {
        if (data === null) {
            return [] as LoadSeriesPoint[];
        }

        if (seriesKey === 'combined') {
            return data.combined;
        }

        return data.per_sport[seriesKey];
    }, [data, seriesKey]);
    const {
        points: series,
        historicalCount,
    } = usePerformanceForecast(historicalSeries, selectedWeeks);
    const chart = usePerformanceChartModel(
        series,
        historicalCount,
        visibleLineKeys,
    );
    const activePoint = hoveredIndex === null
        ? undefined
        : chart.points[hoveredIndex];
    const todaySnapshot = useMemo(
        () => resolveTodaySnapshot(historicalSeries),
        [historicalSeries],
    );

    return (
        <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-[1.875rem] font-medium text-foreground">
                        Performance Management
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                        CTL, ATL and TSB from daily load snapshots.
                    </p>
                </div>

                <ToggleGroup
                    type="single"
                    value={seriesKey}
                    onValueChange={(value) => {
                        if (
                            value === 'combined'
                            || value === 'run'
                            || value === 'bike'
                            || value === 'swim'
                            || value === 'other'
                        ) {
                            setSeriesKey(value);
                            setHoveredIndex(null);
                        }
                    }}
                    className="inline-flex rounded-lg border border-border bg-background p-1"
                >
                    {Object.entries(seriesLabels).map(([key, label]) => (
                        <ToggleGroupItem
                            key={key}
                            value={key}
                            className="h-auto rounded-md px-2.5 py-1 text-xs text-muted-foreground data-[state=on]:bg-accent/20 data-[state=on]:text-foreground"
                            aria-label={`View ${label} load series`}
                        >
                            {label}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </div>

            <PerformanceManagementLegend
                visibleSeries={visibleLineKeys}
                onToggleSeries={(lineKey) => {
                    setVisibleLineKeys((current) => {
                        if (current.includes(lineKey)) {
                            if (current.length === 1) {
                                return current;
                            }

                            return current.filter((key) => key !== lineKey);
                        }

                        return [...current, lineKey];
                    });
                }}
            />

            <PerformanceSnapshotRow snapshot={todaySnapshot} />

            <div className="relative mt-5 h-[27rem] overflow-hidden rounded-xl border border-border/80 bg-background/70">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-muted-foreground">Loading performance metrics...</p>
                    </div>
                ) : error !== null ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-rose-300">{error}</p>
                    </div>
                ) : chart.points.length === 0 ? (
                    <ProgressEmptyState message="No load snapshots in this range." />
                ) : (
                    <>
                        {activePoint !== undefined ? (
                            <div className="pointer-events-none absolute top-3 right-3 z-10 rounded-md border border-border bg-popover/95 px-2.5 py-1.5 text-[0.6875rem] shadow-sm">
                                <p className="text-muted-foreground">{activePoint.date}</p>
                                {activePoint.isProjected ? (
                                    <p className="mt-1 text-[0.625rem] text-muted-foreground">
                                        Projected (no workouts)
                                    </p>
                                ) : null}
                                <div className="mt-1 space-y-1 text-foreground">
                                    <ValueWithDot
                                        visible={visibleLineKeys.includes('ctl')}
                                        dotClassName="bg-cyan-400"
                                        label="CTL"
                                        value={Math.round(activePoint.ctl)}
                                    />
                                    <ValueWithDot
                                        visible={visibleLineKeys.includes('atl')}
                                        dotClassName="bg-amber-400"
                                        label="ATL"
                                        value={Math.round(activePoint.atl)}
                                    />
                                    <ValueWithDot
                                        visible={visibleLineKeys.includes('tsb')}
                                        dotClassName="bg-fuchsia-400"
                                        label="TSB"
                                        value={Math.round(activePoint.tsb)}
                                    />
                                </div>
                            </div>
                        ) : null}

                        <svg
                            viewBox={`0 0 ${chart.width} ${chart.height}`}
                            className="h-full w-full"
                            preserveAspectRatio="xMidYMid meet"
                            role="img"
                            aria-label="Performance management chart"
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            {Array.from({ length: chart.gridLines + 1 }, (_, index) => {
                                const y = chart.paddingY
                                    + (chart.innerHeight / chart.gridLines) * index;

                                return (
                                    <line
                                        key={index}
                                        x1={chart.paddingX}
                                        y1={y}
                                        x2={chart.width - chart.paddingX}
                                        y2={y}
                                        stroke="rgba(113,113,122,0.35)"
                                        strokeWidth={1}
                                    />
                                );
                            })}

                            {chart.zeroY !== null ? (
                                <line
                                    x1={chart.paddingX}
                                    y1={chart.zeroY}
                                    x2={chart.width - chart.paddingX}
                                    y2={chart.zeroY}
                                    stroke="rgba(113,113,122,0.55)"
                                    strokeWidth={1}
                                    strokeDasharray="4 4"
                                />
                            ) : null}

                            {chart.points.map((point, index) => {
                                const hitWidth = chart.points.length > 1
                                    ? Math.max(12, chart.stepX)
                                    : chart.width - chart.paddingX * 2;

                                return (
                                    <rect
                                        key={`hover-${point.date}-${point.isProjected ? 'projected' : 'historical'}`}
                                        x={Math.max(chart.paddingX, point.x - hitWidth / 2)}
                                        y={chart.paddingY}
                                        width={hitWidth}
                                        height={chart.innerHeight}
                                        fill="transparent"
                                        onMouseEnter={() => setHoveredIndex(index)}
                                    />
                                );
                            })}

                            {visibleLineKeys.includes('ctl') ? (
                                <path d={chart.historicalCtlPath} fill="none" stroke={lineColors.ctl} strokeWidth={2.2} />
                            ) : null}
                            {visibleLineKeys.includes('atl') ? (
                                <path d={chart.historicalAtlPath} fill="none" stroke={lineColors.atl} strokeWidth={2.2} />
                            ) : null}
                            {visibleLineKeys.includes('tsb') ? (
                                <path d={chart.historicalTsbPath} fill="none" stroke={lineColors.tsb} strokeWidth={2.2} />
                            ) : null}

                            {chart.hasProjection ? (
                                <>
                                    {visibleLineKeys.includes('ctl') ? (
                                        <path d={chart.projectedCtlPath} fill="none" stroke={lineColors.ctl} strokeOpacity={0.8} strokeDasharray="4 4" strokeWidth={2.1} />
                                    ) : null}
                                    {visibleLineKeys.includes('atl') ? (
                                        <path d={chart.projectedAtlPath} fill="none" stroke={lineColors.atl} strokeOpacity={0.8} strokeDasharray="4 4" strokeWidth={2.1} />
                                    ) : null}
                                    {visibleLineKeys.includes('tsb') ? (
                                        <path d={chart.projectedTsbPath} fill="none" stroke={lineColors.tsb} strokeOpacity={0.8} strokeDasharray="4 4" strokeWidth={2.1} />
                                    ) : null}
                                </>
                            ) : null}

                            {activePoint !== undefined ? (
                                <line
                                    x1={activePoint.x}
                                    y1={chart.paddingY}
                                    x2={activePoint.x}
                                    y2={chart.paddingY + chart.innerHeight}
                                    stroke="rgba(113,113,122,0.8)"
                                    strokeDasharray="3 3"
                                    strokeWidth={1}
                                />
                            ) : null}

                            <text x={chart.paddingX} y={chart.paddingY - 8} fill="rgb(113,113,122)" fontSize={11}>
                                {chart.yTopLabel}
                            </text>
                            <text x={chart.paddingX} y={chart.height - 8} fill="rgb(113,113,122)" fontSize={11}>
                                {chart.yBottomLabel}
                            </text>
                        </svg>
                    </>
                )}
            </div>
        </section>
    );
}

function ValueWithDot({
    visible,
    dotClassName,
    label,
    value,
}: {
    visible: boolean;
    dotClassName: string;
    label: string;
    value: number;
}) {
    if (!visible) {
        return null;
    }

    return (
        <span className="inline-flex items-center gap-1 font-mono">
            <span className={`h-1.5 w-1.5 rounded-full ${dotClassName}`} />
            {label} {value}
        </span>
    );
}
