import { Head, router } from '@inertiajs/react';
import { Activity, BarChart3, Shield } from 'lucide-react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { analytics as adminAnalytics, index as adminIndex } from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';
import { MetricCard } from './analytics/components/MetricCard';
import { MiniMetric } from './analytics/components/MiniMetric';
import { StatLine } from './analytics/components/StatLine';
import { StatsCard } from './analytics/components/StatsCard';
import { UserGrowthSection } from './analytics/components/UserGrowthSection';
import { useAdminAnalyticsChart } from './analytics/hooks/useAdminAnalyticsChart';
import type { AdminAnalyticsPageProps } from './analytics/types';
import { formatDateTime } from './analytics/utils';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Console',
        href: adminIndex().url,
    },
    {
        title: 'Analytics',
        href: adminAnalytics().url,
    },
];

export default function AdminAnalytics({
    range,
    userGrowth,
    coachPipeline,
    platformUsage,
    syncHealth,
    moderation,
    systemOps,
}: AdminAnalyticsPageProps) {
    const [isSwitchingRange, setIsSwitchingRange] = useState(false);
    const chartState = useAdminAnalyticsChart(userGrowth);

    const switchRange = (nextRange: string): void => {
        if (nextRange === range.selected || isSwitchingRange) {
            return;
        }

        setIsSwitchingRange(true);

        const route = adminAnalytics();

        router.get(
            route.url,
            { range: nextRange },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => {
                    setIsSwitchingRange(false);
                },
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Admin Analytics" />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <header className="border-b border-border px-6 py-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="h-4 w-4 text-zinc-500" />
                                <p className="text-[0.6875rem] tracking-wider text-zinc-500 uppercase">
                                    Admin Reporting
                                </p>
                            </div>
                            <h1 className="mt-1 text-4xl font-medium text-zinc-100">
                                Analytics
                            </h1>
                            <p className="mt-2 text-xs text-zinc-500">
                                Range: {formatDateTime(range.start)} - {formatDateTime(range.end)}
                            </p>
                        </div>

                        <div className="flex items-center rounded-xl border border-border bg-surface/50 p-1">
                            {range.options.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => switchRange(option)}
                                    disabled={isSwitchingRange}
                                    className={`min-w-12 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                        option === range.selected
                                            ? 'bg-zinc-800 text-zinc-100'
                                            : 'text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300'
                                    }`}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto px-6 py-6">
                    <div className="space-y-6">
                        <section className="grid gap-4 md:grid-cols-3">
                            <MetricCard
                                label="Total Users"
                                value={userGrowth.current.total.toString()}
                                accent="text-zinc-100"
                            />
                            <MetricCard
                                label="Athletes"
                                value={userGrowth.current.athletes.toString()}
                                accent="text-sky-300"
                            />
                            <MetricCard
                                label="Coaches"
                                value={userGrowth.current.coaches.toString()}
                                accent="text-violet-300"
                            />
                        </section>

                        <UserGrowthSection
                            userGrowth={userGrowth}
                            chartState={chartState}
                        />

                        <section className="grid gap-4 xl:grid-cols-3">
                            <StatsCard title="Coach Pipeline">
                                <StatLine label="Pending" value={coachPipeline.pending} />
                                <StatLine label="Approved" value={coachPipeline.approved} />
                                <StatLine label="Rejected" value={coachPipeline.rejected} />
                                <StatLine
                                    label="Submitted in range"
                                    value={coachPipeline.submitted_in_range}
                                />
                                <StatLine
                                    label="Reviewed in range"
                                    value={coachPipeline.reviewed_in_range}
                                />
                            </StatsCard>

                            <StatsCard title="Platform Usage">
                                <StatLine
                                    label="Planned sessions"
                                    value={platformUsage.planned_sessions}
                                />
                                <StatLine
                                    label="Completed sessions"
                                    value={platformUsage.completed_sessions}
                                />
                                <StatLine
                                    label="Linked sessions"
                                    value={platformUsage.linked_sessions}
                                />
                                <StatLine
                                    label="Synced activities"
                                    value={platformUsage.synced_activities}
                                />
                                <StatLine
                                    label="Active athletes"
                                    value={platformUsage.active_athletes}
                                />
                                <StatLine
                                    label="Completion rate"
                                    value={`${platformUsage.completion_rate}%`}
                                />
                            </StatsCard>

                            <StatsCard title="Sync Health">
                                <StatLine
                                    label="Connected accounts"
                                    value={syncHealth.connected_accounts}
                                />
                                <StatLine
                                    label="Queued / running"
                                    value={syncHealth.queued_or_running}
                                />
                                <StatLine
                                    label="Successful runs"
                                    value={syncHealth.success_runs}
                                />
                                <StatLine label="Failed runs" value={syncHealth.failed_runs} />
                                <StatLine
                                    label="Rate limited"
                                    value={syncHealth.rate_limited_runs}
                                />
                                <StatLine
                                    label="Success rate"
                                    value={`${syncHealth.success_rate}%`}
                                />
                            </StatsCard>
                        </section>

                        <section className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                            <div className="rounded-xl border border-border bg-surface p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-zinc-500" />
                                    <h2 className="text-base font-medium text-zinc-100">
                                        Moderation
                                    </h2>
                                </div>

                                <div className="grid gap-2 sm:grid-cols-3">
                                    <MiniMetric
                                        label="Suspended (total)"
                                        value={moderation.suspended_total}
                                    />
                                    <MiniMetric
                                        label="Suspended (range)"
                                        value={moderation.suspended_in_range}
                                    />
                                    <MiniMetric
                                        label="Pending coach applications"
                                        value={moderation.pending_coach_applications}
                                    />
                                </div>

                                <div className="mt-5 overflow-hidden rounded-lg border border-border">
                                    <div className="border-b border-border bg-zinc-900/40 px-3 py-2">
                                        <p className="text-[0.6875rem] tracking-wide text-zinc-500 uppercase">
                                            Recent Suspensions
                                        </p>
                                    </div>
                                    <div className="divide-y divide-border">
                                        {moderation.recent_suspensions.length === 0 ? (
                                            <p className="px-3 py-4 text-sm text-zinc-500">
                                                No suspended users.
                                            </p>
                                        ) : (
                                            moderation.recent_suspensions.map((record) => (
                                                <div
                                                    key={record.id}
                                                    className="space-y-1 px-3 py-2.5"
                                                >
                                                    <p className="text-sm font-medium text-zinc-200">
                                                        {record.name}
                                                    </p>
                                                    <p className="text-xs text-zinc-500">
                                                        {record.email}
                                                    </p>
                                                    <p className="text-xs text-zinc-400">
                                                        {record.reason?.trim() !== ''
                                                            ? record.reason
                                                            : 'No reason recorded.'}
                                                    </p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-border bg-surface p-5">
                                <div className="mb-4 flex items-center gap-2">
                                    <Activity className="h-4 w-4 text-zinc-500" />
                                    <h2 className="text-base font-medium text-zinc-100">
                                        System Ops (24h)
                                    </h2>
                                </div>
                                <div className="space-y-2">
                                    <StatLine label="Queue backlog" value={systemOps.queue_backlog} />
                                    <StatLine
                                        label="Failed jobs"
                                        value={systemOps.failed_jobs_24h}
                                    />
                                    <StatLine
                                        label="Webhook events"
                                        value={systemOps.webhook_events_24h}
                                    />
                                    <StatLine
                                        label="Webhook failures"
                                        value={systemOps.webhook_failed_24h}
                                    />
                                    <StatLine
                                        label="Mutating requests"
                                        value={systemOps.mutating_requests_24h}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
