import type {
    ActivityApi,
    ApiCollectionResponse,
    ApiPaginatedCollectionResponse,
    CalendarEntryApi,
    GoalApi,
    CalendarEntryView,
    GoalView,
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

export type ProgressComplianceWeek = {
    week_starts_at: string;
    week_ends_at: string;
    planned_sessions_count: number;
    planned_completed_count: number;
    compliance_ratio: number;
    planned_duration_minutes_total: number;
    completed_duration_minutes_total: number;
    actual_minutes_total: number;
    recommendation_band: {
        min_minutes: number;
        max_minutes: number;
    } | null;
};

export type ProgressCompliancePayload = {
    weeks: ProgressComplianceWeek[];
    summary: {
        total_planned_sessions_count: number;
        total_planned_completed_count: number;
        compliance_ratio: number;
        range_starts_at: string;
        range_ends_at: string;
    };
};

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
    goals: ApiCollectionResponse<GoalApi>;
    calendarWindow: CalendarWindow;
    providerStatus: ProviderStatus;
    compliance: ProgressCompliancePayload | null;
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
          type: Exclude<OtherEntryType, 'goal'>;
      }
    | {
          mode: 'edit';
          entry: CalendarEntryView;
      };

export type GoalEditorContext =
    | {
          mode: 'create';
          date: string;
      }
    | {
          mode: 'edit';
          goal: GoalView;
      };
