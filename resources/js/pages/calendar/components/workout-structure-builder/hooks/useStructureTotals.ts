import { useMemo } from 'react';
import type { PreviewGroup, WorkoutStructure } from '../types';
import {
    buildPreviewSegments,
    calculateWorkoutStructureDurationMinutes,
    estimateWorkoutStructureTss,
    patternLabelForStep,
} from '../utils';

type StructureTotals = {
    previewGroups: PreviewGroup[];
    totalDuration: number;
    estimatedTss: number | null;
    previewScaleMax: number;
    axisTicks: number[];
    insertionOffsets: number[];
};

export function useStructureTotals(
    structure: WorkoutStructure | null,
): StructureTotals {
    const previewGroups = useMemo(() => {
        if (structure === null) {
            return [] as PreviewGroup[];
        }

        return structure.steps.map((step, stepIndex) => {
            const segments = buildPreviewSegments(step, structure.mode, structure.unit);
            const totalDurationMinutes = segments.reduce(
                (carry, segment) => carry + Math.max(1, segment.durationMinutes),
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
    }, [structure]);

    const totalDuration = useMemo(() => {
        return calculateWorkoutStructureDurationMinutes(structure);
    }, [structure]);

    const estimatedTss = useMemo(() => {
        return estimateWorkoutStructureTss(structure);
    }, [structure]);

    const previewScaleMax = useMemo(() => {
        if (structure === null) {
            return 120;
        }

        const maxIntensity = previewGroups
            .flatMap((group) => group.segments)
            .reduce((carry, segment) => Math.max(carry, segment.intensityMax), 0);

        if (structure.unit === 'rpe') {
            return Math.max(10, Math.ceil(maxIntensity));
        }

        return Math.max(120, Math.ceil((maxIntensity + 5) / 5) * 5);
    }, [previewGroups, structure]);

    const axisTicks = useMemo(() => {
        if (structure === null) {
            return [] as number[];
        }

        const defaultTicks =
            structure.unit === 'rpe'
                ? [0, 2, 4, 6, 8, 10]
                : [0, 50, 75, 100, previewScaleMax];

        return Array.from(new Set(defaultTicks))
            .filter((tick) => tick <= previewScaleMax)
            .sort((left, right) => left - right);
    }, [previewScaleMax, structure]);

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

    return {
        previewGroups,
        totalDuration,
        estimatedTss,
        previewScaleMax,
        axisTicks,
        insertionOffsets,
    };
}
