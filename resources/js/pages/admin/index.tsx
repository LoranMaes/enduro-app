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
        title: 'Admin',
        href: '/admin',
    },
];

export default function AdminIndex() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-y-auto rounded-xl p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Admin Overview</CardTitle>
                        <CardDescription>
                            System-level oversight for users, roles, and platform health.
                        </CardDescription>
                    </CardHeader>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Read-only shell</CardTitle>
                        <CardDescription>
                            Admin dashboards, impersonation workflows, and moderation
                            actions will be connected in upcoming phases.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        </AppLayout>
    );
}
