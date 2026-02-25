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
        const suggestedBounds = weeks.map((_, index) => {
            const historyActualTss = weeks
                .slice(Math.max(0, index - 4), index)
                .map((week) => week.actual_tss)
                .filter((value): value is number => value !== null && value > 0);

            if (historyActualTss.length < 2) {
                return null;
            }

            const averageHistoryTss =
                historyActualTss.reduce((total, value) => total + value, 0)
                / historyActualTss.length;
            const minSuggestedTss = Math.max(
                0,
                Math.round(averageHistoryTss * 0.85),
            );
            const maxSuggestedTss = Math.max(
                minSuggestedTss,
                Math.round(averageHistoryTss * 1.15),
            );

            return {
                min: minSuggestedTss,
                max: maxSuggestedTss,
            };
        });
        const maxTss = Math.max(
            100,
            ...weeks.flatMap((week) => [week.planned_tss ?? 0, week.actual_tss ?? 0]),
            ...suggestedBounds.map((bounds) => bounds?.max ?? 0),
        );
        const yMax = Math.ceil(maxTss * 1.2);
        const stepX = weeks.length > 1 ? innerWidth / (weeks.length - 1) : 0;

        const points = weeks.map((week, index) => {
            const x = chartPaddingX + stepX * index;
            const plannedTss = week.planned_tss;
            const actualTss = week.actual_tss;
            const suggestedMinTss = suggestedBounds[index]?.min ?? null;
            const suggestedMaxTss = suggestedBounds[index]?.max ?? null;
            const plannedY =
                plannedTss === null
                    ? null
                    : chartPaddingY + innerHeight - (plannedTss / yMax) * innerHeight;
            const actualY =
                actualTss === null
                    ? null
                    : chartPaddingY + innerHeight - (actualTss / yMax) * innerHeight;
            const suggestedMinY =
                suggestedMinTss === null
                    ? null
                    : chartPaddingY
                      + innerHeight
                      - (suggestedMinTss / yMax) * innerHeight;
            const suggestedMaxY =
                suggestedMaxTss === null
                    ? null
                    : chartPaddingY
                      + innerHeight
                      - (suggestedMaxTss / yMax) * innerHeight;

            return {
                x,
                plannedTss,
                actualTss,
                suggestedMinTss,
                suggestedMaxTss,
                plannedY,
                actualY,
                suggestedMinY,
                suggestedMaxY,
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
                    point.suggestedMaxY === null ||
                    nextPoint?.suggestedMaxY === null ||
                    point.suggestedMinY === null ||
                    nextPoint?.suggestedMinY === null
                ) {
                    return null;
                }

                return `${point.x},${point.suggestedMaxY} ${nextPoint.x},${nextPoint.suggestedMaxY} ${nextPoint.x},${nextPoint.suggestedMinY} ${point.x},${point.suggestedMinY}`;
            })
            .filter((segment): segment is string => segment !== null);

        const targetBandUpperSegments = buildLineSegments(
            points.map((point) => {
                if (point.suggestedMaxY === null) {
                    return {
                        x: point.x,
                        y: null,
                    };
                }

                return {
                    x: point.x,
                    y: point.suggestedMaxY,
                };
            }),
        );

        const targetBandLowerSegments = buildLineSegments(
            points.map((point) => {
                if (point.suggestedMinY === null) {
                    return {
                        x: point.x,
                        y: null,
                    };
                }

                return {
                    x: point.x,
                    y: point.suggestedMinY,
                };
            }),
        );

        const targetBandColumns = points
            .map((point) => {
                if (point.suggestedMinY === null || point.suggestedMaxY === null) {
                    return null;
                }
                const width =
                    weeks.length > 1
                        ? Math.max(12, Math.min(stepX * 0.6, 28))
                        : 18;
                const x = point.x - width / 2;

                return {
                    x,
                    y: Math.min(point.suggestedMaxY, point.suggestedMinY),
                    width,
                    height: Math.max(
                        2,
                        Math.abs(point.suggestedMinY - point.suggestedMaxY),
                    ),
                };
            })
            .filter(
                (
                    band,
                ): band is {
                    x: number;
                    y: number;
                    width: number;
                    height: number;
                } => band !== null,
            );

        return {
            yMax,
            points,
            actualSegments,
            plannedSegments,
            targetBands,
            targetBandUpperSegments,
            targetBandLowerSegments,
            targetBandColumns,
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
