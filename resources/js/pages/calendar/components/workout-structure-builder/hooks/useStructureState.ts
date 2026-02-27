import { useCallback } from 'react';
import { blockDefinitions } from '../constants';
import type {
    WorkoutStructure,
    WorkoutStructureBlockType,
    WorkoutStructureBuilderProps,
    WorkoutStructureItem,
    WorkoutStructureStep,
} from '../types';
import {
    createDefaultStructureForSport,
    createStep,
    defaultItemDefinition,
    resetStepForType,
} from './useStructureTemplates';
import { normalizeWorkoutStructure } from './useStructureValidation';

type UseStructureStateResult = {
    structure: WorkoutStructure | null;
    ensureStructure: () => WorkoutStructure;
    updateStructure: (updater: (current: WorkoutStructure) => WorkoutStructure) => void;
    replaceStep: (
        index: number,
        updater: (step: WorkoutStructureStep) => WorkoutStructureStep,
    ) => void;
    addStep: (type: WorkoutStructureBlockType) => void;
    removeStep: (index: number) => void;
    moveStep: (from: number, to: number) => void;
    moveStepByOne: (index: number, direction: -1 | 1) => void;
    addRepeatItem: (stepIndex: number) => void;
    removeRepeatItem: (stepIndex: number, itemIndex: number) => void;
    updateStepItems: (
        stepIndex: number,
        updater: (items: WorkoutStructureItem[]) => WorkoutStructureItem[],
    ) => void;
    updateStepItem: (
        stepIndex: number,
        itemIndex: number,
        updater: (item: WorkoutStructureItem) => WorkoutStructureItem,
    ) => void;
};

export function useStructureState({
    value,
    sport,
    disabled = false,
    onChange,
}: WorkoutStructureBuilderProps): UseStructureStateResult {
    const ensureStructure = useCallback((): WorkoutStructure => {
        if (value !== null) {
            return value;
        }

        const next = createDefaultStructureForSport(sport);
        onChange(next);

        return next;
    }, [onChange, sport, value]);

    const updateStructure = useCallback(
        (updater: (current: WorkoutStructure) => WorkoutStructure): void => {
            if (disabled) {
                return;
            }

            const next = updater(ensureStructure());
            onChange(normalizeWorkoutStructure(next));
        },
        [disabled, ensureStructure, onChange],
    );

    const replaceStep = useCallback(
        (
            index: number,
            updater: (step: WorkoutStructureStep) => WorkoutStructureStep,
        ): void => {
            if (disabled || value === null || value.steps[index] === undefined) {
                return;
            }

            const nextSteps = [...value.steps];
            nextSteps[index] = updater(nextSteps[index]);

            onChange(
                normalizeWorkoutStructure({
                    ...value,
                    steps: nextSteps,
                }),
            );
        },
        [disabled, onChange, value],
    );

    const addStep = useCallback(
        (type: WorkoutStructureBlockType): void => {
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
        },
        [disabled, updateStructure],
    );

    const removeStep = useCallback(
        (index: number): void => {
            if (disabled || value === null || value.steps[index] === undefined) {
                return;
            }

            onChange({
                ...value,
                steps: value.steps.filter((_, currentIndex) => currentIndex !== index),
            });
        },
        [disabled, onChange, value],
    );

    const moveStep = useCallback(
        (from: number, to: number): void => {
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
            const adjustedIndex = targetIndex > from ? targetIndex - 1 : targetIndex;
            nextSteps.splice(adjustedIndex, 0, movedStep);

            onChange({
                ...value,
                steps: nextSteps,
            });
        },
        [disabled, onChange, value],
    );

    const moveStepByOne = useCallback(
        (index: number, direction: -1 | 1): void => {
            if (value === null) {
                return;
            }

            const nextIndex = index + direction;

            if (nextIndex < 0 || nextIndex >= value.steps.length) {
                return;
            }

            moveStep(index, nextIndex);
        },
        [moveStep, value],
    );

    const updateStepItems = useCallback(
        (
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
        },
        [replaceStep],
    );

    const updateStepItem = useCallback(
        (
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
        },
        [updateStepItems],
    );

    const addRepeatItem = useCallback(
        (stepIndex: number): void => {
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
        },
        [replaceStep, value?.unit],
    );

    const removeRepeatItem = useCallback(
        (stepIndex: number, itemIndex: number): void => {
            replaceStep(stepIndex, (step) => {
                if (step.type !== 'repeats' || step.items === null || step.items.length <= 1) {
                    return step;
                }

                return {
                    ...step,
                    items: step.items.filter((_, currentIndex) => currentIndex !== itemIndex),
                };
            });
        },
        [replaceStep],
    );

    return {
        structure: value,
        ensureStructure,
        updateStructure,
        replaceStep,
        addStep,
        removeStep,
        moveStep,
        moveStepByOne,
        addRepeatItem,
        removeRepeatItem,
        updateStepItems,
        updateStepItem,
    };
}
