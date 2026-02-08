import { Head } from '@inertiajs/react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Training Plans',
        href: '/plans',
    },
];

export default function PlansIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Training Plans" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Training Plans</CardTitle>
                        <CardDescription>
                            Training Plans read-only overview coming soon.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">
                            Plan management workflows will be wired here in a
                            later phase.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
