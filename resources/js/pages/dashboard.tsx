import CalendarPage from '@/pages/calendar';
import type {
    ActivityApi,
    ApiCollectionResponse,
    ApiPaginatedCollectionResponse,
    CalendarEntryApi,
    GoalApi,
    TrainingPlanApi,
    TrainingSessionApi,
} from '@/types/training-plans';

type DashboardProps = {
    trainingPlans: ApiPaginatedCollectionResponse<TrainingPlanApi>;
    trainingSessions: ApiCollectionResponse<TrainingSessionApi>;
    activities: ApiCollectionResponse<ActivityApi>;
    calendarEntries: ApiCollectionResponse<CalendarEntryApi>;
    goals: ApiCollectionResponse<GoalApi>;
    compliance: {
        weeks: Array<{
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
        }>;
        summary: {
            total_planned_sessions_count: number;
            total_planned_completed_count: number;
            compliance_ratio: number;
            range_starts_at: string;
            range_ends_at: string;
        };
    } | null;
    calendarWindow: {
        starts_at: string;
        ends_at: string;
    };
    providerStatus: Record<
        string,
        {
            connected: boolean;
            last_synced_at: string | null;
            last_sync_status: string | null;
            provider_athlete_id: string | null;
        }
    > | null;
    entryTypeEntitlements: Array<{
        key: string;
        category: 'workout' | 'other' | string;
        label: string;
        requires_subscription: boolean;
    }>;
    isSubscribed: boolean;
    athleteTrainingTargets: {
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
    } | null;
    viewingAthlete?: {
        id: number;
        name: string;
    } | null;
};

export default function Dashboard({
    trainingPlans,
    trainingSessions,
    activities,
    calendarEntries,
    goals,
    compliance,
    calendarWindow,
    providerStatus,
    entryTypeEntitlements,
    isSubscribed,
    athleteTrainingTargets,
    viewingAthlete = null,
}: DashboardProps) {
    return (
        <CalendarPage
            trainingPlans={trainingPlans}
            trainingSessions={trainingSessions}
            activities={activities}
            calendarEntries={calendarEntries}
            goals={goals}
            compliance={compliance}
            calendarWindow={calendarWindow}
            providerStatus={providerStatus}
            entryTypeEntitlements={entryTypeEntitlements}
            isSubscribed={isSubscribed}
            athleteTrainingTargets={athleteTrainingTargets}
            viewingAthlete={viewingAthlete}
            headTitle="Dashboard"
        />
    );
}
