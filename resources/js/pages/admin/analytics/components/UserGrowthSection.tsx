import { SeriesToggle } from './SeriesToggle';
import { UserGrowthChart } from './UserGrowthChart';
import type { UseAdminAnalyticsChartResult } from '../hooks/useAdminAnalyticsChart';
import type { UserGrowth } from '../types';

type UserGrowthSectionProps = {
    userGrowth: UserGrowth;
    chartState: UseAdminAnalyticsChartResult;
};

export function UserGrowthSection({
    userGrowth,
    chartState,
}: UserGrowthSectionProps) {
    return (
        <section className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-medium text-zinc-100">User Growth</h2>
                <div className="flex flex-wrap items-center gap-2">
                    <SeriesToggle
                        label="Total"
                        enabled={chartState.enabledSeries.totals}
                        onClick={() => chartState.toggleSeries('totals')}
                        colorClass="border-zinc-500 bg-zinc-300"
                    />
                    <SeriesToggle
                        label="Athletes"
                        enabled={chartState.enabledSeries.athletes}
                        onClick={() => chartState.toggleSeries('athletes')}
                        colorClass="border-sky-400 bg-sky-400"
                    />
                    <SeriesToggle
                        label="Coaches"
                        enabled={chartState.enabledSeries.coaches}
                        onClick={() => chartState.toggleSeries('coaches')}
                        colorClass="border-violet-400 bg-violet-400"
                    />
                </div>
            </div>

            <UserGrowthChart
                userGrowth={userGrowth}
                chart={chartState.chart}
                enabledSeries={chartState.enabledSeries}
                hoveredIndex={chartState.hoveredIndex}
                activePointIndex={chartState.activePointIndex}
                activeLabel={chartState.activeLabel}
                activeTotal={chartState.activeTotal}
                activeAthletes={chartState.activeAthletes}
                activeCoaches={chartState.activeCoaches}
                setHoveredIndex={chartState.setHoveredIndex}
            />
        </section>
    );
}
