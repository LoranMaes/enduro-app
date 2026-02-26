import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { index as supportIndex } from '@/routes/support';
import type { BreadcrumbItem } from '@/types';
import { SupportPage } from './SupportPage';
import type {
    SupportAttachmentLimits,
    SupportTicketBuckets,
    SupportTicketStatusLabels,
} from './types';

type SupportIndexPageProps = {
    initialTickets: SupportTicketBuckets;
    statusLabels: SupportTicketStatusLabels;
    attachmentLimits: SupportAttachmentLimits;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Support',
        href: supportIndex().url,
    },
];

export default function SupportIndexPage({
    initialTickets,
    statusLabels,
    attachmentLimits,
}: SupportIndexPageProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Support" />
            <SupportPage
                initialTickets={initialTickets}
                statusLabels={statusLabels}
                attachmentLimits={attachmentLimits}
            />
        </AppLayout>
    );
}
