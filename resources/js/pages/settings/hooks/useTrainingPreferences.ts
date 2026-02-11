import { useForm } from '@inertiajs/react';
import type { SettingsOverviewProps } from '../types';
import { parseNullableInteger } from '../utils';

type UseTrainingPreferencesParams = {
    trainingPreferences: SettingsOverviewProps['trainingPreferences'];
};

export function useTrainingPreferences({
    trainingPreferences,
}: UseTrainingPreferencesParams) {
    const trainingForm = useForm({
        primary_sport: trainingPreferences.primary_sport,
        weekly_training_days: trainingPreferences.weekly_training_days,
        preferred_rest_day: trainingPreferences.preferred_rest_day,
        intensity_distribution: trainingPreferences.intensity_distribution,
        ftp_watts: trainingPreferences.ftp_watts,
        max_heart_rate_bpm: trainingPreferences.max_heart_rate_bpm,
        threshold_heart_rate_bpm: trainingPreferences.threshold_heart_rate_bpm,
        threshold_pace_minutes_per_km:
            trainingPreferences.threshold_pace_minutes_per_km,
        power_zones: trainingPreferences.power_zones,
        heart_rate_zones: trainingPreferences.heart_rate_zones,
    });

    const trainingErrors = trainingForm.errors as Record<string, string | undefined>;

    const updateZoneValue = (
        field: 'power_zones' | 'heart_rate_zones',
        index: number,
        key: 'min' | 'max',
        value: string,
    ): void => {
        const numericValue = Number.parseInt(value, 10);
        const safeValue = Number.isFinite(numericValue) ? numericValue : 0;

        trainingForm.setData(
            field,
            trainingForm.data[field].map((zone, zoneIndex) => {
                if (zoneIndex !== index) {
                    return zone;
                }

                return {
                    ...zone,
                    [key]: safeValue,
                };
            }),
        );

        trainingForm.clearErrors(field);
    };

    const resolveZoneError = (
        field: 'power_zones' | 'heart_rate_zones',
    ): string | undefined => {
        if (trainingErrors[field] !== undefined) {
            return trainingErrors[field];
        }

        const entry = Object.entries(trainingErrors).find(([key, value]) => {
            return key.startsWith(`${field}.`) && typeof value === 'string';
        });

        return entry?.[1];
    };

    const setNullableNumberField = (
        field:
            | 'ftp_watts'
            | 'max_heart_rate_bpm'
            | 'threshold_heart_rate_bpm'
            | 'threshold_pace_minutes_per_km',
        value: string,
    ): void => {
        trainingForm.setData(field, parseNullableInteger(value));
        trainingForm.clearErrors(field);
    };

    const submitTrainingPreferences = (): void => {
        trainingForm.patch('/settings/overview/training-preferences', {
            preserveScroll: true,
        });
    };

    return {
        trainingForm,
        trainingErrors,
        updateZoneValue,
        resolveZoneError,
        setNullableNumberField,
        submitTrainingPreferences,
    };
}
