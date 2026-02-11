import { ArrowDown, ArrowUp, GripVertical, Trash2 } from 'lucide-react';
import type { DragEvent } from 'react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { blockDefinitions } from '../constants';
import type {
    AthleteTrainingTargets,
    WorkoutStructureBlockType,
    WorkoutStructureMode,
    WorkoutStructureStep,
    WorkoutStructureUnit,
} from '../types';
import { formatResolvedTarget, patternLabelForStep } from '../utils';

export type BlockCardProps = {
    step: WorkoutStructureStep;
    index: number;
    totalSteps: number;
    mode: WorkoutStructureMode;
    unit: WorkoutStructureUnit;
    trainingTargets: AthleteTrainingTargets | null;
    disabled: boolean;
    dragActive: boolean;
    dropActive: boolean;
    onStartDrag: (event: DragEvent<HTMLButtonElement>) => void;
    onEndDrag: () => void;
    onDragOver: (event: DragEvent<HTMLDivElement>) => void;
    onDrop: (event: DragEvent<HTMLDivElement>) => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    onRemove: () => void;
    onTypeChange: (type: WorkoutStructureBlockType) => void;
    onUpdateStep: (nextStep: WorkoutStructureStep) => void;
};

export function IntensityEditor({
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
            <label className="text-[0.625rem] text-zinc-500 uppercase">Target</label>
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
                        target: numericValue === null ? null : Math.max(0, numericValue),
                    });
                }}
                className="w-full rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 font-mono text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
            />
            <p className="text-[0.625rem] text-zinc-500">
                {formatResolvedTarget(unit, step, mode, trainingTargets)}
            </p>
        </div>
    ) : (
        <div className="space-y-1 md:col-span-2">
            <label className="text-[0.625rem] text-zinc-500 uppercase">Range</label>
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
                                numericValue === null ? null : Math.max(0, numericValue),
                        });
                    }}
                    className="w-full rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 font-mono text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
                />
                <span className="text-[0.625rem] text-zinc-500">-</span>
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
                                numericValue === null ? null : Math.max(0, numericValue),
                        });
                    }}
                    className="w-full rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 font-mono text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
                />
            </div>
            <p className="text-[0.625rem] text-zinc-500">
                {formatResolvedTarget(unit, step, mode, trainingTargets)}
            </p>
        </div>
    );
}

export function BlockCard({
    step,
    index,
    totalSteps,
    mode,
    unit,
    trainingTargets,
    disabled,
    dragActive,
    dropActive,
    onStartDrag,
    onEndDrag,
    onDragOver,
    onDrop,
    onMoveUp,
    onMoveDown,
    onRemove,
    onTypeChange,
    onUpdateStep,
}: BlockCardProps) {
    const definition = blockDefinitions.find((item) => item.type === step.type);

    return (
        <div
            onDragOver={onDragOver}
            onDrop={onDrop}
            className={`relative rounded-md border border-border bg-zinc-900/40 p-2 ${dragActive ? 'opacity-60' : ''} ${dropActive ? 'ring-1 ring-sky-400/80' : ''}`}
        >
            {dropActive ? (
                <div className="pointer-events-none absolute inset-x-2 top-0 h-0.5 -translate-y-1/2 rounded-full bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.55)]" />
            ) : null}

            <div className="mb-2 flex items-center gap-2">
                <button
                    type="button"
                    draggable={!disabled}
                    aria-label="Drag to reorder block"
                    onDragStart={onStartDrag}
                    onDragEnd={onEndDrag}
                    className={`inline-flex h-5 w-5 cursor-grab items-center justify-center rounded border border-zinc-700 bg-zinc-900 text-zinc-500 transition-colors hover:text-zinc-300 active:cursor-grabbing ${disabled ? 'cursor-default opacity-60' : ''}`}
                >
                    <GripVertical className="h-3.5 w-3.5" />
                </button>

                <Select
                    value={step.type}
                    disabled={disabled}
                    onValueChange={(value) => {
                        onTypeChange(value as WorkoutStructureBlockType);
                    }}
                >
                    <SelectTrigger
                        className="h-7 rounded border-zinc-700 bg-zinc-900/80 px-2 py-1 text-xs text-zinc-200"
                    >
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {blockDefinitions.map((item) => (
                            <SelectItem key={item.type} value={item.type}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {patternLabelForStep(step) !== null ? (
                    <span className="rounded border border-zinc-700/80 bg-zinc-800/70 px-1.5 py-0.5 text-[0.625rem] text-zinc-300">
                        {patternLabelForStep(step)}
                    </span>
                ) : null}

                <div className="ms-auto flex items-center gap-1">
                    <button
                        type="button"
                        aria-label="Move block up"
                        disabled={disabled || index === 0}
                        onClick={onMoveUp}
                        className="inline-flex h-6 w-6 items-center justify-center rounded border border-zinc-700 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40"
                    >
                        <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        aria-label="Move block down"
                        disabled={disabled || index === totalSteps - 1}
                        onClick={onMoveDown}
                        className="inline-flex h-6 w-6 items-center justify-center rounded border border-zinc-700 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200 disabled:opacity-40"
                    >
                        <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        aria-label="Delete block"
                        onClick={onRemove}
                        disabled={disabled}
                        className="inline-flex h-6 w-6 items-center justify-center rounded border border-red-900/40 text-red-300 transition-colors hover:bg-red-950/30 disabled:opacity-40"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="space-y-1">
                    <label className="text-[0.625rem] text-zinc-500 uppercase">
                        Duration (min)
                    </label>
                    <input
                        type="number"
                        min={1}
                        max={600}
                        value={step.durationMinutes}
                        disabled={disabled}
                        onChange={(event) => {
                            onUpdateStep({
                                ...step,
                                durationMinutes: Math.max(
                                    1,
                                    Number(event.target.value) || 1,
                                ),
                            });
                        }}
                        className="w-full rounded border border-zinc-700 bg-zinc-900/80 px-2 py-1 font-mono text-xs text-zinc-200 focus:border-zinc-600 focus:outline-none"
                    />
                </div>

                <IntensityEditor
                    mode={mode}
                    step={step}
                    disabled={disabled}
                    trainingTargets={trainingTargets}
                    unit={unit}
                    onChange={onUpdateStep}
                />
            </div>

            <div className="mt-2 space-y-1">
                <p className="text-[0.625rem] text-zinc-500">{definition?.helperText}</p>
                <input
                    type="text"
                    value={step.note}
                    disabled={disabled}
                    onChange={(event) => {
                        onUpdateStep({
                            ...step,
                            note: event.target.value,
                        });
                    }}
                    placeholder="Optional step note"
                    className="w-full rounded border border-zinc-700 bg-zinc-900/70 px-2 py-1 text-xs text-zinc-300 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                />
            </div>
        </div>
    );
}
