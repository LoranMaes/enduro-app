import { useState, type MouseEvent as ReactMouseEvent } from 'react';
import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { streamColors, streamLabels } from './constants';
import type {
    SelectionRangeSummary,
    StreamSeries,
    XAxisMode,
} from './types';
import {
    formatAverageSpeedForSport,
    formatDurationSeconds,
    formatStreamValue,
    formatXAxisTick,
    formatXAxisValue,
} from './utils';

type SessionAnalysisChartProps = {
    mode: XAxisMode;
    onModeChange: (mode: XAxisMode) => void;
    canUseDistanceAxis: boolean;
    isZoomed: boolean;
    onResetZoom: () => void;
    orderedStreamKeys: string[];
    availableStreams: Set<string>;
    activeStreams: Record<string, boolean>;
    onStreamToggle: (streamKey: string) => void;
    isLoadingStreams: boolean;
    streamError: string | null;
    zoomedSeries: StreamSeries[];
    visibleReferencePoints: Array<{ x: number; sampleIndex: number }>;
    hoverSampleIndex: number | null;
    onHoverSampleIndexChange: (sampleIndex: number | null) => void;
    onZoomSelection: (min: number, max: number) => void;
    hoverSummary: {
        xValue: number | null;
        values: Array<{ key: string; value: number | null }>;
    } | null;
    showSelectionPanel: boolean;
    selectedRangeSummary: SelectionRangeSummary | null;
    sport: string;
};

export function SessionAnalysisChart({
    mode,
    onModeChange,
    canUseDistanceAxis,
    isZoomed,
    onResetZoom,
    orderedStreamKeys,
    availableStreams,
    activeStreams,
    onStreamToggle,
    isLoadingStreams,
    streamError,
    zoomedSeries,
    visibleReferencePoints,
    hoverSampleIndex,
    onHoverSampleIndexChange,
    onZoomSelection,
    hoverSummary,
    showSelectionPanel,
    selectedRangeSummary,
    sport,
}: SessionAnalysisChartProps) {
    return (
        <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-zinc-200">Analysis</h2>

                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        disabled={!canUseDistanceAxis}
                        onClick={() => {
                            onModeChange('distance');
                            onHoverSampleIndexChange(null);
                        }}
                        className={cn(
                            'rounded border px-2 py-1 text-[10px] transition-colors',
                            mode === 'distance'
                                ? 'border-zinc-600 bg-zinc-800 text-zinc-100'
                                : canUseDistanceAxis
                                  ? 'border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200'
                                  : 'cursor-not-allowed border-zinc-800 bg-zinc-950 text-zinc-700',
                        )}
                    >
                        Kilometers
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            onModeChange('time');
                            onHoverSampleIndexChange(null);
                        }}
                        className={cn(
                            'rounded border px-2 py-1 text-[10px] transition-colors',
                            mode === 'time'
                                ? 'border-zinc-600 bg-zinc-800 text-zinc-100'
                                : 'border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200',
                        )}
                    >
                        Time
                    </button>
                    {isZoomed ? (
                        <button
                            type="button"
                            onClick={onResetZoom}
                            className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900/60 px-2 py-1 text-[10px] text-zinc-300 hover:text-zinc-100"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset Zoom
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
                {orderedStreamKeys.map((streamKey) => {
                    const isAvailable = availableStreams.has(streamKey);
                    const isEnabled = activeStreams[streamKey] ?? false;

                    return (
                        <button
                            key={streamKey}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => {
                                if (!isAvailable) {
                                    return;
                                }

                                onStreamToggle(streamKey);
                            }}
                            className={cn(
                                'rounded border px-2 py-1 text-[10px] transition-colors',
                                isEnabled
                                    ? 'border-zinc-600 bg-zinc-800 text-zinc-200'
                                    : isAvailable
                                      ? 'border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200'
                                      : 'cursor-not-allowed border-zinc-800 bg-zinc-950 text-zinc-700',
                            )}
                        >
                            {streamLabels[streamKey] ?? streamKey}
                        </button>
                    );
                })}
            </div>

            <p className="mt-2 text-[11px] text-zinc-500">
                Click and drag on the chart to zoom into a section.
            </p>

            <div className="mt-4 w-full overflow-hidden rounded-lg border border-border/60 bg-background/70 p-3">
                <div className="flex flex-col gap-3 xl:flex-row">
                    <div
                        className={cn(
                            'min-w-0 transition-[width] duration-300 ease-out',
                            showSelectionPanel
                                ? 'xl:w-[calc(100%-17rem)]'
                                : 'xl:w-full',
                        )}
                    >
                        <div className="aspect-[16/6] min-h-[220px] w-full">
                            {isLoadingStreams ? (
                                <p className="text-xs text-zinc-500">
                                    Loading activity streams...
                                </p>
                            ) : streamError !== null ? (
                                <p className="text-xs text-red-300">
                                    {streamError}
                                </p>
                            ) : zoomedSeries.length > 0 &&
                              visibleReferencePoints.length > 1 ? (
                                <InteractiveStreamChart
                                    mode={mode}
                                    series={zoomedSeries}
                                    referencePoints={visibleReferencePoints}
                                    hoverSampleIndex={hoverSampleIndex}
                                    onHoverSampleIndexChange={
                                        onHoverSampleIndexChange
                                    }
                                    onZoomSelection={onZoomSelection}
                                />
                            ) : (
                                <p className="text-xs text-zinc-500">
                                    Link and sync activity data to overlay
                                    actual traces.
                                </p>
                            )}
                        </div>

                        <div className="mt-3 rounded-md border border-border/70 bg-zinc-900/30 px-3 py-2">
                            {hoverSummary !== null ? (
                                <>
                                    <p className="text-[11px] text-zinc-400">
                                        {mode === 'distance'
                                            ? 'Distance'
                                            : 'Elapsed Time'}{' '}
                                        <span className="font-mono text-zinc-200">
                                            {formatXAxisValue(
                                                hoverSummary.xValue,
                                                mode,
                                            )}
                                        </span>
                                    </p>
                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                        {hoverSummary.values.map((item) => (
                                            <p
                                                key={item.key}
                                                className="text-[11px] text-zinc-500"
                                            >
                                                {streamLabels[item.key] ??
                                                    item.key}
                                                :{' '}
                                                <span
                                                    className="font-mono"
                                                    style={{
                                                        color:
                                                            streamColors[
                                                                item.key
                                                            ] ?? '#a1a1aa',
                                                    }}
                                                >
                                                    {formatStreamValue(
                                                        item.key,
                                                        item.value,
                                                    )}
                                                </span>
                                            </p>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-[11px] text-zinc-500">
                                    Hover the chart to inspect values and
                                    highlight route position.
                                </p>
                            )}
                        </div>
                    </div>

                    <aside
                        className={cn(
                            'overflow-hidden rounded-md border text-[11px] transition-all duration-300 ease-out xl:shrink-0',
                            showSelectionPanel
                                ? 'max-h-[420px] border-border/70 bg-zinc-900/35 px-3 py-2 opacity-100 xl:max-h-none xl:w-[17rem]'
                                : 'max-h-0 border-transparent p-0 opacity-0 xl:w-0',
                        )}
                    >
                        {selectedRangeSummary !== null ? (
                            <>
                                <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
                                    Selected Range
                                </p>
                                <div className="mt-1 grid gap-1">
                                    <SelectionStatLine
                                        label="From"
                                        value={formatXAxisValue(
                                            selectedRangeSummary.startXValue,
                                            mode,
                                        )}
                                    />
                                    <SelectionStatLine
                                        label="To"
                                        value={formatXAxisValue(
                                            selectedRangeSummary.endXValue,
                                            mode,
                                        )}
                                    />
                                </div>

                                <div className="mt-2 border-t border-border/70 pt-2">
                                    <div className="grid gap-1.5">
                                        <SelectionStatLine
                                            label="Duration"
                                            value={
                                                selectedRangeSummary.elapsedSeconds ===
                                                null
                                                    ? '—'
                                                    : formatDurationSeconds(
                                                          selectedRangeSummary.elapsedSeconds,
                                                      )
                                            }
                                        />
                                        <SelectionStatLine
                                            label="Distance"
                                            value={
                                                selectedRangeSummary.distanceKilometers ===
                                                null
                                                    ? '—'
                                                    : `${selectedRangeSummary.distanceKilometers.toFixed(2)} km`
                                            }
                                        />
                                        <SelectionStatLine
                                            label="Elevation Gain"
                                            value={
                                                selectedRangeSummary.elevationGainMeters ===
                                                null
                                                    ? '—'
                                                    : `${Math.round(selectedRangeSummary.elevationGainMeters)} m`
                                            }
                                        />
                                        <SelectionStatLine
                                            label="Avg HR"
                                            value={
                                                selectedRangeSummary.avgHeartRate ===
                                                null
                                                    ? '—'
                                                    : `${Math.round(selectedRangeSummary.avgHeartRate)} bpm`
                                            }
                                        />
                                        <SelectionStatLine
                                            label="Avg Power"
                                            value={
                                                selectedRangeSummary.avgPower ===
                                                null
                                                    ? '—'
                                                    : `${Math.round(selectedRangeSummary.avgPower)} W`
                                            }
                                        />
                                        <SelectionStatLine
                                            label="Avg Cadence"
                                            value={
                                                selectedRangeSummary.avgCadence ===
                                                null
                                                    ? '—'
                                                    : `${Math.round(selectedRangeSummary.avgCadence)} rpm`
                                            }
                                        />
                                        <SelectionStatLine
                                            label="Avg Speed"
                                            value={formatAverageSpeedForSport(
                                                sport,
                                                selectedRangeSummary.avgSpeedMetersPerSecond,
                                            )}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </aside>
                </div>
            </div>
        </div>
    );
}

function SelectionStatLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-2 rounded border border-zinc-800/80 bg-black/20 px-2 py-1.5">
            <span className="text-[10px] text-zinc-500">{label}</span>
            <span className="font-mono text-[11px] text-zinc-200">{value}</span>
        </div>
    );
}

function InteractiveStreamChart({
    mode,
    series,
    referencePoints,
    hoverSampleIndex,
    onHoverSampleIndexChange,
    onZoomSelection,
}: {
    mode: XAxisMode;
    series: StreamSeries[];
    referencePoints: Array<{ x: number; sampleIndex: number }>;
    hoverSampleIndex: number | null;
    onHoverSampleIndexChange: (sampleIndex: number | null) => void;
    onZoomSelection: (min: number, max: number) => void;
}) {
    const width = 960;
    const height = 380;
    const axisLeft = 50;
    const axisRight = 22;
    const axisTop = 16;
    const axisBottom = 36;

    const [selectionStartX, setSelectionStartX] = useState<number | null>(null);
    const [selectionEndX, setSelectionEndX] = useState<number | null>(null);
    const [hoverChartX, setHoverChartX] = useState<number | null>(null);

    const xValues = referencePoints.map((point) => point.x);
    const yValues = series.flatMap((item) => item.points.map((point) => point.y));

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minYRaw = Math.min(...yValues);
    const maxYRaw = Math.max(...yValues);
    const yPadding = Math.max(1, (maxYRaw - minYRaw) * 0.08);
    const minY = minYRaw - yPadding;
    const maxY = maxYRaw + yPadding;

    const chartWidth = width - axisLeft - axisRight;
    const chartHeight = height - axisTop - axisBottom;

    const hoveredReferencePoint =
        hoverSampleIndex === null
            ? null
            : (referencePoints.find(
                  (point) => point.sampleIndex === hoverSampleIndex,
              ) ?? null);

    const xTicks = Array.from({ length: 6 }, (_, index) => {
        const ratio = index / 5;
        const value = minX + (maxX - minX) * ratio;

        return {
            x: axisLeft + chartWidth * ratio,
            label: formatXAxisTick(value, mode),
        };
    });

    const yTicks = Array.from({ length: 5 }, (_, index) => {
        const ratio = index / 4;
        const value = maxY - (maxY - minY) * ratio;

        return {
            y: axisTop + chartHeight * ratio,
            label: `${Math.round(value)}`,
        };
    });

    const getChartXFromMouse = (
        event: ReactMouseEvent<SVGSVGElement, MouseEvent>,
    ): number => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const svgX = ((event.clientX - bounds.left) / bounds.width) * width;

        return Math.max(axisLeft, Math.min(axisLeft + chartWidth, svgX));
    };

    const chartXToDomain = (chartX: number): number => {
        return minX + ((chartX - axisLeft) / chartWidth) * (maxX - minX);
    };

    const selectionRectangle =
        selectionStartX !== null && selectionEndX !== null
            ? {
                  x: Math.min(selectionStartX, selectionEndX),
                  width: Math.abs(selectionEndX - selectionStartX),
              }
            : null;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-full w-full cursor-crosshair"
            preserveAspectRatio="xMidYMid meet"
            onMouseLeave={() => {
                onHoverSampleIndexChange(null);
                setHoverChartX(null);
                setSelectionStartX(null);
                setSelectionEndX(null);
            }}
            onMouseDown={(event) => {
                const chartX = getChartXFromMouse(event);
                setSelectionStartX(chartX);
                setSelectionEndX(chartX);
                setHoverChartX(chartX);
            }}
            onMouseMove={(event) => {
                const chartX = getChartXFromMouse(event);
                const domainX = chartXToDomain(chartX);

                setHoverChartX(chartX);

                const closest = referencePoints.reduce<{
                    distance: number;
                    sampleIndex: number;
                } | null>((current, point) => {
                    const distance = Math.abs(point.x - domainX);

                    if (current === null || distance < current.distance) {
                        return {
                            distance,
                            sampleIndex: point.sampleIndex,
                        };
                    }

                    return current;
                }, null);

                onHoverSampleIndexChange(closest?.sampleIndex ?? null);

                if (selectionStartX !== null) {
                    setSelectionEndX(chartX);
                }
            }}
            onMouseUp={() => {
                if (selectionStartX === null || selectionEndX === null) {
                    return;
                }

                if (Math.abs(selectionEndX - selectionStartX) >= 8) {
                    onZoomSelection(
                        chartXToDomain(selectionStartX),
                        chartXToDomain(selectionEndX),
                    );
                }

                setSelectionStartX(null);
                setSelectionEndX(null);
            }}
        >
            <rect
                x={axisLeft}
                y={axisTop}
                width={chartWidth}
                height={chartHeight}
                fill="#05070d"
                opacity={0.35}
            />

            {yTicks.map((tick) => (
                <g key={`y-${tick.y.toFixed(2)}`}>
                    <line
                        x1={axisLeft}
                        x2={axisLeft + chartWidth}
                        y1={tick.y}
                        y2={tick.y}
                        stroke="#27272a"
                        strokeWidth={1}
                        opacity={0.7}
                    />
                    <text
                        x={axisLeft - 8}
                        y={tick.y + 3}
                        textAnchor="end"
                        fill="#71717a"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                    >
                        {tick.label}
                    </text>
                </g>
            ))}

            {xTicks.map((tick) => (
                <g key={`x-${tick.x.toFixed(2)}`}>
                    <line
                        x1={tick.x}
                        x2={tick.x}
                        y1={axisTop}
                        y2={axisTop + chartHeight}
                        stroke="#27272a"
                        strokeWidth={1}
                        opacity={0.45}
                    />
                    <text
                        x={tick.x}
                        y={axisTop + chartHeight + 14}
                        textAnchor="middle"
                        fill="#71717a"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                    >
                        {tick.label}
                    </text>
                </g>
            ))}

            <line
                x1={axisLeft}
                x2={axisLeft + chartWidth}
                y1={axisTop + chartHeight}
                y2={axisTop + chartHeight}
                stroke="#3f3f46"
                strokeWidth={1}
            />
            <line
                x1={axisLeft}
                x2={axisLeft}
                y1={axisTop}
                y2={axisTop + chartHeight}
                stroke="#3f3f46"
                strokeWidth={1}
            />

            {series.map((item) => {
                const path = item.points
                    .map((point, index) => {
                        const x =
                            axisLeft +
                            ((point.x - minX) / Math.max(0.000001, maxX - minX)) *
                                chartWidth;
                        const y =
                            axisTop +
                            (1 -
                                (point.y - minY) /
                                    Math.max(0.000001, maxY - minY)) *
                                chartHeight;

                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ');

                return (
                    <g key={item.key}>
                        {item.key === 'elevation'
                            ? (() => {
                                  const first = item.points[0];
                                  const last = item.points[item.points.length - 1];

                                  if (first === undefined || last === undefined) {
                                      return null;
                                  }

                                  const firstX =
                                      axisLeft +
                                      ((first.x - minX) /
                                          Math.max(0.000001, maxX - minX)) *
                                          chartWidth;
                                  const lastX =
                                      axisLeft +
                                      ((last.x - minX) /
                                          Math.max(0.000001, maxX - minX)) *
                                          chartWidth;

                                  const zeroYRaw =
                                      axisTop +
                                      (1 -
                                          (0 - minY) /
                                              Math.max(0.000001, maxY - minY)) *
                                          chartHeight;
                                  const zeroY = Math.max(
                                      axisTop,
                                      Math.min(axisTop + chartHeight, zeroYRaw),
                                  );

                                  return (
                                      <path
                                          d={`${path} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`}
                                          fill="#a1a1aa"
                                          opacity={0.14}
                                      />
                                  );
                              })()
                            : null}

                        <path
                            d={path}
                            fill="none"
                            stroke={item.color}
                            strokeWidth={2}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />

                        {hoveredReferencePoint !== null
                            ? (() => {
                                  const hoveredPoint = item.points.find((point) => {
                                      return (
                                          point.sampleIndex ===
                                          hoveredReferencePoint.sampleIndex
                                      );
                                  });

                                  if (hoveredPoint === undefined) {
                                      return null;
                                  }

                                  const cx =
                                      axisLeft +
                                      ((hoveredPoint.x - minX) /
                                          Math.max(0.000001, maxX - minX)) *
                                          chartWidth;
                                  const cy =
                                      axisTop +
                                      (1 -
                                          (hoveredPoint.y - minY) /
                                              Math.max(0.000001, maxY - minY)) *
                                          chartHeight;

                                  return (
                                      <circle
                                          cx={cx}
                                          cy={cy}
                                          r={3.2}
                                          fill={item.color}
                                          stroke="#09090b"
                                          strokeWidth={1.5}
                                      />
                                  );
                              })()
                            : null}
                    </g>
                );
            })}

            {hoverChartX !== null ? (
                <line
                    x1={hoverChartX}
                    x2={hoverChartX}
                    y1={axisTop}
                    y2={axisTop + chartHeight}
                    stroke="#d4d4d8"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    opacity={0.65}
                />
            ) : null}

            {selectionRectangle !== null && selectionRectangle.width > 0 ? (
                <rect
                    x={selectionRectangle.x}
                    y={axisTop}
                    width={selectionRectangle.width}
                    height={chartHeight}
                    fill="#e4e4e7"
                    opacity={0.18}
                    stroke="#e4e4e7"
                    strokeWidth={1}
                    strokeDasharray="3 2"
                />
            ) : null}
        </svg>
    );
}
