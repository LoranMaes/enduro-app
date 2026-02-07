import { Head } from '@inertiajs/react';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Coaches',
        href: '/coaches',
    },
];

export default function CoachesIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Coaches" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Coaches</CardTitle>
                        <CardDescription>
                            Administrative coach oversight and readiness surface.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Read-only shell</CardTitle>
                        <CardDescription>
                            Coach listings and approval state will be connected to real
                            backend sources in a later phase.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </AppLayout>
    );
}
