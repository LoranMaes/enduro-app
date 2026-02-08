import React, { useMemo } from 'react';

import type { TelemetryPoint } from '../types';

type PerformanceChartProps = {
    data: TelemetryPoint[];
    height?: number;
    showPower?: boolean;
    showHr?: boolean;
};

export function PerformanceChart({
    data,
    height = 240,
    showPower = true,
    showHr = true,
}: PerformanceChartProps) {
    const { paths, maxPower, maxHr, duration } = useMemo(() => {
        if (data.length === 0) {
            return {
                paths: { power: '', hr: '' },
                maxPower: 0,
                maxHr: 0,
                duration: 0,
            };
        }

        const maxPowerWithPadding =
            Math.max(...data.map((point) => point.power)) * 1.1;
        const maxHrWithPadding =
            Math.max(...data.map((point) => point.hr)) * 1.1;
        const maxTime = data[data.length - 1]?.time ?? 0;

        const createPath = (key: 'power' | 'hr', maxValue: number): string => {
            return data
                .map((point, index) => {
                    const x = maxTime === 0 ? 0 : (point.time / maxTime) * 100;
                    const y = 100 - (point[key] / maxValue) * 100;

                    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
                })
                .join(' ');
        };

        return {
            paths: {
                power: createPath('power', maxPowerWithPadding),
                hr: createPath('hr', maxHrWithPadding),
            },
            maxPower: maxPowerWithPadding / 1.1,
            maxHr: maxHrWithPadding / 1.1,
            duration: maxTime,
        };
    }, [data]);

    if (data.length === 0) {
        return (
            <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/20 text-zinc-600">
                <span className="font-mono text-xs">
                    No telemetry data available
                </span>
            </div>
        );
    }

    return (
        <div
            className="relative w-full overflow-hidden select-none"
            style={{ height }}
        >
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between py-2">
                {[0, 1, 2, 3].map((index) => (
                    <div
                        key={index}
                        className="w-full border-t border-zinc-800/40"
                    />
                ))}
            </div>

            <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="relative z-10 h-full w-full"
            >
                <defs>
                    <linearGradient
                        id="powerGradient"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                    >
                        <stop
                            offset="0%"
                            stopColor="#8b5cf6"
                            stopOpacity="0.2"
                        />
                        <stop
                            offset="100%"
                            stopColor="#8b5cf6"
                            stopOpacity="0"
                        />
                    </linearGradient>
                </defs>

                {showPower && (
                    <>
                        <path
                            d={`${paths.power} L 100 100 L 0 100 Z`}
                            fill="url(#powerGradient)"
                            className="opacity-50"
                        />

                        <path
                            d={paths.power}
                            fill="none"
                            stroke="#a78bfa"
                            strokeWidth="0.8"
                            vectorEffect="non-scaling-stroke"
                            className="opacity-90 drop-shadow-sm"
                        />
                    </>
                )}

                {showHr && (
                    <path
                        d={paths.hr}
                        fill="none"
                        stroke="#fb7185"
                        strokeWidth="0.8"
                        vectorEffect="non-scaling-stroke"
                        className="opacity-80"
                    />
                )}
            </svg>

            <div className="pointer-events-none absolute top-0 right-0 z-20 flex h-full flex-col justify-between py-1">
                <span className="rounded-sm bg-background/80 px-1 font-mono text-[9px] text-zinc-500">
                    {showPower ? `${Math.round(maxPower)} W` : ''}
                </span>

                <span className="rounded-sm bg-background/80 px-1 font-mono text-[9px] text-zinc-500">
                    {showHr ? `${Math.round(maxHr)} bpm` : ''}
                </span>
            </div>

            <div className="absolute bottom-1 left-1 font-mono text-[9px] text-zinc-600">
                0:00
            </div>
            <div className="absolute right-1 bottom-1 font-mono text-[9px] text-zinc-600">
                {Math.floor(duration / 60)}:
                {(duration % 60).toString().padStart(2, '0')}
            </div>
        </div>
    );
}
