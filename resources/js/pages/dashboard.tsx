import { Head } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AppLayout from '@/layouts/app-layout';
import { mapTrainingPlanCollection } from '@/lib/training-plans';
import { dashboard } from '@/routes';
import { index as trainingPlansIndex } from '@/routes/training-plans';
import type { BreadcrumbItem } from '@/types';
import type { ApiCollectionResponse, TrainingPlanApi, TrainingPlanView } from '@/types/training-plans';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

export default function Dashboard() {
    const [plans, setPlans] = useState<TrainingPlanView[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const loadPlans = async (): Promise<void> => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch(trainingPlansIndex.url(), {
                    headers: {
                        Accept: 'application/json',
                    },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error(`Failed to load training plans (${response.status})`);
                }

                const payload =
                    (await response.json()) as ApiCollectionResponse<TrainingPlanApi>;

                setPlans(mapTrainingPlanCollection(payload));
            } catch (loadError) {
                if (controller.signal.aborted) {
                    return;
                }

                setError(
                    loadError instanceof Error
                        ? loadError.message
                        : 'Failed to load training plans.',
                );
            } finally {
                if (!controller.signal.aborted) {
                    setIsLoading(false);
                }
            }
        };

        loadPlans().catch(() => {
            setError('Failed to load training plans.');
            setIsLoading(false);
        });

        return () => {
            controller.abort();
        };
    }, []);

    const summary = useMemo(() => {
        const totalWeeks = plans.reduce((count, plan) => count + plan.weeks.length, 0);
        const totalSessions = plans.reduce((count, plan) => {
            return (
                count +
                plan.weeks.reduce((weekCount, week) => weekCount + week.sessions.length, 0)
            );
        }, 0);
        const completedSessions = plans.reduce((count, plan) => {
            return (
                count +
                plan.weeks.reduce((weekCount, week) => {
                    return (
                        weekCount +
                        week.sessions.filter(
                            (session) => session.status === 'completed',
                        ).length
                    );
                }, 0)
            );
        }, 0);

        return {
            totalPlans: plans.length,
            totalWeeks,
            totalSessions,
            completedSessions,
        };
    }, [plans]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Training Plans (Read Only)</CardTitle>
                        <CardDescription>
                            Data is loaded from the backend API using authenticated
                            read access.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-4">
                        <div className="rounded-lg border p-3">
                            <p className="text-muted-foreground text-xs uppercase">
                                Plans
                            </p>
                            <p className="text-2xl font-semibold">
                                {summary.totalPlans}
                            </p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-muted-foreground text-xs uppercase">
                                Weeks
                            </p>
                            <p className="text-2xl font-semibold">
                                {summary.totalWeeks}
                            </p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-muted-foreground text-xs uppercase">
                                Sessions
                            </p>
                            <p className="text-2xl font-semibold">
                                {summary.totalSessions}
                            </p>
                        </div>
                        <div className="rounded-lg border p-3">
                            <p className="text-muted-foreground text-xs uppercase">
                                Completed
                            </p>
                            <p className="text-2xl font-semibold">
                                {summary.completedSessions}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {error ? (
                    <Alert variant="destructive">
                        <AlertTitle>Unable to load training plans</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                ) : null}

                {isLoading ? (
                    <div className="grid gap-3">
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                        <Skeleton className="h-28 w-full" />
                    </div>
                ) : null}

                {!isLoading && !error && plans.length === 0 ? (
                    <Card>
                        <CardHeader>
                            <CardTitle>No training plans found</CardTitle>
                            <CardDescription>
                                Your current role has no readable plan data yet.
                            </CardDescription>
                        </CardHeader>
                    </Card>
                ) : null}

                {!isLoading && !error && plans.length > 0 ? (
                    <div className="grid gap-3">
                        {plans.map((plan) => (
                            <Card key={plan.id}>
                                <CardHeader className="gap-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <CardTitle>{plan.title}</CardTitle>
                                        <Badge variant="secondary">
                                            {plan.weeks.length} week
                                            {plan.weeks.length === 1 ? '' : 's'}
                                        </Badge>
                                    </div>
                                    <CardDescription>
                                        {plan.startsAt} to {plan.endsAt}
                                    </CardDescription>
                                    {plan.description ? (
                                        <p className="text-muted-foreground text-sm">
                                            {plan.description}
                                        </p>
                                    ) : null}
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {plan.weeks.map((week) => (
                                        <div
                                            key={week.id}
                                            className="rounded-lg border p-3"
                                        >
                                            <div className="mb-2 flex items-center justify-between gap-2">
                                                <p className="text-sm font-medium">
                                                    Week starting {week.startsAt}
                                                </p>
                                                <Badge variant="outline">
                                                    {week.sessions.length} session
                                                    {week.sessions.length === 1
                                                        ? ''
                                                        : 's'}
                                                </Badge>
                                            </div>
                                            {week.sessions.length > 0 ? (
                                                <div className="space-y-2">
                                                    {week.sessions.map((session) => (
                                                        <div
                                                            key={session.id}
                                                            className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                                                        >
                                                            <div>
                                                                <p className="text-sm font-medium capitalize">
                                                                    {session.sport}
                                                                </p>
                                                                <p className="text-muted-foreground text-xs">
                                                                    {
                                                                        session.scheduledDate
                                                                    }
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <Badge variant="outline">
                                                                    {session.status}
                                                                </Badge>
                                                                <p className="text-muted-foreground mt-1 text-xs">
                                                                    {
                                                                        session.durationMinutes
                                                                    }
                                                                    m
                                                                </p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-muted-foreground text-sm">
                                                    No sessions scheduled for this
                                                    week.
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : null}

                <div className="text-muted-foreground rounded-lg border border-dashed p-3 text-xs">
                    Write actions are intentionally disabled in this phase.
                </div>
            </div>
        </AppLayout>
    );
}
