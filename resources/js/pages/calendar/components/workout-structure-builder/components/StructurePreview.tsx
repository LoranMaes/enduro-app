import type { DragEvent } from 'react';
import { cn } from '@/lib/utils';
import { unitDisplayLabels } from '../constants';
import type {
    AthleteTrainingTargets,
    PreviewGroup,
    WorkoutStructure,
} from '../types';
import {
    blockColor,
    blockLabel,
    formatAxisTickLabel,
    formatDurationMinutes,
} from '../utils';
import { StructureDragOverlay } from './StructureDragOverlay';

type StructurePreviewProps = {
    structure: WorkoutStructure;
    disabled: boolean;
    trainingTargets: AthleteTrainingTargets | null;
    previewGroups: PreviewGroup[];
    totalDuration: number;
    previewScaleMax: number;
    axisTicks: number[];
    insertionOffsets: number[];
    dragIndex: number | null;
    dropIndex: number | null;
    onStartDrag: (index: number, event: DragEvent<HTMLElement>) => void;
    onEndDrag: () => void;
    onPreviewDragOver: (event: DragEvent<HTMLElement>, index: number) => void;
    onDropCurrent: (event: DragEvent<HTMLElement>) => void;
};

export function StructurePreview({
    structure,
    disabled,
    trainingTargets,
    previewGroups,
    totalDuration,
    previewScaleMax,
    axisTicks,
    insertionOffsets,
    dragIndex,
    dropIndex,
    onStartDrag,
    onEndDrag,
    onPreviewDragOver,
    onDropCurrent,
}: StructurePreviewProps) {
    return (
        <div className="rounded-md border border-zinc-800 bg-zinc-950/70 p-2">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-[0.625rem] text-zinc-500 uppercase">
                    Workout Preview
                </p>
                <p className="text-[0.625rem] text-zinc-500 uppercase">
                    {unitDisplayLabels[structure.unit]} • {structure.mode}
                </p>
            </div>

            <div className="flex items-stretch gap-2">
                <div className="relative w-24 shrink-0 border-r border-zinc-800/80 pe-2">
                    {axisTicks.map((tick) => {
                        const bottom =
                            previewScaleMax === 0 ? 0 : (tick / previewScaleMax) * 100;

                        return (
                            <div
                                key={`axis-${tick}`}
                                className="pointer-events-none absolute inset-x-0"
                                style={{ bottom: `${bottom}%` }}
                            >
                                <span className="absolute right-0 translate-y-1/2 pe-1 text-[0.5625rem] text-zinc-500">
                                    {formatAxisTickLabel(
                                        tick,
                                        structure.unit,
                                        trainingTargets,
                                    )}
                                </span>
                            </div>
                        );
                    })}
                </div>

                <div className="relative min-w-0 flex-1">
                    <div className="relative h-44 overflow-hidden rounded border border-zinc-800/80 bg-zinc-950/40">
                        {[20, 40, 60, 80].map((line) => (
                            <div
                                key={`grid-${line}`}
                                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-zinc-800/60"
                                style={{ bottom: `${line}%` }}
                            />
                        ))}

                        {dropIndex !== null && insertionOffsets[dropIndex] !== undefined ? (
                            <StructureDragOverlay leftPercent={insertionOffsets[dropIndex]} />
                        ) : null}

                        <div className="flex h-full items-end">
                            {previewGroups.map((group, index) => {
                                const width =
                                    totalDuration > 0
                                        ? (group.totalDurationMinutes / totalDuration) * 100
                                        : 0;

                                return (
                                    <div
                                        key={`preview-${group.stepId}`}
                                        draggable={!disabled}
                                        onDragStart={(event) => onStartDrag(index, event)}
                                        onDragOver={(event) => onPreviewDragOver(event, index)}
                                        onDrop={onDropCurrent}
                                        onDragEnd={onEndDrag}
                                        className={cn(
                                            'relative flex h-full min-w-[1.375rem] cursor-grab items-end border-r border-zinc-900/70 px-[0.0625rem] pb-1',
                                            dragIndex === index && 'opacity-60',
                                            disabled && 'cursor-default',
                                        )}
                                        style={{ width: `${Math.max(4, width)}%` }}
                                    >
                                        <div className="flex h-full w-full items-end gap-[0.0625rem]">
                                            {group.segments.map((segment) => {
                                                const segmentWidth =
                                                    group.totalDurationMinutes > 0
                                                        ? (segment.durationMinutes /
                                                              group.totalDurationMinutes) *
                                                          100
                                                        : 0;
                                                const minHeight = Math.max(
                                                    0,
                                                    Math.min(
                                                        100,
                                                        (segment.intensityMin /
                                                            previewScaleMax) *
                                                            100,
                                                    ),
                                                );
                                                const maxHeight = Math.max(
                                                    minHeight,
                                                    Math.min(
                                                        100,
                                                        (segment.intensityMax /
                                                            previewScaleMax) *
                                                            100,
                                                    ),
                                                );
                                                const rangeHeight = Math.max(
                                                    2,
                                                    maxHeight - minHeight,
                                                );

                                                return (
                                                    <div
                                                        key={segment.id}
                                                        className="relative h-full min-w-[0.25rem]"
                                                        style={{
                                                            width: `${Math.max(8, segmentWidth)}%`,
                                                        }}
                                                        title={`${blockLabel(segment.type)} • ${segment.durationMinutes}m`}
                                                    >
                                                        <div
                                                            className={cn(
                                                                'absolute inset-x-0 rounded-sm border border-white/5 opacity-45',
                                                                blockColor(segment.type),
                                                            )}
                                                            style={{
                                                                bottom: 0,
                                                                height: `${Math.max(2, maxHeight)}%`,
                                                            }}
                                                        />
                                                        <div
                                                            className={cn(
                                                                'absolute inset-x-0 rounded-sm border border-white/15',
                                                                blockColor(segment.type),
                                                            )}
                                                            style={{
                                                                bottom: `${minHeight}%`,
                                                                height: `${rangeHeight}%`,
                                                            }}
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {group.patternLabel !== null ? (
                                            <span className="pointer-events-none absolute right-1 top-1 rounded bg-zinc-950/90 px-1 py-0.5 text-[0.5625rem] font-medium text-zinc-300">
                                                {group.patternLabel}
                                            </span>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[0.625rem] text-zinc-500">
                        <span>0m</span>
                        <span>
                            {formatDurationMinutes(Math.round(totalDuration / 2))}
                        </span>
                        <span>{formatDurationMinutes(totalDuration)}</span>
                    </div>
                </div>
            </div>

            <p className="mt-2 text-[0.625rem] text-zinc-500">
                Drag preview groups to reorder. Range mode uses full-fill bars with
                highlighted range bands.
            </p>
        </div>
    );
}
