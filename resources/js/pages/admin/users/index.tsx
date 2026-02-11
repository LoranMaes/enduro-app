import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowDownAZ,
    ArrowUpAZ,
    Eye,
    Search,
    Shield,
    UserRound,
    UsersRound,
} from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    created_at: string | null;
    can_impersonate: boolean;
    is_current: boolean;
};

type PaginatedUsers = {
    data: AdminUserListItem[];
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

type Option = {
    value: string;
    label: string;
};

type AdminUsersPageProps = {
    users: PaginatedUsers;
    filters: {
        search: string;
        role: string;
        status: string;
        sort: 'name' | 'email' | 'role' | 'status' | 'created_at' | string;
        direction: 'asc' | 'desc' | string;
        per_page: number;
    };
    roleOptions: Option[];
    statusOptions: Option[];
    sortOptions: Option[];
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

export default function AdminUsersIndex({
    users,
    filters,
    roleOptions,
    statusOptions,
    sortOptions,
}: AdminUsersPageProps) {
    const [processingUserId, setProcessingUserId] = useState<number | null>(
        null,
    );
    const [searchQuery, setSearchQuery] = useState(filters.search);

    const queryState = useMemo(
        () => ({
            search: filters.search,
            role: filters.role,
            status: filters.status,
            sort: filters.sort,
            direction: filters.direction,
            per_page: filters.per_page,
        }),
        [filters],
    );

    const updateTable = (
        next: Partial<{
            search: string;
            role: string;
            status: string;
            sort: string;
            direction: string;
            page: number;
            per_page: number;
        }>,
    ): void => {
        router.get(
            adminUsersIndex().url,
            {
                search:
                    next.search !== undefined ? next.search : queryState.search,
                role: next.role ?? queryState.role,
                status: next.status ?? queryState.status,
                sort: next.sort ?? queryState.sort,
                direction: next.direction ?? queryState.direction,
                per_page: next.per_page ?? queryState.per_page,
                page: next.page ?? 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            },
        );
    };

    const submitSearch = (event: FormEvent<HTMLFormElement>): void => {
        event.preventDefault();
        updateTable({ search: searchQuery, page: 1 });
    };

    const toggleSort = (column: string): void => {
        if (filters.sort === column) {
            updateTable({
                sort: column,
                direction: filters.direction === 'asc' ? 'desc' : 'asc',
                page: 1,
            });

            return;
        }

        updateTable({
            sort: column,
            direction: column === 'created_at' ? 'desc' : 'asc',
            page: 1,
        });
    };

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
                            <p className="text-[0.6875rem] font-medium tracking-wide text-zinc-500 uppercase">
                                Directory
                            </p>
                        </div>
                        <h1 className="font-sans text-4xl font-medium text-zinc-100">
                            Users
                        </h1>
                    </div>

                    <form onSubmit={submitSearch} className="relative w-full md:w-96">
                        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search users..."
                            className="w-full rounded-lg border border-border bg-surface py-2 pr-4 pl-9 text-sm text-zinc-300 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                        />
                    </form>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <section className="overflow-hidden rounded-xl border border-border bg-surface">
                        <div className="flex flex-wrap items-end gap-3 border-b border-border px-6 py-3">
                            <div className="space-y-1">
                                <label
                                    htmlFor="role-filter"
                                    className="text-[0.625rem] tracking-wide text-zinc-500 uppercase"
                                >
                                    Role
                                </label>
                                <Select
                                    value={filters.role}
                                    onValueChange={(value) =>
                                        updateTable({
                                            role: value,
                                            page: 1,
                                        })
                                    }
                                >
                                    <SelectTrigger
                                        id="role-filter"
                                        className="h-9 rounded-md border-border bg-background text-xs text-zinc-200"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roleOptions.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label
                                    htmlFor="status-filter"
                                    className="text-[0.625rem] tracking-wide text-zinc-500 uppercase"
                                >
                                    Status
                                </label>
                                <Select
                                    value={filters.status}
                                    onValueChange={(value) =>
                                        updateTable({
                                            status: value,
                                            page: 1,
                                        })
                                    }
                                >
                                    <SelectTrigger
                                        id="status-filter"
                                        className="h-9 rounded-md border-border bg-background text-xs text-zinc-200"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-1">
                                <label
                                    htmlFor="sort-filter"
                                    className="text-[0.625rem] tracking-wide text-zinc-500 uppercase"
                                >
                                    Sort
                                </label>
                                <Select
                                    value={filters.sort}
                                    onValueChange={(value) =>
                                        updateTable({
                                            sort: value,
                                            page: 1,
                                        })
                                    }
                                >
                                    <SelectTrigger
                                        id="sort-filter"
                                        className="h-9 rounded-md border-border bg-background text-xs text-zinc-200"
                                    >
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {sortOptions.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    updateTable({
                                        direction:
                                            filters.direction === 'asc'
                                                ? 'desc'
                                                : 'asc',
                                        page: 1,
                                    })
                                }
                                className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs text-zinc-300 transition-colors hover:bg-zinc-900/70"
                            >
                                {filters.direction === 'asc' ? (
                                    <ArrowUpAZ className="h-3.5 w-3.5" />
                                ) : (
                                    <ArrowDownAZ className="h-3.5 w-3.5" />
                                )}
                                {filters.direction.toUpperCase()}
                            </button>

                            <div className="ml-auto space-y-1">
                                <label
                                    htmlFor="rows-filter"
                                    className="text-[0.625rem] tracking-wide text-zinc-500 uppercase"
                                >
                                    Rows
                                </label>
                                <Select
                                    value={String(filters.per_page)}
                                    onValueChange={(value) =>
                                        updateTable({
                                            per_page: Number.parseInt(value, 10),
                                            page: 1,
                                        })
                                    }
                                >
                                    <SelectTrigger
                                        id="rows-filter"
                                        className="h-9 rounded-md border-border bg-background text-xs text-zinc-200"
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
                        </div>

                        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_5rem_8.25rem] border-b border-border bg-zinc-900/40 px-6 py-2">
                            <HeaderCell label="User" onClick={() => toggleSort('name')} />
                            <HeaderCell label="Role" onClick={() => toggleSort('role')} />
                            <HeaderCell label="Status" onClick={() => toggleSort('status')} />
                            <HeaderCell label="Plan" />
                            <HeaderCell
                                label="Created at"
                                onClick={() => toggleSort('created_at')}
                            />
                            <HeaderCell label="Detail" />
                            <p className="text-right text-[0.625rem] tracking-wider text-zinc-500 uppercase">
                                Access
                            </p>
                        </div>

                        <div className="divide-y divide-border">
                            {users.data.length === 0 ? (
                                <p className="px-6 py-8 text-sm text-zinc-500">
                                    No users match the selected filters.
                                </p>
                            ) : (
                                users.data.map((user) => (
                                    <div
                                        key={user.id}
                                        className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_5rem_8.25rem] items-center gap-3 px-6 py-3 transition-colors hover:bg-zinc-800/30"
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
                                        <p className="text-xs text-zinc-500">
                                            {formatDate(user.created_at)}
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
                                                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-[0.625rem] font-medium text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white"
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

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs text-zinc-500">
                            Showing {users.meta.from ?? 0}-{users.meta.to ?? 0}{' '}
                            of {users.meta.total}
                        </p>
                        <div className="flex items-center gap-1">
                            {users.links.map((link, index) => (
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
                </div>
            </div>
        </AppLayout>
    );
}

function HeaderCell({
    label,
    onClick,
}: {
    label: string;
    onClick?: () => void;
}) {
    if (onClick === undefined) {
        return (
            <p className="text-[0.625rem] tracking-wider text-zinc-500 uppercase">
                {label}
            </p>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="w-fit text-left text-[0.625rem] tracking-wider text-zinc-500 uppercase transition-colors hover:text-zinc-200"
        >
            {label}
        </button>
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

function RoleIcon({ role }: { role: string | null }) {
    if (role === 'admin') {
        return <Shield className="h-3.5 w-3.5 text-zinc-500" />;
    }

    if (role === 'coach') {
        return <UsersRound className="h-3.5 w-3.5 text-zinc-500" />;
    }

    return <UserRound className="h-3.5 w-3.5 text-zinc-500" />;
}

function formatDate(value: string | null): string {
    if (value === null) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString();
}
