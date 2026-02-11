import { useMemo } from 'react';
import { progressChartDimensions } from '../constants';
import type { ProgressTrend, ProgressWeek } from '../types';
import { buildLineSegments, formatShortDate } from '../utils';

export function useProgressChartData(weeks: ProgressWeek[]): ProgressTrend {
    return useMemo(() => {
        const { chartWidth, chartHeight, chartPaddingX, chartPaddingY, gridLines } =
            progressChartDimensions;

        const innerWidth = chartWidth - chartPaddingX * 2;
        const innerHeight = chartHeight - chartPaddingY * 2;
        const maxTss = Math.max(
            100,
            ...weeks.flatMap((week) => [week.planned_tss ?? 0, week.actual_tss ?? 0]),
        );
        const yMax = Math.ceil(maxTss * 1.2);
        const stepX = weeks.length > 1 ? innerWidth / (weeks.length - 1) : 0;

        const points = weeks.map((week, index) => {
            const x = chartPaddingX + stepX * index;
            const plannedTss = week.planned_tss;
            const actualTss = week.actual_tss;
            const plannedY =
                plannedTss === null
                    ? null
                    : chartPaddingY + innerHeight - (plannedTss / yMax) * innerHeight;
            const actualY =
                actualTss === null
                    ? null
                    : chartPaddingY + innerHeight - (actualTss / yMax) * innerHeight;

            return {
                x,
                plannedTss,
                actualTss,
                plannedY,
                actualY,
                label: `${formatShortDate(week.week_start)} — ${formatShortDate(week.week_end)}`,
            };
        });

        const actualSegments = buildLineSegments(
            points.map((point) => ({
                x: point.x,
                y: point.actualY,
            })),
        );

        const plannedSegments = buildLineSegments(
            points.map((point) => ({
                x: point.x,
                y: point.plannedY,
            })),
        );

        const targetBands = points
            .slice(0, -1)
            .map((point, index) => {
                const nextPoint = points[index + 1];

                if (
                    point.plannedTss === null ||
                    nextPoint?.plannedTss === null ||
                    point.plannedY === null ||
                    nextPoint?.plannedY === null
                ) {
                    return null;
                }

                const pointHighY =
                    chartPaddingY +
                    innerHeight -
                    (point.plannedTss * 1.15 * innerHeight) / yMax;
                const pointLowY =
                    chartPaddingY +
                    innerHeight -
                    (point.plannedTss * 0.85 * innerHeight) / yMax;
                const nextPointHighY =
                    chartPaddingY +
                    innerHeight -
                    (nextPoint.plannedTss * 1.15 * innerHeight) / yMax;
                const nextPointLowY =
                    chartPaddingY +
                    innerHeight -
                    (nextPoint.plannedTss * 0.85 * innerHeight) / yMax;

                return `${point.x},${pointHighY} ${nextPoint.x},${nextPointHighY} ${nextPoint.x},${nextPointLowY} ${point.x},${pointLowY}`;
            })
            .filter((segment): segment is string => segment !== null);

        return {
            yMax,
            points,
            actualSegments,
            plannedSegments,
            targetBands,
            chartWidth,
            chartHeight,
            chartPaddingX,
            chartPaddingY,
            innerHeight,
            stepX,
            gridLines,
        };
    }, [weeks]);
}
