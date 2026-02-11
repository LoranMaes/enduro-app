import { useMemo } from 'react';
import type { ProgressTrend, ProgressWeek } from '../types';

export function useProgressMetrics(
    weeks: ProgressWeek[],
    trend: ProgressTrend,
    hoveredIndex: number | null,
) {
    return useMemo(() => {
        const hasVisibleLoadData = weeks.some((week) => {
            return week.actual_tss !== null || week.planned_tss !== null;
        });

        const activePointIndex =
            hoveredIndex === null ? Math.max(0, weeks.length - 1) : hoveredIndex;
        const activePoint = trend.points[activePointIndex];

        return {
            hasVisibleLoadData,
            activePointIndex,
            activePoint,
        };
    }, [hoveredIndex, trend.points, weeks]);
}
