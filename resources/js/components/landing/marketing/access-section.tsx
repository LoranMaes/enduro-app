import React from 'react';

import { cn } from '@/lib/utils';

import { DataValue, Heading, Label } from '../ui/typography';

type CapabilityListProps = {
    items: readonly string[];
    className?: string;
};

function CapabilityList({ items, className }: CapabilityListProps) {
    return (
        <ul
            className={cn(
                'space-y-3 font-mono text-xs text-zinc-400',
                className,
            )}
        >
            {items.map((item) => (
                <li key={item} className="flex items-start gap-3">
                    <span className="mt-1.5 h-0.5 w-0.5 shrink-0 rounded-full bg-zinc-600" />
                    <span>{item}</span>
                </li>
            ))}
        </ul>
    );
}

function PriceDisclosure() {
    return (
        <div className="mt-8 border-t border-zinc-800 pt-6">
            <div className="flex items-baseline gap-2">
                <DataValue size="xl" className="text-white">
                    €12
                </DataValue>
                <span className="font-mono text-xs text-zinc-500">/ month</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                Designed for athletes training with structure year-round.
            </p>
        </div>
    );
}

export function AccessSection() {
    return (
        <section
            data-landing-section
            className="border-y border-border bg-background px-6 py-32 md:px-12"
        >
            <div className="mx-auto max-w-5xl">
                <div data-motion-item className="mb-16 max-w-2xl">
                    <Heading
                        level={2}
                        className="text-xl font-medium text-zinc-200"
                    >
                        Access & Availability
                    </Heading>
                    <p className="mt-4 text-sm text-zinc-500">
                        Endure is free to explore. Some capabilities require a
                        paid plan.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-16">
                    <div
                        data-access-card
                        data-motion-item
                        className="flex flex-col rounded-xl border border-zinc-800 bg-transparent p-6 opacity-70 transition-opacity hover:opacity-100 md:p-8"
                    >
                        <Label className="mb-6 text-zinc-600">
                            Core Access
                        </Label>

                        <CapabilityList
                            items={[
                                'Training calendar',
                                'Manual session creation',
                                'Weekly summaries',
                                'Session analysis (basic)',
                                'Progress over time (4 weeks)',
                            ]}
                        />

                        <div className="mt-auto pt-8">
                            <span className="font-mono text-xs text-zinc-600">
                                Included
                            </span>
                        </div>
                    </div>

                    <div
                        data-access-card
                        data-motion-item
                        className="flex flex-col rounded-xl border border-zinc-700 bg-surface p-6 shadow-sm md:p-8"
                    >
                        <Label className="mb-6 text-zinc-400">
                            Advanced Tools
                        </Label>

                        <CapabilityList
                            className="text-zinc-300"
                            items={[
                                'Unlimited progress history',
                                'Training plan overlays',
                                'Detailed session analytics',
                                'Long-term trend analysis',
                                'Coach-grade exports (future)',
                            ]}
                        />

                        <PriceDisclosure />
                    </div>
                </div>

                <div
                    data-motion-item
                    className="mt-16 border-l border-zinc-800 pl-6"
                >
                    <p className="max-w-md text-xs leading-relaxed text-zinc-500">
                        No lock-in. Cancel anytime. Core features remain fully
                        usable without payment.
                    </p>
                </div>
            </div>
        </section>
    );
}
