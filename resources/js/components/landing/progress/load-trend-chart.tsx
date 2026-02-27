import React, { useMemo } from 'react';

import { cn } from '@/lib/utils';

import type { WeekData } from '../types';

type LoadTrendChartProps = {
    weeks: WeekData[];
    height?: number;
};

export function LoadTrendChart({ weeks, height = 300 }: LoadTrendChartProps) {
    const { paths, points, maxTss } = useMemo(() => {
        if (weeks.length === 0) {
            return {
                paths: { actual: '', target: '', targetDash: '' },
                points: [] as Array<{
                    x: number;
                    y: number;
                    color: string;
                    value: number;
                }>,
                maxTss: 100,
            };
        }

        const sortedWeeks = [...weeks].sort(
            (a, b) => a.startDate.getTime() - b.startDate.getTime(),
        );
        const maxActual = Math.max(
            ...sortedWeeks.map((week) => week.summary.totalTss),
        );
        const maxPlanned = Math.max(
            ...sortedWeeks.map((week) => week.summary.plannedTss),
        );
        const ceiling = Math.max(maxActual, maxPlanned, 100) * 1.2;
        const step = 100 / (sortedWeeks.length - 1 || 1);

        const pointsActual = sortedWeeks.map((week, index) => {
            const x = index * step;
            const y = 100 - (week.summary.totalTss / ceiling) * 100;

            return `${x},${y}`;
        });

        const upperPoints: string[] = [];
        const lowerPoints: string[] = [];
        const targetDashPoints: string[] = [];

        const overlayPoints = sortedWeeks.map((week, index) => {
            const x = index * step;
            const actual = week.summary.totalTss;
            const planned = week.summary.plannedTss || 1;
            const y = 100 - (actual / ceiling) * 100;
            const ratio = actual / planned;

            let statusColor = 'bg-zinc-500';

            if (ratio >= 0.8 && ratio <= 1.15) {
                statusColor = 'bg-emerald-500';
            } else if (ratio > 1.15) {
                statusColor = 'bg-rose-500';
            }

            return {
                x,
                y,
                color: statusColor,
                value: actual,
            };
        });

        sortedWeeks.forEach((week, index) => {
            const x = index * step;
            const targetTss = week.summary.plannedTss || 0;
            const yHigh = 100 - ((targetTss * 1.15) / ceiling) * 100;
            const yLow = 100 - ((targetTss * 0.8) / ceiling) * 100;
            const yCenter = 100 - (targetTss / ceiling) * 100;

            upperPoints.push(`${x},${yHigh}`);
            lowerPoints.unshift(`${x},${yLow}`);
            targetDashPoints.push(`${index === 0 ? 'M' : 'L'} ${x},${yCenter}`);
        });

        return {
            paths: {
                actual:
                    pointsActual.length > 1
                        ? `M ${pointsActual.join(' L ')}`
                        : '',
                target: `${upperPoints.join(' ')} ${lowerPoints.join(' ')}`,
                targetDash: targetDashPoints.join(' '),
            },
            points: overlayPoints,
            maxTss: ceiling,
        };
    }, [weeks]);

    if (weeks.length === 0) {
        return null;
    }

    return (
        <div className="relative w-full select-none" style={{ height }}>
            <div className="absolute inset-0 flex flex-col justify-between border-l border-zinc-800/50 py-4">
                {[...Array(5)].map((_, index) => (
                    <div
                        key={index}
                        className="w-full border-t border-zinc-800/30"
                    />
                ))}
            </div>

            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 h-full w-full"
            >
                <polygon points={paths.target} className="fill-sky-500/10" />
                <path
                    d={paths.targetDash}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                    className="text-sky-500/30"
                    vectorEffect="non-scaling-stroke"
                />

                <path
                    d={paths.actual}
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                    className="opacity-90 drop-shadow-sm"
                />
            </svg>

            {points.map((point, index) => (
                <div
                    key={index}
                    className={cn(
                        'absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-950 transition-transform hover:scale-150',
                        point.color,
                    )}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                    title={`${point.value} TSS`}
                />
            ))}

            <div className="absolute top-0 left-2 font-mono text-[0.625rem] text-zinc-500">
                {Math.round(maxTss)} TSS
            </div>
        </div>
    );
}
