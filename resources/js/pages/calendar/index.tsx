import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { mapActivityCollection, mapTrainingSessionCollection } from '@/lib/training-plans';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type {
    ActivityView,
    TrainingSessionView,
} from '@/types/training-plans';
import CalendarPageContent from './CalendarPage';
import type { CalendarPageProps } from './types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Calendar',
        href: dashboard().url,
    },
];

export default function CalendarIndex({
    trainingPlans: _trainingPlans,
    trainingSessions,
    activities,
    calendarWindow,
    providerStatus,
    athleteTrainingTargets,
    viewingAthlete = null,
    headTitle = 'Calendar',
}: CalendarPageProps) {
    void _trainingPlans;
    const initialSessions: TrainingSessionView[] =
        mapTrainingSessionCollection(trainingSessions);
    const initialActivities: ActivityView[] = mapActivityCollection(activities);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={headTitle} />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                    <CalendarPageContent
                        initialSessions={initialSessions}
                        initialActivities={initialActivities}
                        initialWindow={calendarWindow}
                        providerStatus={providerStatus}
                        athleteTrainingTargets={athleteTrainingTargets}
                        viewingAthleteId={viewingAthlete?.id ?? null}
                        viewingAthleteName={viewingAthlete?.name ?? null}
                    />
                </div>
            </div>
        </AppLayout>
    );
}
