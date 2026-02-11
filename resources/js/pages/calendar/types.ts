import type {
    ActivityApi,
    ApiCollectionResponse,
    ApiPaginatedCollectionResponse,
    TrainingPlanApi,
    TrainingSessionApi,
} from '@/types/training-plans';
import type { CalendarWindow } from './lib/calendar-weeks';

export type ProviderStatus = Record<
    string,
    {
        connected: boolean;
        last_synced_at: string | null;
        last_sync_status: string | null;
        provider_athlete_id: string | null;
    }
> | null;

export type AthleteTrainingTargets = {
    ftp_watts: number | null;
    max_heart_rate_bpm: number | null;
    threshold_heart_rate_bpm: number | null;
    threshold_pace_minutes_per_km: number | null;
    power_zones: Array<{
        label: string;
        min: number;
        max: number;
    }>;
    heart_rate_zones: Array<{
        label: string;
        min: number;
        max: number;
    }>;
};

export type CalendarPageProps = {
    trainingPlans: ApiPaginatedCollectionResponse<TrainingPlanApi>;
    trainingSessions: ApiCollectionResponse<TrainingSessionApi>;
    activities: ApiCollectionResponse<ActivityApi>;
    calendarWindow: CalendarWindow;
    providerStatus: ProviderStatus;
    athleteTrainingTargets: AthleteTrainingTargets | null;
    viewingAthlete?: {
        id: number;
        name: string;
    } | null;
    headTitle?: string;
};

export type CalendarViewMode = 'infinite' | 'day' | 'week' | 'month';
