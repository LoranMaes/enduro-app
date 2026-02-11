import { blockDefinitions, itemBasedBlockTypes } from './constants';
import type {
    AthleteTrainingTargets,
    PreviewSegment,
    WorkoutStructure,
    WorkoutStructureBlockType,
    WorkoutStructureMode,
    WorkoutStructureStep,
    WorkoutStructureUnit,
} from './types';

export function stepUsesItems(type: WorkoutStructureBlockType): boolean {
    return itemBasedBlockTypes.includes(type);
}

export function blockColor(type: WorkoutStructureBlockType): string {
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

export function blockLabel(type: WorkoutStructureBlockType): string {
    return (
        blockDefinitions.find((definition) => definition.type === type)?.label ??
        type
    );
}

export function patternLabelForStep(step: WorkoutStructureStep): string | null {
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

export function resolveIntensityBounds(
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

export function clampIntensity(
    value: number,
    unit: WorkoutStructureUnit,
): number {
    if (unit === 'rpe') {
        return Math.max(0, Math.min(10, value));
    }

    return Math.max(0, Math.min(200, value));
}

export function buildPreviewSegments(
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

export function calculateWorkoutStructureDurationMinutes(
    structure: WorkoutStructure | null,
): number {
    if (structure === null) {
        return 0;
    }

    return structure.steps.reduce((carry, step) => {
        const segments = buildPreviewSegments(step, structure.mode, structure.unit);
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
        const segments = buildPreviewSegments(step, structure.mode, structure.unit);

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

export function formatDurationMinutes(durationMinutes: number): string {
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

export function formatAxisTickLabel(
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

export function formatResolvedTarget(
    unit: WorkoutStructureUnit,
    step: WorkoutStructureStep,
    mode: WorkoutStructureMode,
    trainingTargets: AthleteTrainingTargets | null,
): string {
    const [min, max] = resolveIntensityBounds(step, mode);

    if (mode === 'target') {
        const converted = convertUnitPercentToDisplay(unit, max, trainingTargets);

        if (converted === null) {
            return `${max}`;
        }

        return converted;
    }

    const minConverted = convertUnitPercentToDisplay(unit, min, trainingTargets);
    const maxConverted = convertUnitPercentToDisplay(unit, max, trainingTargets);

    if (minConverted === null || maxConverted === null) {
        return `${min}-${max}`;
    }

    return `${minConverted} - ${maxConverted}`;
}

export function convertUnitPercentToDisplay(
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
            if (trainingTargets.ftp_watts === null || trainingTargets.ftp_watts <= 0) {
                return null;
            }

            const watts = Math.round((roundedPercent / 100) * trainingTargets.ftp_watts);

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
                (roundedPercent / 100) * trainingTargets.threshold_heart_rate_bpm,
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

export function formatPace(totalSeconds: number): string {
    const safeSeconds = Math.max(0, totalSeconds);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
