import { Head, usePage } from '@inertiajs/react';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { index as athletesIndex, show as showAthlete } from '@/routes/athletes';
import type { BreadcrumbItem, SharedData } from '@/types';

type AthleteDetailProps = {
    athleteId: string;
};

export default function AthletesShow({ athleteId }: AthleteDetailProps) {
    const { auth } = usePage<SharedData>().props;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Athletes',
            href: athletesIndex().url,
        },
        {
            title: `Athlete ${athleteId}`,
            href: showAthlete(Number(athleteId)).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Athlete ${athleteId}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Athlete Detail</CardTitle>
                        <CardDescription>
                            Context surface for individual athlete planning and review.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Read-only shell</CardTitle>
                        <CardDescription>
                            Detailed athlete data is not wired yet. Route context is
                            active for athlete ID: {athleteId}. Viewed by {auth.user.name}
                            .
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </AppLayout>
    );
}
