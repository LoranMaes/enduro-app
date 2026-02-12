import { Head, usePage } from '@inertiajs/react';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { index as athletesIndex } from '@/routes/athletes';
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Athletes',
        href: athletesIndex().url,
    },
];

export default function AthletesIndex() {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Athletes" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Athletes</CardTitle>
                        <CardDescription>
                            Role-aware athlete roster surface for planning and review.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Read-only shell</CardTitle>
                        <CardDescription>
                            Athlete list wiring will be connected to real backend
                            roster data in a later phase. Current user: {auth.user.name}
                            .
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </AppLayout>
    );
}
