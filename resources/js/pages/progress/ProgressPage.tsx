import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ProgressHeader } from './components/ProgressHeader';
import { ProgressLoadTrendChart } from './components/ProgressLoadTrendChart';
import { ProgressSummaryCards } from './components/ProgressSummaryCards';
import { ProgressWeeklyLogs } from './components/ProgressWeeklyLogs';
import { progressBreadcrumbs } from './constants';
import { useProgressChartData } from './hooks/useProgressChartData';
import { useProgressMetrics } from './hooks/useProgressMetrics';
import { useProgressState } from './hooks/useProgressState';
import type { ProgressPageProps } from './types';

export function ProgressPage({ range, summary, weeks }: ProgressPageProps) {
    const { isSwitchingRange, hoveredIndex, setHoveredIndex, switchRange } =
        useProgressState(range.weeks);

    const trend = useProgressChartData(weeks);

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
                    <ProgressLoadTrendChart
                        summary={summary}
                        trend={trend}
                        hasVisibleLoadData={hasVisibleLoadData}
                        activePointIndex={activePointIndex}
                        activePoint={activePoint}
                        weeksCount={weeks.length}
                        onSetHoveredIndex={setHoveredIndex}
                    />

                    <ProgressSummaryCards
                        consistencyWeeks={summary.consistency_weeks}
                        selectedRangeWeeks={range.weeks}
                        currentStreakWeeks={summary.current_streak_weeks}
                    />

                    <ProgressWeeklyLogs weeks={weeks} />
                </div>
            </div>
        </AppLayout>
    );
}
