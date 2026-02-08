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
        title: 'Training Progress',
        href: '/progress',
    },
];

export default function ProgressIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Training Progress" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Training Progress</CardTitle>
                        <CardDescription>
                            Training Progress coming soon.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-sm">
                            This section will provide read-only progress
                            summaries in a later phase.
                        </p>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
