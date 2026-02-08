import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { mapTrainingSessionCollection } from '@/lib/training-plans';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type {
    ApiCollectionResponse,
    ApiPaginatedCollectionResponse,
    TrainingPlanApi,
    TrainingSessionApi,
} from '@/types/training-plans';
import { PlanSection } from './components/plan-section';

type CalendarPageProps = {
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

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Calendar',
        href: dashboard().url,
    },
];

export default function CalendarPage({
    trainingPlans: _trainingPlans,
    trainingSessions,
    calendarWindow,
    viewingAthlete = null,
}: CalendarPageProps) {
    void _trainingPlans;
    const sessions = mapTrainingSessionCollection(trainingSessions);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Calendar" />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                    <PlanSection
                        initialSessions={sessions}
                        initialWindow={calendarWindow}
                        viewingAthleteName={viewingAthlete?.name ?? null}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
