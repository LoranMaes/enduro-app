import { useMemo } from 'react';
import type { ProviderStatus, SessionView } from '../types';
import {
    averageNumeric,
    calculateElevationGain,
    formatAverageSpeedForSport,
} from '../utils';

type UseSessionStatsOptions = {
    sessionView: SessionView;
    normalizedStreams: Record<string, number[]>;
    providerStatus: ProviderStatus | null;
};

type UseSessionStatsResult = {
    avgHeartRate: number | null;
    avgPower: number | null;
    avgCadence: number | null;
    avgSpeedMetersPerSecond: number | null;
    avgSpeedLabel: string;
    totalDistanceKilometers: number | null;
    elevationGainMeters: number | null;
    stravaStatus: ProviderStatus['strava'] | null;
    integrationLabel: string;
};

export function useSessionStats({
    sessionView,
    normalizedStreams,
    providerStatus,
}: UseSessionStatsOptions): UseSessionStatsResult {
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

    const avgSpeedLabel = useMemo(() => {
        return formatAverageSpeedForSport(
            sessionView.sport,
            avgSpeedMetersPerSecond,
        );
    }, [avgSpeedMetersPerSecond, sessionView.sport]);

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

    return {
        avgHeartRate,
        avgPower,
        avgCadence,
        avgSpeedMetersPerSecond,
        avgSpeedLabel,
        totalDistanceKilometers,
        elevationGainMeters,
        stravaStatus,
        integrationLabel,
    };
}
