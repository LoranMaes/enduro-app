import type {
    ActivityApi,
    ApiCollectionResponse,
    ApiPaginatedCollectionResponse,
    CalendarEntryApi,
    CalendarEntryView,
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
    calendarEntries: ApiCollectionResponse<CalendarEntryApi>;
    calendarWindow: CalendarWindow;
    providerStatus: ProviderStatus;
    entryTypeEntitlements: Array<{
        key: string;
        category: 'workout' | 'other' | string;
        label: string;
        requires_subscription: boolean;
    }>;
    isSubscribed: boolean;
    athleteTrainingTargets: AthleteTrainingTargets | null;
    viewingAthlete?: {
        id: number;
        name: string;
    } | null;
    headTitle?: string;
};

export type CalendarViewMode = 'infinite' | 'day' | 'week' | 'month';

export type WorkoutEntrySport =
    | 'run'
    | 'bike'
    | 'swim'
    | 'day_off'
    | 'mtn_bike'
    | 'custom'
    | 'walk';

export type OtherEntryType = 'event' | 'goal' | 'note';

export type EntryTypeEntitlement = {
    key: string;
    category: 'workout' | 'other' | string;
    label: string;
    requires_subscription: boolean;
};

export type CalendarEntryEditorContext =
    | {
          mode: 'create';
          date: string;
          type: OtherEntryType;
      }
    | {
          mode: 'edit';
          entry: CalendarEntryView;
      };
