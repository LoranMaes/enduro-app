import { Plus, RotateCcw } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { blockDefinitions, unitLabels } from './constants';
import {
    BlockCard,
    type BlockCardProps,
} from './components/BlockCard';
import { DropSeparator } from './components/StructureDragOverlay';
import { StructureOverviewTiles } from './components/StructureOverviewTiles';
import { StructurePreview } from './components/StructurePreview';
import { RampBlockCard } from './components/RampBlockCard';
import { RepeatBlockCard } from './components/RepeatBlockCard';
import { WarmupBlockCard } from './components/WarmupBlockCard';
import { useStructureDrag } from './hooks/useStructureDrag';
import { useStructureState } from './hooks/useStructureState';
import { createDefaultStructureForSport, createStep, resetStepForType } from './hooks/useStructureTemplates';
import { useStructureTotals } from './hooks/useStructureTotals';
import type {
    WorkoutStructureBlockType,
    WorkoutStructureBuilderProps,
    WorkoutStructureItem,
    WorkoutStructureStep,
    WorkoutStructureUnit,
} from './types';
import { stepUsesItems } from './utils';

function EmptyStructureState() {
    return (
        <p className="rounded-md border border-dashed border-zinc-700/70 px-3 py-3 text-xs text-zinc-500">
            No structured workout blocks set for this session.
        </p>
    );
}

export function WorkoutStructureBuilder({
    value,
    sport,
    trainingTargets,
    disabled = false,
    onChange,
}: WorkoutStructureBuilderProps) {
    const {
        structure,
        updateStructure,
        replaceStep,
        addStep,
        removeStep,
        moveStep,
        moveStepByOne,
        addRepeatItem,
        removeRepeatItem,
        updateStepItem,
    } = useStructureState({
        value,
        sport,
        trainingTargets,
        disabled,
        onChange,
    });

    const {
        previewGroups,
        totalDuration,
        estimatedTss,
        previewScaleMax,
        axisTicks,
        insertionOffsets,
    } = useStructureTotals(structure);

    const drag = useStructureDrag({
        disabled,
        stepCount: structure?.steps.length ?? 0,
        onMoveStep: moveStep,
    });

    const handleStepTypeChange = (
        stepIndex: number,
        nextType: WorkoutStructureBlockType,
    ): void => {
        if (structure === null) {
            return;
        }

        replaceStep(stepIndex, () => {
            return createStep({
                type: nextType,
                durationMinutes:
                    blockDefinitions.find((item) => item.type === nextType)
                        ?.defaultDuration ?? 8,
                unit: structure.unit,
                index: stepIndex,
            });
        });
    };

    const baseCardProps = (
        step: WorkoutStructureStep,
        index: number,
    ): Omit<
        BlockCardProps,
        'onTypeChange' | 'onUpdateStep' | 'step' | 'index' | 'totalSteps'
    > => ({
        mode: structure?.mode ?? 'range',
        unit: structure?.unit ?? 'rpe',
        trainingTargets,
        disabled,
        dragActive: drag.dragIndex === index,
        dropActive: drag.dragIndex !== null && drag.dropIndex === index,
        onStartDrag: (event) => {
            drag.startDrag(index, event);
        },
        onEndDrag: drag.endDrag,
        onDragOver: (event) => {
            drag.handleListDragOver(event, index);
        },
        onDrop: drag.handleDropCurrent,
        onMoveUp: () => {
            moveStepByOne(index, -1);
        },
        onMoveDown: () => {
            moveStepByOne(index, 1);
        },
        onRemove: () => {
            removeStep(index);
        },
    });

    return (
        <section className="space-y-3 rounded-md border border-border bg-background/55 p-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-[0.6875rem] font-medium tracking-wide text-zinc-300 uppercase">
                        Workout Structure
                    </p>
                    <p className="mt-0.5 text-[0.6875rem] text-zinc-500">
                        Edit interval blocks directly. Repeats and ramps support
                        per-item targets.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {structure === null ? (
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                                onChange(createDefaultStructureForSport(sport));
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-800/70 px-2.5 py-1.5 text-xs text-zinc-200 transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            Build
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={disabled}
                            onClick={() => {
                                onChange(null);
                            }}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {structure === null ? (
                <EmptyStructureState />
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <label className="text-[0.625rem] text-zinc-500 uppercase">
                                Unit
                            </label>
                            <Select
                                value={structure.unit}
                                disabled={disabled}
                                onValueChange={(value) => {
                                    const nextUnit = value as WorkoutStructureUnit;
                                    updateStructure((current) => ({
                                        ...current,
                                        unit: nextUnit,
                                        steps: current.steps.map((step, stepIndex) => {
                                            return resetStepForType(
                                                step.type,
                                                nextUnit,
                                                stepIndex,
                                                step,
                                            );
                                        }),
                                    }));
                                }}
                            >
                                <SelectTrigger
                                    className="h-8 w-full rounded-md border-border bg-zinc-900/60 px-2 py-1.5 text-xs text-zinc-200 disabled:opacity-60"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(unitLabels).map(([unit, label]) => (
                                        <SelectItem key={unit} value={unit}>
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[0.625rem] text-zinc-500 uppercase">
                                Mode
                            </label>
                            <Select
                                value={structure.mode}
                                disabled={disabled}
                                onValueChange={(value) => {
                                    updateStructure((current) => ({
                                        ...current,
                                        mode: value as
                                            | 'range'
                                            | 'target',
                                    }));
                                }}
                            >
                                <SelectTrigger
                                    className="h-8 w-full rounded-md border-border bg-zinc-900/60 px-2 py-1.5 text-xs text-zinc-200 disabled:opacity-60"
                                >
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="range">Range</SelectItem>
                                    <SelectItem value="target">Target</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <StructureOverviewTiles
                        totalDuration={totalDuration}
                        estimatedTss={estimatedTss}
                        blockCount={structure.steps.length}
                    />

                    <StructurePreview
                        structure={structure}
                        disabled={disabled}
                        trainingTargets={trainingTargets}
                        previewGroups={previewGroups}
                        totalDuration={totalDuration}
                        previewScaleMax={previewScaleMax}
                        axisTicks={axisTicks}
                        insertionOffsets={insertionOffsets}
                        dragIndex={drag.dragIndex}
                        dropIndex={drag.dropIndex}
                        onStartDrag={drag.startDrag}
                        onEndDrag={drag.endDrag}
                        onPreviewDragOver={drag.handlePreviewDragOver}
                        onDropCurrent={drag.handleDropCurrent}
                    />

                    <div className="flex flex-wrap gap-1.5 rounded-md border border-border/70 bg-zinc-950/40 p-2">
                        {blockDefinitions.map((definition) => (
                            <button
                                key={definition.type}
                                type="button"
                                disabled={disabled}
                                onClick={() => {
                                    addStep(definition.type);
                                }}
                                className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900/50 px-2 py-1 text-[0.625rem] text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
                                title={definition.helperText}
                            >
                                <Plus className="h-3 w-3" />
                                {definition.label}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-1">
                        <DropSeparator
                            active={drag.dragIndex !== null && drag.dropIndex === 0}
                            disabled={disabled}
                            onDragOver={(event) => {
                                drag.handleSeparatorDragOver(event, 0);
                            }}
                            onDrop={(event) => {
                                drag.handleDropAt(event, 0);
                            }}
                        />

                        {structure.steps.map((step, index) => {
                            const commonProps = baseCardProps(step, index);

                            const listItem =
                                step.type === 'warmup' ? (
                                    <WarmupBlockCard
                                        {...commonProps}
                                        step={step}
                                        index={index}
                                        totalSteps={structure.steps.length}
                                        onTypeChange={(nextType) => {
                                            handleStepTypeChange(index, nextType);
                                        }}
                                        onUpdateStep={(nextStep) => {
                                            replaceStep(index, () => nextStep);
                                        }}
                                    />
                                ) : step.type === 'repeats' ? (
                                    <RepeatBlockCard
                                        {...commonProps}
                                        step={step}
                                        index={index}
                                        totalSteps={structure.steps.length}
                                        onTypeChange={(nextType) => {
                                            handleStepTypeChange(index, nextType);
                                        }}
                                        onUpdateStep={(nextStep) => {
                                            replaceStep(index, () => nextStep);
                                        }}
                                        onUpdateItem={(itemIndex, nextItem) => {
                                            updateStepItem(index, itemIndex, () => nextItem);
                                        }}
                                        onAddItem={() => {
                                            addRepeatItem(index);
                                        }}
                                        onRemoveItem={(itemIndex) => {
                                            removeRepeatItem(index, itemIndex);
                                        }}
                                    />
                                ) : stepUsesItems(step.type) ? (
                                    <RampBlockCard
                                        {...commonProps}
                                        step={step}
                                        index={index}
                                        totalSteps={structure.steps.length}
                                        onTypeChange={(nextType) => {
                                            handleStepTypeChange(index, nextType);
                                        }}
                                        onUpdateStep={(nextStep) => {
                                            replaceStep(index, () => nextStep);
                                        }}
                                        onUpdateItem={(itemIndex, nextItem) => {
                                            updateStepItem(index, itemIndex, () => nextItem);
                                        }}
                                    />
                                ) : (
                                    <BlockCard
                                        {...commonProps}
                                        step={step}
                                        index={index}
                                        totalSteps={structure.steps.length}
                                        onTypeChange={(nextType) => {
                                            handleStepTypeChange(index, nextType);
                                        }}
                                        onUpdateStep={(nextStep) => {
                                            replaceStep(index, () => nextStep);
                                        }}
                                    />
                                );

                            return (
                                <div key={step.id} className="space-y-1">
                                    {listItem}

                                    <DropSeparator
                                        active={
                                            drag.dragIndex !== null &&
                                            drag.dropIndex === index + 1
                                        }
                                        disabled={disabled}
                                        onDragOver={(event) => {
                                            drag.handleSeparatorDragOver(
                                                event,
                                                index + 1,
                                            );
                                        }}
                                        onDrop={(event) => {
                                            drag.handleDropAt(event, index + 1);
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
