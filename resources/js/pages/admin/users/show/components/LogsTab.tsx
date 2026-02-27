import { router } from '@inertiajs/react';
import { Eye, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { decodePaginationLabel } from '@/lib/pagination';
import type { ActivityLogItem, AdminUserShowPageProps, PaginatedLogs } from '../types';
import { formatDateTime } from '../utils';
import { EventBadge } from './EventBadge';

type LogsTabProps = {
    filters: AdminUserShowPageProps['filters'];
    scopeOptions: AdminUserShowPageProps['scopeOptions'];
    eventOptions: AdminUserShowPageProps['eventOptions'];
    logs: PaginatedLogs;
    safeLogMeta: NonNullable<PaginatedLogs['meta']>;
    updateFilters: (
        next: Partial<{
            scope: string;
            event: string | null;
            page: number;
            per_page: number;
        }>,
    ) => void;
    setSelectedLog: (log: ActivityLogItem) => void;
};

export function LogsTab({
    filters,
    scopeOptions,
    eventOptions,
    logs,
    safeLogMeta,
    updateFilters,
    setSelectedLog,
}: LogsTabProps) {
    return (
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
                                event: value === '__all__' ? null : value,
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
                            <SelectItem value="__all__">All events</SelectItem>
                            {eventOptions.map((eventOption) => (
                                <SelectItem key={eventOption} value={eventOption}>
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
                                per_page: Number.parseInt(value, 10),
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
                                    {formatDateTime(log.created_at)}
                                </p>
                                <EventBadge event={log.event} />
                                <p className="truncate text-xs text-zinc-400">
                                    {log.subject_label ?? 'Request'}
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
                                        onClick={() => setSelectedLog(log)}
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
                    Showing {safeLogMeta.from ?? 0}–{safeLogMeta.to ?? 0} of{' '}
                    {safeLogMeta.total}
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
                        >
                            {decodePaginationLabel(link.label)}
                        </button>
                    ))}
                </div>
            </div>
        </section>
    );
}
