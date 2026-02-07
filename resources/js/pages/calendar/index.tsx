import { Head } from '@inertiajs/react';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { mapTrainingPlanCollection } from '@/lib/training-plans';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';
import type {
    ApiPaginatedCollectionResponse,
    TrainingPlanApi,
} from '@/types/training-plans';
import { CalendarSummary } from './components/calendar-summary';
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

    const totals = plans.reduce(
        (carry, plan) => {
            const weekCount = plan.weeks.length;
            const sessionCount = plan.weeks.reduce(
                (count, week) => count + week.sessions.length,
                0,
            );
            const completedCount = plan.weeks.reduce((count, week) => {
                return (
                    count +
                    week.sessions.filter((session) => session.status === 'completed')
                        .length
                );
            }, 0);

            return {
                plans: carry.plans + 1,
                weeks: carry.weeks + weekCount,
                sessions: carry.sessions + sessionCount,
                completed: carry.completed + completedCount,
            };
        },
        { plans: 0, weeks: 0, sessions: 0, completed: 0 },
    );

    const meta = trainingPlans.meta;
    const rangeLabel =
        meta && meta.total > 0
            ? `${meta.from ?? 0}-${meta.to ?? 0} of ${meta.total}`
            : '0';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Calendar" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto rounded-xl p-4">
                <CalendarSummary
                    plans={totals.plans}
                    weeks={totals.weeks}
                    sessions={totals.sessions}
                    completed={totals.completed}
                    coverageLabel={rangeLabel}
                />

                {plans.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>No training plans found</CardTitle>
                            <CardDescription>
                                No readable calendar data is currently available for
                                this account.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {plans.map((plan) => (
                            <PlanSection key={plan.id} plan={plan} />
                        ))}
                    </div>
                )}

                <div className="text-muted-foreground rounded-md border border-dashed border-border p-3 text-xs">
                    Read-only mode: create/update/delete actions are intentionally
                    disabled.
                </div>
            </div>
        </AppLayout>
    );
}
