import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Shield } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { index as adminIndex } from '@/routes/admin';
import {
    index as adminUsersIndex,
    show as adminUsersShow,
    suspend as adminUsersSuspend,
    unsuspend as adminUsersUnsuspend,
} from '@/routes/admin/users';
import type { BreadcrumbItem } from '@/types';
import { LogDetailsDialog } from './show/components/LogDetailsDialog';
import { LogsTab } from './show/components/LogsTab';
import { OverviewTab } from './show/components/OverviewTab';
import { StatusPill } from './show/components/StatusPill';
import type { ActivityLogItem, AdminUserShowPageProps, PaginatedLogs } from './show/types';

const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'logs', label: 'Activity Logs' },
] as const;

export default function AdminUserShow({
    user,
    statusMessage,
    backUrl,
    filters,
    scopeOptions,
    eventOptions,
    logs,
    suspension,
}: AdminUserShowPageProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'logs'>('logs');
    const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(
        null,
    );
    const [suspensionReason, setSuspensionReason] = useState('');
    const [isSubmittingSuspension, setIsSubmittingSuspension] = useState(false);

    const safeLogMeta: NonNullable<PaginatedLogs['meta']> = logs.meta ?? {
        current_page: 1,
        from: null,
        last_page: 1,
        path: '',
        per_page: filters.per_page,
        to: null,
        total: logs.data.length,
    };

    const breadcrumbs: BreadcrumbItem[] = useMemo(() => {
        return [
            {
                title: 'Admin Console',
                href: adminIndex().url,
            },
            {
                title: 'Users',
                href: adminUsersIndex().url,
            },
            {
                title: user.name,
                href: adminUsersShow(user.id).url,
            },
        ];
    }, [user.id, user.name]);

    const updateFilters = (
        next: Partial<{
            scope: string;
            event: string | null;
            page: number;
            per_page: number;
        }>,
    ): void => {
        const route = adminUsersShow(user.id);

        router.get(
            route.url,
            {
                scope: next.scope ?? filters.scope,
                event:
                    next.event !== undefined
                        ? next.event
                        : (filters.event ?? ''),
                page: next.page ?? 1,
                per_page: next.per_page ?? filters.per_page,
            },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
            },
        );
    };

    const suspendUser = (): void => {
        if (suspensionReason.trim().length < 10 || isSubmittingSuspension) {
            return;
        }

        setIsSubmittingSuspension(true);

        const route = adminUsersSuspend(user.id);

        router.post(
            route.url,
            { reason: suspensionReason.trim() },
            {
                preserveScroll: true,
                onFinish: () => {
                    setIsSubmittingSuspension(false);
                },
            },
        );
    };

    const unsuspendUser = (): void => {
        if (isSubmittingSuspension) {
            return;
        }

        setIsSubmittingSuspension(true);

        const route = adminUsersUnsuspend(user.id);

        router.delete(route.url, {
            preserveScroll: true,
            onFinish: () => {
                setIsSubmittingSuspension(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name} • User Detail`} />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <header className="flex flex-col gap-4 border-b border-border px-6 py-5 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-zinc-500" />
                            <p className="text-[0.6875rem] tracking-[0.22em] text-zinc-500 uppercase">
                                User Detail
                            </p>
                        </div>
                        <h1 className="text-3xl font-medium text-zinc-100">
                            {user.name}
                        </h1>
                        <p className="text-sm text-zinc-500">{user.email}</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href={backUrl}
                            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800/70 hover:text-zinc-100"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            Back
                        </Link>
                        <StatusPill status={user.status} />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                    {statusMessage ? (
                        <div className="mb-4 rounded-lg border border-emerald-900/40 bg-emerald-950/20 px-3 py-2 text-sm text-emerald-300">
                            {statusMessage}
                        </div>
                    ) : null}

                    <div className="mb-5 inline-flex rounded-lg border border-border bg-surface p-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                                    activeTab === tab.value
                                        ? 'bg-zinc-800 text-zinc-100'
                                        : 'text-zinc-500 hover:text-zinc-200'
                                }`}
                                onClick={() => setActiveTab(tab.value)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'overview' ? (
                        <OverviewTab
                            user={user}
                            suspension={suspension}
                            suspensionReason={suspensionReason}
                            setSuspensionReason={setSuspensionReason}
                            isSubmittingSuspension={isSubmittingSuspension}
                            suspendUser={suspendUser}
                            unsuspendUser={unsuspendUser}
                        />
                    ) : (
                        <LogsTab
                            filters={filters}
                            scopeOptions={scopeOptions}
                            eventOptions={eventOptions}
                            logs={logs}
                            safeLogMeta={safeLogMeta}
                            updateFilters={updateFilters}
                            setSelectedLog={setSelectedLog}
                        />
                    )}
                </div>
            </div>

            <LogDetailsDialog
                selectedLog={selectedLog}
                setSelectedLog={setSelectedLog}
            />
        </AppLayout>
    );
}
