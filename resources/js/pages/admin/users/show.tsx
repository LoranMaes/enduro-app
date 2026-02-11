import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Eye, Filter, Shield } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    meta?: {
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
    statusMessage?: string | null;
    backUrl: string;
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
    suspension: {
        is_suspended: boolean;
        suspended_at: string | null;
        suspended_reason: string | null;
        suspended_by_name: string | null;
    };
};

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

    const safeLogMeta = logs.meta ?? {
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

    const suspendUser = (): void => {
        if (suspensionReason.trim().length < 10 || isSubmittingSuspension) {
            return;
        }

        setIsSubmittingSuspension(true);

        router.post(
            `/admin/users/${user.id}/suspend`,
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

        router.delete(`/admin/users/${user.id}/suspend`, {
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
                        <section className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-4">
                                <OverviewCard label="Role" value={user.role ?? '—'} />
                                <OverviewCard label="Status" value={user.status} />
                                <OverviewCard
                                    label="Training Plans"
                                    value={user.plan_label}
                                />
                                <OverviewCard
                                    label="Impersonation"
                                    value={
                                        user.can_impersonate
                                            ? 'Allowed'
                                            : 'Blocked'
                                    }
                                />
                            </div>

                            {user.role !== 'admin' ? (
                                <div className="rounded-xl border border-border bg-surface p-4">
                                    <h2 className="text-sm font-medium text-zinc-100">
                                        Moderation
                                    </h2>

                                    {suspension.is_suspended ? (
                                        <div className="mt-3 space-y-3">
                                            <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2">
                                                <p className="text-xs text-zinc-300">
                                                    This user is currently
                                                    suspended.
                                                </p>
                                                <p className="mt-1 text-xs text-zinc-500">
                                                    Suspended by{' '}
                                                    {suspension.suspended_by_name ??
                                                        'Unknown'}{' '}
                                                    on{' '}
                                                    {formatDateTime(
                                                        suspension.suspended_at,
                                                    )}
                                                </p>
                                                <p className="mt-2 text-xs text-zinc-400">
                                                    {suspension.suspended_reason ??
                                                        'No reason recorded.'}
                                                </p>
                                            </div>

                                            <Button
                                                type="button"
                                                variant="secondary"
                                                className="h-9"
                                                disabled={isSubmittingSuspension}
                                                onClick={unsuspendUser}
                                            >
                                                {isSubmittingSuspension
                                                    ? 'Updating...'
                                                    : 'Reactivate User'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="mt-3 space-y-3">
                                            <textarea
                                                value={suspensionReason}
                                                onChange={(event) =>
                                                    setSuspensionReason(
                                                        event.target.value,
                                                    )
                                                }
                                                placeholder="Describe why this account is being suspended..."
                                                className="min-h-24 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                className="h-9"
                                                disabled={
                                                    isSubmittingSuspension ||
                                                    suspensionReason.trim()
                                                        .length < 10
                                                }
                                                onClick={suspendUser}
                                            >
                                                {isSubmittingSuspension
                                                    ? 'Suspending...'
                                                    : 'Suspend User'}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </section>
                    ) : (
                        <section className="space-y-4">
                            <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface px-4 py-3">
                                <div className="space-y-1">
                                    <label
                                        htmlFor="scope"
                                        className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase"
                                    >
                                        Scope
                                    </label>
                                    <Select
                                        value={filters.scope}
                                        onValueChange={(value) =>
                                            updateFilters({
                                                scope: value,
                                                page: 1,
                                            })
                                        }
                                    >
                                        <SelectTrigger
                                            id="scope"
                                            className="h-9 rounded-md border-border bg-background text-sm text-zinc-200"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {scopeOptions.map((scopeOption) => (
                                                <SelectItem
                                                    key={scopeOption.value}
                                                    value={scopeOption.value}
                                                >
                                                    {scopeOption.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <label
                                        htmlFor="event"
                                        className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase"
                                    >
                                        Event
                                    </label>
                                    <Select
                                        value={filters.event ?? '__all__'}
                                        onValueChange={(value) =>
                                            updateFilters({
                                                event:
                                                    value === '__all__'
                                                        ? null
                                                        : value,
                                                page: 1,
                                            })
                                        }
                                    >
                                        <SelectTrigger
                                            id="event"
                                            className="h-9 rounded-md border-border bg-background text-sm text-zinc-200"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__all__">
                                                All events
                                            </SelectItem>
                                            {eventOptions.map((eventOption) => (
                                                <SelectItem
                                                    key={eventOption}
                                                    value={eventOption}
                                                >
                                                    {eventOption}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1">
                                    <label
                                        htmlFor="per-page"
                                        className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase"
                                    >
                                        Rows
                                    </label>
                                    <Select
                                        value={String(filters.per_page)}
                                        onValueChange={(value) =>
                                            updateFilters({
                                                per_page: Number.parseInt(
                                                    value,
                                                    10,
                                                ),
                                                page: 1,
                                            })
                                        }
                                    >
                                        <SelectTrigger
                                            id="per-page"
                                            className="h-9 rounded-md border-border bg-background text-sm text-zinc-200"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="10">10</SelectItem>
                                            <SelectItem value="25">25</SelectItem>
                                            <SelectItem value="50">50</SelectItem>
                                            <SelectItem value="100">100</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="ml-auto flex items-center gap-2 text-xs text-zinc-500">
                                    <Filter className="h-3.5 w-3.5" />
                                    {safeLogMeta.total} log entries
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-border bg-surface">
                                <div className="grid grid-cols-[10.625rem_6.875rem_10rem_1fr_6.875rem] border-b border-border bg-zinc-900/40 px-4 py-2">
                                    <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                                        Time
                                    </p>
                                    <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                                        Event
                                    </p>
                                    <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                                        Target
                                    </p>
                                    <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                                        Action
                                    </p>
                                    <p className="text-right text-[0.625rem] tracking-wide text-zinc-500 uppercase">
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
                                                className="grid grid-cols-[10.625rem_6.875rem_10rem_1fr_6.875rem] items-center gap-3 px-4 py-3"
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
                                                        className="h-7 px-2 text-[0.6875rem] text-zinc-300 hover:bg-zinc-800"
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
                                    Showing {safeLogMeta.from ?? 0}–
                                    {safeLogMeta.to ?? 0} of {safeLogMeta.total}
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
                <DialogContent className="max-h-[90vh] max-w-5xl overflow-hidden border-border bg-surface text-zinc-100">
                    <DialogHeader>
                        <DialogTitle className="text-base">
                            Log #{selectedLog?.id}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedLog !== null ? (
                        <div className="space-y-3 overflow-y-auto pr-1">
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

                            <div className="grid gap-3 lg:grid-cols-2">
                                <JsonPanel
                                    label="Previous values"
                                    payload={selectedLog.changes.old ?? {}}
                                />
                                <JsonPanel
                                    label="Next values"
                                    payload={selectedLog.changes.attributes ?? {}}
                                />
                            </div>

                            <JsonPanel
                                label="Properties"
                                payload={selectedLog.properties}
                            />
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
            <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
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
    children: ReactNode;
}) {
    return (
        <div className="rounded-md border border-border bg-background px-3 py-2">
            <p className="text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                {label}
            </p>
            <p className="mt-1 text-xs text-zinc-200">{children}</p>
        </div>
    );
}

function JsonPanel({
    label,
    payload,
}: {
    label: string;
    payload: Record<string, unknown>;
}) {
    return (
        <div className="rounded-md border border-border bg-background p-3">
            <p className="mb-2 text-[0.625rem] tracking-wide text-zinc-500 uppercase">
                {label}
            </p>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words text-[0.6875rem] text-zinc-300">
                {JSON.stringify(payload, null, 2)}
            </pre>
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
        <Badge
            className={`inline-flex w-fit items-center border-transparent px-2 py-0.5 text-[0.625rem] tracking-wide uppercase ${baseClass}`}
        >
            {value}
        </Badge>
    );
}

function StatusPill({ status }: { status: string }) {
    if (status === 'active') {
        return (
            <Badge className="inline-flex items-center gap-1.5 border-transparent bg-emerald-950/30 px-2.5 py-1 text-[0.6875rem] font-medium tracking-wide text-emerald-400 uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Active
            </Badge>
        );
    }

    if (status === 'rejected') {
        return (
            <Badge className="inline-flex items-center gap-1.5 border-transparent bg-red-950/40 px-2.5 py-1 text-[0.6875rem] font-medium tracking-wide text-red-300 uppercase">
                Rejected
            </Badge>
        );
    }

    if (status === 'suspended') {
        return (
            <Badge className="inline-flex items-center gap-1.5 border-transparent bg-zinc-800 px-2.5 py-1 text-[0.6875rem] font-medium tracking-wide text-zinc-200 uppercase">
                Suspended
            </Badge>
        );
    }

    return (
        <Badge className="inline-flex items-center gap-1.5 border-transparent bg-amber-950/35 px-2.5 py-1 text-[0.6875rem] font-medium tracking-wide text-amber-300 uppercase">
            Pending
        </Badge>
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
