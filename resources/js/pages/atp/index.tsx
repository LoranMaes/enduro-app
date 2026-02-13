import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { show as showAtp } from '@/routes/atp';
import type { BreadcrumbItem } from '@/types';
import { AtpPage } from './AtpPage';
import type { AtpPageProps } from './types';

type AtpInertiaPageProps = AtpPageProps;

export default function AtpIndex({
    year,
    plan,
    weekTypeOptions,
    priorityOptions,
}: AtpInertiaPageProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'ATP',
            href: showAtp(year).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Annual Training Plan" />

            <AtpPage
                year={year}
                plan={plan}
                weekTypeOptions={weekTypeOptions}
                priorityOptions={priorityOptions}
            />
        </AppLayout>
    );
}
