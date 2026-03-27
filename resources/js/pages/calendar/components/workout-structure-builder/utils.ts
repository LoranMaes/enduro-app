import { blockDefinitions, itemBasedBlockTypes } from './constants';
import type {
    AthleteTrainingTargets,
    PreviewSegment,
    WorkoutStructure,
    WorkoutStructureBlockType,
    WorkoutStructureItem,
    WorkoutStructureMode,
    WorkoutStructureStep,
    WorkoutStructureUnit,
    WorkoutStructureZoneLabel,
} from './types';

const DEFAULT_MINIMUM_DURATION_SECONDS = 60;

type IntensitySource = {
    target: number | null;
    rangeMin: number | null;
    rangeMax: number | null;
};

type DurationSource = {
    durationType: 'time' | 'distance';
    durationSeconds: number;
    durationMinutes: number;
    distanceMeters: number | null;
    target: number | null;
    rangeMin: number | null;
    rangeMax: number | null;
};

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
    source: IntensitySource,
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

export function normalizeDurationSeconds(value: number): number {
    return Math.max(DEFAULT_MINIMUM_DURATION_SECONDS, Math.round(value) || DEFAULT_MINIMUM_DURATION_SECONDS);
}

export function minutesToSeconds(durationMinutes: number): number {
    return normalizeDurationSeconds(Math.max(1, Math.round(durationMinutes)) * 60);
}

export function secondsToRoundedMinutes(durationSeconds: number): number {
    return Math.max(1, Math.round(normalizeDurationSeconds(durationSeconds) / 60));
}

export function resolveZoneOptionsForUnit(
    unit: WorkoutStructureUnit,
    trainingTargets: AthleteTrainingTargets | null,
): Array<{ label: WorkoutStructureZoneLabel; min: number; max: number }> {
    if (trainingTargets === null) {
        return [];
    }

    if (unit === 'ftp_percent') {
        return trainingTargets.power_zones
            .filter(isZoneLabel)
            .map((zone) => ({
                label: zone.label,
                min: zone.min,
                max: zone.max,
            }));
    }

    if (
        unit === 'max_hr_percent' ||
        unit === 'threshold_hr_percent' ||
        unit === 'threshold_speed_percent'
    ) {
        return trainingTargets.heart_rate_zones
            .filter(isZoneLabel)
            .map((zone) => ({
                label: zone.label,
                min: zone.min,
                max: zone.max,
            }));
    }

    return [];
}

function isZoneLabel(zone: {
    label: string;
    min: number;
    max: number;
}): zone is {
    label: WorkoutStructureZoneLabel;
    min: number;
    max: number;
} {
    return ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'].includes(zone.label);
}

export function applyZoneToSource(
    source: WorkoutStructureStep | WorkoutStructureItem,
    mode: WorkoutStructureMode,
    zone: { label: WorkoutStructureZoneLabel; min: number; max: number },
): WorkoutStructureStep | WorkoutStructureItem {
    if (mode === 'target') {
        return {
            ...source,
            zoneLabel: zone.label,
            target: Math.round((zone.min + zone.max) / 2),
            rangeMin: zone.min,
            rangeMax: zone.max,
        };
    }

    return {
        ...source,
        zoneLabel: zone.label,
        rangeMin: zone.min,
        rangeMax: zone.max,
        target: Math.round((zone.min + zone.max) / 2),
    };
}

function resolveDurationSecondsFromSource(
    source: DurationSource,
    mode: WorkoutStructureMode,
    unit: WorkoutStructureUnit,
    sport: string,
    trainingTargets: AthleteTrainingTargets | null,
): number {
    if (source.durationType === 'time') {
        if (source.durationSeconds > 0) {
            return normalizeDurationSeconds(source.durationSeconds);
        }

        return minutesToSeconds(source.durationMinutes);
    }

    const distanceMeters = Math.max(0, Math.round(source.distanceMeters ?? 0));

    if (distanceMeters <= 0) {
        return normalizeDurationSeconds(source.durationSeconds);
    }

    const [min, max] = resolveIntensityBounds(source, mode);
    const midpoint = (min + max) / 2;
    const intensityFactor =
        unit === 'rpe' ? Math.max(0.4, midpoint / 10) : Math.max(0.4, midpoint / 100);

    if (sport === 'run' || sport === 'walk') {
        const fallbackPaceSeconds = sport === 'walk' ? 720 : 330;
        const thresholdPace = trainingTargets?.threshold_pace_minutes_per_km ?? fallbackPaceSeconds;
        const normalizedThresholdPace = Math.max(120, thresholdPace);
        const adjustedPaceSeconds = normalizedThresholdPace / Math.max(0.5, Math.min(1.6, intensityFactor));

        return normalizeDurationSeconds((distanceMeters / 1000) * adjustedPaceSeconds);
    }

    if (sport === 'bike' || sport === 'mtn_bike') {
        const baseMetersPerSecond = sport === 'mtn_bike' ? 5.5 : 8.33;
        const adjustedSpeed = baseMetersPerSecond * Math.max(0.55, Math.min(1.45, intensityFactor));

        return normalizeDurationSeconds(distanceMeters / adjustedSpeed);
    }

    if (sport === 'swim') {
        const baseMetersPerSecond = 1.67;
        const adjustedSpeed = baseMetersPerSecond * Math.max(0.65, Math.min(1.4, intensityFactor));

        return normalizeDurationSeconds(distanceMeters / adjustedSpeed);
    }

    const fallbackMetersPerSecond = 3.2 * Math.max(0.5, Math.min(1.3, intensityFactor));

    return normalizeDurationSeconds(distanceMeters / fallbackMetersPerSecond);
}

export function buildPreviewSegments(
    step: WorkoutStructureStep,
    mode: WorkoutStructureMode,
    unit: WorkoutStructureUnit,
    sport = 'other',
    trainingTargets: AthleteTrainingTargets | null = null,
): PreviewSegment[] {
    const cycles = step.type === 'repeats' ? Math.max(2, step.repeatCount) : 1;
    const sourceItems = step.items ?? [
        {
            id: `${step.id}-base`,
            label: blockLabel(step.type),
            durationType: step.durationType,
            durationSeconds: step.durationSeconds,
            durationMinutes: step.durationMinutes,
            distanceMeters: step.distanceMeters,
            target: step.target,
            rangeMin: step.rangeMin,
            rangeMax: step.rangeMax,
            zoneLabel: step.zoneLabel,
        },
    ];

    const segments: PreviewSegment[] = [];

    for (let cycleIndex = 0; cycleIndex < cycles; cycleIndex += 1) {
        sourceItems.forEach((item, itemIndex) => {
            const [min, max] = resolveIntensityBounds(item, mode);
            const durationSeconds = resolveDurationSecondsFromSource(
                item,
                mode,
                unit,
                sport,
                trainingTargets,
            );

            segments.push({
                id: `${step.id}-${cycleIndex}-${item.id}-${itemIndex}`,
                durationSeconds,
                durationMinutes: secondsToRoundedMinutes(durationSeconds),
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
    sport = 'other',
    trainingTargets: AthleteTrainingTargets | null = null,
): number {
    if (structure === null) {
        return 0;
    }

    const totalSeconds = structure.steps.reduce((carry, step) => {
        const segments = buildPreviewSegments(
            step,
            structure.mode,
            structure.unit,
            sport,
            trainingTargets,
        );
        const segmentDuration = segments.reduce((segmentCarry, segment) => {
            return segmentCarry + normalizeDurationSeconds(segment.durationSeconds);
        }, 0);

        return carry + segmentDuration;
    }, 0);

    if (totalSeconds <= 0) {
        return 0;
    }

    return Math.max(1, Math.round(totalSeconds / 60));
}

export function estimateWorkoutStructureTss(
    structure: WorkoutStructure | null,
    sport = 'other',
    trainingTargets: AthleteTrainingTargets | null = null,
): number | null {
    if (structure === null) {
        return null;
    }

    const total = structure.steps.reduce((carry, step) => {
        const segments = buildPreviewSegments(
            step,
            structure.mode,
            structure.unit,
            sport,
            trainingTargets,
        );

        const segmentTotal = segments.reduce((segmentCarry, segment) => {
            const midpoint = (segment.intensityMin + segment.intensityMax) / 2;
            const intensityFactor =
                structure.unit === 'rpe' ? midpoint / 10 : midpoint / 100;
            const durationHours = normalizeDurationSeconds(segment.durationSeconds) / 3600;

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

export function formatDurationSecondsHuman(durationSeconds: number): string {
    const safeSeconds = Math.max(0, Math.round(durationSeconds));
    const hours = Math.floor(safeSeconds / 3600);
    const remainingAfterHours = safeSeconds % 3600;
    const minutes = Math.floor(remainingAfterHours / 60);
    const seconds = remainingAfterHours % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    }

    return `${minutes}m ${seconds}s`;
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

