import CalendarPage from '@/pages/calendar';
import type {
    ApiPaginatedCollectionResponse,
    TrainingPlanApi,
} from '@/types/training-plans';

type DashboardProps = {
    trainingPlans: ApiPaginatedCollectionResponse<TrainingPlanApi>;
    viewingAthlete?: {
        id: number;
        name: string;
    } | null;
};

export default function Dashboard({
    trainingPlans,
    viewingAthlete = null,
}: DashboardProps) {
    return (
        <CalendarPage
            trainingPlans={trainingPlans}
            viewingAthlete={viewingAthlete}
        />
    );
}
