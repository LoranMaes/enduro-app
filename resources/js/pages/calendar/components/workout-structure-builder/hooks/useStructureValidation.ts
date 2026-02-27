import type {
    WorkoutStructure,
    WorkoutStructureItem,
    WorkoutStructureStep,
} from '../types';
import { stepUsesItems } from '../utils';

function normalizeDuration(value: number): number {
    return Math.max(1, Number(value) || 1);
}

function normalizeOptional(value: number | null): number | null {
    if (value === null || Number.isNaN(value)) {
        return null;
    }

    return Math.max(0, value);
}

export function normalizeWorkoutItem(
    item: WorkoutStructureItem,
): WorkoutStructureItem {
    return {
        ...item,
        durationMinutes: normalizeDuration(item.durationMinutes),
        target: normalizeOptional(item.target),
        rangeMin: normalizeOptional(item.rangeMin),
        rangeMax: normalizeOptional(item.rangeMax),
    };
}

export function normalizeWorkoutStep(
    step: WorkoutStructureStep,
): WorkoutStructureStep {
    const normalizedItems =
        step.items === null ? null : step.items.map(normalizeWorkoutItem);

    return {
        ...step,
        durationMinutes: normalizeDuration(step.durationMinutes),
        target: normalizeOptional(step.target),
        rangeMin: normalizeOptional(step.rangeMin),
        rangeMax: normalizeOptional(step.rangeMax),
        repeatCount:
            step.type === 'repeats' ? Math.max(2, step.repeatCount) : 1,
        items: stepUsesItems(step.type) ? normalizedItems : null,
    };
}

export function normalizeWorkoutStructure(
    structure: WorkoutStructure,
): WorkoutStructure {
    return {
        ...structure,
        steps: structure.steps.map(normalizeWorkoutStep),
    };
}
