import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { MapPoint, PlannedSegment } from '../types';

type UseSessionHoverOptions = {
    latLngPoints: MapPoint[];
    rawXAxisSamples: number[];
    fallbackXAxisBySample: Map<number, number>;
    enabledStreamKeys: string[];
    normalizedStreams: Record<string, number[]>;
    plannedSegments: PlannedSegment[];
};

type UseSessionHoverResult = {
    hoverSampleIndex: number | null;
    setHoverSampleIndex: Dispatch<SetStateAction<number | null>>;
    hoveredPlannedSegmentId: string | null;
    setHoveredPlannedSegmentId: Dispatch<SetStateAction<string | null>>;
    hoverPoint: MapPoint | null;
    hoverSummary: {
        xValue: number | null;
        values: Array<{ key: string; value: number | null }>;
    } | null;
    hoveredPlannedSegment: PlannedSegment | null;
};

export function useSessionHover({
    latLngPoints,
    rawXAxisSamples,
    fallbackXAxisBySample,
    enabledStreamKeys,
    normalizedStreams,
    plannedSegments,
}: UseSessionHoverOptions): UseSessionHoverResult {
    const [hoverSampleIndex, setHoverSampleIndex] = useState<number | null>(
        null,
    );
    const [hoveredPlannedSegmentId, setHoveredPlannedSegmentId] = useState<
        string | null
    >(null);

    const hoverPoint = useMemo(() => {
        if (hoverSampleIndex === null) {
            return null;
        }

        return latLngPoints[hoverSampleIndex] ?? null;
    }, [hoverSampleIndex, latLngPoints]);

    const hoverSummary = useMemo(() => {
        if (hoverSampleIndex === null) {
            return null;
        }

        const xValue =
            rawXAxisSamples[hoverSampleIndex] ??
            fallbackXAxisBySample.get(hoverSampleIndex) ??
            null;

        return {
            xValue,
            values: enabledStreamKeys.map((streamKey) => ({
                key: streamKey,
                value: normalizedStreams[streamKey]?.[hoverSampleIndex] ?? null,
            })),
        };
    }, [
        enabledStreamKeys,
        fallbackXAxisBySample,
        hoverSampleIndex,
        normalizedStreams,
        rawXAxisSamples,
    ]);

    const hoveredPlannedSegment = useMemo(() => {
        if (hoveredPlannedSegmentId === null) {
            return null;
        }

        return (
            plannedSegments.find(
                (segment) => segment.id === hoveredPlannedSegmentId,
            ) ?? null
        );
    }, [hoveredPlannedSegmentId, plannedSegments]);

    return {
        hoverSampleIndex,
        setHoverSampleIndex,
        hoveredPlannedSegmentId,
        setHoveredPlannedSegmentId,
        hoverPoint,
        hoverSummary,
        hoveredPlannedSegment,
    };
}
