import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import { streams as activityStreams } from '@/routes/activities';
import { maxChartRenderPoints, streamColors } from '../constants';
import type {
    MapPoint,
    PlannedSegment,
    SessionView,
    StreamPayload,
    StreamSeries,
    StreamSeriesPoint,
    XAxisMode,
} from '../types';
import {
    buildPlannedSegments,
    buildSampledIndices,
    decodePolyline,
    normalizeNumericSeries,
} from '../utils';

type UseSessionStreamsOptions = {
    linkedActivityId: number | null;
    plannedStructure: SessionView['plannedStructure'];
};

type UseSessionStreamsResult = {
    streamData: StreamPayload | null;
    streamError: string | null;
    isLoadingStreams: boolean;
    activeStreams: Record<string, boolean>;
    setActiveStreams: Dispatch<SetStateAction<Record<string, boolean>>>;
    xAxisMode: XAxisMode;
    setXAxisMode: Dispatch<SetStateAction<XAxisMode>>;
    availableStreams: Set<string>;
    normalizedStreams: Record<string, number[]>;
    orderedStreamKeys: string[];
    enabledStreamKeys: string[];
    rawXAxisSamples: number[];
    sourceSampleCount: number;
    sampledIndices: number[];
    referencePoints: Array<{ sampleIndex: number; x: number }>;
    baseSeries: StreamSeries[];
    fallbackXAxisBySample: Map<number, number>;
    axisDomainSamples: number[];
    latLngPoints: MapPoint[];
    xMin: number;
    xMax: number;
    plannedSegments: PlannedSegment[];
    hasPlannedStructure: boolean;
    plannedPreviewScaleMax: number;
    totalPlannedSegmentDuration: number;
    canUseDistanceAxis: boolean;
};

export function useSessionStreams({
    linkedActivityId,
    plannedStructure,
}: UseSessionStreamsOptions): UseSessionStreamsResult {
    const [streamData, setStreamData] = useState<StreamPayload | null>(null);
    const [streamError, setStreamError] = useState<string | null>(null);
    const [isLoadingStreams, setIsLoadingStreams] = useState(false);
    const [activeStreams, setActiveStreams] = useState<Record<string, boolean>>(
        {},
    );
    const [xAxisMode, setXAxisMode] = useState<XAxisMode>('distance');

    useEffect(() => {
        if (linkedActivityId === null) {
            return;
        }

        const abortController = new AbortController();

        setIsLoadingStreams(true);
        setStreamError(null);

        const route = activityStreams(linkedActivityId);

        void fetch(route.url, {
            method: route.method,
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
            signal: abortController.signal,
        })
            .then(async (response) => {
                if (!response.ok) {
                    throw new Error('Unable to load activity streams.');
                }

                const payload = (await response.json()) as {
                    data?: StreamPayload;
                };

                if (payload.data === undefined) {
                    throw new Error('Unexpected stream payload.');
                }

                const streamPayload = payload.data;
                setStreamData(streamPayload);

                const defaults = new Set(streamPayload.default_enabled_streams);
                const available = new Set(streamPayload.available_streams);
                const toggles: Record<string, boolean> = {};

                streamPayload.stream_catalog.forEach((streamKey) => {
                    toggles[streamKey] =
                        defaults.has(streamKey) && available.has(streamKey);
                });

                setActiveStreams(toggles);
                setXAxisMode(
                    streamPayload.available_streams.includes('distance')
                        ? 'distance'
                        : 'time',
                );
            })
            .catch((error: unknown) => {
                if (abortController.signal.aborted) {
                    return;
                }

                if (error instanceof Error) {
                    setStreamError(error.message);
                } else {
                    setStreamError('Unable to load activity streams.');
                }
            })
            .finally(() => {
                if (!abortController.signal.aborted) {
                    setIsLoadingStreams(false);
                }
            });

        return () => {
            abortController.abort();
        };
    }, [linkedActivityId]);

    const availableStreams = useMemo<Set<string>>(() => {
        if (streamData === null) {
            return new Set<string>();
        }

        return new Set(streamData.available_streams);
    }, [streamData]);

    const normalizedStreams = useMemo(() => {
        if (streamData === null) {
            return {} as Record<string, number[]>;
        }

        const values: Record<string, number[]> = {};

        Object.entries(streamData.streams).forEach(
            ([streamKey, streamValues]) => {
                values[streamKey] = normalizeNumericSeries(streamValues);
            },
        );

        return values;
    }, [streamData]);

    const orderedStreamKeys = useMemo(() => {
        if (streamData === null) {
            return [] as string[];
        }

        return [...streamData.stream_catalog].sort((left, right) => {
            const leftAvailable = availableStreams.has(left) ? 0 : 1;
            const rightAvailable = availableStreams.has(right) ? 0 : 1;

            if (leftAvailable !== rightAvailable) {
                return leftAvailable - rightAvailable;
            }

            return (
                streamData.stream_catalog.indexOf(left) -
                streamData.stream_catalog.indexOf(right)
            );
        });
    }, [availableStreams, streamData]);

    const enabledStreamKeys = useMemo(() => {
        if (streamData === null) {
            return [] as string[];
        }

        return orderedStreamKeys.filter(
            (key) => availableStreams.has(key) && activeStreams[key] === true,
        );
    }, [activeStreams, availableStreams, orderedStreamKeys, streamData]);

    const rawXAxisSamples = useMemo(() => {
        const timeSamples = normalizedStreams.time ?? [];
        const distanceSamples = normalizedStreams.distance ?? [];

        if (xAxisMode === 'distance' && distanceSamples.length > 0) {
            return distanceSamples.map((sample) => sample / 1000);
        }

        return timeSamples;
    }, [normalizedStreams.distance, normalizedStreams.time, xAxisMode]);

    const sourceSampleCount = useMemo(() => {
        return Math.max(
            rawXAxisSamples.length,
            ...Object.values(normalizedStreams).map((values) => values.length),
        );
    }, [normalizedStreams, rawXAxisSamples.length]);

    const sampledIndices = useMemo(() => {
        return buildSampledIndices(sourceSampleCount, maxChartRenderPoints);
    }, [sourceSampleCount]);

    const referencePoints = useMemo(() => {
        return sampledIndices.map((sampleIndex) => {
            return {
                sampleIndex,
                x: rawXAxisSamples[sampleIndex] ?? sampleIndex,
            };
        });
    }, [rawXAxisSamples, sampledIndices]);

    const baseSeries = useMemo<StreamSeries[]>(() => {
        if (streamData === null) {
            return [];
        }

        return enabledStreamKeys
            .map((streamKey) => {
                const values = normalizedStreams[streamKey] ?? [];

                if (values.length === 0) {
                    return null;
                }

                const points = sampledIndices
                    .map((sampleIndex) => {
                        const value = values[sampleIndex];

                        if (value === undefined || Number.isNaN(value)) {
                            return null;
                        }

                        return {
                            x: rawXAxisSamples[sampleIndex] ?? sampleIndex,
                            y: value,
                            sampleIndex,
                        };
                    })
                    .filter(
                        (value): value is StreamSeriesPoint => value !== null,
                    );

                if (points.length < 2) {
                    return null;
                }

                return {
                    key: streamKey,
                    color: streamColors[streamKey] ?? '#a1a1aa',
                    points,
                };
            })
            .filter((value): value is StreamSeries => value !== null);
    }, [
        enabledStreamKeys,
        normalizedStreams,
        rawXAxisSamples,
        sampledIndices,
        streamData,
    ]);

    const fallbackXAxisBySample = useMemo(() => {
        const map = new Map<number, number>();

        referencePoints.forEach((point) => {
            map.set(point.sampleIndex, point.x);
        });

        return map;
    }, [referencePoints]);

    const axisDomainSamples = useMemo(() => {
        return referencePoints.map((point) => point.x);
    }, [referencePoints]);

    const latLngPoints = useMemo(() => {
        if (streamData === null) {
            return [] as MapPoint[];
        }

        const latlngStream = streamData.streams.latlng ?? [];

        if (latlngStream.length > 0) {
            return latlngStream
                .map((point) => {
                    if (!Array.isArray(point) || point.length < 2) {
                        return null;
                    }

                    const latitude = Number(point[0]);
                    const longitude = Number(point[1]);

                    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
                        return null;
                    }

                    return [latitude, longitude] as MapPoint;
                })
                .filter((point): point is MapPoint => point !== null);
        }

        if (
            streamData.summary_polyline !== null &&
            streamData.summary_polyline.trim() !== ''
        ) {
            return decodePolyline(streamData.summary_polyline);
        }

        return [] as MapPoint[];
    }, [streamData]);

    const xMin = useMemo(() => {
        if (axisDomainSamples.length === 0) {
            return 0;
        }

        return Math.min(...axisDomainSamples);
    }, [axisDomainSamples]);

    const xMax = useMemo(() => {
        if (axisDomainSamples.length === 0) {
            return 0;
        }

        return Math.max(...axisDomainSamples);
    }, [axisDomainSamples]);

    const plannedSegments = useMemo(() => {
        return buildPlannedSegments(plannedStructure);
    }, [plannedStructure]);

    const hasPlannedStructure = plannedSegments.length > 0;

    const plannedPreviewScaleMax = useMemo(() => {
        if (!hasPlannedStructure) {
            return 120;
        }

        const maxIntensity = plannedSegments.reduce((carry, segment) => {
            return Math.max(carry, segment.max);
        }, 0);

        if (plannedStructure?.unit === 'rpe') {
            return Math.max(10, Math.ceil(maxIntensity));
        }

        return Math.max(120, Math.ceil((maxIntensity + 5) / 5) * 5);
    }, [hasPlannedStructure, plannedSegments, plannedStructure?.unit]);

    const totalPlannedSegmentDuration = useMemo(() => {
        return plannedSegments.reduce((carry, segment) => {
            return carry + Math.max(1, segment.durationMinutes);
        }, 0);
    }, [plannedSegments]);

    const canUseDistanceAxis = availableStreams.has('distance');

    return {
        streamData,
        streamError,
        isLoadingStreams,
        activeStreams,
        setActiveStreams,
        xAxisMode,
        setXAxisMode,
        availableStreams,
        normalizedStreams,
        orderedStreamKeys,
        enabledStreamKeys,
        rawXAxisSamples,
        sourceSampleCount,
        sampledIndices,
        referencePoints,
        baseSeries,
        fallbackXAxisBySample,
        axisDomainSamples,
        latLngPoints,
        xMin,
        xMax,
        plannedSegments,
        hasPlannedStructure,
        plannedPreviewScaleMax,
        totalPlannedSegmentDuration,
        canUseDistanceAxis,
    };
}
