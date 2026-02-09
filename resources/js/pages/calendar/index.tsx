import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { mapActivityCollection, mapTrainingSessionCollection } from '@/lib/training-plans';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type {
    ActivityApi,
    ApiCollectionResponse,
    ApiPaginatedCollectionResponse,
    TrainingPlanApi,
    TrainingSessionApi,
} from '@/types/training-plans';
import { PlanSection } from './components/plan-section';

type CalendarPageProps = {
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
    headTitle?: string;
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
    activities,
    calendarWindow,
    providerStatus,
    athleteTrainingTargets,
    viewingAthlete = null,
    headTitle = 'Calendar',
}: CalendarPageProps) {
    void _trainingPlans;
    const sessions = mapTrainingSessionCollection(trainingSessions);
    const activityEntries = mapActivityCollection(activities);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={headTitle} />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                    <PlanSection
                        initialSessions={sessions}
                        initialActivities={activityEntries}
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
