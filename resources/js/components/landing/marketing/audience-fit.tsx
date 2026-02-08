import React from 'react';

import { Heading, Label } from '../ui/typography';

const TARGET_PROFILE = [
    'Train 5–15 hours per week',
    'Follow structured plans or a coach',
    'Review training data weekly',
    'Prioritize long-term health',
] as const;

const ANTI_PATTERN = [
    'Prioritize social streaks and badges',
    'Require daily motivational quotes',
    'Train randomly without intent',
    'Focus on calorie tracking over performance',
] as const;

export function AudienceFit() {
    return (
        <section
            data-landing-section
            className="border-y border-border bg-surface/20 px-6 py-32 md:px-12"
        >
            <div className="mx-auto max-w-5xl">
                <div className="grid grid-cols-1 gap-16 md:grid-cols-2">
                    <div data-motion-item className="space-y-8">
                        <Label className="text-emerald-500">
                            Target Profile
                        </Label>
                        <Heading
                            level={3}
                            className="text-xl font-light text-zinc-200"
                        >
                            This tool is built for athletes who:
                        </Heading>
                        <ul className="space-y-4 border-l border-zinc-800 pl-6">
                            {TARGET_PROFILE.map((item) => (
                                <li
                                    key={item}
                                    className="flex items-start gap-3"
                                >
                                    <span className="text-sm font-medium text-zinc-400">
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div data-motion-item className="space-y-8">
                        <Label className="text-zinc-600">Anti-Pattern</Label>
                        <Heading
                            level={3}
                            className="text-xl font-light text-zinc-500"
                        >
                            It is not built for athletes who:
                        </Heading>
                        <ul className="space-y-4 border-l border-zinc-800 pl-6">
                            {ANTI_PATTERN.map((item) => (
                                <li
                                    key={item}
                                    className="flex items-start gap-3"
                                >
                                    <span className="text-sm text-zinc-600">
                                        {item}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
