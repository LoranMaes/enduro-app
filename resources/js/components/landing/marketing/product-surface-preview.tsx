import React from 'react';

import { PerformanceChart } from '../analysis/performance-chart';
import { SessionCard } from '../calendar/session-card';
import { LoadTrendChart } from '../progress/load-trend-chart';
import type { TelemetryPoint, WeekData } from '../types';
import { DataValue, Heading, Label } from '../ui/typography';

const PERFORMANCE_DATA: TelemetryPoint[] = [
    { time: 0, power: 210, hr: 132, cadence: 88 },
    { time: 60, power: 235, hr: 138, cadence: 90 },
    { time: 120, power: 255, hr: 143, cadence: 91 },
    { time: 180, power: 272, hr: 149, cadence: 92 },
    { time: 240, power: 244, hr: 146, cadence: 89 },
    { time: 300, power: 226, hr: 141, cadence: 88 },
    { time: 360, power: 265, hr: 151, cadence: 92 },
    { time: 420, power: 281, hr: 156, cadence: 93 },
    { time: 480, power: 239, hr: 147, cadence: 90 },
    { time: 540, power: 223, hr: 142, cadence: 88 },
    { time: 600, power: 252, hr: 148, cadence: 91 },
    { time: 660, power: 274, hr: 153, cadence: 93 },
    { time: 720, power: 241, hr: 146, cadence: 90 },
    { time: 780, power: 219, hr: 139, cadence: 87 },
    { time: 840, power: 233, hr: 143, cadence: 89 },
    { time: 900, power: 261, hr: 150, cadence: 92 },
    { time: 960, power: 277, hr: 155, cadence: 93 },
    { time: 1020, power: 246, hr: 148, cadence: 90 },
    { time: 1080, power: 228, hr: 142, cadence: 88 },
    { time: 1140, power: 238, hr: 145, cadence: 89 },
];

const LOAD_TREND_WEEKS: WeekData[] = [
    {
        id: 'w-1',
        startDate: new Date('2024-01-01'),
        summary: { totalTss: 280, plannedTss: 290 },
    },
    {
        id: 'w-2',
        startDate: new Date('2024-01-08'),
        summary: { totalTss: 300, plannedTss: 305 },
    },
    {
        id: 'w-3',
        startDate: new Date('2024-01-15'),
        summary: { totalTss: 315, plannedTss: 320 },
    },
    {
        id: 'w-4',
        startDate: new Date('2024-01-22'),
        summary: { totalTss: 330, plannedTss: 335 },
    },
    {
        id: 'w-5',
        startDate: new Date('2024-01-29'),
        summary: { totalTss: 342, plannedTss: 348 },
    },
    {
        id: 'w-6',
        startDate: new Date('2024-02-05'),
        summary: { totalTss: 356, plannedTss: 360 },
    },
    {
        id: 'w-7',
        startDate: new Date('2024-02-12'),
        summary: { totalTss: 370, plannedTss: 374 },
    },
    {
        id: 'w-8',
        startDate: new Date('2024-02-19'),
        summary: { totalTss: 384, plannedTss: 388 },
    },
    {
        id: 'w-9',
        startDate: new Date('2024-02-26'),
        summary: { totalTss: 398, plannedTss: 402 },
    },
    {
        id: 'w-10',
        startDate: new Date('2024-03-04'),
        summary: { totalTss: 412, plannedTss: 418 },
    },
    {
        id: 'w-11',
        startDate: new Date('2024-03-11'),
        summary: { totalTss: 426, plannedTss: 430 },
    },
    {
        id: 'w-12',
        startDate: new Date('2024-03-18'),
        summary: { totalTss: 440, plannedTss: 445 },
    },
];

export function ProductSurfacePreview() {
    return (
        <section
            data-landing-section
            className="space-y-48 bg-background px-6 py-32 md:px-12"
        >
            <div
                data-motion-item
                className="mx-auto grid max-w-5xl grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center"
            >
                <div className="order-2 space-y-8 lg:order-1">
                    <div
                        data-surface-panel
                        className="relative overflow-hidden rounded border border-border bg-surface/50 p-6 grayscale transition-all hover:grayscale-0"
                    >
                        <div className="absolute top-0 left-0 h-full w-1 bg-sky-500/20" />
                        <div className="space-y-1">
                            <div className="flex items-center gap-4 border-b border-border/50 py-3">
                                <span className="font-mono text-[10px] text-zinc-600">
                                    MON
                                </span>
                                <SessionCard
                                    title="Rest Day"
                                    sport="rest"
                                    duration={0}
                                    tss={0}
                                    status="planned"
                                    compact
                                />
                            </div>
                            <div className="flex items-center gap-4 border-b border-border/50 py-3">
                                <span className="font-mono text-[10px] text-zinc-400">
                                    TUE
                                </span>
                                <SessionCard
                                    title="VO2 Max Intervals"
                                    sport="bike"
                                    duration={75}
                                    tss={85}
                                    status="completed"
                                    compact
                                />
                            </div>
                            <div className="flex items-center gap-4 border-b border-border/50 py-3">
                                <span className="font-mono text-[10px] text-zinc-400">
                                    WED
                                </span>
                                <SessionCard
                                    title="Threshold Run"
                                    sport="run"
                                    duration={50}
                                    tss={70}
                                    status="planned"
                                    compact
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="order-1 space-y-6 lg:order-2 lg:pl-12">
                    <Label className="text-sky-500">Surface 01</Label>
                    <Heading level={2} className="text-4xl font-light">
                        Daily execution with weekly structure.
                    </Heading>
                    <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
                        Time is continuous. The calendar reflects this reality,
                        stripping away month boundaries to focus on the flow of
                        training blocks.
                    </p>
                </div>
            </div>

            <div
                data-motion-item
                className="mx-auto grid max-w-5xl grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center"
            >
                <div className="space-y-6 lg:pr-12">
                    <Label className="text-violet-500">Surface 02</Label>
                    <Heading level={2} className="text-4xl font-light">
                        Effort, not ego.
                    </Heading>
                    <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
                        Detailed telemetry analysis designed to find signal in
                        the noise. Visualize decoupling, intensity distribution,
                        and efficiency.
                    </p>
                </div>
                <div
                    data-surface-panel
                    className="relative overflow-hidden rounded border border-border bg-surface/50 p-6 grayscale transition-all hover:grayscale-0"
                >
                    <div className="absolute top-0 right-0 h-full w-1 bg-violet-500/20" />
                    <div className="mb-6 flex gap-8">
                        <div>
                            <Label className="mb-1">Power</Label>
                            <DataValue size="lg">245W</DataValue>
                        </div>
                        <div>
                            <Label className="mb-1">HR</Label>
                            <DataValue size="lg">152bpm</DataValue>
                        </div>
                    </div>
                    <div className="h-40 border border-zinc-800/50 bg-zinc-950/30 p-2">
                        <PerformanceChart
                            data={PERFORMANCE_DATA}
                            height={140}
                            showPower
                            showHr
                        />
                    </div>
                </div>
            </div>

            <div
                data-motion-item
                className="mx-auto grid max-w-5xl grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center"
            >
                <div
                    data-surface-panel
                    className="relative order-2 overflow-hidden rounded border border-border bg-surface/50 p-6 grayscale transition-all hover:grayscale-0 lg:order-1"
                >
                    <div className="absolute bottom-0 left-0 h-1 w-full bg-emerald-500/20" />
                    <div className="mb-8 flex items-end justify-between">
                        <div className="space-y-1">
                            <Label>Load Accumulation</Label>
                            <DataValue size="xl">Build 2</DataValue>
                        </div>
                        <DataValue size="sm" className="mb-1 text-emerald-500">
                            +42 TSS
                        </DataValue>
                    </div>
                    <div className="h-40">
                        <LoadTrendChart weeks={LOAD_TREND_WEEKS} height={160} />
                    </div>
                </div>

                <div className="order-1 space-y-6 lg:order-2 lg:pl-12">
                    <Label className="text-emerald-500">Surface 03</Label>
                    <Heading level={2} className="text-4xl font-light">
                        Consistency over intensity.
                    </Heading>
                    <p className="max-w-sm text-sm leading-relaxed text-zinc-500">
                        Long-term progression requires managing load and
                        fatigue. Visualize your ramp rate and ensure you are
                        building, not breaking.
                    </p>
                </div>
            </div>
        </section>
    );
}
