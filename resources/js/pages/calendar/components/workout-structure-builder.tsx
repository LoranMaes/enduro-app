import {
    ArrowDown,
    ArrowUp,
    GripVertical,
    Minus,
    Plus,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { type DragEvent, useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

export type WorkoutStructureMode = 'range' | 'target';
export type WorkoutStructureUnit =
    | 'ftp_percent'
    | 'max_hr_percent'
    | 'threshold_hr_percent'
    | 'threshold_speed_percent'
    | 'rpe';
export type WorkoutStructureBlockType =
    | 'warmup'
    | 'active'
    | 'recovery'
    | 'cooldown'
    | 'two_step_repeats'
    | 'three_step_repeats'
    | 'repeats'
    | 'ramp_up'
    | 'ramp_down';

export type WorkoutStructureItem = {
    id: string;
    label: string;
    durationMinutes: number;
    target: number | null;
    rangeMin: number | null;
    rangeMax: number | null;
};

export type WorkoutStructureStep = {
    id: string;
    type: WorkoutStructureBlockType;
    durationMinutes: number;
    target: number | null;
    rangeMin: number | null;
    rangeMax: number | null;
    repeatCount: number;
    items: WorkoutStructureItem[] | null;
    note: string;
};

export type WorkoutStructure = {
    unit: WorkoutStructureUnit;
    mode: WorkoutStructureMode;
    steps: WorkoutStructureStep[];
};

export type AthleteTrainingTargets = {
    ftp_watts: number | null;
    max_heart_rate_bpm: number | null;
    threshold_heart_rate_bpm: number | null;
    threshold_pace_minutes_per_km: number | null;
    power_zones: Array<{
        label: string;
        min: number;
        max: number;
    }>;
    heart_rate_zones: Array<{
        label: string;
        min: number;
        max: number;
    }>;
};

type WorkoutStructureBuilderProps = {
    value: WorkoutStructure | null;
    sport: string;
    trainingTargets: AthleteTrainingTargets | null;
    disabled?: boolean;
    onChange: (next: WorkoutStructure | null) => void;
};

type BlockDefinition = {
    type: WorkoutStructureBlockType;
    label: string;
    defaultDuration: number;
    helperText: string;
};

type PreviewSegment = {
    id: string;
    durationMinutes: number;
    type: WorkoutStructureBlockType;
    intensityMin: number;
    intensityMax: number;
};

const blockDefinitions: BlockDefinition[] = [
    {
        type: 'warmup',
        label: 'Warmup',
        defaultDuration: 12,
        helperText: 'Single preparation block.',
    },
    {
        type: 'active',
        label: 'Active',
        defaultDuration: 8,
        helperText: 'Main work effort.',
    },
    {
        type: 'recovery',
        label: 'Recovery',
        defaultDuration: 4,
        helperText: 'Low-intensity reset block.',
    },
    {
        type: 'cooldown',
        label: 'Cool Down',
        defaultDuration: 10,
        helperText: 'Easy finish and de-load.',
    },
    {
        type: 'two_step_repeats',
        label: 'Two Step Repeats',
        defaultDuration: 8,
        helperText: 'Two-item repeating pattern with editable inner blocks.',
    },
    {
        type: 'three_step_repeats',
        label: 'Three Step Repeats',
        defaultDuration: 9,
        helperText: 'Three-item repeating pattern with editable inner blocks.',
    },
    {
        type: 'repeats',
        label: 'Repeats',
        defaultDuration: 6,
        helperText: 'Custom repeat cycle. Repeat count only lives here.',
    },
    {
        type: 'ramp_up',
        label: 'Ramp Up',
        defaultDuration: 8,
        helperText: 'Predefined 4-step progressive build.',
    },
    {
        type: 'ramp_down',
        label: 'Ramp Down',
        defaultDuration: 8,
        helperText: 'Predefined 4-step progressive unload.',
    },
];

const unitLabels: Record<WorkoutStructureUnit, string> = {
    ftp_percent: '% Functional Threshold Power',
    max_hr_percent: '% Maximum Heart Rate',
    threshold_hr_percent: '% Threshold Heart Rate',
    threshold_speed_percent: '% Threshold Speed',
    rpe: 'RPE',
};

const unitDisplayLabels: Record<WorkoutStructureUnit, string> = {
    ftp_percent: 'FTP%',
    max_hr_percent: 'Max HR%',
    threshold_hr_percent: 'THR%',
    threshold_speed_percent: 'Threshold Speed%',
    rpe: 'RPE',
};

export function WorkoutStructureBuilder({
    value,
    sport,
    trainingTargets,
    disabled = false,
    onChange,
}: WorkoutStructureBuilderProps) {
    const [dragIndex, setDragIndex] = useState<number | null>(null);
    const [dropIndex, setDropIndex] = useState<number | null>(null);

    const previewGroups = useMemo(() => {
        if (value === null) {
            return [] as Array<{
                stepId: string;
                stepIndex: number;
                totalDurationMinutes: number;
                patternLabel: string | null;
                segments: PreviewSegment[];
            }>;
        }

        return value.steps.map((step, stepIndex) => {
            const segments = buildPreviewSegments(step, value.mode, value.unit);
            const totalDurationMinutes = segments.reduce(
                (carry, segment) =>
                    carry + Math.max(1, segment.durationMinutes),
                0,
            );

            return {
                stepId: step.id,
                stepIndex,
                totalDurationMinutes,
                patternLabel: patternLabelForStep(step),
                segments,
            };
        });
    }, [value]);

    const totalDuration = useMemo(() => {
        if (value === null) {
            return 0;
        }

        return calculateWorkoutStructureDurationMinutes(value);
    }, [value]);

    const estimatedTss = useMemo(() => {
        return estimateWorkoutStructureTss(value);
    }, [value]);

    const previewScaleMax = useMemo(() => {
        if (value === null) {
            return 120;
        }

        const maxIntensity = previewGroups
            .flatMap((group) => group.segments)
            .reduce(
                (carry, segment) => Math.max(carry, segment.intensityMax),
                0,
            );

        if (value.unit === 'rpe') {
            return Math.max(10, Math.ceil(maxIntensity));
        }

        return Math.max(120, Math.ceil((maxIntensity + 5) / 5) * 5);
    }, [previewGroups, value]);

    const axisTicks = useMemo(() => {
        if (value === null) {
            return [] as number[];
        }

        const defaultTicks =
            value.unit === 'rpe'
                ? [0, 2, 4, 6, 8, 10]
                : [0, 50, 75, 100, previewScaleMax];

        return Array.from(new Set(defaultTicks))
            .filter((tick) => tick <= previewScaleMax)
            .sort((left, right) => left - right);
    }, [previewScaleMax, value]);

    const insertionOffsets = useMemo(() => {
        if (previewGroups.length === 0 || totalDuration <= 0) {
            return [0];
        }

        const offsets = [0];
        let accumulatedDuration = 0;

        previewGroups.forEach((group) => {
            accumulatedDuration += group.totalDurationMinutes;
            offsets.push((accumulatedDuration / totalDuration) * 100);
        });

        return offsets;
    }, [previewGroups, totalDuration]);

    const ensureStructure = (): WorkoutStructure => {
        if (value !== null) {
            return value;
        }

        const next = createDefaultStructureForSport(sport);
        onChange(next);

        return next;
    };

    const updateStructure = (
        updater: (current: WorkoutStructure) => WorkoutStructure,
    ): void => {
        onChange(updater(ensureStructure()));
    };

    const replaceStep = (
        index: number,
        updater: (step: WorkoutStructureStep) => WorkoutStructureStep,
    ): void => {
        if (disabled || value === null || value.steps[index] === undefined) {
            return;
        }

        const nextSteps = [...value.steps];
        nextSteps[index] = updater(nextSteps[index]);

        onChange({
            ...value,
            steps: nextSteps,
        });
    };

    const addStep = (type: WorkoutStructureBlockType): void => {
        if (disabled) {
            return;
        }

        const definition = blockDefinitions.find((item) => item.type === type);

        if (definition === undefined) {
            return;
        }

        updateStructure((structure) => ({
            ...structure,
            steps: [
                ...structure.steps,
                createStep({
                    type,
                    durationMinutes: definition.defaultDuration,
                    unit: structure.unit,
                    index: structure.steps.length,
                }),
            ],
        }));
    };

    const removeStep = (index: number): void => {
        if (disabled || value === null || value.steps[index] === undefined) {
            return;
        }

        onChange({
            ...value,
            steps: value.steps.filter(
                (_, currentIndex) => currentIndex !== index,
            ),
        });
    };

    const moveStep = (from: number, to: number): void => {
        if (
            disabled ||
            value === null ||
            from === to ||
            value.steps[from] === undefined
        ) {
            return;
        }

        const targetIndex = Math.max(0, Math.min(to, value.steps.length));
        const nextSteps = [...value.steps];
        const [movedStep] = nextSteps.splice(from, 1);
        const adjustedIndex =
            targetIndex > from ? targetIndex - 1 : targetIndex;
        nextSteps.splice(adjustedIndex, 0, movedStep);

        onChange({
            ...value,
            steps: nextSteps,
        });
    };

    const moveStepByOne = (index: number, direction: -1 | 1): void => {
        if (value === null) {
            return;
        }

        const nextIndex = index + direction;

        if (nextIndex < 0 || nextIndex >= value.steps.length) {
            return;
        }

        moveStep(index, nextIndex);
    };

    const addRepeatItem = (stepIndex: number): void => {
        replaceStep(stepIndex, (step) => {
            if (step.type !== 'repeats') {
                return step;
            }

            const template = defaultItemDefinition(
                step.type,
                step.items?.length ?? 0,
                step.type,
                value?.unit ?? 'rpe',
            );

            return {
                ...step,
                items: [...(step.items ?? []), template],
            };
        });
    };

    const removeRepeatItem = (stepIndex: number, itemIndex: number): void => {
        replaceStep(stepIndex, (step) => {
            if (
                step.type !== 'repeats' ||
                step.items === null ||
                step.items.length <= 1
            ) {
                return step;
            }

            return {
                ...step,
                items: step.items.filter(
                    (_, currentIndex) => currentIndex !== itemIndex,
                ),
            };
        });
    };

    const updateStepItems = (
        stepIndex: number,
        updater: (items: WorkoutStructureItem[]) => WorkoutStructureItem[],
    ): void => {
        replaceStep(stepIndex, (step) => {
            if (step.items === null) {
                return step;
            }

            return {
                ...step,
                items: updater(step.items),
            };
        });
    };

    const updateStepItem = (
        stepIndex: number,
        itemIndex: number,
        updater: (item: WorkoutStructureItem) => WorkoutStructureItem,
    ): void => {
        updateStepItems(stepIndex, (items) => {
            if (items[itemIndex] === undefined) {
                return items;
            }

            const next = [...items];
            next[itemIndex] = updater(next[itemIndex]);

            return next;
        });
    };

    const canDrop = (dropAt: number): boolean => {
        if (dragIndex === null || value === null) {
            return false;
        }

        return dropAt >= 0 && dropAt <= value.steps.length;
    };

    const commitDrop = (dropAt: number): void => {
        if (!canDrop(dropAt) || dragIndex === null) {
            return;
        }

        moveStep(dragIndex, dropAt);
        setDragIndex(null);
        setDropIndex(null);
    };

    return (
        <section className="space-y-3 rounded-md border border-border bg-background/55 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-medium tracking-wide text-zinc-300 uppercase">
                        Workout Structure
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                        Edit interval blocks directly. Repeats and ramps support
                        per-item targets.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {value === null ? (
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() =>
                                onChange(createDefaultStructureForSport(sport))
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/70 px-2.5 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Build
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(null)}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {value === null ? (
                <p className="rounded-md border border-dashed border-zinc-700/70 px-3 py-3 text-xs text-zinc-500">
                    No structured workout blocks set for this session.
                </p>
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 uppercase">
                                Unit
                            </label>
                            <select
                                value={value.unit}
                                disabled={disabled}
                                onChange={(event) => {
                                    const nextUnit = event.target
                                        .value as WorkoutStructureUnit;
                                    updateStructure((structure) => ({
                                        ...structure,
                                        unit: nextUnit,
                                        steps: structure.steps.map(
                                            (step, index) => {
                                                return resetStepForType(
                                                    step.type,
                                                    nextUnit,
                                                    index,
                                                    step,
                                                );
                                            },
                                        ),
                                    }));
                                }}
                                className="w-full rounded-md border border-border bg-zinc-900/60 px-2 py-1.5 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none disabled:opacity-60"
                            >
                                {Object.entries(unitLabels).map(
                                    ([unit, label]) => (
                                        <option key={unit} value={unit}>
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] text-zinc-500 uppercase">
                                Mode
                            </label>
                            <select
                                value={value.mode}
                                disabled={disabled}
                                onChange={(event) => {
                                    updateStructure((structure) => ({
                                        ...structure,
                                        mode: event.target
                                            .value as WorkoutStructureMode,
                                    }));
                                }}
                                className="w-full rounded-md border border-border bg-zinc-900/60 px-2 py-1.5 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none disabled:opacity-60"
                            >
                                <option value="range">Range</option>
                                <option value="target">Target</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-md border border-border/70 bg-zinc-950/40 p-2">
                        <MetricTile
                            label="Total Duration"
                            value={formatDurationMinutes(totalDuration)}
                        />
                        <MetricTile
                            label="Estimated TSS"
                            value={
                                estimatedTss === null ? '—' : `${estimatedTss}`
                            }
                        />
                        <MetricTile
                            label="Blocks"
                            value={`${value.steps.length}`}
                        />
                    </div>

                    <div className="rounded-md border border-zinc-800 bg-zinc-950/70 p-2">
                        <div className="mb-2 flex items-center justify-between">
                            <p className="text-[10px] text-zinc-500 uppercase">
                                Workout Preview
                            </p>
                            <p className="text-[10px] text-zinc-500 uppercase">
                                {unitDisplayLabels[value.unit]} • {value.mode}
                            </p>
                        </div>

                        <div className="flex items-stretch gap-2">
                            <div className="relative w-24 shrink-0 border-r border-zinc-800/80 pr-2">
                                {axisTicks.map((tick) => {
                                    const bottom =
                                        previewScaleMax === 0
                                            ? 0
                                            : (tick / previewScaleMax) * 100;

                                    return (
                                        <div
                                            key={`axis-${tick}`}
                                            className="pointer-events-none absolute right-0 left-0"
                                            style={{ bottom: `${bottom}%` }}
                                        >
                                            <span className="absolute right-0 translate-y-1/2 pr-1 text-[9px] text-zinc-500">
                                                {formatAxisTickLabel(
                                                    tick,
                                                    value.unit,
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
                                            className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-zinc-800/60"
                                            style={{ bottom: `${line}%` }}
                                        />
                                    ))}

                                    {dropIndex !== null &&
                                    insertionOffsets[dropIndex] !==
                                        undefined ? (
                                        <div
                                            className="pointer-events-none absolute top-0 bottom-0 z-20 w-0.5 bg-sky-400"
                                            style={{
                                                left: `${insertionOffsets[dropIndex]}%`,
                                            }}
                                        />
                                    ) : null}

                                    <div className="flex h-full items-end">
                                        {previewGroups.map((group, index) => {
                                            const width =
                                                totalDuration > 0
                                                    ? (group.totalDurationMinutes /
                                                          totalDuration) *
                                                      100
                                                    : 0;

                                            return (
                                                <div
                                                    key={`preview-${group.stepId}`}
                                                    draggable={!disabled}
                                                    onDragStart={(event) => {
                                                        if (disabled) {
                                                            return;
                                                        }

                                                        setDragIndex(index);
                                                        setDropIndex(index);
                                                        event.dataTransfer.effectAllowed =
                                                            'move';
                                                    }}
                                                    onDragOver={(event) => {
                                                        if (
                                                            disabled ||
                                                            dragIndex === null
                                                        ) {
                                                            return;
                                                        }

                                                        event.preventDefault();
                                                        const bounds =
                                                            event.currentTarget.getBoundingClientRect();
                                                        const insertAt =
                                                            event.clientX <
                                                            bounds.left +
                                                                bounds.width / 2
                                                                ? index
                                                                : index + 1;

                                                        setDropIndex(insertAt);
                                                    }}
                                                    onDrop={(event) => {
                                                        event.preventDefault();
                                                        if (
                                                            dropIndex !== null
                                                        ) {
                                                            commitDrop(
                                                                dropIndex,
                                                            );
                                                        }
                                                    }}
                                                    onDragEnd={() => {
                                                        setDragIndex(null);
                                                        setDropIndex(null);
                                                    }}
                                                    className={cn(
                                                        'relative flex h-full min-w-[22px] cursor-grab items-end border-r border-zinc-900/70 px-[1px] pb-1',
                                                        dragIndex === index &&
                                                            'opacity-60',
                                                        disabled &&
                                                            'cursor-default',
                                                    )}
                                                    style={{
                                                        width: `${Math.max(4, width)}%`,
                                                    }}
                                                >
                                                    <div className="flex h-full w-full items-end gap-[1px]">
                                                        {group.segments.map(
                                                            (segment) => {
                                                                const segmentWidth =
                                                                    group.totalDurationMinutes >
                                                                    0
                                                                        ? (segment.durationMinutes /
                                                                              group.totalDurationMinutes) *
                                                                          100
                                                                        : 0;
                                                                const minHeight =
                                                                    Math.max(
                                                                        0,
                                                                        Math.min(
                                                                            100,
                                                                            (segment.intensityMin /
                                                                                previewScaleMax) *
                                                                                100,
                                                                        ),
                                                                    );
                                                                const maxHeight =
                                                                    Math.max(
                                                                        minHeight,
                                                                        Math.min(
                                                                            100,
                                                                            (segment.intensityMax /
                                                                                previewScaleMax) *
                                                                                100,
                                                                        ),
                                                                    );
                                                                const rangeHeight =
                                                                    Math.max(
                                                                        2,
                                                                        maxHeight -
                                                                            minHeight,
                                                                    );

                                                                return (
                                                                    <div
                                                                        key={
                                                                            segment.id
                                                                        }
                                                                        className="relative h-full min-w-[4px]"
                                                                        style={{
                                                                            width: `${Math.max(8, segmentWidth)}%`,
                                                                        }}
                                                                        title={`${blockLabel(segment.type)} • ${segment.durationMinutes}m`}
                                                                    >
                                                                        <div
                                                                            className={cn(
                                                                                'absolute right-0 left-0 rounded-sm border border-white/5 opacity-45',
                                                                                blockColor(
                                                                                    segment.type,
                                                                                ),
                                                                            )}
                                                                            style={{
                                                                                bottom: 0,
                                                                                height: `${Math.max(2, maxHeight)}%`,
                                                                            }}
                                                                        />
                                                                        <div
                                                                            className={cn(
                                                                                'absolute right-0 left-0 rounded-sm border border-white/15',
                                                                                blockColor(
                                                                                    segment.type,
                                                                                ),
                                                                            )}
                                                                            style={{
                                                                                bottom: `${minHeight}%`,
                                                                                height: `${rangeHeight}%`,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>

                                                    {group.patternLabel !==
                                                    null ? (
                                                        <span className="pointer-events-none absolute top-1 right-1 rounded bg-zinc-950/90 px-1 py-0.5 text-[9px] font-medium text-zinc-300">
                                                            {group.patternLabel}
                                                        </span>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500">
                                    <span>0m</span>
                                    <span>
                                        {formatDurationMinutes(
                                            Math.round(totalDuration / 2),
                                        )}
                                    </span>
                                    <span>
                                        {formatDurationMinutes(totalDuration)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p className="mt-2 text-[10px] text-zinc-500">
                            Drag preview groups to reorder. Range mode uses
                            full-fill bars with highlighted range bands.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5 rounded-md border border-border/70 bg-zinc-950/40 p-2">
                        {blockDefinitions.map((definition) => (
                            <button
                                key={definition.type}
                                type="button"
                                disabled={disabled}
                                onClick={() => addStep(definition.type)}
                                className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900/50 px-2 py-1 text-[10px] text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                                title={definition.helperText}
                            >
                                <Plus className="h-3 w-3" />
                                {definition.label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-1">
                        <DropSeparator
                            active={dragIndex !== null && dropIndex === 0}
                            disabled={disabled}
                            onDragOver={(event) => {
                                if (dragIndex === null || disabled) {
                                    return;
                                }

                                event.preventDefault();
                                setDropIndex(0);
                            }}
                            onDrop={(event) => {
                                event.preventDefault();
                                commitDrop(0);
                            }}
                        />

                        {value.steps.map((step, index) => {
                            const definition = blockDefinitions.find(
                                (item) => item.type === step.type,
                            );
                            const usesItems = stepUsesItems(step.type);
                            const canAdjustRepeatCount =
                                step.type === 'repeats';
                            const canEditItemCount = step.type === 'repeats';

                            return (
                                <div key={step.id} className="space-y-1">
                                    <div
                                        onDragOver={(event) => {
                                            if (
                                                disabled ||
                                                dragIndex === null
                                            ) {
                                                return;
                                            }

                                            event.preventDefault();
                                            const bounds =
                                                event.currentTarget.getBoundingClientRect();
                                            const insertAt =
                                                event.clientY <
                                                bounds.top + bounds.height / 2
                                                    ? index
                                                    : index + 1;
                                            setDropIndex(insertAt);
                                        }}
                                        onDrop={(event) => {
                                            event.preventDefault();
                                            if (dropIndex !== null) {
                                                commitDrop(dropIndex);
                                            }
                                        }}
                                        className={cn(
                                            'relative rounded-md border border-border bg-zinc-900/40 p-2',
                                            dragIndex === index && 'opacity-60',
                                            dragIndex !== null &&
                                                dropIndex === index &&
                                                'ring-1 ring-sky-400/80',
                                        )}
                                    >
                                        {dragIndex !== null &&
                                        dropIndex === index ? (
                                            <div className="pointer-events-none absolute inset-x-2 top-0 h-0.5 -translate-y-1/2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.55)]" />
                                        ) : null}

                                        <div className="mb-2 flex items-center gap-2">
                                            <button
                                                type="button"
                                                draggable={!disabled}
                                                aria-label="Drag to reorder block"
                                                onDragStart={(event) => {
                                                    if (disabled) {
                                                        return;
                                                    }

                                                    setDragIndex(index);
                                                    setDropIndex(index);
                                                    event.dataTransfer.effectAllowed =
                                                        'move';
                                                }}
                                                onDragEnd={() => {
                                                    setDragIndex(null);
                                                    setDropIndex(null);
                                                }}
                                                className={cn(
                                                    'inline-flex h-5 w-5 cursor-grab items-center justify-center rounded border border-zinc-700 bg-zinc-900 text-zinc-500 transition-colors hover:text-zinc-300 active:cursor-grabbing',
                                                    disabled &&
                                                        'cursor-default opacity-60',
                                                )}
                                            >
                                                <GripVertical className="h-3.5 w-3.5" />
                                            </button>

                                            <select
                                                value={step.type}
                                                disabled={disabled}
                                                onChange={(event) => {
                                                    const nextType = event
                                                        .target
                                                        .value as WorkoutStructureBlockType;
                                                    replaceStep(index, () => {
                                                        return createStep({
                                                            type: nextType,
                                                            durationMinutes:
                                                                blockDefinitions.find(
                                                                    (item) =>
                                                                        item.type ===
                                                                        nextType,
                                                                )
                                                                    ?.defaultDuration ??
                                                                8,
                                                            unit: value.unit,
                                                            index,
                                                        });
                                                    });
                                                }}
                                                className="rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                            >
                                                {blockDefinitions.map(
                                                    (item) => (
                                                        <option
                                                            key={item.type}
                                                            value={item.type}
                                                        >
                                                            {item.label}
                                                        </option>
                                                    ),
                                                )}
                                            </select>

                                            {patternLabelForStep(step) !==
                                            null ? (
                                                <span className="rounded border border-zinc-700/80 bg-zinc-800/70 px-1.5 py-0.5 text-[10px] text-zinc-300">
                                                    {patternLabelForStep(step)}
                                                </span>
                                            ) : null}

                                            <div className="ml-auto flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    aria-label="Move block up"
                                                    disabled={
                                                        disabled || index === 0
                                                    }
                                                    onClick={() =>
                                                        moveStepByOne(index, -1)
                                                    }
                                                    className="inline-flex h-6 w-6 items-center justify-center rounded border border-zinc-700 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40"
                                                >
                                                    <ArrowUp className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label="Move block down"
                                                    disabled={
                                                        disabled ||
                                                        index ===
                                                            value.steps.length -
                                                                1
                                                    }
                                                    onClick={() =>
                                                        moveStepByOne(index, 1)
                                                    }
                                                    className="inline-flex h-6 w-6 items-center justify-center rounded border border-zinc-700 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40"
                                                >
                                                    <ArrowDown className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    aria-label="Delete block"
                                                    onClick={() =>
                                                        removeStep(index)
                                                    }
                                                    disabled={disabled}
                                                    className="inline-flex h-6 w-6 items-center justify-center rounded border border-red-900/40 text-red-300 transition-colors hover:bg-red-950/30 disabled:opacity-40"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {!usesItems ? (
                                            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] text-zinc-500 uppercase">
                                                        Duration (min)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={600}
                                                        value={
                                                            step.durationMinutes
                                                        }
                                                        disabled={disabled}
                                                        onChange={(event) => {
                                                            replaceStep(
                                                                index,
                                                                (current) => ({
                                                                    ...current,
                                                                    durationMinutes:
                                                                        Math.max(
                                                                            1,
                                                                            Number(
                                                                                event
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                                1,
                                                                        ),
                                                                }),
                                                            );
                                                        }}
                                                        className="w-full rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 font-mono text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                                    />
                                                </div>

                                                <IntensityEditor
                                                    mode={value.mode}
                                                    step={step}
                                                    disabled={disabled}
                                                    trainingTargets={
                                                        trainingTargets
                                                    }
                                                    unit={value.unit}
                                                    onChange={(nextStep) => {
                                                        replaceStep(
                                                            index,
                                                            () => nextStep,
                                                        );
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {canAdjustRepeatCount ? (
                                                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] text-zinc-500 uppercase">
                                                                Repeats
                                                            </label>
                                                            <div className="flex items-center rounded border border-zinc-700 bg-zinc-900/80">
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        disabled ||
                                                                        !canAdjustRepeatCount
                                                                    }
                                                                    onClick={() => {
                                                                        replaceStep(
                                                                            index,
                                                                            (
                                                                                current,
                                                                            ) => ({
                                                                                ...current,
                                                                                repeatCount:
                                                                                    Math.max(
                                                                                        2,
                                                                                        current.repeatCount -
                                                                                            1,
                                                                                    ),
                                                                            }),
                                                                        );
                                                                    }}
                                                                    className="inline-flex h-7 w-7 items-center justify-center text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
                                                                >
                                                                    <Minus className="h-3 w-3" />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min={2}
                                                                    max={20}
                                                                    value={
                                                                        step.repeatCount
                                                                    }
                                                                    disabled={
                                                                        disabled ||
                                                                        !canAdjustRepeatCount
                                                                    }
                                                                    onChange={(
                                                                        event,
                                                                    ) => {
                                                                        replaceStep(
                                                                            index,
                                                                            (
                                                                                current,
                                                                            ) => ({
                                                                                ...current,
                                                                                repeatCount:
                                                                                    Math.max(
                                                                                        2,
                                                                                        Number(
                                                                                            event
                                                                                                .target
                                                                                                .value,
                                                                                        ) ||
                                                                                            2,
                                                                                    ),
                                                                            }),
                                                                        );
                                                                    }}
                                                                    className="w-full bg-transparent px-1 text-center font-mono text-xs text-zinc-200 focus:outline-none disabled:opacity-50"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    disabled={
                                                                        disabled ||
                                                                        !canAdjustRepeatCount
                                                                    }
                                                                    onClick={() => {
                                                                        replaceStep(
                                                                            index,
                                                                            (
                                                                                current,
                                                                            ) => ({
                                                                                ...current,
                                                                                repeatCount:
                                                                                    current.repeatCount +
                                                                                    1,
                                                                            }),
                                                                        );
                                                                    }}
                                                                    className="inline-flex h-7 w-7 items-center justify-center text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
                                                                >
                                                                    <Plus className="h-3 w-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : null}

                                                <div className="space-y-2">
                                                    {(step.items ?? []).map(
                                                        (item, itemIndex) => (
                                                            <div
                                                                key={item.id}
                                                                className="rounded border border-zinc-800/80 bg-zinc-900/40 p-2"
                                                            >
                                                                <div className="mb-2 flex items-center gap-2">
                                                                    <input
                                                                        type="text"
                                                                        value={
                                                                            item.label
                                                                        }
                                                                        disabled={
                                                                            disabled
                                                                        }
                                                                        onChange={(
                                                                            event,
                                                                        ) => {
                                                                            updateStepItem(
                                                                                index,
                                                                                itemIndex,
                                                                                (
                                                                                    currentItem,
                                                                                ) => ({
                                                                                    ...currentItem,
                                                                                    label: event
                                                                                        .target
                                                                                        .value,
                                                                                }),
                                                                            );
                                                                        }}
                                                                        className="w-full rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                                                    />

                                                                    {canEditItemCount ? (
                                                                        <button
                                                                            type="button"
                                                                            aria-label="Remove repeat item"
                                                                            disabled={
                                                                                disabled ||
                                                                                (step
                                                                                    .items
                                                                                    ?.length ??
                                                                                    0) <=
                                                                                    1
                                                                            }
                                                                            onClick={() =>
                                                                                removeRepeatItem(
                                                                                    index,
                                                                                    itemIndex,
                                                                                )
                                                                            }
                                                                            className="inline-flex h-6 w-6 items-center justify-center rounded border border-red-900/40 text-red-300 transition-colors hover:bg-red-950/30 disabled:opacity-40"
                                                                        >
                                                                            <Trash2 className="h-3.5 w-3.5" />
                                                                        </button>
                                                                    ) : null}
                                                                </div>

                                                                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                                                                    <div className="space-y-1">
                                                                        <label className="text-[10px] text-zinc-500 uppercase">
                                                                            Duration
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            min={
                                                                                1
                                                                            }
                                                                            max={
                                                                                600
                                                                            }
                                                                            value={
                                                                                item.durationMinutes
                                                                            }
                                                                            disabled={
                                                                                disabled
                                                                            }
                                                                            onChange={(
                                                                                event,
                                                                            ) => {
                                                                                updateStepItem(
                                                                                    index,
                                                                                    itemIndex,
                                                                                    (
                                                                                        currentItem,
                                                                                    ) => ({
                                                                                        ...currentItem,
                                                                                        durationMinutes:
                                                                                            Math.max(
                                                                                                1,
                                                                                                Number(
                                                                                                    event
                                                                                                        .target
                                                                                                        .value,
                                                                                                ) ||
                                                                                                    1,
                                                                                            ),
                                                                                    }),
                                                                                );
                                                                            }}
                                                                            className="w-full rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 font-mono text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
                                                                        />
                                                                    </div>

                                                                    <IntensityEditor
                                                                        mode={
                                                                            value.mode
                                                                        }
                                                                        step={{
                                                                            ...step,
                                                                            target: item.target,
                                                                            rangeMin:
                                                                                item.rangeMin,
                                                                            rangeMax:
                                                                                item.rangeMax,
                                                                        }}
                                                                        disabled={
                                                                            disabled
                                                                        }
                                                                        trainingTargets={
                                                                            trainingTargets
                                                                        }
                                                                        unit={
                                                                            value.unit
                                                                        }
                                                                        onChange={(
                                                                            nextStep,
                                                                        ) => {
                                                                            updateStepItem(
                                                                                index,
                                                                                itemIndex,
                                                                                (
                                                                                    currentItem,
                                                                                ) => ({
                                                                                    ...currentItem,
                                                                                    target: nextStep.target,
                                                                                    rangeMin:
                                                                                        nextStep.rangeMin,
                                                                                    rangeMax:
                                                                                        nextStep.rangeMax,
                                                                                }),
                                                                            );
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ),
                                                    )}

                                                    {canEditItemCount ? (
                                                        <button
                                                            type="button"
                                                            disabled={disabled}
                                                            onClick={() =>
                                                                addRepeatItem(
                                                                    index,
                                                                )
                                                            }
                                                            className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900/60 px-2 py-1 text-[10px] text-zinc-300 transition-colors hover:bg-zinc-800 disabled:opacity-50"
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Add repeat item
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-2 space-y-1">
                                            <p className="text-[10px] text-zinc-500">
                                                {definition?.helperText}
                                            </p>
                                            <input
                                                type="text"
                                                value={step.note}
                                                disabled={disabled}
                                                onChange={(event) => {
                                                    replaceStep(
                                                        index,
                                                        (current) => ({
                                                            ...current,
                                                            note: event.target
                                                                .value,
                                                        }),
                                                    );
                                                }}
                                                placeholder="Optional step note"
                                                className="w-full rounded border border-zinc-700 bg-zinc-900/70 px-2 py-1 text-xs text-zinc-300 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <DropSeparator
                                        active={
                                            dragIndex !== null &&
                                            dropIndex === index + 1
                                        }
                                        disabled={disabled}
                                        onDragOver={(event) => {
                                            if (
                                                dragIndex === null ||
                                                disabled
                                            ) {
                                                return;
                                            }

                                            event.preventDefault();
                                            setDropIndex(index + 1);
                                        }}
                                        onDrop={(event) => {
                                            event.preventDefault();
                                            commitDrop(index + 1);
                                        }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </section>
    );
}

function IntensityEditor({
    mode,
    step,
    disabled,
    trainingTargets,
    unit,
    onChange,
}: {
    mode: WorkoutStructureMode;
    step: WorkoutStructureStep;
    disabled: boolean;
    trainingTargets: AthleteTrainingTargets | null;
    unit: WorkoutStructureUnit;
    onChange: (nextStep: WorkoutStructureStep) => void;
}) {
    return mode === 'target' ? (
        <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] text-zinc-500 uppercase">
                Target
            </label>
            <input
                type="number"
                min={0}
                max={300}
                value={step.target ?? ''}
                disabled={disabled}
                onChange={(event) => {
                    const numericValue =
                        event.target.value.trim() === ''
                            ? null
                            : Number(event.target.value);

                    onChange({
                        ...step,
                        target:
                            numericValue === null
                                ? null
                                : Math.max(0, numericValue),
                    });
                }}
                className="w-full rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 font-mono text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
            />
            <p className="text-[10px] text-zinc-500">
                {formatResolvedTarget(unit, step, mode, trainingTargets)}
            </p>
        </div>
    ) : (
        <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] text-zinc-500 uppercase">Range</label>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1">
                <input
                    type="number"
                    min={0}
                    max={300}
                    value={step.rangeMin ?? ''}
                    disabled={disabled}
                    onChange={(event) => {
                        const numericValue =
                            event.target.value.trim() === ''
                                ? null
                                : Number(event.target.value);

                        onChange({
                            ...step,
                            rangeMin:
                                numericValue === null
                                    ? null
                                    : Math.max(0, numericValue),
                        });
                    }}
                    className="w-full rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 font-mono text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
                />
                <span className="text-[10px] text-zinc-500">-</span>
                <input
                    type="number"
                    min={0}
                    max={300}
                    value={step.rangeMax ?? ''}
                    disabled={disabled}
                    onChange={(event) => {
                        const numericValue =
                            event.target.value.trim() === ''
                                ? null
                                : Number(event.target.value);

                        onChange({
                            ...step,
                            rangeMax:
                                numericValue === null
                                    ? null
                                    : Math.max(0, numericValue),
                        });
                    }}
                    className="w-full rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 font-mono text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
                />
            </div>
            <p className="text-[10px] text-zinc-500">
                {formatResolvedTarget(unit, step, mode, trainingTargets)}
            </p>
        </div>
    );
}

function MetricTile({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded border border-zinc-800/80 bg-zinc-900/40 px-2.5 py-2">
            <p className="text-[10px] text-zinc-500 uppercase">{label}</p>
            <p className="mt-1 font-mono text-sm text-zinc-200">{value}</p>
        </div>
    );
}

function DropSeparator({
    active,
    disabled,
    onDragOver,
    onDrop,
}: {
    active: boolean;
    disabled: boolean;
    onDragOver: (event: DragEvent<HTMLDivElement>) => void;
    onDrop: (event: DragEvent<HTMLDivElement>) => void;
}) {
    return (
        <div
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={cn(
                'relative h-3 rounded transition-colors',
                disabled ? 'pointer-events-none' : 'pointer-events-auto',
                active ? 'bg-sky-500/12' : 'bg-transparent',
            )}
        >
            <span
                className={cn(
                    'pointer-events-none absolute inset-x-2 top-1/2 h-0.5 -translate-y-1/2 rounded-full transition-opacity',
                    active
                        ? 'opacity-100 shadow-[0_0_8px_rgba(56,189,248,0.55)]'
                        : 'opacity-0',
                    'bg-sky-400',
                )}
            />
        </div>
    );
}

function stepUsesItems(type: WorkoutStructureBlockType): boolean {
    return (
        type === 'two_step_repeats' ||
        type === 'three_step_repeats' ||
        type === 'repeats' ||
        type === 'ramp_up' ||
        type === 'ramp_down'
    );
}

function resetStepForType(
    type: WorkoutStructureBlockType,
    unit: WorkoutStructureUnit,
    index: number,
    currentStep?: WorkoutStructureStep,
): WorkoutStructureStep {
    return createStep({
        type,
        durationMinutes:
            currentStep?.durationMinutes ??
            blockDefinitions.find((item) => item.type === type)
                ?.defaultDuration ??
            8,
        unit,
        index,
    });
}

function createDefaultStructureForSport(sport: string): WorkoutStructure {
    if (sport === 'bike' || sport === 'run') {
        const unit: WorkoutStructureUnit =
            sport === 'bike' ? 'ftp_percent' : 'threshold_hr_percent';

        return {
            unit,
            mode: 'range',
            steps: [
                createStep({
                    type: 'warmup',
                    durationMinutes: 12,
                    unit,
                    index: 0,
                }),
                createStep({
                    type: 'active',
                    durationMinutes: 8,
                    unit,
                    index: 1,
                }),
                createStep({
                    type: 'recovery',
                    durationMinutes: 4,
                    unit,
                    index: 2,
                }),
                createStep({
                    type: 'two_step_repeats',
                    durationMinutes: 8,
                    unit,
                    index: 3,
                }),
                createStep({
                    type: 'ramp_down',
                    durationMinutes: 8,
                    unit,
                    index: 4,
                }),
                createStep({
                    type: 'cooldown',
                    durationMinutes: 10,
                    unit,
                    index: 5,
                }),
            ],
        };
    }

    return {
        unit: 'rpe',
        mode: 'target',
        steps: [
            createStep({
                type: 'active',
                durationMinutes: 45,
                unit: 'rpe',
                index: 0,
            }),
        ],
    };
}

function createStep({
    type,
    durationMinutes,
    unit,
    index,
}: {
    type: WorkoutStructureBlockType;
    durationMinutes: number;
    unit: WorkoutStructureUnit;
    index: number;
}): WorkoutStructureStep {
    const defaults = defaultIntensityForType(type, unit);
    const items = createDefaultItemsForType(type, unit);

    return {
        id: `step-${Date.now()}-${index}`,
        type,
        durationMinutes,
        target: defaults.target,
        rangeMin: defaults.rangeMin,
        rangeMax: defaults.rangeMax,
        repeatCount: type === 'repeats' ? 3 : 1,
        items,
        note: '',
    };
}

function createDefaultItemsForType(
    type: WorkoutStructureBlockType,
    unit: WorkoutStructureUnit,
): WorkoutStructureItem[] | null {
    if (!stepUsesItems(type)) {
        return null;
    }

    if (type === 'two_step_repeats') {
        return [
            defaultItemDefinition(type, 0, 'Work', unit),
            defaultItemDefinition(type, 1, 'Recover', unit),
        ];
    }

    if (type === 'three_step_repeats') {
        return [
            defaultItemDefinition(type, 0, 'Build', unit),
            defaultItemDefinition(type, 1, 'Recover', unit),
            defaultItemDefinition(type, 2, 'Peak', unit),
        ];
    }

    if (type === 'repeats') {
        return [
            defaultItemDefinition(type, 0, 'Hard', unit),
            defaultItemDefinition(type, 1, 'Easy', unit),
        ];
    }

    if (type === 'ramp_up') {
        return [
            defaultItemDefinition(type, 0, 'Step 1', unit),
            defaultItemDefinition(type, 1, 'Step 2', unit),
            defaultItemDefinition(type, 2, 'Step 3', unit),
            defaultItemDefinition(type, 3, 'Step 4', unit),
        ];
    }

    return [
        defaultItemDefinition(type, 0, 'Step 1', unit),
        defaultItemDefinition(type, 1, 'Step 2', unit),
        defaultItemDefinition(type, 2, 'Step 3', unit),
        defaultItemDefinition(type, 3, 'Step 4', unit),
    ];
}

function defaultItemDefinition(
    type: WorkoutStructureBlockType,
    index: number,
    label: string,
    unit: WorkoutStructureUnit,
): WorkoutStructureItem {
    const defaults = defaultIntensityForType(type, unit, index);

    return {
        id: `item-${Date.now()}-${type}-${index}`,
        label,
        durationMinutes: Math.max(1, defaults.durationMinutes),
        target: defaults.target,
        rangeMin: defaults.rangeMin,
        rangeMax: defaults.rangeMax,
    };
}

function defaultIntensityForType(
    type: WorkoutStructureBlockType,
    unit: WorkoutStructureUnit,
    itemIndex = 0,
): {
    durationMinutes: number;
    target: number;
    rangeMin: number;
    rangeMax: number;
} {
    const isRpe = unit === 'rpe';

    const base = isRpe
        ? {
              warmup: [12, 3, 2, 4],
              active: [8, 7, 6, 8],
              recovery: [4, 3, 2, 4],
              cooldown: [10, 3, 2, 3],
              two_step_repeats: [4, 7, 6, 8],
              three_step_repeats: [3, 8, 7, 9],
              repeats: [3, 7, 6, 8],
              ramp_up: [2, 6, 5, 7],
              ramp_down: [2, 6, 5, 7],
          }
        : {
              warmup: [12, 60, 50, 70],
              active: [8, 92, 85, 100],
              recovery: [4, 60, 55, 65],
              cooldown: [10, 55, 45, 60],
              two_step_repeats: [4, 96, 90, 105],
              three_step_repeats: [3, 100, 92, 110],
              repeats: [3, 98, 90, 108],
              ramp_up: [2, 90, 80, 95],
              ramp_down: [2, 85, 75, 90],
          };

    const [durationMinutes, target, rangeMin, rangeMax] = base[type];

    if (type === 'two_step_repeats' && itemIndex === 1) {
        return {
            durationMinutes,
            target: isRpe ? 3 : 60,
            rangeMin: isRpe ? 2 : 55,
            rangeMax: isRpe ? 4 : 65,
        };
    }

    if (type === 'three_step_repeats') {
        if (itemIndex === 1) {
            return {
                durationMinutes,
                target: isRpe ? 3 : 60,
                rangeMin: isRpe ? 2 : 55,
                rangeMax: isRpe ? 4 : 65,
            };
        }

        if (itemIndex === 2) {
            return {
                durationMinutes,
                target: isRpe ? 8.5 : 105,
                rangeMin: isRpe ? 7.5 : 98,
                rangeMax: isRpe ? 9.5 : 115,
            };
        }
    }

    if (type === 'repeats' && itemIndex % 2 === 1) {
        return {
            durationMinutes,
            target: isRpe ? 3 : 60,
            rangeMin: isRpe ? 2 : 55,
            rangeMax: isRpe ? 4 : 65,
        };
    }

    if (type === 'ramp_up') {
        const min = isRpe ? 5 + itemIndex : 75 + itemIndex * 8;
        const max = isRpe ? 6 + itemIndex : 82 + itemIndex * 8;

        return {
            durationMinutes,
            target: (min + max) / 2,
            rangeMin: min,
            rangeMax: max,
        };
    }

    if (type === 'ramp_down') {
        const min = isRpe ? 8 - itemIndex : 98 - itemIndex * 8;
        const max = isRpe ? 9 - itemIndex : 106 - itemIndex * 8;

        return {
            durationMinutes,
            target: (min + max) / 2,
            rangeMin: min,
            rangeMax: max,
        };
    }

    return {
        durationMinutes,
        target,
        rangeMin,
        rangeMax,
    };
}

function buildPreviewSegments(
    step: WorkoutStructureStep,
    mode: WorkoutStructureMode,
    unit: WorkoutStructureUnit,
): PreviewSegment[] {
    const cycles = step.type === 'repeats' ? Math.max(2, step.repeatCount) : 1;
    const sourceItems = step.items ?? [
        {
            id: `${step.id}-base`,
            label: blockLabel(step.type),
            durationMinutes: step.durationMinutes,
            target: step.target,
            rangeMin: step.rangeMin,
            rangeMax: step.rangeMax,
        },
    ];

    const segments: PreviewSegment[] = [];

    for (let cycleIndex = 0; cycleIndex < cycles; cycleIndex += 1) {
        sourceItems.forEach((item, itemIndex) => {
            const [min, max] = resolveIntensityBounds(item, mode);

            segments.push({
                id: `${step.id}-${cycleIndex}-${item.id}-${itemIndex}`,
                durationMinutes: Math.max(1, item.durationMinutes),
                type: step.type,
                intensityMin: clampIntensity(min, unit),
                intensityMax: clampIntensity(max, unit),
            });
        });
    }

    return segments;
}

function resolveIntensityBounds(
    source: {
        target: number | null;
        rangeMin: number | null;
        rangeMax: number | null;
    },
    mode: WorkoutStructureMode,
): [number, number] {
    if (mode === 'target') {
        const target = source.target ?? 0;

        return [target, target];
    }

    const min = source.rangeMin ?? source.target ?? 0;
    const max = source.rangeMax ?? source.target ?? min;

    return [Math.min(min, max), Math.max(min, max)];
}

function patternLabelForStep(step: WorkoutStructureStep): string | null {
    if (step.type === 'two_step_repeats') {
        return '2-step';
    }

    if (step.type === 'three_step_repeats') {
        return '3-step';
    }

    if (step.type === 'repeats') {
        return `x${Math.max(2, step.repeatCount)}`;
    }

    if (step.type === 'ramp_up') {
        return 'ramp up';
    }

    if (step.type === 'ramp_down') {
        return 'ramp down';
    }

    return null;
}

export function calculateWorkoutStructureDurationMinutes(
    structure: WorkoutStructure | null,
): number {
    if (structure === null) {
        return 0;
    }

    return structure.steps.reduce((carry, step) => {
        const segments = buildPreviewSegments(
            step,
            structure.mode,
            structure.unit,
        );
        const segmentDuration = segments.reduce(
            (segmentCarry, segment) =>
                segmentCarry + Math.max(1, segment.durationMinutes),
            0,
        );

        return carry + segmentDuration;
    }, 0);
}

export function estimateWorkoutStructureTss(
    structure: WorkoutStructure | null,
): number | null {
    if (structure === null) {
        return null;
    }

    const total = structure.steps.reduce((carry, step) => {
        const segments = buildPreviewSegments(
            step,
            structure.mode,
            structure.unit,
        );

        const segmentTotal = segments.reduce((segmentCarry, segment) => {
            const midpoint = (segment.intensityMin + segment.intensityMax) / 2;
            const intensityFactor =
                structure.unit === 'rpe' ? midpoint / 10 : midpoint / 100;
            const durationHours = Math.max(1, segment.durationMinutes) / 60;

            return (
                segmentCarry +
                durationHours * intensityFactor * intensityFactor * 100
            );
        }, 0);

        return carry + segmentTotal;
    }, 0);

    return Math.max(0, Math.round(total));
}

function clampIntensity(value: number, unit: WorkoutStructureUnit): number {
    if (unit === 'rpe') {
        return Math.max(0, Math.min(10, value));
    }

    return Math.max(0, Math.min(200, value));
}

function formatDurationMinutes(durationMinutes: number): string {
    const safeMinutes = Math.max(0, Math.round(durationMinutes));
    const hours = Math.floor(safeMinutes / 60);
    const minutes = safeMinutes % 60;

    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (hours > 0) {
        return `${hours}h`;
    }

    return `${minutes}m`;
}

function formatAxisTickLabel(
    value: number,
    unit: WorkoutStructureUnit,
    trainingTargets: AthleteTrainingTargets | null,
): string {
    if (unit === 'rpe') {
        return `RPE ${value}`;
    }

    const converted = convertUnitPercentToDisplay(unit, value, trainingTargets);

    if (converted === null) {
        return `${value}%`;
    }

    return `${value}% · ${converted}`;
}

function formatResolvedTarget(
    unit: WorkoutStructureUnit,
    step: WorkoutStructureStep,
    mode: WorkoutStructureMode,
    trainingTargets: AthleteTrainingTargets | null,
): string {
    const [min, max] = resolveIntensityBounds(step, mode);

    if (mode === 'target') {
        const converted = convertUnitPercentToDisplay(
            unit,
            max,
            trainingTargets,
        );

        if (converted === null) {
            return `${max}`;
        }

        return converted;
    }

    const minConverted = convertUnitPercentToDisplay(
        unit,
        min,
        trainingTargets,
    );
    const maxConverted = convertUnitPercentToDisplay(
        unit,
        max,
        trainingTargets,
    );

    if (minConverted === null || maxConverted === null) {
        return `${min}-${max}`;
    }

    return `${minConverted} - ${maxConverted}`;
}

function convertUnitPercentToDisplay(
    unit: WorkoutStructureUnit,
    value: number,
    trainingTargets: AthleteTrainingTargets | null,
): string | null {
    if (unit === 'rpe') {
        return `${Math.round(value * 10) / 10}`;
    }

    if (trainingTargets === null) {
        return null;
    }

    const roundedPercent = Math.max(0, value);

    switch (unit) {
        case 'ftp_percent': {
            if (
                trainingTargets.ftp_watts === null ||
                trainingTargets.ftp_watts <= 0
            ) {
                return null;
            }

            const watts = Math.round(
                (roundedPercent / 100) * trainingTargets.ftp_watts,
            );

            return `${watts}W`;
        }
        case 'max_hr_percent': {
            if (
                trainingTargets.max_heart_rate_bpm === null ||
                trainingTargets.max_heart_rate_bpm <= 0
            ) {
                return null;
            }

            const bpm = Math.round(
                (roundedPercent / 100) * trainingTargets.max_heart_rate_bpm,
            );

            return `${bpm} bpm`;
        }
        case 'threshold_hr_percent': {
            if (
                trainingTargets.threshold_heart_rate_bpm === null ||
                trainingTargets.threshold_heart_rate_bpm <= 0
            ) {
                return null;
            }

            const bpm = Math.round(
                (roundedPercent / 100) *
                    trainingTargets.threshold_heart_rate_bpm,
            );

            return `${bpm} bpm`;
        }
        case 'threshold_speed_percent': {
            if (
                trainingTargets.threshold_pace_minutes_per_km === null ||
                trainingTargets.threshold_pace_minutes_per_km <= 0 ||
                roundedPercent <= 0
            ) {
                return null;
            }

            const paceSecondsPerKm =
                trainingTargets.threshold_pace_minutes_per_km *
                (100 / roundedPercent);

            return `${formatPace(Math.round(paceSecondsPerKm))}/km`;
        }
        default:
            return null;
    }
}

function formatPace(totalSeconds: number): string {
    const safeSeconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function blockColor(type: WorkoutStructureBlockType): string {
    switch (type) {
        case 'warmup':
            return 'bg-sky-900/70';
        case 'active':
            return 'bg-blue-700/80';
        case 'recovery':
            return 'bg-zinc-700/80';
        case 'cooldown':
            return 'bg-emerald-900/70';
        case 'two_step_repeats':
        case 'three_step_repeats':
        case 'repeats':
            return 'bg-violet-700/80';
        case 'ramp_up':
            return 'bg-amber-700/80';
        case 'ramp_down':
            return 'bg-rose-800/70';
        default:
            return 'bg-zinc-700/70';
    }
}

function blockLabel(type: WorkoutStructureBlockType): string {
    return (
        blockDefinitions.find((definition) => definition.type === type)
            ?.label ?? type
    );
}
