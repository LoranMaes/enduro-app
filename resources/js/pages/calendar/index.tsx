import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { mapTrainingPlanCollection } from '@/lib/training-plans';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type {
    ApiPaginatedCollectionResponse,
    TrainingPlanApi,
    TrainingPlanView,
} from '@/types/training-plans';
import { PlanSection } from './components/plan-section';

type CalendarPageProps = {
    trainingPlans: ApiPaginatedCollectionResponse<TrainingPlanApi>;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Calendar',
        href: dashboard().url,
    },
];

export default function CalendarPage({ trainingPlans }: CalendarPageProps) {
    const plans = mapTrainingPlanCollection(trainingPlans);
    const primaryPlan = resolvePrimaryPlan(plans);
    const additionalPlanCount = plans.length > 0 ? plans.length - 1 : 0;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Calendar" />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                {primaryPlan === null ? (
                    <div className="flex h-full items-center justify-center border border-dashed border-border">
                        <p className="text-sm text-zinc-400">
                            No readable calendar data is currently available for
                            this account.
                        </p>
                    </div>
                ) : (
                    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
                        <PlanSection
                            plan={primaryPlan}
                            additionalPlanCount={additionalPlanCount}
                        />
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function resolvePrimaryPlan(
    plans: TrainingPlanView[],
): TrainingPlanView | null {
    if (plans.length === 0) {
        return null;
    }

    const today = new Date();
    const activePlan = plans.find((plan) => {
        const startsAt = new Date(`${plan.startsAt}T00:00:00`);
        const endsAt = new Date(`${plan.endsAt}T23:59:59`);

        return startsAt <= today && today <= endsAt;
    });

    return activePlan ?? plans[0];
}
