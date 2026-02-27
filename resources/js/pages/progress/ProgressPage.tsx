import { Head, usePage } from '@inertiajs/react';
import { FeatureLockedCard } from '@/components/feature-locked-card';
import AppLayout from '@/layouts/app-layout';
import type { SharedData } from '@/types';
import { ProgressHeader } from './components/ProgressHeader';
import { ProgressLoadTrendChart } from './components/ProgressLoadTrendChart';
import { PerformanceManagementChart } from './components/PerformanceManagementChart';
import { ProgressCompliancePanel } from './components/ProgressCompliancePanel';
import { ProgressSummaryCards } from './components/ProgressSummaryCards';
import { ProgressWeeklyLogs } from './components/ProgressWeeklyLogs';
import { progressBreadcrumbs } from './constants';
import { useProgressChartData } from './hooks/useProgressChartData';
import { usePerformanceManagementData } from './hooks/usePerformanceManagementData';
import { useProgressMetrics } from './hooks/useProgressMetrics';
import { useProgressState } from './hooks/useProgressState';
import type { ProgressPageProps } from './types';

export function ProgressPage({
    range,
    summary,
    weeks,
    compliance,
    load_metrics_enabled,
    trendSeedWeeks,
    todaySnapshot,
}: ProgressPageProps) {
    const { feature_access: featureAccess = {} } = usePage<SharedData>().props;
    const canViewLoadTrend =
        featureAccess['progress.chart.load_trend'] ?? true;
    const canViewPerformanceManagement =
        featureAccess['progress.chart.performance_management'] ?? true;
    const { isSwitchingRange, hoveredIndex, setHoveredIndex, switchRange } =
        useProgressState(range.weeks);

    const trend = useProgressChartData(weeks, trendSeedWeeks);
    const performanceLoad = usePerformanceManagementData(
        weeks,
        load_metrics_enabled && canViewPerformanceManagement,
    );

    const { hasVisibleLoadData, activePointIndex, activePoint } = useProgressMetrics(
        weeks,
        trend,
        hoveredIndex,
    );

    return (
        <AppLayout breadcrumbs={progressBreadcrumbs}>
            <Head title="Training Progress" />

            <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background">
                <ProgressHeader
                    range={range}
                    summary={summary}
                    isSwitchingRange={isSwitchingRange}
                    onSwitchRange={switchRange}
                />

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                    {load_metrics_enabled ? (
                        <>
                            {canViewLoadTrend ? (
                                <ProgressLoadTrendChart
                                    summary={summary}
                                    trend={trend}
                                    hasVisibleLoadData={hasVisibleLoadData}
                                    activePointIndex={activePointIndex}
                                    activePoint={activePoint}
                                    weeksCount={weeks.length}
                                    todaySnapshot={todaySnapshot}
                                    onSetHoveredIndex={setHoveredIndex}
                                />
                            ) : (
                                <FeatureLockedCard
                                    title="Load Trend"
                                    description="Load trend is available with an active subscription."
                                />
                            )}
                            {canViewPerformanceManagement ? (
                                <PerformanceManagementChart
                                    data={performanceLoad.data}
                                    loading={performanceLoad.loading}
                                    error={performanceLoad.error}
                                    selectedWeeks={range.weeks}
                                />
                            ) : (
                                <FeatureLockedCard
                                    title="Performance Management"
                                    description="Performance management metrics require an active subscription."
                                />
                            )}
                        </>
                    ) : null}

                    <ProgressSummaryCards
                        consistencyWeeks={summary.consistency_weeks}
                        selectedRangeWeeks={range.weeks}
                        currentStreakWeeks={summary.current_streak_weeks}
                    />

                    <ProgressCompliancePanel compliance={compliance} />

                    <ProgressWeeklyLogs weeks={weeks} />
                </div>
            </div>
        </AppLayout>
    );
}
