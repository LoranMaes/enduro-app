import React from 'react';

import { DataValue, Heading, Label } from '../ui/typography';

const LOOP_STEPS = [
    {
        title: 'Plan',
        description: 'Structure macrocycles with precise load targets.',
        stat: 'CTL: 85',
        color: 'bg-sky-500/50',
        statColor: 'text-sky-400',
    },
    {
        title: 'Execute',
        description: 'Daily work, distractions removed.',
        stat: 'IF: 0.85',
        color: 'bg-emerald-500/50',
        statColor: 'text-emerald-400',
    },
    {
        title: 'Review',
        description: 'Analyze response, not just output.',
        stat: 'TSB: -12',
        color: 'bg-violet-500/50',
        statColor: 'text-violet-400',
    },
    {
        title: 'Adapt',
        description: 'Adjust trajectory based on reality.',
        stat: 'RAMP: +2',
        color: 'bg-amber-500/50',
        statColor: 'text-amber-400',
    },
] as const;

export function TrainingLoop() {
    return (
        <section
            data-landing-section
            className="border-b border-border bg-background px-6 py-32 md:px-12"
        >
            <div className="mx-auto max-w-5xl">
                <Label data-motion-item className="mb-16">
                    The Loop
                </Label>

                <div className="grid grid-cols-1 gap-16 md:grid-cols-4">
                    {LOOP_STEPS.map((step) => (
                        <div
                            key={step.title}
                            data-loop-step
                            data-motion-item
                            className="group flex flex-col gap-6"
                        >
                            <div
                                className={`h-[0.0625rem] w-8 transition-all duration-500 group-hover:w-full ${step.color}`}
                            />

                            <div className="space-y-2">
                                <Heading level={2} className="text-white">
                                    {step.title}
                                </Heading>
                                <p className="text-xs leading-relaxed text-zinc-500">
                                    {step.description}
                                </p>
                            </div>

                            <DataValue size="sm" className={step.statColor}>
                                {step.stat}
                            </DataValue>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
