import CalendarPage from '@/pages/calendar';
import type {
    ApiCollectionResponse,
    ApiPaginatedCollectionResponse,
    TrainingPlanApi,
    TrainingSessionApi,
} from '@/types/training-plans';

type DashboardProps = {
    trainingPlans: ApiPaginatedCollectionResponse<TrainingPlanApi>;
    trainingSessions: ApiCollectionResponse<TrainingSessionApi>;
    calendarWindow: {
        starts_at: string;
        ends_at: string;
    };
    viewingAthlete?: {
        id: number;
        name: string;
    } | null;
};

export default function Dashboard({
    trainingPlans,
    trainingSessions,
    calendarWindow,
    viewingAthlete = null,
}: DashboardProps) {
    return (
        <CalendarPage
            trainingPlans={trainingPlans}
            trainingSessions={trainingSessions}
            calendarWindow={calendarWindow}
            viewingAthlete={viewingAthlete}
        />
    );
}
