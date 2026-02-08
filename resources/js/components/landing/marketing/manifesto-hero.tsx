import React from 'react';

import { Heading, Label } from '../ui/typography';

export function ManifestoHero() {
    return (
        <section
            data-landing-section
            className="flex min-h-[80vh] flex-col justify-center border-b border-border bg-background px-6 pt-24 pb-12 md:px-12"
        >
            <div className="mx-auto w-full max-w-5xl">
                <Label data-landing-hero-label className="mb-12 text-zinc-500">
                    Manifesto 01
                </Label>

                <Heading
                    data-landing-hero-title
                    level={1}
                    className="mb-12 max-w-4xl text-5xl leading-[0.9] font-semibold tracking-tighter text-white sm:text-7xl md:text-8xl lg:text-[7rem]"
                >
                    Train with <br />{' '}
                    <span className="text-zinc-500">intent.</span>
                </Heading>

                <p
                    data-landing-hero-copy
                    className="mb-24 max-w-2xl text-xl leading-relaxed font-light text-zinc-400 md:text-2xl"
                >
                    Endure is a training environment for athletes who care about
                    progression, not noise.
                </p>

                <div
                    data-landing-hero-pillars
                    className="grid grid-cols-1 gap-12 border-t border-zinc-800 pt-8 md:grid-cols-3"
                >
                    <div className="space-y-2">
                        <span className="font-mono text-xs text-sky-500">
                            01
                        </span>
                        <p className="text-sm font-medium text-zinc-200">
                            Plan seasons, not workouts.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <span className="font-mono text-xs text-emerald-500">
                            02
                        </span>
                        <p className="text-sm font-medium text-zinc-200">
                            Execute with clarity.
                        </p>
                    </div>
                    <div className="space-y-2">
                        <span className="font-mono text-xs text-violet-500">
                            03
                        </span>
                        <p className="text-sm font-medium text-zinc-200">
                            Review with context.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
