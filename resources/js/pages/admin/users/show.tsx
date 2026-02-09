import { Head, Link, router } from '@inertiajs/react';
import { Eye, Filter, Shield } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import { index as adminIndex } from '@/routes/admin';
import { index as adminUsersIndex } from '@/routes/admin/users';
import type { BreadcrumbItem } from '@/types';

type AdminUser = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    status: string;
    plan_label: string;
    can_impersonate: boolean;
    is_current: boolean;
};

type ActivityLogItem = {
    id: number;
    log_name: string;
    event: string | null;
    description: string;
    subject_type: string | null;
    subject_label: string | null;
    subject_id: number | null;
    causer_id: number | null;
    causer_name: string | null;
    created_at: string | null;
    properties: Record<string, unknown>;
    changes: {
        old: Record<string, unknown> | null;
        attributes: Record<string, unknown> | null;
    };
};

type PaginatedLogs = {
    data: ActivityLogItem[];
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    meta: {
        current_page: number;
        from: number | null;
        last_page: number;
        path: string;
        per_page: number;
        to: number | null;
        total: number;
    };
};

type AdminUserShowPageProps = {
    user: AdminUser;
    filters: {
        scope: 'causer' | 'subject' | 'all' | string;
        event: string | null;
        per_page: number;
    };
    scopeOptions: Array<{
        value: 'causer' | 'subject' | 'all' | string;
        label: string;
    }>;
    eventOptions: string[];
    logs: PaginatedLogs;
};

const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'logs', label: 'Activity Logs' },
] as const;

export default function AdminUserShow({
    user,
    filters,
    scopeOptions,
    eventOptions,
    logs,
}: AdminUserShowPageProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'logs'>('logs');
    const [selectedLog, setSelectedLog] = useState<ActivityLogItem | null>(
        null,
    );

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
                href: `/admin/users/${user.id}`,
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
        router.get(
            `/admin/users/${user.id}`,
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name} • User Detail`} />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <header className="flex flex-col gap-4 border-b border-border px-6 py-5 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-zinc-500" />
                            <p className="text-[11px] tracking-[0.22em] text-zinc-500 uppercase">
                                User Detail
                            </p>
                        </div>
                        <h1 className="text-3xl font-medium text-zinc-100">
                            {user.name}
                        </h1>
                        <p className="text-sm text-zinc-500">{user.email}</p>
                    </div>

                    <StatusPill status={user.status} />
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-6">
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
                        <section className="grid gap-4 md:grid-cols-4">
                            <OverviewCard
                                label="Role"
                                value={user.role ?? '—'}
                            />
                            <OverviewCard label="Status" value={user.status} />
                            <OverviewCard
                                label="Training Plans"
                                value={user.plan_label}
                            />
                            <OverviewCard
                                label="Impersonation"
                                value={
                                    user.can_impersonate ? 'Allowed' : 'Blocked'
                                }
                            />
                        </section>
                    ) : (
                        <section className="space-y-4">
                            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                                <div className="space-y-1">
                                    <label
                                        htmlFor="scope"
                                        className="text-[11px] tracking-wide text-zinc-500 uppercase"
                                    >
                                        Scope
                                    </label>
                                    <select
                                        id="scope"
                                        value={filters.scope}
                                        onChange={(event) =>
                                            updateFilters({
                                                scope: event.target.value,
                                                page: 1,
                                            })
                                        }
                                        className="h-9 rounded-md border border-border bg-background px-3 text-sm text-zinc-200"
                                    >
                                        {scopeOptions.map((scopeOption) => (
                                            <option
                                                key={scopeOption.value}
                                                value={scopeOption.value}
                                            >
                                                {scopeOption.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label
                                        htmlFor="event"
                                        className="text-[11px] tracking-wide text-zinc-500 uppercase"
                                    >
                                        Event
                                    </label>
                                    <select
                                        id="event"
                                        value={filters.event ?? ''}
                                        onChange={(event) =>
                                            updateFilters({
                                                event:
                                                    event.target.value === ''
                                                        ? null
                                                        : event.target.value,
                                                page: 1,
                                            })
                                        }
                                        className="h-9 rounded-md border border-border bg-background px-3 text-sm text-zinc-200"
                                    >
                                        <option value="">All events</option>
                                        {eventOptions.map((eventOption) => (
                                            <option
                                                key={eventOption}
                                                value={eventOption}
                                            >
                                                {eventOption}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label
                                        htmlFor="per-page"
                                        className="text-[11px] tracking-wide text-zinc-500 uppercase"
                                    >
                                        Rows
                                    </label>
                                    <select
                                        id="per-page"
                                        value={filters.per_page}
                                        onChange={(event) =>
                                            updateFilters({
                                                per_page: Number.parseInt(
                                                    event.target.value,
                                                    10,
                                                ),
                                                page: 1,
                                            })
                                        }
                                        className="h-9 rounded-md border border-border bg-background px-3 text-sm text-zinc-200"
                                    >
                                        <option value={10}>10</option>
                                        <option value={25}>25</option>
                                        <option value={50}>50</option>
                                        <option value={100}>100</option>
                                    </select>
                                </div>

                                <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
                                    <Filter className="h-3.5 w-3.5" />
                                    {logs.meta.total} log entries
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-border bg-surface">
                                <div className="grid grid-cols-[170px_110px_160px_1fr_110px] border-b border-border bg-zinc-900/40 px-4 py-2">
                                    <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
                                        Time
                                    </p>
                                    <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
                                        Event
                                    </p>
                                    <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
                                        Target
                                    </p>
                                    <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
                                        Action
                                    </p>
                                    <p className="text-right text-[10px] tracking-wide text-zinc-500 uppercase">
                                        Values
                                    </p>
                                </div>

                                <div className="divide-y divide-border">
                                    {logs.data.length === 0 ? (
                                        <p className="px-4 py-8 text-sm text-zinc-500">
                                            No logs found for this filter.
                                        </p>
                                    ) : (
                                        logs.data.map((log) => (
                                            <div
                                                key={log.id}
                                                className="grid grid-cols-[170px_110px_160px_1fr_110px] items-center gap-3 px-4 py-3"
                                            >
                                                <p className="text-xs text-zinc-400">
                                                    {formatDateTime(
                                                        log.created_at,
                                                    )}
                                                </p>
                                                <EventBadge event={log.event} />
                                                <p className="truncate text-xs text-zinc-400">
                                                    {log.subject_label ??
                                                        'Request'}
                                                    {log.subject_id !== null
                                                        ? ` #${log.subject_id}`
                                                        : ''}
                                                </p>
                                                <p className="truncate text-xs text-zinc-300">
                                                    {log.description}
                                                </p>
                                                <div className="flex justify-end">
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 px-2 text-[11px] text-zinc-300 hover:bg-zinc-800"
                                                        onClick={() =>
                                                            setSelectedLog(log)
                                                        }
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        View
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <p className="text-xs text-zinc-500">
                                    Showing {logs.meta.from ?? 0}–
                                    {logs.meta.to ?? 0} of {logs.meta.total}
                                </p>
                                <div className="flex items-center gap-1">
                                    {logs.links.map((link, index) => (
                                        <button
                                            key={`${link.label}-${index}`}
                                            type="button"
                                            disabled={link.url === null}
                                            className={`rounded border px-2.5 py-1 text-xs transition-colors ${
                                                link.active
                                                    ? 'border-zinc-500 bg-zinc-800 text-zinc-100'
                                                    : 'border-border text-zinc-400 hover:text-zinc-200'
                                            } disabled:cursor-not-allowed disabled:opacity-50`}
                                            onClick={() => {
                                                if (link.url === null) {
                                                    return;
                                                }

                                                router.visit(link.url, {
                                                    preserveScroll: true,
                                                    preserveState: true,
                                                    replace: true,
                                                });
                                            }}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}
                </div>
            </div>

            <Dialog
                open={selectedLog !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setSelectedLog(null);
                    }
                }}
            >
                <DialogContent className="max-w-3xl border-border bg-surface text-zinc-100">
                    <DialogHeader>
                        <DialogTitle className="text-base">
                            Log #{selectedLog?.id}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedLog !== null ? (
                        <div className="space-y-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <LogDetail label="Time">
                                    {formatDateTime(selectedLog.created_at)}
                                </LogDetail>
                                <LogDetail label="Event">
                                    {selectedLog.event ?? '—'}
                                </LogDetail>
                                <LogDetail label="Action">
                                    {selectedLog.description}
                                </LogDetail>
                                <LogDetail label="Subject">
                                    {selectedLog.subject_label ?? 'Request'}
                                    {selectedLog.subject_id !== null
                                        ? ` #${selectedLog.subject_id}`
                                        : ''}
                                </LogDetail>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <pre className="max-h-72 overflow-auto rounded border border-border bg-background p-3 text-[11px] text-zinc-300">
                                    {JSON.stringify(
                                        selectedLog.changes.old ?? {},
                                        null,
                                        2,
                                    )}
                                </pre>
                                <pre className="max-h-72 overflow-auto rounded border border-border bg-background p-3 text-[11px] text-zinc-300">
                                    {JSON.stringify(
                                        selectedLog.changes.attributes ?? {},
                                        null,
                                        2,
                                    )}
                                </pre>
                            </div>

                            <pre className="max-h-72 overflow-auto rounded border border-border bg-background p-3 text-[11px] text-zinc-400">
                                {JSON.stringify(
                                    selectedLog.properties,
                                    null,
                                    2,
                                )}
                            </pre>
                        </div>
                    ) : null}
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function OverviewCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-xl border border-border bg-surface px-4 py-3">
            <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
                {label}
            </p>
            <p className="mt-1 text-sm text-zinc-100">{value}</p>
        </div>
    );
}

function LogDetail({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-md border border-border bg-background px-3 py-2">
            <p className="text-[10px] tracking-wide text-zinc-500 uppercase">
                {label}
            </p>
            <p className="mt-1 text-xs text-zinc-200">{children}</p>
        </div>
    );
}

function EventBadge({ event }: { event: string | null }) {
    const value = (event ?? 'unknown').toLowerCase();
    const baseClass =
        value === 'created' || value === 'post'
            ? 'bg-emerald-500/15 text-emerald-300'
            : value === 'updated' || value === 'put' || value === 'patch'
              ? 'bg-sky-500/15 text-sky-300'
              : value === 'deleted' || value === 'delete'
                ? 'bg-red-500/15 text-red-300'
                : 'bg-zinc-700/60 text-zinc-300';

    return (
        <span
            className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase ${baseClass}`}
        >
            {value}
        </span>
    );
}

function StatusPill({ status }: { status: string }) {
    if (status === 'active') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-950/30 px-2.5 py-1 text-[11px] font-medium tracking-wide text-emerald-400 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Active
            </span>
        );
    }

    if (status === 'rejected') {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-950/40 px-2.5 py-1 text-[11px] font-medium tracking-wide text-red-300 uppercase">
                Rejected
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-950/35 px-2.5 py-1 text-[11px] font-medium tracking-wide text-amber-300 uppercase">
            Pending
        </span>
    );
}

function formatDateTime(value: string | null): string {
    if (value === null) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString();
}
