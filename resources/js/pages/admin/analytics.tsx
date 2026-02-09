import { Head, router } from '@inertiajs/react';
import { Activity, BarChart3, Shield } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { index as adminIndex } from '@/routes/admin';
import type { BreadcrumbItem } from '@/types';

type AnalyticsRange = {
    selected: string;
    options: string[];
    weeks: number;
    start: string;
    end: string;
};

type UserGrowth = {
    labels: string[];
    totals: number[];
    athletes: number[];
    coaches: number[];
    current: {
        total: number;
        athletes: number;
        coaches: number;
    };
};

type AdminAnalyticsPageProps = {
    range: AnalyticsRange;
    userGrowth: UserGrowth;
    coachPipeline: {
        pending: number;
        approved: number;
        rejected: number;
        submitted_in_range: number;
        reviewed_in_range: number;
    };
    platformUsage: {
        planned_sessions: number;
        completed_sessions: number;
        linked_sessions: number;
        synced_activities: number;
        active_athletes: number;
        completion_rate: number;
    };
    syncHealth: {
        connected_accounts: number;
        queued_or_running: number;
        success_runs: number;
        failed_runs: number;
        rate_limited_runs: number;
        success_rate: number;
    };
    moderation: {
        suspended_total: number;
        suspended_in_range: number;
        pending_coach_applications: number;
        recent_suspensions: Array<{
            id: number;
            name: string;
            email: string;
            suspended_at: string | null;
            reason: string | null;
        }>;
    };
    systemOps: {
        queue_backlog: number;
        failed_jobs_24h: number;
        webhook_events_24h: number;
        webhook_failed_24h: number;
        mutating_requests_24h: number;
    };
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Admin Console',
        href: adminIndex().url,
    },
    {
        title: 'Analytics',
        href: '/admin/analytics',
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
    const [enabledSeries, setEnabledSeries] = useState({
        totals: true,
        athletes: true,
        coaches: true,
    });
    const [isSwitchingRange, setIsSwitchingRange] = useState(false);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const chart = useMemo(() => {
        const series = [
            enabledSeries.totals ? userGrowth.totals : [],
            enabledSeries.athletes ? userGrowth.athletes : [],
            enabledSeries.coaches ? userGrowth.coaches : [],
        ].flat();

        const maxValue = Math.max(1, ...series);
        const width = 980;
        const height = 280;
        const paddingX = 42;
        const paddingY = 26;
        const innerWidth = width - paddingX * 2;
        const innerHeight = height - paddingY * 2;
        const stepX =
            userGrowth.labels.length > 1
                ? innerWidth / (userGrowth.labels.length - 1)
                : innerWidth;

        const buildPath = (values: number[]): string => {
            return values
                .map((value, index) => {
                    const x = paddingX + index * stepX;
                    const y = paddingY + innerHeight - (value / maxValue) * innerHeight;

                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                })
                .join(' ');
        };

        const buildPoints = (values: number[]): Array<{ x: number; y: number }> => {
            return values.map((value, index) => ({
                x: paddingX + index * stepX,
                y: paddingY + innerHeight - (value / maxValue) * innerHeight,
            }));
        };

        const totalPoints = buildPoints(userGrowth.totals);
        const athletePoints = buildPoints(userGrowth.athletes);
        const coachPoints = buildPoints(userGrowth.coaches);

        return {
            width,
            height,
            paddingX,
            paddingY,
            stepX,
            innerHeight,
            maxValue,
            totalPoints,
            athletePoints,
            coachPoints,
            buildPath,
            buildPoints,
        };
    }, [enabledSeries, userGrowth]);

    const activePointIndex =
        hoveredIndex === null
            ? Math.max(0, userGrowth.labels.length - 1)
            : hoveredIndex;
    const activeLabel = userGrowth.labels[activePointIndex] ?? '—';
    const activeTotal = userGrowth.totals[activePointIndex] ?? 0;
    const activeAthletes = userGrowth.athletes[activePointIndex] ?? 0;
    const activeCoaches = userGrowth.coaches[activePointIndex] ?? 0;

    const switchRange = (nextRange: string): void => {
        if (nextRange === range.selected || isSwitchingRange) {
            return;
        }

        setIsSwitchingRange(true);

        router.get(
            '/admin/analytics',
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

    const toggleSeries = (seriesKey: 'totals' | 'athletes' | 'coaches'): void => {
        setEnabledSeries((current) => ({
            ...current,
            [seriesKey]: !current[seriesKey],
        }));
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
                                <p className="text-[11px] tracking-wider text-zinc-500 uppercase">
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

                        <section className="rounded-xl border border-border bg-surface p-5">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-lg font-medium text-zinc-100">
                                    User Growth
                                </h2>
                                <div className="flex flex-wrap items-center gap-2">
                                    <SeriesToggle
                                        label="Total"
                                        enabled={enabledSeries.totals}
                                        onClick={() => toggleSeries('totals')}
                                        colorClass="border-zinc-500 bg-zinc-300"
                                    />
                                    <SeriesToggle
                                        label="Athletes"
                                        enabled={enabledSeries.athletes}
                                        onClick={() => toggleSeries('athletes')}
                                        colorClass="border-sky-400 bg-sky-400"
                                    />
                                    <SeriesToggle
                                        label="Coaches"
                                        enabled={enabledSeries.coaches}
                                        onClick={() => toggleSeries('coaches')}
                                        colorClass="border-violet-400 bg-violet-400"
                                    />
                                </div>
                            </div>

                            <div className="relative h-72 overflow-hidden rounded-lg border border-border/70 bg-background/70">
                                <div className="pointer-events-none absolute top-3 right-3 z-10 rounded-md border border-zinc-800 bg-zinc-950/85 px-2.5 py-1.5 text-[11px]">
                                    <p className="text-zinc-400">{activeLabel}</p>
                                    <div className="mt-1 flex items-center gap-2 text-zinc-300">
                                        <span className="text-zinc-500">T</span>
                                        <span className="font-mono">{activeTotal}</span>
                                        <span className="text-sky-300">A</span>
                                        <span className="font-mono text-sky-200">
                                            {activeAthletes}
                                        </span>
                                        <span className="text-violet-300">C</span>
                                        <span className="font-mono text-violet-200">
                                            {activeCoaches}
                                        </span>
                                    </div>
                                </div>
                                <svg
                                    viewBox={`0 0 ${chart.width} ${chart.height}`}
                                    className="h-full w-full"
                                    preserveAspectRatio="xMidYMid meet"
                                    role="img"
                                    aria-label="User growth chart"
                                    onMouseLeave={() => setHoveredIndex(null)}
                                >
                                    {Array.from({ length: 5 }, (_, index) => {
                                        const y =
                                            chart.paddingY +
                                            (chart.innerHeight / 4) * index;

                                        return (
                                            <line
                                                key={`grid-${index}`}
                                                x1={chart.paddingX}
                                                y1={y}
                                                x2={chart.width - chart.paddingX}
                                                y2={y}
                                                stroke="rgba(39,39,42,0.7)"
                                                strokeWidth={1}
                                            />
                                        );
                                    })}

                                    {userGrowth.labels.map((label, index) => {
                                        const point = chart.totalPoints[index];

                                        if (point === undefined) {
                                            return null;
                                        }

                                        const hitWidth =
                                            userGrowth.labels.length > 1
                                                ? Math.max(16, chart.stepX)
                                                : chart.width - chart.paddingX * 2;
                                        const startX = Math.max(
                                            chart.paddingX,
                                            point.x - hitWidth / 2,
                                        );
                                        const maxStartX =
                                            chart.width - chart.paddingX - hitWidth;

                                        return (
                                            <rect
                                                key={`hover-hit-${label}`}
                                                x={Math.min(startX, maxStartX)}
                                                y={chart.paddingY}
                                                width={hitWidth}
                                                height={chart.innerHeight}
                                                fill="transparent"
                                                onMouseEnter={() =>
                                                    setHoveredIndex(index)
                                                }
                                            />
                                        );
                                    })}

                                    {enabledSeries.totals ? (
                                        <>
                                            <path
                                                d={chart.buildPath(userGrowth.totals)}
                                                fill="none"
                                                stroke="rgb(212,212,216)"
                                                strokeWidth={2}
                                            />
                                            {chart
                                                .buildPoints(userGrowth.totals)
                                                .map((point, index) => (
                                                    <circle
                                                        key={`total-${index}`}
                                                        cx={point.x}
                                                        cy={point.y}
                                                        r={2.5}
                                                        fill="rgb(212,212,216)"
                                                    />
                                                ))}
                                        </>
                                    ) : null}

                                    {enabledSeries.athletes ? (
                                        <path
                                            d={chart.buildPath(userGrowth.athletes)}
                                            fill="none"
                                            stroke="rgb(56,189,248)"
                                            strokeWidth={2}
                                        />
                                    ) : null}

                                    {enabledSeries.coaches ? (
                                        <path
                                            d={chart.buildPath(userGrowth.coaches)}
                                            fill="none"
                                            stroke="rgb(167,139,250)"
                                            strokeWidth={2}
                                            />
                                    ) : null}

                                    {(() => {
                                        const focusPoint =
                                            chart.totalPoints[activePointIndex];

                                        if (focusPoint === undefined) {
                                            return null;
                                        }

                                        return (
                                            <line
                                                x1={focusPoint.x}
                                                y1={chart.paddingY}
                                                x2={focusPoint.x}
                                                y2={
                                                    chart.paddingY +
                                                    chart.innerHeight
                                                }
                                                stroke="rgba(113,113,122,0.6)"
                                                strokeWidth={1}
                                                strokeDasharray="3 3"
                                            />
                                        );
                                    })()}

                                    {enabledSeries.totals &&
                                    chart.totalPoints[activePointIndex] !==
                                        undefined ? (
                                        <circle
                                            cx={
                                                chart.totalPoints[activePointIndex]
                                                    .x
                                            }
                                            cy={
                                                chart.totalPoints[activePointIndex]
                                                    .y
                                            }
                                            r={4}
                                            fill="rgb(212,212,216)"
                                            stroke="rgb(9,9,11)"
                                            strokeWidth={1.5}
                                        />
                                    ) : null}

                                    {enabledSeries.athletes &&
                                    chart.athletePoints[activePointIndex] !==
                                        undefined ? (
                                        <circle
                                            cx={
                                                chart.athletePoints[
                                                    activePointIndex
                                                ].x
                                            }
                                            cy={
                                                chart.athletePoints[
                                                    activePointIndex
                                                ].y
                                            }
                                            r={4}
                                            fill="rgb(56,189,248)"
                                            stroke="rgb(9,9,11)"
                                            strokeWidth={1.5}
                                        />
                                    ) : null}

                                    {enabledSeries.coaches &&
                                    chart.coachPoints[activePointIndex] !==
                                        undefined ? (
                                        <circle
                                            cx={
                                                chart.coachPoints[
                                                    activePointIndex
                                                ].x
                                            }
                                            cy={
                                                chart.coachPoints[
                                                    activePointIndex
                                                ].y
                                            }
                                            r={4}
                                            fill="rgb(167,139,250)"
                                            stroke="rgb(9,9,11)"
                                            strokeWidth={1.5}
                                        />
                                    ) : null}

                                    <text
                                        x={chart.paddingX}
                                        y={chart.paddingY - 8}
                                        fill="rgb(113,113,122)"
                                        fontSize={11}
                                    >
                                        {chart.maxValue}
                                    </text>

                                    {userGrowth.labels.map((label, index) => {
                                        const x =
                                            chart.paddingX +
                                            index *
                                                (userGrowth.labels.length > 1
                                                    ? (chart.width - chart.paddingX * 2) /
                                                      (userGrowth.labels.length - 1)
                                                    : 0);
                                        const shouldShow =
                                            userGrowth.labels.length <= 8 ||
                                            index % Math.ceil(userGrowth.labels.length / 6) === 0 ||
                                            index === userGrowth.labels.length - 1;

                                        if (!shouldShow) {
                                            return null;
                                        }

                                        return (
                                            <text
                                                key={label}
                                                x={x}
                                                y={chart.height - 8}
                                                textAnchor="middle"
                                                fill="rgb(113,113,122)"
                                                fontSize={10}
                                            >
                                                {label}
                                            </text>
                                        );
                                    })}
                                </svg>
                            </div>
                        </section>

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
                                        <p className="text-[11px] tracking-wide text-zinc-500 uppercase">
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

function MetricCard({
    label,
    value,
    accent,
}: {
    label: string;
    value: string;
    accent: string;
}) {
    return (
        <div className="rounded-xl border border-border bg-surface px-4 py-4">
            <p className="text-[11px] tracking-wide text-zinc-500 uppercase">{label}</p>
            <p className={`mt-2 font-mono text-3xl ${accent}`}>{value}</p>
        </div>
    );
}

function SeriesToggle({
    label,
    enabled,
    onClick,
    colorClass,
}: {
    label: string;
    enabled: boolean;
    onClick: () => void;
    colorClass: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1 text-[11px] transition-colors ${
                enabled
                    ? 'border-zinc-700 bg-zinc-800 text-zinc-100'
                    : 'border-border text-zinc-500 hover:bg-zinc-900/60'
            }`}
        >
            <span className={`h-2 w-2 rounded-full ${colorClass}`} />
            {label}
        </button>
    );
}

function StatsCard({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <div className="rounded-xl border border-border bg-surface p-5">
            <h3 className="mb-3 text-base font-medium text-zinc-100">{title}</h3>
            <div className="space-y-2">{children}</div>
        </div>
    );
}

function StatLine({ label, value }: { label: string; value: number | string }) {
    return (
        <div className="flex items-center justify-between border-b border-border/70 py-1.5 last:border-b-0">
            <span className="text-xs text-zinc-500">{label}</span>
            <span className="font-mono text-xs text-zinc-200">{value}</span>
        </div>
    );
}

function MiniMetric({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-md border border-border bg-background/50 px-3 py-2">
            <p className="text-[10px] tracking-wide text-zinc-500 uppercase">{label}</p>
            <p className="mt-1 font-mono text-lg text-zinc-100">{value}</p>
        </div>
    );
}

function formatDateTime(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString();
}
