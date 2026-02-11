import { Head, Link, router } from '@inertiajs/react';
import {
    BarChart3,
    Eye,
    Search,
    Shield,
    UserRound,
    UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { index as adminIndex } from '@/routes/admin';
import { start as startImpersonation } from '@/routes/admin/impersonate';
import {
    index as adminUsersIndex,
    show as adminUsersShow,
} from '@/routes/admin/users';
import type { BreadcrumbItem } from '@/types';

type AdminMetrics = {
    total_users: number;
    active_athletes: number;
    active_coaches: number;
    pending_coach_applications: number;
    estimated_mrr: number | null;
};

type AdminUserPreview = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    status: string;
    plan_label: string;
    can_impersonate: boolean;
    is_current: boolean;
};

type AdminIndexProps = {
    metrics: AdminMetrics;
    recentUsers: AdminUserPreview[];
    coachApplicationsPreview: Array<{
        id: number;
        name: string;
        email: string | null;
        submitted_at: string | null;
    }>;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Console',
        href: adminIndex().url,
    },
];

export default function AdminIndex({
    metrics,
    recentUsers,
    coachApplicationsPreview,
}: AdminIndexProps) {
    const [processingUserId, setProcessingUserId] = useState<number | null>(
        null,
    );

    const impersonate = (userId: number): void => {
        setProcessingUserId(userId);
        router.post(startImpersonation(userId).url, undefined, {
            onFinish: () => {
                setProcessingUserId(null);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Console" />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <header className="flex flex-col gap-6 border-b border-border bg-background px-6 py-6 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-zinc-500" />
                            <p className="text-[0.6875rem] font-medium tracking-wide text-zinc-500 uppercase">
                                Platform Overview
                            </p>
                        </div>
                        <h1 className="font-sans text-4xl font-medium text-zinc-100">
                            Admin Console
                        </h1>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search users or logs..."
                            disabled
                            className="w-full rounded-lg border border-border bg-surface py-2 pr-4 pl-9 text-sm text-zinc-300 placeholder:text-zinc-600"
                        />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="space-y-8">
                        <section className="grid grid-cols-2 gap-4 xl:grid-cols-5">
                            <MetricTile
                                label="Total Users"
                                value={metrics.total_users.toString()}
                            />
                            <MetricTile
                                label="Active Athletes"
                                value={metrics.active_athletes.toString()}
                            />
                            <MetricTile
                                label="Active Coaches"
                                value={metrics.active_coaches.toString()}
                            />
                            <MetricTile
                                label="Coach Applications"
                                value={metrics.pending_coach_applications.toString()}
                                caption="Pending"
                            />
                            <MetricTile
                                label="Est. MRR"
                                value={
                                    metrics.estimated_mrr !== null
                                        ? `€${metrics.estimated_mrr}`
                                        : '\u2014'
                                }
                                caption="Monthly"
                                dashed
                            />
                        </section>

                        <section className="grid gap-4 lg:grid-cols-4">
                            <Link
                                href={adminUsersIndex().url}
                                className="rounded-xl border border-border bg-surface/40 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-800/30"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-100">
                                            Users
                                        </p>
                                        <p className="mt-1 text-xs text-zinc-500">
                                            Directory + read-only impersonation
                                            entrypoint.
                                        </p>
                                    </div>
                                    <UsersRound className="h-4 w-4 text-zinc-500" />
                                </div>
                            </Link>

                            <Link
                                href="/admin/analytics"
                                className="rounded-xl border border-border bg-surface/40 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-800/30"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-100">
                                            Analytics
                                        </p>
                                        <p className="mt-1 text-xs text-zinc-500">
                                            Range-based trends for growth,
                                            sync-health, and moderation.
                                        </p>
                                    </div>
                                    <BarChart3 className="h-4 w-4 text-zinc-500" />
                                </div>
                            </Link>

                            <Link
                                href="/admin/coach-applications"
                                className="rounded-xl border border-border bg-surface/40 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-800/30"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-100">
                                            Coach Applications
                                        </p>
                                        <p className="mt-1 text-xs text-zinc-500">
                                            Review submissions and approve coach
                                            access.
                                        </p>
                                    </div>
                                    <UsersRound className="h-4 w-4 text-zinc-500" />
                                </div>
                            </Link>

                            <div className="rounded-xl border border-border bg-surface/40 p-5 transition-colors hover:border-zinc-700 hover:bg-zinc-800/30">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-medium text-zinc-100">
                                            Impersonation Tools
                                        </p>
                                        <p className="mt-1 text-xs text-zinc-500">
                                            Open Users to start an impersonated
                                            read-only review session.
                                        </p>
                                    </div>
                                    <UserRound className="h-4 w-4 text-zinc-500" />
                                </div>
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-xl border border-border bg-surface">
                            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                <h2 className="text-base font-medium text-zinc-200">
                                    Pending Coach Applications
                                </h2>
                                <Link
                                    href="/admin/coach-applications"
                                    className="text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
                                >
                                    Open queue
                                </Link>
                            </div>

                            {coachApplicationsPreview.length === 0 ? (
                                <p className="px-4 py-6 text-sm text-zinc-500">
                                    No pending coach applications.
                                </p>
                            ) : (
                                <ul className="divide-y divide-border">
                                    {coachApplicationsPreview.map(
                                        (application) => (
                                            <li
                                                key={application.id}
                                                className="flex items-center justify-between gap-4 px-4 py-3"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium text-zinc-200">
                                                        {application.name}
                                                    </p>
                                                    <p className="truncate text-xs text-zinc-500">
                                                        {application.email ??
                                                            '—'}
                                                    </p>
                                                </div>
                                                <span className="shrink-0 text-[0.6875rem] text-zinc-500">
                                                    {application.submitted_at ===
                                                    null
                                                        ? '—'
                                                        : new Date(
                                                              application.submitted_at,
                                                          ).toLocaleDateString()}
                                                </span>
                                            </li>
                                        ),
                                    )}
                                </ul>
                            )}
                        </section>

                        <section className="overflow-hidden rounded-xl border border-border bg-surface">
                            <div className="flex items-center justify-between border-b border-border px-4 py-3">
                                <h2 className="text-xl font-medium text-zinc-200">
                                    Recent Signups
                                </h2>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        className="text-xs font-medium text-zinc-500 transition-colors hover:text-white"
                                    >
                                        Filter
                                    </button>
                                    <button
                                        type="button"
                                        className="text-xs font-medium text-zinc-500 transition-colors hover:text-white"
                                    >
                                        Sort
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_5.625rem_8.25rem] border-b border-border bg-zinc-900/40 px-4 py-2">
                                <p className="text-[0.625rem] tracking-wider text-zinc-500 uppercase">
                                    User
                                </p>
                                <p className="text-[0.625rem] tracking-wider text-zinc-500 uppercase">
                                    Role
                                </p>
                                <p className="text-[0.625rem] tracking-wider text-zinc-500 uppercase">
                                    Status
                                </p>
                                <p className="text-[0.625rem] tracking-wider text-zinc-500 uppercase">
                                    Plan
                                </p>
                                <p className="text-[0.625rem] tracking-wider text-zinc-500 uppercase">
                                    Detail
                                </p>
                                <p className="text-right text-[0.625rem] tracking-wider text-zinc-500 uppercase">
                                    Access
                                </p>
                            </div>

                            <div className="divide-y divide-border">
                                {recentUsers.length === 0 ? (
                                    <p className="px-4 py-6 text-sm text-zinc-500">
                                        No user records available.
                                    </p>
                                ) : (
                                    recentUsers.map((user) => (
                                        <div
                                            key={user.id}
                                            className="grid grid-cols-[2fr_1fr_1fr_1fr_5.625rem_8.25rem] items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/30"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-zinc-200">
                                                    {user.name}
                                                </p>
                                                <p className="text-xs text-zinc-500">
                                                    {user.email}
                                                </p>
                                            </div>
                                            <p className="text-xs text-zinc-400 capitalize">
                                                {user.role ?? '\u2014'}
                                            </p>
                                            <StatusPill status={user.status} />
                                            <p className="font-mono text-xs text-zinc-500">
                                                {user.plan_label}
                                            </p>
                                            <Link
                                                href={
                                                    adminUsersShow(user.id).url
                                                }
                                                className="w-fit text-xs text-zinc-300 underline-offset-2 transition-colors hover:text-zinc-100 hover:underline"
                                            >
                                                Open
                                            </Link>
                                            <div className="flex justify-end">
                                                {user.can_impersonate ? (
                                                    <button
                                                        type="button"
                                                        className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-[0.625rem] font-medium text-zinc-300 transition-colors hover:bg-zinc-700 hover:text-white"
                                                        onClick={() =>
                                                            impersonate(user.id)
                                                        }
                                                        disabled={
                                                            processingUserId !==
                                                            null
                                                        }
                                                    >
                                                        <Eye className="h-3.5 w-3.5" />
                                                        {processingUserId ===
                                                        user.id
                                                            ? 'Starting...'
                                                            : 'Impersonate'}
                                                    </button>
                                                ) : (
                                                    <span className="text-[0.625rem] text-zinc-600 italic">
                                                        {user.is_current
                                                            ? 'Current'
                                                            : '-'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function MetricTile({
    label,
    value,
    caption = null,
    dashed = false,
}: {
    label: string;
    value: string;
    caption?: string | null;
    dashed?: boolean;
}) {
    return (
        <div
            className={`rounded-xl border px-4 py-4 ${
                dashed
                    ? 'border-dashed border-border bg-zinc-900/30 transition-colors hover:border-zinc-700 hover:bg-zinc-900/40'
                    : 'border-border bg-surface/50 transition-colors hover:border-zinc-700 hover:bg-zinc-800/30'
            }`}
        >
            <p className="text-[0.6875rem] tracking-wider text-zinc-500 uppercase">
                {label}
            </p>
            <p className="mt-4 font-mono text-4xl font-medium text-zinc-100">
                {value}
            </p>
            {caption !== null ? (
                <p className="mt-1 text-xs text-zinc-500">{caption}</p>
            ) : null}
        </div>
    );
}

function StatusPill({ status }: { status: string }) {
    const value = status.toLowerCase();
    const isActive = value === 'active';
    const isRejected = value === 'rejected';
    const isSuspended = value === 'suspended';

    return (
        <Badge
            className={`inline-flex items-center gap-1.5 border-transparent px-2 py-0.5 text-[0.625rem] font-medium tracking-wide uppercase ${
                isActive
                    ? 'bg-emerald-950/30 text-emerald-500'
                    : isRejected
                      ? 'bg-red-950/35 text-red-300'
                      : isSuspended
                        ? 'bg-zinc-800 text-zinc-300'
                      : 'bg-amber-950/35 text-amber-300'
            }`}
        >
            {isActive ? (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            ) : null}
            {value}
        </Badge>
    );
}
