import { useMemo, useState } from 'react';
import {
    ToggleGroup,
    ToggleGroupItem,
} from '@/components/ui/toggle-group';
import type {
    LoadSeriesPoint,
    ProgressLoadHistoryPayload,
} from '../types';
import { ProgressEmptyState } from './ProgressEmptyState';

type PerformanceManagementChartProps = {
    data: ProgressLoadHistoryPayload | null;
    loading: boolean;
    error: string | null;
};

type SeriesKey = 'combined' | 'run' | 'bike' | 'swim' | 'other';

const seriesLabels: Record<SeriesKey, string> = {
    combined: 'Combined',
    run: 'Run',
    bike: 'Bike',
    swim: 'Swim',
    other: 'Other',
};

export function PerformanceManagementChart({
    data,
    loading,
    error,
}: PerformanceManagementChartProps) {
    const [seriesKey, setSeriesKey] = useState<SeriesKey>('combined');
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const series = useMemo(() => {
        if (data === null) {
            return [] as LoadSeriesPoint[];
        }

        if (seriesKey === 'combined') {
            return data.combined;
        }

        return data.per_sport[seriesKey];
    }, [data, seriesKey]);

    const chart = useMemo(() => {
        const width = 960;
        const height = 320;
        const paddingX = 28;
        const paddingY = 26;
        const innerWidth = width - paddingX * 2;
        const innerHeight = height - paddingY * 2;
        const stepX = series.length > 1 ? innerWidth / (series.length - 1) : 0;

        const values = series.flatMap((point) => [
            point.ctl,
            point.atl,
            point.tsb,
        ]);
        const rawMin = values.length > 0 ? Math.min(...values) : -10;
        const rawMax = values.length > 0 ? Math.max(...values) : 10;
        const span = Math.max(20, rawMax - rawMin);
        const paddedMin = rawMin - span * 0.18;
        const paddedMax = rawMax + span * 0.18;
        const range = Math.max(1, paddedMax - paddedMin);

        const toY = (value: number): number => {
            return paddingY + innerHeight - ((value - paddedMin) / range) * innerHeight;
        };

        const points = series.map((point, index) => ({
            ...point,
            x: paddingX + stepX * index,
            ctlY: toY(point.ctl),
            atlY: toY(point.atl),
            tsbY: toY(point.tsb),
        }));

        return {
            width,
            height,
            paddingX,
            paddingY,
            innerHeight,
            points,
            yTopLabel: Math.round(paddedMax),
            yBottomLabel: Math.round(paddedMin),
            ctlPath: buildLinePath(
                points.map((point) => ({
                    x: point.x,
                    y: point.ctlY,
                })),
            ),
            atlPath: buildLinePath(
                points.map((point) => ({
                    x: point.x,
                    y: point.atlY,
                })),
            ),
            tsbPath: buildLinePath(
                points.map((point) => ({
                    x: point.x,
                    y: point.tsbY,
                })),
            ),
            gridLines: 4,
            stepX,
        };
    }, [series]);

    const activePoint = hoveredIndex === null
        ? undefined
        : chart.points[hoveredIndex];

    return (
        <section className="mt-8 rounded-2xl border border-border bg-surface p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-[1.875rem] font-medium text-zinc-200">
                        Performance Management
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500">
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
                            className="h-auto rounded-md px-2.5 py-1 text-xs text-zinc-400 data-[state=on]:bg-zinc-800 data-[state=on]:text-zinc-100"
                            aria-label={`View ${label} load series`}
                        >
                            {label}
                        </ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </div>

            <div className="mt-4 flex items-center gap-5 text-[0.6875rem] text-zinc-500 uppercase">
                <span className="inline-flex items-center gap-2">
                    <span className="h-0.5 w-4 bg-cyan-400" />
                    CTL
                </span>
                <span className="inline-flex items-center gap-2">
                    <span className="h-0.5 w-4 bg-amber-400" />
                    ATL
                </span>
                <span className="inline-flex items-center gap-2">
                    <span className="h-0.5 w-4 bg-fuchsia-400" />
                    TSB
                </span>
            </div>

            <div className="relative mt-5 h-[21.25rem] overflow-hidden rounded-xl border border-border/70 bg-background/60">
                {loading ? (
                    <div className="flex h-full items-center justify-center">
                        <p className="text-sm text-zinc-500">Loading performance metrics...</p>
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
                            <div className="pointer-events-none absolute top-3 right-3 z-10 rounded-md border border-zinc-800 bg-zinc-950/85 px-2.5 py-1.5 text-[0.6875rem]">
                                <p className="text-zinc-400">{activePoint.date}</p>
                                <div className="mt-1 grid grid-cols-3 gap-3 text-zinc-200">
                                    <span className="font-mono">CTL {Math.round(activePoint.ctl)}</span>
                                    <span className="font-mono">ATL {Math.round(activePoint.atl)}</span>
                                    <span className="font-mono">TSB {Math.round(activePoint.tsb)}</span>
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
                                        stroke="rgba(39,39,42,0.6)"
                                        strokeWidth={1}
                                    />
                                );
                            })}

                            {chart.points.map((point, index) => {
                                const hitWidth = chart.points.length > 1
                                    ? Math.max(12, chart.stepX)
                                    : chart.width - chart.paddingX * 2;

                                return (
                                    <rect
                                        key={`hover-${point.date}`}
                                        x={Math.max(chart.paddingX, point.x - hitWidth / 2)}
                                        y={chart.paddingY}
                                        width={hitWidth}
                                        height={chart.innerHeight}
                                        fill="transparent"
                                        onMouseEnter={() => setHoveredIndex(index)}
                                    />
                                );
                            })}

                            <path d={chart.ctlPath} fill="none" stroke="rgb(34,211,238)" strokeWidth={2} />
                            <path d={chart.atlPath} fill="none" stroke="rgb(251,191,36)" strokeWidth={2} />
                            <path d={chart.tsbPath} fill="none" stroke="rgb(232,121,249)" strokeWidth={2} />

                            {activePoint !== undefined ? (
                                <line
                                    x1={activePoint.x}
                                    y1={chart.paddingY}
                                    x2={activePoint.x}
                                    y2={chart.paddingY + chart.innerHeight}
                                    stroke="rgba(113,113,122,0.7)"
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

function buildLinePath(points: Array<{ x: number; y: number }>): string {
    if (points.length === 0) {
        return '';
    }

    return points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');
}
