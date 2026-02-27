import type { TrainingSessionApi, TrainingSessionView } from '@/types/training-plans';

export type ProviderStatus = Record<
    string,
    {
        connected: boolean;
        last_synced_at: string | null;
        last_sync_status: string | null;
        provider_athlete_id: string | null;
    }
>;

export type SessionDetailPageProps = {
    session: TrainingSessionApi;
    providerStatus: ProviderStatus | null;
    isActivityOnly?: boolean;
};

export type StreamPayload = {
    provider: string;
    external_id: string;
    streams: Record<string, Array<number | [number, number]>>;
    available_streams: string[];
    summary_polyline: string | null;
    default_enabled_streams: string[];
    stream_catalog: string[];
};

export type StreamSeriesPoint = {
    x: number;
    y: number;
    sampleIndex: number;
};

export type StreamSeries = {
    key: string;
    color: string;
    points: StreamSeriesPoint[];
};

export type XAxisMode = 'distance' | 'time';

export type MapPoint = [number, number];

export type PlannedSegment = {
    id: string;
    type: string;
    label: string;
    durationMinutes: number;
    min: number;
    max: number;
};

export type SelectionRangeSummary = {
    startIndex: number;
    endIndex: number;
    startXValue: number | null;
    endXValue: number | null;
    elapsedSeconds: number | null;
    distanceKilometers: number | null;
    avgHeartRate: number | null;
    avgPower: number | null;
    avgCadence: number | null;
    avgSpeedMetersPerSecond: number | null;
    elevationGainMeters: number | null;
};

export type SessionView = TrainingSessionView;
