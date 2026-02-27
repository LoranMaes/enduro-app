import { useMemo } from 'react';
import type { LoadSeriesPoint } from '../types';

type UsePerformanceForecastResult = {
    points: LoadSeriesPoint[];
    historicalCount: number;
};

const ATL_TIME_CONSTANT_DAYS = 7;
const CTL_TIME_CONSTANT_DAYS = 42;

export function usePerformanceForecast(
    historicalPoints: LoadSeriesPoint[],
    selectedWeeks: number,
): UsePerformanceForecastResult {
    return useMemo(() => {
        if (historicalPoints.length === 0) {
            return {
                points: [],
                historicalCount: 0,
            };
        }

        const todayDate = new Date().toISOString().slice(0, 10);
        const pointsUpToToday = historicalPoints.filter((point) => point.date <= todayDate);
        const sanitizedHistoricalPoints = trimTrailingSyntheticPoints(pointsUpToToday);
        const effectiveHistoricalPoints = sanitizedHistoricalPoints.length > 0
            ? sanitizedHistoricalPoints
            : pointsUpToToday;

        if (effectiveHistoricalPoints.length === 0) {
            return {
                points: [],
                historicalCount: 0,
            };
        }

        const projectionDays = resolveProjectionDays(selectedWeeks);
        const lastHistoricalPoint = effectiveHistoricalPoints[effectiveHistoricalPoints.length - 1];

        if (lastHistoricalPoint === undefined || projectionDays <= 0) {
            return {
                points: effectiveHistoricalPoints,
                historicalCount: effectiveHistoricalPoints.length,
            };
        }

        const seedPoint = resolveSeedPoint(effectiveHistoricalPoints, lastHistoricalPoint);
        const projectedPoints: LoadSeriesPoint[] = [];
        let previousAtl = seedPoint.atl;
        let previousCtl = seedPoint.ctl;

        for (let dayOffset = 1; dayOffset <= projectionDays; dayOffset++) {
            const tsb = previousCtl - previousAtl;
            const atl = previousAtl + ((0 - previousAtl) / ATL_TIME_CONSTANT_DAYS);
            const ctl = previousCtl + ((0 - previousCtl) / CTL_TIME_CONSTANT_DAYS);

            projectedPoints.push({
                date: addDaysToIsoDate(lastHistoricalPoint.date, dayOffset),
                sport: lastHistoricalPoint.sport,
                tss: 0,
                atl,
                ctl,
                tsb,
                isProjected: true,
            });

            previousAtl = atl;
            previousCtl = ctl;
        }

        return {
            points: [
                ...effectiveHistoricalPoints,
                ...projectedPoints,
            ],
            historicalCount: effectiveHistoricalPoints.length,
        };
    }, [historicalPoints, selectedWeeks]);
}

function resolveProjectionDays(selectedWeeks: number): number {
    const selectedRangeDays = Math.max(1, Math.round(selectedWeeks * 7));
    const rangeBasedProjection = Math.round(selectedRangeDays * 0.25);

    return clamp(rangeBasedProjection, 7, 42);
}

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

function addDaysToIsoDate(isoDate: string, dayOffset: number): string {
    const date = new Date(`${isoDate}T00:00:00Z`);

    if (Number.isNaN(date.getTime())) {
        return isoDate;
    }

    date.setUTCDate(date.getUTCDate() + dayOffset);

    return date.toISOString().slice(0, 10);
}

function resolveSeedPoint(
    points: LoadSeriesPoint[],
    lastHistoricalPoint: LoadSeriesPoint,
): { atl: number; ctl: number } {
    const currentWeekAverage = resolveCurrentWeekAveragePoint(points);

    if (currentWeekAverage !== null) {
        return currentWeekAverage;
    }

    const lastRealPoint = resolveLastRealPoint(points);

    if (lastRealPoint !== null) {
        return {
            atl: lastRealPoint.atl,
            ctl: lastRealPoint.ctl,
        };
    }

    return {
        atl: lastHistoricalPoint.atl,
        ctl: lastHistoricalPoint.ctl,
    };
}

function resolveCurrentWeekAveragePoint(
    points: LoadSeriesPoint[],
): { atl: number; ctl: number } | null {
    const today = new Date();
    const weekStart = startOfWeekDate(today);
    const weekStartKey = toDateKey(weekStart);
    const todayKey = toDateKey(today);

    const currentWeekPoints = points.filter((point) => {
        if (point.date < weekStartKey || point.date > todayKey) {
            return false;
        }

        return isRealPoint(point);
    });

    if (currentWeekPoints.length === 0) {
        return null;
    }

    const totals = currentWeekPoints.reduce(
        (carry, point) => ({
            atl: carry.atl + point.atl,
            ctl: carry.ctl + point.ctl,
        }),
        { atl: 0, ctl: 0 },
    );

    return {
        atl: totals.atl / currentWeekPoints.length,
        ctl: totals.ctl / currentWeekPoints.length,
    };
}

function resolveLastRealPoint(points: LoadSeriesPoint[]): LoadSeriesPoint | null {
    const todayDate = new Date().toISOString().slice(0, 10);

    return (
        [...points]
            .reverse()
            .find((point) => point.date <= todayDate && isRealPoint(point))
        ?? null
    );
}

function isRealPoint(point: LoadSeriesPoint): boolean {
    return !(
        point.tss === 0
        && point.atl === 0
        && point.ctl === 0
        && point.tsb === 0
    );
}

function startOfWeekDate(date: Date): Date {
    const clone = new Date(date);
    const day = clone.getDay();
    const diff = day === 0 ? -6 : 1 - day;

    clone.setDate(clone.getDate() + diff);
    clone.setHours(0, 0, 0, 0);

    return clone;
}

function toDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
}

function trimTrailingSyntheticPoints(
    points: LoadSeriesPoint[],
): LoadSeriesPoint[] {
    if (points.length <= 1) {
        return points;
    }

    const trimmed = [...points];

    while (trimmed.length > 1) {
        const lastPoint = trimmed[trimmed.length - 1];

        if (lastPoint === undefined || isRealPoint(lastPoint)) {
            break;
        }

        trimmed.pop();
    }

    return trimmed;
}
