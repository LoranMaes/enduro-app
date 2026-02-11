import { useCallback, useMemo, useState } from 'react';
import type { MapPoint, SelectionRangeSummary, StreamSeries } from '../types';
import {
    averageNumeric,
    calculateElevationGain,
    sliceNumericRange,
} from '../utils';

type UseSessionZoomOptions = {
    xMin: number;
    xMax: number;
    baseSeries: StreamSeries[];
    referencePoints: Array<{ x: number; sampleIndex: number }>;
    latLngPoints: MapPoint[];
    rawXAxisSamples: number[];
    fallbackXAxisBySample: Map<number, number>;
    normalizedStreams: Record<string, number[]>;
    onHoverSampleIndexChange: (value: number | null) => void;
};

type UseSessionZoomResult = {
    zoomStartPercent: number;
    zoomEndPercent: number;
    isZoomed: boolean;
    zoomedXRange: { min: number; max: number };
    zoomedSeries: StreamSeries[];
    visibleReferencePoints: Array<{ x: number; sampleIndex: number }>;
    visibleSampleRange: { start: number; end: number } | null;
    focusedRoutePoints: MapPoint[];
    selectedRangeSummary: SelectionRangeSummary | null;
    showSelectionPanel: boolean;
    resetZoomSelection: () => void;
    applyZoomSelection: (selectionMin: number, selectionMax: number) => void;
};

export function useSessionZoom({
    xMin,
    xMax,
    baseSeries,
    referencePoints,
    latLngPoints,
    rawXAxisSamples,
    fallbackXAxisBySample,
    normalizedStreams,
    onHoverSampleIndexChange,
}: UseSessionZoomOptions): UseSessionZoomResult {
    const [zoomStartPercent, setZoomStartPercent] = useState(0);
    const [zoomEndPercent, setZoomEndPercent] = useState(100);

    const zoomedXRange = useMemo(() => {
        const span = Math.max(0.000001, xMax - xMin);

        return {
            min: xMin + (span * zoomStartPercent) / 100,
            max: xMin + (span * zoomEndPercent) / 100,
        };
    }, [xMax, xMin, zoomEndPercent, zoomStartPercent]);

    const zoomedSeries = useMemo(() => {
        return baseSeries
            .map((series) => ({
                ...series,
                points: series.points.filter((point) => {
                    return (
                        point.x >= zoomedXRange.min &&
                        point.x <= zoomedXRange.max
                    );
                }),
            }))
            .filter((series) => series.points.length > 1);
    }, [baseSeries, zoomedXRange.max, zoomedXRange.min]);

    const visibleReferencePoints = useMemo(() => {
        return referencePoints.filter((point) => {
            return point.x >= zoomedXRange.min && point.x <= zoomedXRange.max;
        });
    }, [referencePoints, zoomedXRange.max, zoomedXRange.min]);

    const visibleSampleRange = useMemo(() => {
        if (visibleReferencePoints.length === 0) {
            return null;
        }

        const first = visibleReferencePoints[0];
        const last = visibleReferencePoints[visibleReferencePoints.length - 1];

        return {
            start: Math.min(first.sampleIndex, last.sampleIndex),
            end: Math.max(first.sampleIndex, last.sampleIndex),
        };
    }, [visibleReferencePoints]);

    const focusedRoutePoints = useMemo(() => {
        if (latLngPoints.length < 2 || visibleSampleRange === null) {
            return [] as MapPoint[];
        }

        const startIndex = Math.max(
            0,
            Math.min(latLngPoints.length - 1, visibleSampleRange.start),
        );
        const endIndex = Math.max(
            startIndex + 1,
            Math.min(latLngPoints.length - 1, visibleSampleRange.end),
        );

        return latLngPoints.slice(startIndex, endIndex + 1);
    }, [latLngPoints, visibleSampleRange]);

    const isZoomed = zoomStartPercent > 0 || zoomEndPercent < 100;

    const resetZoomSelection = useCallback((): void => {
        setZoomStartPercent(0);
        setZoomEndPercent(100);
        onHoverSampleIndexChange(null);
    }, [onHoverSampleIndexChange]);

    const selectedRangeSummary = useMemo(() => {
        if (!isZoomed || visibleSampleRange === null) {
            return null;
        }

        const startIndex = Math.max(0, visibleSampleRange.start);
        const endIndex = Math.max(startIndex, visibleSampleRange.end);
        const selectedHeartRate = averageNumeric(
            sliceNumericRange(
                normalizedStreams.heart_rate ?? [],
                startIndex,
                endIndex,
            ),
        );
        const selectedPower = averageNumeric(
            sliceNumericRange(
                normalizedStreams.power ?? [],
                startIndex,
                endIndex,
            ),
        );
        const selectedCadence = averageNumeric(
            sliceNumericRange(
                normalizedStreams.cadence ?? [],
                startIndex,
                endIndex,
            ),
        );
        const selectedSpeed = averageNumeric(
            sliceNumericRange(
                normalizedStreams.speed ?? [],
                startIndex,
                endIndex,
            ),
        );
        const selectedElevationGain = calculateElevationGain(
            sliceNumericRange(
                normalizedStreams.elevation ?? [],
                startIndex,
                endIndex,
            ),
        );
        const timeSeries = normalizedStreams.time ?? [];
        const distanceSeries = normalizedStreams.distance ?? [];
        const startTime = timeSeries[startIndex];
        const endTime = timeSeries[endIndex];
        const startDistance = distanceSeries[startIndex];
        const endDistance = distanceSeries[endIndex];
        const elapsedSeconds =
            startTime === undefined || endTime === undefined
                ? null
                : Math.max(0, endTime - startTime);
        const distanceKilometers =
            startDistance === undefined || endDistance === undefined
                ? null
                : Math.max(0, (endDistance - startDistance) / 1000);

        return {
            startIndex,
            endIndex,
            startXValue:
                rawXAxisSamples[startIndex] ??
                fallbackXAxisBySample.get(startIndex) ??
                null,
            endXValue:
                rawXAxisSamples[endIndex] ??
                fallbackXAxisBySample.get(endIndex) ??
                null,
            elapsedSeconds,
            distanceKilometers,
            avgHeartRate: selectedHeartRate,
            avgPower: selectedPower,
            avgCadence: selectedCadence,
            avgSpeedMetersPerSecond: selectedSpeed,
            elevationGainMeters: selectedElevationGain,
        };
    }, [
        fallbackXAxisBySample,
        isZoomed,
        normalizedStreams.cadence,
        normalizedStreams.distance,
        normalizedStreams.elevation,
        normalizedStreams.heart_rate,
        normalizedStreams.power,
        normalizedStreams.speed,
        normalizedStreams.time,
        rawXAxisSamples,
        visibleSampleRange,
    ]);

    const showSelectionPanel = selectedRangeSummary !== null;

    const applyZoomSelection = useCallback(
        (selectionMin: number, selectionMax: number): void => {
            const span = Math.max(0.000001, xMax - xMin);
            const normalizedMin = Math.max(
                xMin,
                Math.min(selectionMin, selectionMax),
            );
            const normalizedMax = Math.min(
                xMax,
                Math.max(selectionMin, selectionMax),
            );
            const start = ((normalizedMin - xMin) / span) * 100;
            const end = ((normalizedMax - xMin) / span) * 100;

            if (end - start < 2) {
                return;
            }

            setZoomStartPercent(Math.max(0, Math.min(100, start)));
            setZoomEndPercent(Math.max(0, Math.min(100, end)));
            onHoverSampleIndexChange(null);
        },
        [onHoverSampleIndexChange, xMax, xMin],
    );

    return {
        zoomStartPercent,
        zoomEndPercent,
        isZoomed,
        zoomedXRange,
        zoomedSeries,
        visibleReferencePoints,
        visibleSampleRange,
        focusedRoutePoints,
        selectedRangeSummary,
        showSelectionPanel,
        resetZoomSelection,
        applyZoomSelection,
    };
}
