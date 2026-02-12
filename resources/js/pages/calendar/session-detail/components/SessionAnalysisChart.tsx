import { RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { streamColors, streamLabels } from '../constants';
import type {
    SelectionRangeSummary,
    StreamSeries,
    XAxisMode,
} from '../types';
import {
    formatAverageSpeedForSport,
    formatDurationSeconds,
    formatStreamValue,
    formatXAxisValue,
} from '../utils';
import { InteractiveStreamChart } from './session-analysis-chart/InteractiveStreamChart';
import { SelectionStatLine } from './session-analysis-chart/SelectionStatLine';

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
                            'rounded border px-2 py-1 text-[0.625rem] transition-colors',
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
                            'rounded border px-2 py-1 text-[0.625rem] transition-colors',
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
                            className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900/60 px-2 py-1 text-[0.625rem] text-zinc-300 hover:text-zinc-100"
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
                                'rounded border px-2 py-1 text-[0.625rem] transition-colors',
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

            <p className="mt-2 text-[0.6875rem] text-zinc-500">
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
                        <div className="aspect-[16/6] min-h-[13.75rem] w-full">
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
                                    <p className="text-[0.6875rem] text-zinc-400">
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
                                                className="text-[0.6875rem] text-zinc-500"
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
                                <p className="text-[0.6875rem] text-zinc-500">
                                    Hover the chart to inspect values and
                                    highlight route position.
                                </p>
                            )}
                        </div>
                    </div>

                    <aside
                        className={cn(
                            'overflow-hidden rounded-md border text-[0.6875rem] transition-all duration-300 ease-out xl:shrink-0',
                            showSelectionPanel
                                ? 'max-h-[26.25rem] border-border/70 bg-zinc-900/35 px-3 py-2 opacity-100 xl:max-h-none xl:w-[17rem]'
                                : 'max-h-0 border-transparent p-0 opacity-0 xl:w-0',
                        )}
                    >
                        {selectedRangeSummary !== null ? (
                            <>
                                <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
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
