import { Head, Link, usePage } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { show as showAthlete } from '@/routes/athletes';
import type { BreadcrumbItem } from '@/types';
import type { SharedData } from '@/types';

type AssignedAthlete = {
    id: number;
    name: string;
    email: string;
    training_plans_count: number;
};

type CoachesIndexProps = {
    assignedAthletes: AssignedAthlete[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Coaches',
        href: '/coaches',
    },
];

export default function CoachesIndex({ assignedAthletes }: CoachesIndexProps) {
    const { auth } = usePage<SharedData>().props;
    const isCoach = auth.user.role === 'coach';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Coaches" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {isCoach
                                ? 'Assigned Athletes'
                                : 'Athlete Directory'}
                        </CardTitle>
                        <CardDescription>
                            {isCoach
                                ? 'Read-only roster of athletes assigned to your coaching account.'
                                : 'Read-only athlete roster visibility for administrative review.'}
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            {isCoach
                                ? 'Coach Read-Only Access'
                                : 'Read-Only Access'}
                        </CardTitle>
                        <CardDescription>
                            Calendar editing remains disabled for this role in
                            this phase.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {assignedAthletes.length === 0 ? (
                            <p className="rounded-md border border-dashed border-border px-4 py-6 text-sm text-zinc-400">
                                No assigned athletes are currently available.
                            </p>
                        ) : (
                            assignedAthletes.map((athlete) => (
                                <Link
                                    key={athlete.id}
                                    href={showAthlete(athlete.id).url}
                                    className="block rounded-lg border border-border bg-surface/40 px-4 py-3 transition-colors hover:bg-surface/70"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium text-zinc-100">
                                                {athlete.name}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {athlete.email}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono text-sm text-zinc-200">
                                                {athlete.training_plans_count}
                                            </p>
                                            <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                                                Plans
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
