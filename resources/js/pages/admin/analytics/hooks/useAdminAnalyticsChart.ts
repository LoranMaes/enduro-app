import { useMemo, useState } from 'react';
import type {
    AnalyticsSeriesKey,
    AnalyticsSeriesState,
    UserGrowth,
} from '../types';

type ChartPoint = { x: number; y: number };

export type AnalyticsChartData = {
    width: number;
    height: number;
    paddingX: number;
    paddingY: number;
    stepX: number;
    innerHeight: number;
    maxValue: number;
    totalPoints: ChartPoint[];
    athletePoints: ChartPoint[];
    coachPoints: ChartPoint[];
    buildPath: (values: number[]) => string;
    buildPoints: (values: number[]) => ChartPoint[];
};

export type UseAdminAnalyticsChartResult = {
    enabledSeries: AnalyticsSeriesState;
    hoveredIndex: number | null;
    activePointIndex: number;
    activeLabel: string;
    activeTotal: number;
    activeAthletes: number;
    activeCoaches: number;
    chart: AnalyticsChartData;
    setHoveredIndex: (index: number | null) => void;
    toggleSeries: (seriesKey: AnalyticsSeriesKey) => void;
};

export function useAdminAnalyticsChart(
    userGrowth: UserGrowth,
): UseAdminAnalyticsChartResult {
    const [enabledSeries, setEnabledSeries] = useState<AnalyticsSeriesState>({
        totals: true,
        athletes: true,
        coaches: true,
    });
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const chart = useMemo<AnalyticsChartData>(() => {
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

        const buildPoints = (values: number[]): ChartPoint[] => {
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

    const toggleSeries = (seriesKey: AnalyticsSeriesKey): void => {
        setEnabledSeries((current) => ({
            ...current,
            [seriesKey]: !current[seriesKey],
        }));
    };

    return {
        enabledSeries,
        hoveredIndex,
        activePointIndex,
        activeLabel,
        activeTotal,
        activeAthletes,
        activeCoaches,
        chart,
        setHoveredIndex,
        toggleSeries,
    };
}
