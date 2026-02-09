import CalendarPage from '@/pages/calendar';
import type {
    ActivityApi,
    ApiCollectionResponse,
    ApiPaginatedCollectionResponse,
    TrainingPlanApi,
    TrainingSessionApi,
} from '@/types/training-plans';

type DashboardProps = {
    trainingPlans: ApiPaginatedCollectionResponse<TrainingPlanApi>;
    trainingSessions: ApiCollectionResponse<TrainingSessionApi>;
    activities: ApiCollectionResponse<ActivityApi>;
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
    calendarWindow,
    providerStatus,
    athleteTrainingTargets,
    viewingAthlete = null,
}: DashboardProps) {
    return (
        <CalendarPage
            trainingPlans={trainingPlans}
            trainingSessions={trainingSessions}
            activities={activities}
            calendarWindow={calendarWindow}
            providerStatus={providerStatus}
            athleteTrainingTargets={athleteTrainingTargets}
            viewingAthlete={viewingAthlete}
        />
    );
}
