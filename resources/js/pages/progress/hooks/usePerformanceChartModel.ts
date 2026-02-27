import { useMemo } from 'react';
import type { LoadSeriesPoint, PerformanceLineKey } from '../types';

type PerformanceChartPoint = LoadSeriesPoint & {
    x: number;
    ctlY: number;
    atlY: number;
    tsbY: number;
};

type PerformanceChartModel = {
    width: number;
    height: number;
    paddingX: number;
    paddingY: number;
    innerHeight: number;
    points: PerformanceChartPoint[];
    yTopLabel: number;
    yBottomLabel: number;
    historicalCtlPath: string;
    historicalAtlPath: string;
    historicalTsbPath: string;
    projectedCtlPath: string;
    projectedAtlPath: string;
    projectedTsbPath: string;
    gridLines: number;
    stepX: number;
    hasProjection: boolean;
    zeroY: number | null;
};

export function usePerformanceChartModel(
    series: LoadSeriesPoint[],
    historicalCount: number,
    visibleLineKeys: PerformanceLineKey[],
): PerformanceChartModel {
    return useMemo(() => {
        const width = 960;
        const height = 392;
        const paddingX = 28;
        const paddingY = 28;
        const innerWidth = width - paddingX * 2;
        const innerHeight = height - paddingY * 2;
        const stepX = series.length > 1 ? innerWidth / (series.length - 1) : 0;
        const evaluationLines = visibleLineKeys.length > 0
            ? visibleLineKeys
            : (['ctl', 'atl', 'tsb'] as PerformanceLineKey[]);

        const values = series.flatMap((point) => {
            return evaluationLines.map((lineKey) => point[lineKey]);
        });
        const rawMin = values.length > 0 ? Math.min(...values) : -10;
        const rawMax = values.length > 0 ? Math.max(...values) : 10;
        const span = Math.max(20, rawMax - rawMin);
        const paddedMin = rawMin - span * 0.2;
        const paddedMax = rawMax + span * 0.2;
        const range = Math.max(1, paddedMax - paddedMin);

        const toY = (value: number): number => {
            return paddingY + innerHeight - ((value - paddedMin) / range) * innerHeight;
        };

        const points = series.map((point, index) => ({
            ...point,
            x: paddingX + stepX * index,
            ctlY: toY(point.ctl),
            atlY: toY(point.atl),
            tsbY: toY(point.tsb),
        }));

        const historicalPoints = points.slice(0, historicalCount);
        const projectedPoints = historicalCount > 0
            ? points.slice(Math.max(0, historicalCount - 1))
            : [];
        const zeroY = paddedMin <= 0 && paddedMax >= 0 ? toY(0) : null;

        return {
            width,
            height,
            paddingX,
            paddingY,
            innerHeight,
            points,
            yTopLabel: Math.round(paddedMax),
            yBottomLabel: Math.round(paddedMin),
            historicalCtlPath: buildLinePath(
                historicalPoints.map((point) => ({
                    x: point.x,
                    y: point.ctlY,
                })),
            ),
            historicalAtlPath: buildLinePath(
                historicalPoints.map((point) => ({
                    x: point.x,
                    y: point.atlY,
                })),
            ),
            historicalTsbPath: buildLinePath(
                historicalPoints.map((point) => ({
                    x: point.x,
                    y: point.tsbY,
                })),
            ),
            projectedCtlPath: buildLinePath(
                projectedPoints.map((point) => ({
                    x: point.x,
                    y: point.ctlY,
                })),
            ),
            projectedAtlPath: buildLinePath(
                projectedPoints.map((point) => ({
                    x: point.x,
                    y: point.atlY,
                })),
            ),
            projectedTsbPath: buildLinePath(
                projectedPoints.map((point) => ({
                    x: point.x,
                    y: point.tsbY,
                })),
            ),
            gridLines: 5,
            stepX,
            hasProjection: series.length > historicalCount,
            zeroY,
        };
    }, [historicalCount, series, visibleLineKeys]);
}

function buildLinePath(points: Array<{ x: number; y: number }>): string {
    if (points.length < 2) {
        return '';
    }

    return points
        .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
        .join(' ');
}
