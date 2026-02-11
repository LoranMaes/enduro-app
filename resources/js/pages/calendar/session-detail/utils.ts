import type { TrainingSessionView } from '@/types/training-plans';
import type { MapPoint, PlannedSegment, XAxisMode } from './types';

export function buildSampledIndices(
    totalSamples: number,
    maxPoints: number,
): number[] {
    if (totalSamples <= 0) {
        return [];
    }

    if (totalSamples <= maxPoints) {
        return Array.from({ length: totalSamples }, (_, index) => index);
    }

    const step = Math.ceil(totalSamples / maxPoints);
    const sampled = [] as number[];

    for (let index = 0; index < totalSamples; index += step) {
        sampled.push(index);
    }

    if (sampled[sampled.length - 1] !== totalSamples - 1) {
        sampled.push(totalSamples - 1);
    }

    return sampled;
}

export function buildPlannedSegments(
    structure: TrainingSessionView['plannedStructure'],
): PlannedSegment[] {
    if (structure === null || structure.steps.length === 0) {
        return [];
    }

    const mode = structure.mode === 'target' ? 'target' : 'range';
    const segments = [] as PlannedSegment[];

    structure.steps.forEach((step, stepIndex) => {
        const sourceItems =
            step.items !== null &&
            step.items !== undefined &&
            Array.isArray(step.items) &&
            step.items.length > 0
                ? step.items
                : [
                      {
                          id: step.id ?? `step-${stepIndex}`,
                          label: formatBlockType(step.type),
                          durationMinutes: step.durationMinutes,
                          target: step.target ?? null,
                          rangeMin: step.rangeMin ?? null,
                          rangeMax: step.rangeMax ?? null,
                      },
                  ];

        const repeatCycles =
            step.type === 'repeats' ? Math.max(2, step.repeatCount ?? 2) : 1;

        for (let cycle = 0; cycle < repeatCycles; cycle += 1) {
            sourceItems.forEach((item, itemIndex) => {
                const bounds = resolvePlannedBounds(
                    {
                        target: item.target ?? null,
                        rangeMin: item.rangeMin ?? null,
                        rangeMax: item.rangeMax ?? null,
                    },
                    mode,
                );

                segments.push({
                    id: `${step.id ?? `step-${stepIndex}`}-${cycle}-${item.id ?? `item-${itemIndex}`}`,
                    type: step.type,
                    label:
                        item.label ??
                        `${formatBlockType(step.type)} ${itemIndex + 1}`,
                    durationMinutes: Math.max(
                        1,
                        Math.round(item.durationMinutes),
                    ),
                    min: bounds.min,
                    max: bounds.max,
                });
            });
        }
    });

    return segments;
}

export function resolvePlannedBounds(
    value: {
        target: number | null;
        rangeMin: number | null;
        rangeMax: number | null;
    },
    mode: 'range' | 'target',
): { min: number; max: number } {
    if (mode === 'target') {
        const target = value.target ?? 0;

        return {
            min: target,
            max: target,
        };
    }

    const min = value.rangeMin ?? value.target ?? 0;
    const max = value.rangeMax ?? value.target ?? min;

    return {
        min: Math.min(min, max),
        max: Math.max(min, max),
    };
}

export function plannedBlockColor(type: string): string {
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

export function formatPlannedSegmentSummary(
    segment: PlannedSegment,
    mode: string,
): string {
    const intensityLabel =
        mode === 'target'
            ? `Target ${Math.round(segment.max)}`
            : `Range ${Math.round(segment.min)}-${Math.round(segment.max)}`;

    return `${segment.label} • ${segment.durationMinutes}m • ${intensityLabel}`;
}

export function serializePlannedStructureForRequest(
    structure: TrainingSessionView['plannedStructure'],
): {
    unit: string;
    mode: 'range' | 'target' | string;
    steps: Array<{
        id: string | null;
        type: string;
        duration_minutes: number;
        target: number | null;
        range_min: number | null;
        range_max: number | null;
        repeat_count: number | null;
        note: string | null;
        items: Array<{
            id: string | null;
            label: string | null;
            duration_minutes: number;
            target: number | null;
            range_min: number | null;
            range_max: number | null;
        }> | null;
    }>;
} | null {
    if (structure === null || structure.steps.length === 0) {
        return null;
    }

    return {
        unit: structure.unit,
        mode: structure.mode,
        steps: structure.steps.map((step) => ({
            id: step.id ?? null,
            type: step.type,
            duration_minutes: Math.max(1, Math.round(step.durationMinutes)),
            target: step.target ?? null,
            range_min: step.rangeMin ?? null,
            range_max: step.rangeMax ?? null,
            repeat_count: step.repeatCount ?? null,
            note: step.note ?? null,
            items:
                step.items?.map((item) => ({
                    id: item.id ?? null,
                    label: item.label ?? null,
                    duration_minutes: Math.max(
                        1,
                        Math.round(item.durationMinutes),
                    ),
                    target: item.target ?? null,
                    range_min: item.rangeMin ?? null,
                    range_max: item.rangeMax ?? null,
                })) ?? null,
        })),
    };
}

export function extractErrorMessage(payload: unknown): string | null {
    if (
        typeof payload === 'object' &&
        payload !== null &&
        'message' in payload &&
        typeof payload.message === 'string'
    ) {
        return payload.message;
    }

    return null;
}

export function sliceNumericRange(
    values: number[],
    startIndex: number,
    endIndex: number,
): number[] {
    if (values.length === 0) {
        return [];
    }

    const start = Math.max(0, Math.min(startIndex, endIndex));
    const end = Math.max(start, Math.max(startIndex, endIndex));

    return values
        .slice(start, end + 1)
        .filter((value) => Number.isFinite(value));
}

export function averageNumeric(values: number[]): number | null {
    const valid = values.filter((value) => Number.isFinite(value));

    if (valid.length === 0) {
        return null;
    }

    const total = valid.reduce((carry, value) => carry + value, 0);

    return total / valid.length;
}

export function calculateElevationGain(values: number[]): number | null {
    if (values.length < 2) {
        return null;
    }

    let gain = 0;

    for (let index = 1; index < values.length; index += 1) {
        const delta = values[index] - values[index - 1];

        if (delta > 0) {
            gain += delta;
        }
    }

    return gain;
}

export function formatAverageSpeedForSport(
    sport: string,
    speedMetersPerSecond: number | null,
): string {
    if (speedMetersPerSecond === null || speedMetersPerSecond <= 0) {
        return '—';
    }

    if (sport === 'run') {
        const secondsPerKilometer = 1000 / speedMetersPerSecond;

        return `${formatDurationSeconds(secondsPerKilometer)}/km`;
    }

    if (sport === 'swim') {
        const secondsPer100Meters = 100 / speedMetersPerSecond;

        return `${formatDurationSeconds(secondsPer100Meters)}/100m`;
    }

    return `${(speedMetersPerSecond * 3.6).toFixed(1)} km/h`;
}

export function normalizeNumericSeries(
    values: Array<number | [number, number]>,
): number[] {
    return values
        .map((value) => {
            if (Array.isArray(value)) {
                return Number(value[0]);
            }

            return Number(value);
        })
        .filter((value) => !Number.isNaN(value));
}

export function decodePolyline(polyline: string): MapPoint[] {
    let index = 0;
    let latitude = 0;
    let longitude = 0;
    const coordinates: MapPoint[] = [];

    while (index < polyline.length) {
        let shift = 0;
        let result = 0;
        let byte: number;

        do {
            byte = polyline.charCodeAt(index) - 63;
            index += 1;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const latitudeDelta = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        latitude += latitudeDelta;

        shift = 0;
        result = 0;

        do {
            byte = polyline.charCodeAt(index) - 63;
            index += 1;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        const longitudeDelta =
            (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
        longitude += longitudeDelta;

        coordinates.push([latitude / 1e5, longitude / 1e5]);
    }

    return coordinates;
}

export function formatDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

export function formatDurationMinutes(value: number | null): string {
    if (value === null || Number.isNaN(value)) {
        return '—';
    }

    const hours = Math.floor(value / 60);
    const minutes = value % 60;

    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (hours > 0) {
        return `${hours}h`;
    }

    return `${minutes}m`;
}

export function formatNumber(value: number | null): string {
    if (value === null || Number.isNaN(value)) {
        return '—';
    }

    return `${value}`;
}

export function formatStructureUnit(unit: string): string {
    switch (unit) {
        case 'ftp_percent':
            return 'FTP%';
        case 'max_hr_percent':
            return 'Max HR%';
        case 'threshold_hr_percent':
            return 'THR%';
        case 'threshold_speed_percent':
            return 'Threshold Speed%';
        case 'rpe':
            return 'RPE';
        default:
            return unit;
    }
}

export function formatBlockType(type: string): string {
    switch (type) {
        case 'warmup':
            return 'Warmup';
        case 'active':
            return 'Active';
        case 'recovery':
            return 'Recovery';
        case 'cooldown':
            return 'Cool Down';
        case 'two_step_repeats':
            return 'Two Step Repeats';
        case 'three_step_repeats':
            return 'Three Step Repeats';
        case 'repeats':
            return 'Repeats';
        case 'ramp_up':
            return 'Ramp Up';
        case 'ramp_down':
            return 'Ramp Down';
        default:
            return type;
    }
}

export function formatDurationSeconds(totalSeconds: number): string {
    if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
        return '0:00';
    }

    const roundedSeconds = Math.round(totalSeconds);
    const hours = Math.floor(roundedSeconds / 3600);
    const minutes = Math.floor((roundedSeconds % 3600) / 60);
    const seconds = roundedSeconds % 60;

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
            .toString()
            .padStart(2, '0')}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function formatXAxisTick(value: number, mode: XAxisMode): string {
    if (mode === 'distance') {
        return `${value.toFixed(1)} km`;
    }

    return formatDurationSeconds(value);
}

export function formatXAxisValue(
    value: number | null,
    mode: XAxisMode,
): string {
    if (value === null || Number.isNaN(value)) {
        return '—';
    }

    if (mode === 'distance') {
        return `${value.toFixed(2)} km`;
    }

    return formatDurationSeconds(value);
}

export function formatStreamValue(
    streamKey: string,
    value: number | null,
): string {
    if (value === null || Number.isNaN(value)) {
        return '—';
    }

    switch (streamKey) {
        case 'heart_rate':
            return `${Math.round(value)} bpm`;
        case 'power':
            return `${Math.round(value)} W`;
        case 'cadence':
            return `${Math.round(value)} rpm`;
        case 'elevation':
            return `${Math.round(value)} m`;
        case 'temperature':
            return `${Math.round(value)} C`;
        case 'speed':
            return `${(value * 3.6).toFixed(1)} km/h`;
        case 'grade':
            return `${value.toFixed(1)}%`;
        case 'distance':
            return `${(value / 1000).toFixed(2)} km`;
        case 'power_balance_left_right':
            return `${value.toFixed(1)}%`;
        default:
            return `${Math.round(value)}`;
    }
}
