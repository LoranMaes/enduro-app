import CalendarPage from '@/pages/calendar';
import type {
    ApiPaginatedCollectionResponse,
    TrainingPlanApi,
} from '@/types/training-plans';

type DashboardProps = {
    trainingPlans: ApiPaginatedCollectionResponse<TrainingPlanApi>;
};

export default function Dashboard({ trainingPlans }: DashboardProps) {
    return <CalendarPage trainingPlans={trainingPlans} />;
}
