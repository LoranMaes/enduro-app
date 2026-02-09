import { Head, Link, router } from '@inertiajs/react';
import { Eye, Search, Shield, UserRound, UsersRound } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { index as adminIndex } from '@/routes/admin';
import { start as startImpersonation } from '@/routes/admin/impersonate';
import {
    index as adminUsersIndex,
    show as adminUsersShow,
} from '@/routes/admin/users';
import type { BreadcrumbItem } from '@/types';

type AdminUserListItem = {
    id: number;
    name: string;
    email: string;
    role: string | null;
    status: string;
    plan_label: string;
    can_impersonate: boolean;
    is_current: boolean;
};

type AdminUsersPageProps = {
    users: AdminUserListItem[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Console',
        href: adminIndex().url,
    },
    {
        title: 'Users',
        href: adminUsersIndex().url,
    },
];

export default function AdminUsersIndex({ users }: AdminUsersPageProps) {
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
            <Head title="Users" />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <header className="flex flex-col gap-6 border-b border-border bg-background px-6 py-6 md:flex-row md:items-end md:justify-between">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-zinc-500" />
                            <p className="text-[11px] font-medium tracking-wide text-zinc-500 uppercase">
                                Directory
                            </p>
                        </div>
                        <h1 className="font-sans text-4xl font-medium text-zinc-100">
                            Users
                        </h1>
                    </div>

                    <div className="relative w-full md:w-80">
                        <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            disabled
                            className="w-full rounded-lg border border-border bg-surface py-2 pr-4 pl-9 text-sm text-zinc-300 placeholder:text-zinc-600"
                        />
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <section className="overflow-hidden rounded-xl border border-border bg-surface">
                        <div className="flex items-center justify-between border-b border-border px-6 py-3">
                            <h2 className="text-xl font-medium text-zinc-200">
                                All Users
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

                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_92px_132px] border-b border-border bg-zinc-900/40 px-6 py-2">
                            <p className="text-[10px] tracking-wider text-zinc-500 uppercase">
                                User
                            </p>
                            <p className="text-[10px] tracking-wider text-zinc-500 uppercase">
                                Role
                            </p>
                            <p className="text-[10px] tracking-wider text-zinc-500 uppercase">
                                Status
                            </p>
                            <p className="text-[10px] tracking-wider text-zinc-500 uppercase">
                                Plan
                            </p>
                            <p className="text-[10px] tracking-wider text-zinc-500 uppercase">
                                Detail
                            </p>
                            <p className="text-right text-[10px] tracking-wider text-zinc-500 uppercase">
                                Access
                            </p>
                        </div>

                        <div className="divide-y divide-border">
                            {users.length === 0 ? (
                                <p className="px-6 py-8 text-sm text-zinc-500">
                                    No users available.
                                </p>
                            ) : (
                                users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="grid grid-cols-[2fr_1fr_1fr_1fr_92px_132px] items-center gap-3 px-6 py-3 transition-colors hover:bg-zinc-800/30"
                                    >
                                        <div>
                                            <p className="text-sm font-medium text-zinc-200">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {user.email}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <RoleIcon role={user.role} />
                                            <p className="text-xs text-zinc-400 capitalize">
                                                {user.role ?? '\u2014'}
                                            </p>
                                        </div>
                                        <StatusPill status={user.status} />
                                        <p className="font-mono text-xs text-zinc-500">
                                            {user.plan_label}
                                        </p>
                                        <Link
                                            href={adminUsersShow(user.id).url}
                                            className="w-fit text-xs text-zinc-300 underline-offset-2 transition-colors hover:text-zinc-100 hover:underline"
                                        >
                                            Open
                                        </Link>
                                        <div className="flex justify-end">
                                            {user.can_impersonate ? (
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-[10px] font-medium text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white"
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
                                                <span className="text-xs text-zinc-500 italic">
                                                    {user.is_current
                                                        ? 'Current'
                                                        : '\u2014'}
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
        </AppLayout>
    );
}

function StatusPill({ status }: { status: string }) {
    const value = status.toLowerCase();
    const isActive = value === 'active';
    const isRejected = value === 'rejected';

    return (
        <div>
            <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wide uppercase ${
                    isActive
                        ? 'bg-emerald-950/30 text-emerald-500'
                        : isRejected
                          ? 'bg-red-950/35 text-red-300'
                          : 'bg-amber-950/35 text-amber-300'
                }`}
            >
                {isActive ? (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                ) : null}
                {value}
            </span>
        </div>
    );
}

function RoleIcon({ role }: { role: string | null }) {
    if (role === 'admin') {
        return <Shield className="h-3.5 w-3.5 text-zinc-500" />;
    }

    if (role === 'coach') {
        return <UsersRound className="h-3.5 w-3.5 text-zinc-500" />;
    }

    return <UserRound className="h-3.5 w-3.5 text-zinc-500" />;
}
