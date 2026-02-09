import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, MapPinned, RotateCcw, Save } from 'lucide-react';
import type { LatLngBoundsExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    useEffect,
    useMemo,
    useState,
    type MouseEvent as ReactMouseEvent,
} from 'react';
import {
    CircleMarker,
    MapContainer,
    Polyline,
    TileLayer,
    useMap,
    useMapEvents,
} from 'react-leaflet';
import { Textarea } from '@/components/ui/textarea';
import { mapTrainingSession } from '@/lib/training-plans';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { update as updateTrainingSession } from '@/routes/training-sessions';
import type { BreadcrumbItem, SharedData } from '@/types';
import type {
    TrainingSessionApi,
    TrainingSessionView,
} from '@/types/training-plans';

type StreamPayload = {
    provider: string;
    external_id: string;
    streams: Record<string, Array<number | [number, number]>>;
    available_streams: string[];
    summary_polyline: string | null;
    default_enabled_streams: string[];
    stream_catalog: string[];
};

type SessionDetailPageProps = {
    session: TrainingSessionApi;
    providerStatus: Record<
        string,
        {
            connected: boolean;
            last_synced_at: string | null;
            last_sync_status: string | null;
            provider_athlete_id: string | null;
        }
    > | null;
    isActivityOnly?: boolean;
};

type StreamSeriesPoint = {
    x: number;
    y: number;
    sampleIndex: number;
};

type StreamSeries = {
    key: string;
    color: string;
    points: StreamSeriesPoint[];
};

type XAxisMode = 'distance' | 'time';
type MapPoint = [number, number];

type PlannedSegment = {
    id: string;
    type: string;
    label: string;
    durationMinutes: number;
    min: number;
    max: number;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Calendar',
        href: dashboard().url,
    },
    {
        title: 'Session Detail',
        href: '/sessions',
    },
];

const streamLabels: Record<string, string> = {
    heart_rate: 'Heart Rate',
    power: 'Power',
    cadence: 'Cadence',
    elevation: 'Elevation',
    temperature: 'Temperature',
    power_balance_left_right: 'Power Balance L/R',
    speed: 'Speed',
    grade: 'Grade',
    distance: 'Distance',
};

const streamColors: Record<string, string> = {
    heart_rate: '#fb7185',
    power: '#a78bfa',
    cadence: '#38bdf8',
    elevation: '#d4d4d8',
    temperature: '#f87171',
    power_balance_left_right: '#fbbf24',
    speed: '#22d3ee',
    grade: '#14b8a6',
    distance: '#10b981',
};

const maxChartRenderPoints = 1400;

export default function SessionDetailPage({
    session,
    providerStatus,
    isActivityOnly = false,
}: SessionDetailPageProps) {
    const { auth } = usePage<SharedData>().props;
    const sessionView = mapTrainingSession(session);

    const [streamData, setStreamData] = useState<StreamPayload | null>(null);
    const [streamError, setStreamError] = useState<string | null>(null);
    const [isLoadingStreams, setIsLoadingStreams] = useState(false);
    const [activeStreams, setActiveStreams] = useState<Record<string, boolean>>(
        {},
    );
    const [xAxisMode, setXAxisMode] = useState<XAxisMode>('distance');
    const [zoomStartPercent, setZoomStartPercent] = useState(0);
    const [zoomEndPercent, setZoomEndPercent] = useState(100);
    const [hoverSampleIndex, setHoverSampleIndex] = useState<number | null>(
        null,
    );
    const [hoveredPlannedSegmentId, setHoveredPlannedSegmentId] = useState<
        string | null
    >(null);
    const [internalNotes, setInternalNotes] = useState(sessionView.notes ?? '');
    const [savedNotes, setSavedNotes] = useState(sessionView.notes ?? '');
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const [notesError, setNotesError] = useState<string | null>(null);
    const [notesStatus, setNotesStatus] = useState<string | null>(null);
    const [sideCardTab, setSideCardTab] = useState<'statistics' | 'notes'>(
        'statistics',
    );

    const linkedActivityId = sessionView.linkedActivityId;
    const canEditNotes =
        !isActivityOnly &&
        auth.user.role === 'athlete' &&
        auth.impersonating !== true;

    useEffect(() => {
        setInternalNotes(sessionView.notes ?? '');
        setSavedNotes(sessionView.notes ?? '');
        setNotesError(null);
        setNotesStatus(null);
        setSideCardTab('statistics');
    }, [sessionView.id, sessionView.notes]);

    useEffect(() => {
        if (linkedActivityId === null) {
            return;
        }

        const abortController = new AbortController();

        setIsLoadingStreams(true);
        setStreamError(null);

        void fetch(`/api/activities/${linkedActivityId}/streams`, {
            method: 'GET',
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
                setHoverSampleIndex(null);
                setZoomStartPercent(0);
                setZoomEndPercent(100);

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

    const plannedSegments = useMemo(() => {
        return buildPlannedSegments(sessionView.plannedStructure);
    }, [sessionView.plannedStructure]);

    const hasPlannedStructure = plannedSegments.length > 0;

    const plannedPreviewScaleMax = useMemo(() => {
        if (!hasPlannedStructure) {
            return 120;
        }

        const maxIntensity = plannedSegments.reduce((carry, segment) => {
            return Math.max(carry, segment.max);
        }, 0);

        if (sessionView.plannedStructure?.unit === 'rpe') {
            return Math.max(10, Math.ceil(maxIntensity));
        }

        return Math.max(120, Math.ceil((maxIntensity + 5) / 5) * 5);
    }, [
        hasPlannedStructure,
        plannedSegments,
        sessionView.plannedStructure?.unit,
    ]);

    const totalPlannedSegmentDuration = useMemo(() => {
        return plannedSegments.reduce((carry, segment) => {
            return carry + Math.max(1, segment.durationMinutes);
        }, 0);
    }, [plannedSegments]);

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

    const avgHeartRate = useMemo(() => {
        return averageNumeric(normalizedStreams.heart_rate ?? []);
    }, [normalizedStreams.heart_rate]);

    const avgPower = useMemo(() => {
        return averageNumeric(normalizedStreams.power ?? []);
    }, [normalizedStreams.power]);

    const avgCadence = useMemo(() => {
        return averageNumeric(normalizedStreams.cadence ?? []);
    }, [normalizedStreams.cadence]);

    const avgSpeedMetersPerSecond = useMemo(() => {
        return averageNumeric(normalizedStreams.speed ?? []);
    }, [normalizedStreams.speed]);

    const totalDistanceKilometers = useMemo(() => {
        const distanceSeries = normalizedStreams.distance ?? [];

        if (distanceSeries.length === 0) {
            return null;
        }

        const lastValue = distanceSeries[distanceSeries.length - 1];

        return lastValue / 1000;
    }, [normalizedStreams.distance]);

    const elevationGainMeters = useMemo(() => {
        return calculateElevationGain(normalizedStreams.elevation ?? []);
    }, [normalizedStreams.elevation]);

    const stravaStatus = providerStatus?.strava ?? null;
    const integrationLabel =
        stravaStatus === null
            ? 'Integrations Unavailable'
            : stravaStatus.connected
              ? stravaStatus.last_sync_status === 'queued'
                  ? 'Strava Sync Queued'
                  : stravaStatus.last_sync_status === 'running'
                    ? 'Strava Syncing'
                    : 'Strava Connected'
              : 'Strava Disconnected';

    const canUseDistanceAxis = availableStreams.has('distance');
    const hasNotesChanged = internalNotes.trim() !== savedNotes.trim();
    const isZoomed = zoomStartPercent > 0 || zoomEndPercent < 100;
    const resetZoomSelection = (): void => {
        setZoomStartPercent(0);
        setZoomEndPercent(100);
        setHoverSampleIndex(null);
    };

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

    const applyZoomSelection = (
        selectionMin: number,
        selectionMax: number,
    ): void => {
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
        setHoverSampleIndex(null);
    };

    const saveInternalNotes = async (): Promise<void> => {
        if (!canEditNotes || isSavingNotes || !hasNotesChanged) {
            return;
        }

        setIsSavingNotes(true);
        setNotesError(null);
        setNotesStatus(null);

        const normalizedNotes = internalNotes.trim();

        try {
            const route = updateTrainingSession(sessionView.id);
            const response = await fetch(route.url, {
                method: 'PUT',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    training_week_id: sessionView.trainingWeekId,
                    date: sessionView.scheduledDate,
                    sport: sessionView.sport,
                    planned_duration_minutes: sessionView.durationMinutes,
                    planned_tss: sessionView.plannedTss,
                    notes: normalizedNotes === '' ? null : normalizedNotes,
                    planned_structure: serializePlannedStructureForRequest(
                        sessionView.plannedStructure,
                    ),
                }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null);
                const message =
                    extractErrorMessage(payload) ?? 'Unable to save notes.';

                setNotesError(message);
                return;
            }

            setSavedNotes(normalizedNotes);
            setNotesStatus('Internal notes saved.');
        } finally {
            setIsSavingNotes(false);
        }
    };

    const analysisPanel = (
        <div className="rounded-xl border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-zinc-200">Analysis</h2>

                <div className="flex flex-wrap items-center gap-1.5">
                    <button
                        type="button"
                        disabled={!canUseDistanceAxis}
                        onClick={() => {
                            setXAxisMode('distance');
                            setHoverSampleIndex(null);
                        }}
                        className={cn(
                            'rounded border px-2 py-1 text-[10px] transition-colors',
                            xAxisMode === 'distance'
                                ? 'border-zinc-600 bg-zinc-800 text-zinc-100'
                                : canUseDistanceAxis
                                  ? 'border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200'
                                  : 'cursor-not-allowed border-zinc-800 bg-zinc-950 text-zinc-700',
                        )}
                    >
                        Kilometers
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setXAxisMode('time');
                            setHoverSampleIndex(null);
                        }}
                        className={cn(
                            'rounded border px-2 py-1 text-[10px] transition-colors',
                            xAxisMode === 'time'
                                ? 'border-zinc-600 bg-zinc-800 text-zinc-100'
                                : 'border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200',
                        )}
                    >
                        Time
                    </button>
                    {isZoomed ? (
                        <button
                            type="button"
                            onClick={resetZoomSelection}
                            className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900/60 px-2 py-1 text-[10px] text-zinc-300 hover:text-zinc-100"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset Zoom
                        </button>
                    ) : null}
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
                {orderedStreamKeys.map((streamKey) => {
                    const isAvailable = availableStreams.has(streamKey);
                    const isEnabled = activeStreams[streamKey] ?? false;

                    return (
                        <button
                            key={streamKey}
                            type="button"
                            disabled={!isAvailable}
                            onClick={() => {
                                if (!isAvailable) {
                                    return;
                                }

                                setActiveStreams((current) => ({
                                    ...current,
                                    [streamKey]: !isEnabled,
                                }));
                            }}
                            className={cn(
                                'rounded border px-2 py-1 text-[10px] transition-colors',
                                isEnabled
                                    ? 'border-zinc-600 bg-zinc-800 text-zinc-200'
                                    : isAvailable
                                      ? 'border-zinc-700 bg-zinc-900/50 text-zinc-400 hover:text-zinc-200'
                                      : 'cursor-not-allowed border-zinc-800 bg-zinc-950 text-zinc-700',
                            )}
                        >
                            {streamLabels[streamKey] ?? streamKey}
                        </button>
                    );
                })}
            </div>

            <p className="mt-2 text-[11px] text-zinc-500">
                Click and drag on the chart to zoom into a section.
            </p>

            <div className="mt-4 w-full overflow-hidden rounded-lg border border-border/60 bg-background/70 p-3">
                <div className="flex flex-col gap-3 xl:flex-row">
                    <div
                        className={cn(
                            'min-w-0 transition-[width] duration-300 ease-out',
                            showSelectionPanel
                                ? 'xl:w-[calc(100%-17rem)]'
                                : 'xl:w-full',
                        )}
                    >
                        <div className="aspect-[16/6] min-h-[220px] w-full">
                            {isLoadingStreams ? (
                                <p className="text-xs text-zinc-500">
                                    Loading activity streams...
                                </p>
                            ) : streamError !== null ? (
                                <p className="text-xs text-red-300">
                                    {streamError}
                                </p>
                            ) : zoomedSeries.length > 0 &&
                              visibleReferencePoints.length > 1 ? (
                                <InteractiveStreamChart
                                    mode={xAxisMode}
                                    series={zoomedSeries}
                                    referencePoints={visibleReferencePoints}
                                    hoverSampleIndex={hoverSampleIndex}
                                    onHoverSampleIndexChange={
                                        setHoverSampleIndex
                                    }
                                    onZoomSelection={applyZoomSelection}
                                />
                            ) : (
                                <p className="text-xs text-zinc-500">
                                    Link and sync activity data to overlay
                                    actual traces.
                                </p>
                            )}
                        </div>

                        <div className="mt-3 rounded-md border border-border/70 bg-zinc-900/30 px-3 py-2">
                            {hoverSummary !== null ? (
                                <>
                                    <p className="text-[11px] text-zinc-400">
                                        {xAxisMode === 'distance'
                                            ? 'Distance'
                                            : 'Elapsed Time'}{' '}
                                        <span className="font-mono text-zinc-200">
                                            {formatXAxisValue(
                                                hoverSummary.xValue,
                                                xAxisMode,
                                            )}
                                        </span>
                                    </p>
                                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                                        {hoverSummary.values.map((item) => (
                                            <p
                                                key={item.key}
                                                className="text-[11px] text-zinc-500"
                                            >
                                                {streamLabels[item.key] ??
                                                    item.key}
                                                :{' '}
                                                <span
                                                    className="font-mono"
                                                    style={{
                                                        color:
                                                            streamColors[
                                                                item.key
                                                            ] ?? '#a1a1aa',
                                                    }}
                                                >
                                                    {formatStreamValue(
                                                        item.key,
                                                        item.value,
                                                    )}
                                                </span>
                                            </p>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <p className="text-[11px] text-zinc-500">
                                    Hover the chart to inspect values and
                                    highlight route position.
                                </p>
                            )}
                        </div>
                    </div>

                    <aside
                        className={cn(
                            'overflow-hidden rounded-md border text-[11px] transition-all duration-300 ease-out xl:shrink-0',
                            showSelectionPanel
                                ? 'max-h-[420px] border-border/70 bg-zinc-900/35 px-3 py-2 opacity-100 xl:max-h-none xl:w-[17rem]'
                                : 'max-h-0 border-transparent p-0 opacity-0 xl:w-0',
                        )}
                    >
                        {selectedRangeSummary !== null ? (
                            <>
                                <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
                                    Selected Range
                                </p>
                                <div className="mt-1 grid gap-1">
                                    <SelectionStatLine
                                        label="From"
                                        value={formatXAxisValue(
                                            selectedRangeSummary.startXValue,
                                            xAxisMode,
                                        )}
                                    />
                                    <SelectionStatLine
                                        label="To"
                                        value={formatXAxisValue(
                                            selectedRangeSummary.endXValue,
                                            xAxisMode,
                                        )}
                                    />
                                </div>

                                <div className="mt-2 border-t border-border/70 pt-2">
                                    <div className="grid gap-1.5">
                                        <SelectionStatLine
                                            label="Duration"
                                            value={
                                                selectedRangeSummary.elapsedSeconds ===
                                                null
                                                    ? '—'
                                                    : formatDurationSeconds(
                                                          selectedRangeSummary.elapsedSeconds,
                                                      )
                                            }
                                        />
                                        <SelectionStatLine
                                            label="Distance"
                                            value={
                                                selectedRangeSummary.distanceKilometers ===
                                                null
                                                    ? '—'
                                                    : `${selectedRangeSummary.distanceKilometers.toFixed(2)} km`
                                            }
                                        />
                                        <SelectionStatLine
                                            label="Elevation Gain"
                                            value={
                                                selectedRangeSummary.elevationGainMeters ===
                                                null
                                                    ? '—'
                                                    : `${Math.round(selectedRangeSummary.elevationGainMeters)} m`
                                            }
                                        />
                                        <SelectionStatLine
                                            label="Avg HR"
                                            value={
                                                selectedRangeSummary.avgHeartRate ===
                                                null
                                                    ? '—'
                                                    : `${Math.round(selectedRangeSummary.avgHeartRate)} bpm`
                                            }
                                        />
                                        <SelectionStatLine
                                            label="Avg Power"
                                            value={
                                                selectedRangeSummary.avgPower ===
                                                null
                                                    ? '—'
                                                    : `${Math.round(selectedRangeSummary.avgPower)} W`
                                            }
                                        />
                                        <SelectionStatLine
                                            label="Avg Cadence"
                                            value={
                                                selectedRangeSummary.avgCadence ===
                                                null
                                                    ? '—'
                                                    : `${Math.round(selectedRangeSummary.avgCadence)} rpm`
                                            }
                                        />
                                        <SelectionStatLine
                                            label="Avg Speed"
                                            value={formatAverageSpeedForSport(
                                                sessionView.sport,
                                                selectedRangeSummary.avgSpeedMetersPerSecond,
                                            )}
                                        />
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </aside>
                </div>
            </div>
        </div>
    );

    const statisticsPanel = (
        <div className="h-full overflow-y-auto rounded-xl border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-medium text-zinc-200">
                    Route Statistics
                </h2>
                {sideCardTab === 'notes' && notesStatus !== null ? (
                    <span className="text-[11px] text-emerald-300">
                        {notesStatus}
                    </span>
                ) : null}
            </div>

            <div className="mt-3 inline-flex items-center gap-1 rounded-md border border-border/70 bg-background/60 p-1">
                <button
                    type="button"
                    onClick={() => setSideCardTab('statistics')}
                    className={cn(
                        'rounded px-2 py-1 text-[11px] transition-colors',
                        sideCardTab === 'statistics'
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'text-zinc-400 hover:text-zinc-200',
                    )}
                >
                    Statistics
                </button>
                <button
                    type="button"
                    onClick={() => setSideCardTab('notes')}
                    className={cn(
                        'rounded px-2 py-1 text-[11px] transition-colors',
                        sideCardTab === 'notes'
                            ? 'bg-zinc-800 text-zinc-100'
                            : 'text-zinc-400 hover:text-zinc-200',
                    )}
                >
                    Internal Notes
                </button>
            </div>

            {sideCardTab === 'statistics' ? (
                <>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                        <ComparisonBadge
                            label="Planned"
                            value={formatDurationMinutes(
                                sessionView.durationMinutes,
                            )}
                            meta={`${formatNumber(sessionView.plannedTss)} TSS`}
                        />
                        <ComparisonBadge
                            label="Actual"
                            value={formatDurationMinutes(
                                sessionView.actualDurationMinutes,
                            )}
                            meta={`${formatNumber(sessionView.actualTss)} TSS`}
                        />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                        <StatisticsRow
                            label="Avg HR"
                            value={
                                avgHeartRate === null
                                    ? '—'
                                    : `${Math.round(avgHeartRate)} bpm`
                            }
                        />
                        <StatisticsRow
                            label="Avg Power"
                            value={
                                avgPower === null
                                    ? '—'
                                    : `${Math.round(avgPower)} W`
                            }
                        />
                        <StatisticsRow
                            label="Avg Cadence"
                            value={
                                avgCadence === null
                                    ? '—'
                                    : `${Math.round(avgCadence)} rpm`
                            }
                        />
                        <StatisticsRow
                            label="Avg Speed"
                            value={formatAverageSpeedForSport(
                                sessionView.sport,
                                avgSpeedMetersPerSecond,
                            )}
                        />
                        <StatisticsRow
                            label="Distance"
                            value={
                                totalDistanceKilometers === null
                                    ? '—'
                                    : `${totalDistanceKilometers.toFixed(2)} km`
                            }
                        />
                        <StatisticsRow
                            label="Elevation"
                            value={
                                elevationGainMeters === null
                                    ? '—'
                                    : `${Math.round(elevationGainMeters)} m`
                            }
                        />
                    </div>
                </>
            ) : (
                <div className="mt-3">
                    <Textarea
                        value={internalNotes}
                        rows={8}
                        disabled={!canEditNotes || isSavingNotes}
                        onChange={(event) => {
                            setInternalNotes(event.target.value);
                            setNotesError(null);
                            setNotesStatus(null);
                        }}
                        className={cn(
                            'w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-zinc-200',
                            'placeholder:text-zinc-600 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
                            (!canEditNotes || isSavingNotes) &&
                                'cursor-not-allowed text-zinc-400 opacity-75',
                        )}
                        placeholder="Write internal notes for this session."
                    />

                    <div className="mt-2 flex items-center justify-between gap-3">
                        <p className="text-[11px] text-zinc-500">
                            {canEditNotes
                                ? 'Notes are private to the athlete account.'
                                : 'Notes are read-only in this context.'}
                        </p>

                        {canEditNotes ? (
                            <button
                                type="button"
                                disabled={!hasNotesChanged || isSavingNotes}
                                onClick={() => {
                                    void saveInternalNotes();
                                }}
                                className={cn(
                                    'inline-flex items-center gap-1 rounded border px-2 py-1 text-[11px] transition-colors',
                                    !hasNotesChanged || isSavingNotes
                                        ? 'cursor-not-allowed border-zinc-800 bg-zinc-900/50 text-zinc-600'
                                        : 'border-zinc-700 bg-zinc-900/60 text-zinc-200 hover:text-zinc-100',
                                )}
                            >
                                <Save className="h-3.5 w-3.5" />
                                {isSavingNotes ? 'Saving...' : 'Save notes'}
                            </button>
                        ) : null}
                    </div>

                    {notesStatus !== null ? (
                        <p className="mt-2 text-[11px] text-zinc-500">
                            Last update saved successfully.
                        </p>
                    ) : null}
                    {notesError !== null ? (
                        <p className="mt-2 rounded-md border border-red-500/25 bg-red-500/10 px-2.5 py-1.5 text-[11px] text-red-300">
                            {notesError}
                        </p>
                    ) : null}
                </div>
            )}
        </div>
    );

    const plannedStructurePanel = hasPlannedStructure ? (
        <div className="rounded-xl border border-border bg-surface p-4">
            <h2 className="text-sm font-medium text-zinc-200">
                Planned Structure
            </h2>

            <div className="mt-2 flex items-center justify-between text-[10px] tracking-wider text-zinc-500 uppercase">
                <span>
                    {formatStructureUnit(
                        sessionView.plannedStructure?.unit ?? 'rpe',
                    )}
                </span>
                <span>{sessionView.plannedStructure?.mode ?? 'range'}</span>
            </div>

            <div className="mt-3 h-36 overflow-hidden rounded border border-border/60 bg-background/70 p-2">
                <div className="flex h-full items-end gap-[1px]">
                    {plannedSegments.map((segment) => {
                        const width =
                            totalPlannedSegmentDuration > 0
                                ? (segment.durationMinutes /
                                      totalPlannedSegmentDuration) *
                                  100
                                : 0;
                        const minHeight =
                            plannedPreviewScaleMax === 0
                                ? 0
                                : (segment.min / plannedPreviewScaleMax) * 100;
                        const maxHeight =
                            plannedPreviewScaleMax === 0
                                ? 0
                                : (segment.max / plannedPreviewScaleMax) * 100;
                        const rangeHeight = Math.max(2, maxHeight - minHeight);

                        return (
                            <button
                                key={segment.id}
                                type="button"
                                onMouseEnter={() => {
                                    setHoveredPlannedSegmentId(segment.id);
                                }}
                                onMouseLeave={() => {
                                    setHoveredPlannedSegmentId(null);
                                }}
                                className="relative h-full min-w-[6px] border-r border-zinc-900/60"
                                style={{ width: `${Math.max(4, width)}%` }}
                            >
                                <span
                                    className={cn(
                                        'absolute inset-x-0 bottom-0 rounded-[2px] border border-white/5 opacity-45',
                                        plannedBlockColor(segment.type),
                                    )}
                                    style={{
                                        height: `${Math.max(2, maxHeight)}%`,
                                    }}
                                />
                                <span
                                    className={cn(
                                        'absolute inset-x-0 rounded-[2px] border border-white/20',
                                        plannedBlockColor(segment.type),
                                    )}
                                    style={{
                                        bottom: `${minHeight}%`,
                                        height: `${rangeHeight}%`,
                                    }}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>

            <p className="mt-2 text-[11px] text-zinc-400">
                {hoveredPlannedSegment !== null
                    ? formatPlannedSegmentSummary(
                          hoveredPlannedSegment,
                          sessionView.plannedStructure?.mode ?? 'range',
                      )
                    : 'Hover a segment to inspect block details.'}
            </p>

            <p className="mt-1 text-[11px] text-zinc-500">
                Planned total:{' '}
                {formatDurationMinutes(sessionView.durationMinutes)}
                {' • '}Planned TSS: {formatNumber(sessionView.plannedTss)}
            </p>
        </div>
    ) : null;

    const mapPanel = (
        <div className="flex min-h-0 flex-col rounded-xl border border-border bg-surface p-4">
            <div className="mb-3 flex items-center gap-2">
                <MapPinned className="h-4 w-4 text-zinc-400" />
                <h2 className="text-sm font-medium text-zinc-200">Route</h2>
            </div>

            <div className="relative box-border h-[300px] overflow-hidden rounded-lg border border-border/60 bg-background/70 p-2 xl:h-[320px]">
                {latLngPoints.length > 1 ? (
                    <>
                        <ActivityMap
                            points={latLngPoints}
                            focusPoints={focusedRoutePoints}
                            hoverPoint={hoverPoint}
                            onResetZoom={resetZoomSelection}
                        />

                        {hoverSummary !== null ? (
                            <div className="pointer-events-none absolute top-3 right-3 z-[600] min-w-44 rounded-md border border-zinc-700/80 bg-zinc-950/85 px-3 py-2">
                                <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
                                    {xAxisMode === 'distance'
                                        ? 'Distance'
                                        : 'Elapsed Time'}
                                </p>
                                <p className="mt-0.5 font-mono text-xs text-zinc-100">
                                    {formatXAxisValue(
                                        hoverSummary.xValue,
                                        xAxisMode,
                                    )}
                                </p>

                                <div className="mt-2 space-y-1 border-t border-zinc-800 pt-2">
                                    {hoverSummary.values.map((item) => (
                                        <div
                                            key={item.key}
                                            className="flex items-center justify-between gap-3"
                                        >
                                            <span className="text-[10px] text-zinc-400">
                                                {streamLabels[item.key] ??
                                                    item.key}
                                            </span>
                                            <span
                                                className="font-mono text-[10px]"
                                                style={{
                                                    color:
                                                        streamColors[
                                                            item.key
                                                        ] ?? '#a1a1aa',
                                                }}
                                            >
                                                {formatStreamValue(
                                                    item.key,
                                                    item.value,
                                                )}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </>
                ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                        Route data will appear when GPS stream is available.
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head
                title={isActivityOnly ? 'Activity Detail' : 'Session Detail'}
            />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <header className="sticky top-0 z-30 border-b border-border bg-background/95 px-6 py-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link
                                href={dashboard().url}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>

                            <div>
                                <p className="text-[11px] tracking-wider text-zinc-500 uppercase">
                                    {isActivityOnly
                                        ? 'Activity Detail'
                                        : 'Training Detail'}
                                </p>
                                <h1 className="mt-0.5 text-lg font-medium text-zinc-100">
                                    {sessionView.sport.toUpperCase()}{' '}
                                    {isActivityOnly ? 'Activity' : 'Session'} •{' '}
                                    {formatDate(sessionView.scheduledDate)}
                                </h1>
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs">
                            <span
                                className={`h-2 w-2 rounded-full ${
                                    stravaStatus?.connected
                                        ? stravaStatus.last_sync_status ===
                                              'queued' ||
                                          stravaStatus.last_sync_status ===
                                              'running'
                                            ? 'bg-amber-500'
                                            : 'bg-emerald-500'
                                        : 'bg-zinc-500'
                                }`}
                            />
                            <span className="text-zinc-400">
                                {integrationLabel}
                            </span>
                        </div>
                    </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                    <div className="mx-auto flex max-w-7xl flex-col gap-6">
                        <section className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.85fr)_minmax(280px,0.75fr)]">
                            {mapPanel}
                            {statisticsPanel}
                        </section>

                        {hasPlannedStructure ? (
                            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(280px,0.75fr)_minmax(0,1.25fr)]">
                                {plannedStructurePanel}
                                {analysisPanel}
                            </section>
                        ) : (
                            <section>{analysisPanel}</section>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function StatisticsRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-md border border-border/70 bg-background/50 px-2.5 py-2">
            <span className="block text-[10px] tracking-wide text-zinc-500 uppercase">
                {label}
            </span>
            <span className="mt-0.5 block font-mono text-xs text-zinc-200">
                {value}
            </span>
        </div>
    );
}

function ComparisonBadge({
    label,
    value,
    meta,
}: {
    label: string;
    value: string;
    meta: string;
}) {
    return (
        <div className="rounded-full border border-border/80 bg-background/60 px-3 py-1.5">
            <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
                {label}
            </p>
            <p className="font-mono text-xs text-zinc-100">{value}</p>
            <p className="text-[10px] text-zinc-400">{meta}</p>
        </div>
    );
}

function SelectionStatLine({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-2 rounded border border-zinc-800/80 bg-black/20 px-2 py-1.5">
            <span className="text-[10px] text-zinc-500">{label}</span>
            <span className="font-mono text-[11px] text-zinc-200">{value}</span>
        </div>
    );
}

function InteractiveStreamChart({
    mode,
    series,
    referencePoints,
    hoverSampleIndex,
    onHoverSampleIndexChange,
    onZoomSelection,
}: {
    mode: XAxisMode;
    series: StreamSeries[];
    referencePoints: Array<{ x: number; sampleIndex: number }>;
    hoverSampleIndex: number | null;
    onHoverSampleIndexChange: (sampleIndex: number | null) => void;
    onZoomSelection: (min: number, max: number) => void;
}) {
    const width = 960;
    const height = 380;
    const axisLeft = 50;
    const axisRight = 22;
    const axisTop = 16;
    const axisBottom = 36;

    const [selectionStartX, setSelectionStartX] = useState<number | null>(null);
    const [selectionEndX, setSelectionEndX] = useState<number | null>(null);
    const [hoverChartX, setHoverChartX] = useState<number | null>(null);

    const xValues = referencePoints.map((point) => point.x);
    const yValues = series.flatMap((item) =>
        item.points.map((point) => point.y),
    );

    const minX = Math.min(...xValues);
    const maxX = Math.max(...xValues);
    const minYRaw = Math.min(...yValues);
    const maxYRaw = Math.max(...yValues);
    const yPadding = Math.max(1, (maxYRaw - minYRaw) * 0.08);
    const minY = minYRaw - yPadding;
    const maxY = maxYRaw + yPadding;

    const chartWidth = width - axisLeft - axisRight;
    const chartHeight = height - axisTop - axisBottom;

    const hoveredReferencePoint =
        hoverSampleIndex === null
            ? null
            : (referencePoints.find(
                  (point) => point.sampleIndex === hoverSampleIndex,
              ) ?? null);

    const xTicks = Array.from({ length: 6 }, (_, index) => {
        const ratio = index / 5;
        const value = minX + (maxX - minX) * ratio;

        return {
            x: axisLeft + chartWidth * ratio,
            label: formatXAxisTick(value, mode),
        };
    });

    const yTicks = Array.from({ length: 5 }, (_, index) => {
        const ratio = index / 4;
        const value = maxY - (maxY - minY) * ratio;

        return {
            y: axisTop + chartHeight * ratio,
            label: `${Math.round(value)}`,
        };
    });

    const getChartXFromMouse = (
        event: ReactMouseEvent<SVGSVGElement, MouseEvent>,
    ): number => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const svgX = ((event.clientX - bounds.left) / bounds.width) * width;

        return Math.max(axisLeft, Math.min(axisLeft + chartWidth, svgX));
    };

    const chartXToDomain = (chartX: number): number => {
        return minX + ((chartX - axisLeft) / chartWidth) * (maxX - minX);
    };

    const selectionRectangle =
        selectionStartX !== null && selectionEndX !== null
            ? {
                  x: Math.min(selectionStartX, selectionEndX),
                  width: Math.abs(selectionEndX - selectionStartX),
              }
            : null;

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-full w-full cursor-crosshair"
            preserveAspectRatio="xMidYMid meet"
            onMouseLeave={() => {
                onHoverSampleIndexChange(null);
                setHoverChartX(null);
                setSelectionStartX(null);
                setSelectionEndX(null);
            }}
            onMouseDown={(event) => {
                const chartX = getChartXFromMouse(event);
                setSelectionStartX(chartX);
                setSelectionEndX(chartX);
                setHoverChartX(chartX);
            }}
            onMouseMove={(event) => {
                const chartX = getChartXFromMouse(event);
                const domainX = chartXToDomain(chartX);

                setHoverChartX(chartX);

                const closest = referencePoints.reduce<{
                    distance: number;
                    sampleIndex: number;
                } | null>((current, point) => {
                    const distance = Math.abs(point.x - domainX);

                    if (current === null || distance < current.distance) {
                        return {
                            distance,
                            sampleIndex: point.sampleIndex,
                        };
                    }

                    return current;
                }, null);

                onHoverSampleIndexChange(closest?.sampleIndex ?? null);

                if (selectionStartX !== null) {
                    setSelectionEndX(chartX);
                }
            }}
            onMouseUp={() => {
                if (selectionStartX === null || selectionEndX === null) {
                    return;
                }

                if (Math.abs(selectionEndX - selectionStartX) >= 8) {
                    onZoomSelection(
                        chartXToDomain(selectionStartX),
                        chartXToDomain(selectionEndX),
                    );
                }

                setSelectionStartX(null);
                setSelectionEndX(null);
            }}
        >
            <rect
                x={axisLeft}
                y={axisTop}
                width={chartWidth}
                height={chartHeight}
                fill="#05070d"
                opacity={0.35}
            />

            {yTicks.map((tick) => (
                <g key={`y-${tick.y.toFixed(2)}`}>
                    <line
                        x1={axisLeft}
                        x2={axisLeft + chartWidth}
                        y1={tick.y}
                        y2={tick.y}
                        stroke="#27272a"
                        strokeWidth={1}
                        opacity={0.7}
                    />
                    <text
                        x={axisLeft - 8}
                        y={tick.y + 3}
                        textAnchor="end"
                        fill="#71717a"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                    >
                        {tick.label}
                    </text>
                </g>
            ))}

            {xTicks.map((tick) => (
                <g key={`x-${tick.x.toFixed(2)}`}>
                    <line
                        x1={tick.x}
                        x2={tick.x}
                        y1={axisTop}
                        y2={axisTop + chartHeight}
                        stroke="#27272a"
                        strokeWidth={1}
                        opacity={0.45}
                    />
                    <text
                        x={tick.x}
                        y={axisTop + chartHeight + 14}
                        textAnchor="middle"
                        fill="#71717a"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                    >
                        {tick.label}
                    </text>
                </g>
            ))}

            <line
                x1={axisLeft}
                x2={axisLeft + chartWidth}
                y1={axisTop + chartHeight}
                y2={axisTop + chartHeight}
                stroke="#3f3f46"
                strokeWidth={1}
            />
            <line
                x1={axisLeft}
                x2={axisLeft}
                y1={axisTop}
                y2={axisTop + chartHeight}
                stroke="#3f3f46"
                strokeWidth={1}
            />

            {series.map((item) => {
                const path = item.points
                    .map((point, index) => {
                        const x =
                            axisLeft +
                            ((point.x - minX) /
                                Math.max(0.000001, maxX - minX)) *
                                chartWidth;
                        const y =
                            axisTop +
                            (1 -
                                (point.y - minY) /
                                    Math.max(0.000001, maxY - minY)) *
                                chartHeight;

                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                    })
                    .join(' ');

                return (
                    <g key={item.key}>
                        {item.key === 'elevation'
                            ? (() => {
                                  const first = item.points[0];
                                  const last =
                                      item.points[item.points.length - 1];

                                  if (
                                      first === undefined ||
                                      last === undefined
                                  ) {
                                      return null;
                                  }

                                  const firstX =
                                      axisLeft +
                                      ((first.x - minX) /
                                          Math.max(0.000001, maxX - minX)) *
                                          chartWidth;
                                  const lastX =
                                      axisLeft +
                                      ((last.x - minX) /
                                          Math.max(0.000001, maxX - minX)) *
                                          chartWidth;

                                  const zeroYRaw =
                                      axisTop +
                                      (1 -
                                          (0 - minY) /
                                              Math.max(0.000001, maxY - minY)) *
                                          chartHeight;
                                  const zeroY = Math.max(
                                      axisTop,
                                      Math.min(axisTop + chartHeight, zeroYRaw),
                                  );

                                  return (
                                      <path
                                          d={`${path} L ${lastX} ${zeroY} L ${firstX} ${zeroY} Z`}
                                          fill="#a1a1aa"
                                          opacity={0.14}
                                      />
                                  );
                              })()
                            : null}

                        <path
                            d={path}
                            fill="none"
                            stroke={item.color}
                            strokeWidth={2}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />

                        {hoveredReferencePoint !== null
                            ? (() => {
                                  const hoveredPoint = item.points.find(
                                      (point) => {
                                          return (
                                              point.sampleIndex ===
                                              hoveredReferencePoint.sampleIndex
                                          );
                                      },
                                  );

                                  if (hoveredPoint === undefined) {
                                      return null;
                                  }

                                  const cx =
                                      axisLeft +
                                      ((hoveredPoint.x - minX) /
                                          Math.max(0.000001, maxX - minX)) *
                                          chartWidth;
                                  const cy =
                                      axisTop +
                                      (1 -
                                          (hoveredPoint.y - minY) /
                                              Math.max(0.000001, maxY - minY)) *
                                          chartHeight;

                                  return (
                                      <circle
                                          cx={cx}
                                          cy={cy}
                                          r={3.2}
                                          fill={item.color}
                                          stroke="#09090b"
                                          strokeWidth={1.5}
                                      />
                                  );
                              })()
                            : null}
                    </g>
                );
            })}

            {hoverChartX !== null ? (
                <line
                    x1={hoverChartX}
                    x2={hoverChartX}
                    y1={axisTop}
                    y2={axisTop + chartHeight}
                    stroke="#d4d4d8"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    opacity={0.65}
                />
            ) : null}

            {selectionRectangle !== null && selectionRectangle.width > 0 ? (
                <rect
                    x={selectionRectangle.x}
                    y={axisTop}
                    width={selectionRectangle.width}
                    height={chartHeight}
                    fill="#e4e4e7"
                    opacity={0.18}
                    stroke="#e4e4e7"
                    strokeWidth={1}
                    strokeDasharray="3 2"
                />
            ) : null}
        </svg>
    );
}

function ActivityMap({
    points,
    focusPoints,
    hoverPoint,
    onResetZoom,
}: {
    points: MapPoint[];
    focusPoints: MapPoint[];
    hoverPoint: MapPoint | null;
    onResetZoom: () => void;
}) {
    const effectiveFocusPoints = focusPoints.length > 1 ? focusPoints : points;

    const bounds = useMemo<LatLngBoundsExpression>(() => {
        return effectiveFocusPoints;
    }, [effectiveFocusPoints]);

    return (
        <MapContainer
            center={points[0]}
            zoom={13}
            doubleClickZoom={false}
            className="h-full w-full rounded-md"
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Polyline
                positions={points}
                pathOptions={{
                    color: '#3f3f46',
                    weight: 3,
                    opacity: 0.45,
                }}
            />

            <Polyline
                positions={effectiveFocusPoints}
                pathOptions={{
                    color: '#f59e0b',
                    weight: 4,
                    opacity: 0.95,
                }}
            />

            {hoverPoint !== null ? (
                <CircleMarker
                    center={hoverPoint}
                    radius={6}
                    pathOptions={{
                        color: '#f8fafc',
                        weight: 2,
                        fillColor: '#22d3ee',
                        fillOpacity: 0.85,
                    }}
                />
            ) : null}

            <MapResetOnDoubleClick onResetZoom={onResetZoom} />
            <FitMapBounds bounds={bounds} />
        </MapContainer>
    );
}

function MapResetOnDoubleClick({ onResetZoom }: { onResetZoom: () => void }) {
    useMapEvents({
        dblclick: () => {
            onResetZoom();
        },
    });

    return null;
}

function FitMapBounds({ bounds }: { bounds: LatLngBoundsExpression }) {
    const map = useMap();

    useEffect(() => {
        map.fitBounds(bounds, {
            padding: [24, 24],
        });
    }, [bounds, map]);

    return null;
}

function buildSampledIndices(
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

function buildPlannedSegments(
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

function resolvePlannedBounds(
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

function plannedBlockColor(type: string): string {
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

function formatPlannedSegmentSummary(
    segment: PlannedSegment,
    mode: string,
): string {
    const intensityLabel =
        mode === 'target'
            ? `Target ${Math.round(segment.max)}`
            : `Range ${Math.round(segment.min)}-${Math.round(segment.max)}`;

    return `${segment.label} • ${segment.durationMinutes}m • ${intensityLabel}`;
}

function serializePlannedStructureForRequest(
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

function extractErrorMessage(payload: unknown): string | null {
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

function sliceNumericRange(
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

function averageNumeric(values: number[]): number | null {
    const valid = values.filter((value) => Number.isFinite(value));

    if (valid.length === 0) {
        return null;
    }

    const total = valid.reduce((carry, value) => carry + value, 0);

    return total / valid.length;
}

function calculateElevationGain(values: number[]): number | null {
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

function formatAverageSpeedForSport(
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

function normalizeNumericSeries(
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

function decodePolyline(polyline: string): MapPoint[] {
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

function formatDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

function formatDurationMinutes(value: number | null): string {
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

function formatNumber(value: number | null): string {
    if (value === null || Number.isNaN(value)) {
        return '—';
    }

    return `${value}`;
}

function formatStructureUnit(unit: string): string {
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

function formatBlockType(type: string): string {
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

function formatDurationSeconds(totalSeconds: number): string {
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

function formatXAxisTick(value: number, mode: XAxisMode): string {
    if (mode === 'distance') {
        return `${value.toFixed(1)} km`;
    }

    return formatDurationSeconds(value);
}

function formatXAxisValue(value: number | null, mode: XAxisMode): string {
    if (value === null || Number.isNaN(value)) {
        return '—';
    }

    if (mode === 'distance') {
        return `${value.toFixed(2)} km`;
    }

    return formatDurationSeconds(value);
}

function formatStreamValue(streamKey: string, value: number | null): string {
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
