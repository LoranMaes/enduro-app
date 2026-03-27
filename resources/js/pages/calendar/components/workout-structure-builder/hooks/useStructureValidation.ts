import type {
    WorkoutStructure,
    WorkoutStructureItem,
    WorkoutStructureStep,
} from '../types';
import {
    minutesToSeconds,
    secondsToRoundedMinutes,
    stepUsesItems,
} from '../utils';

function normalizeDuration(value: number): number {
    return Math.max(1, Number(value) || 1);
}

function normalizeDurationSeconds(value: number, fallbackMinutes: number): number {
    const numericValue = Number(value);

    if (Number.isFinite(numericValue) && numericValue > 0) {
        return Math.max(1, Math.round(numericValue));
    }

    return minutesToSeconds(fallbackMinutes);
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
    const normalizedDurationMinutes = normalizeDuration(item.durationMinutes);
    const normalizedDurationSeconds = normalizeDurationSeconds(
        item.durationSeconds,
        normalizedDurationMinutes,
    );

    return {
        ...item,
        durationSeconds: normalizedDurationSeconds,
        durationMinutes: secondsToRoundedMinutes(normalizedDurationSeconds),
        durationType: item.durationType === 'distance' ? 'distance' : 'time',
        distanceMeters:
            item.durationType === 'distance'
                ? Math.max(1, Math.round(item.distanceMeters ?? 1000))
                : null,
        target: normalizeOptional(item.target),
        rangeMin: normalizeOptional(item.rangeMin),
        rangeMax: normalizeOptional(item.rangeMax),
        zoneLabel:
            item.zoneLabel === null ||
            ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'].includes(item.zoneLabel)
                ? item.zoneLabel
                : null,
    };
}

export function normalizeWorkoutStep(
    step: WorkoutStructureStep,
): WorkoutStructureStep {
    const normalizedItems =
        step.items === null ? null : step.items.map(normalizeWorkoutItem);
    const normalizedDurationMinutes = normalizeDuration(step.durationMinutes);
    const normalizedDurationSeconds = normalizeDurationSeconds(
        step.durationSeconds,
        normalizedDurationMinutes,
    );

    return {
        ...step,
        durationSeconds: normalizedDurationSeconds,
        durationMinutes: secondsToRoundedMinutes(normalizedDurationSeconds),
        durationType: step.durationType === 'distance' ? 'distance' : 'time',
        distanceMeters:
            step.durationType === 'distance'
                ? Math.max(1, Math.round(step.distanceMeters ?? 1000))
                : null,
        target: normalizeOptional(step.target),
        rangeMin: normalizeOptional(step.rangeMin),
        rangeMax: normalizeOptional(step.rangeMax),
        zoneLabel:
            step.zoneLabel === null ||
            ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'].includes(step.zoneLabel)
                ? step.zoneLabel
                : null,
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
