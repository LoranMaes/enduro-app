import React from 'react';

import { Label } from '../ui/typography';

export function PhilosophyBlock() {
    return (
        <section
            data-landing-section
            className="bg-background px-6 py-32 md:px-12"
        >
            <div className="mx-auto max-w-2xl space-y-12 text-center">
                <Label data-motion-item className="mb-8">
                    Philosophy
                </Label>

                <div className="space-y-8">
                    <p
                        data-motion-item
                        className="text-lg font-light text-zinc-300 md:text-xl"
                    >
                        Training is cumulative.
                    </p>
                    <p
                        data-motion-item
                        className="text-lg font-light text-zinc-300 md:text-xl"
                    >
                        Tools should reduce noise, not add to it.
                    </p>
                    <p
                        data-motion-item
                        className="text-lg font-light text-zinc-300 md:text-xl"
                    >
                        Data is only useful in context.
                    </p>
                    <p
                        data-motion-item
                        className="text-lg font-light text-zinc-300 md:text-xl"
                    >
                        Consistency beats intensity.
                    </p>
                </div>
            </div>
        </section>
    );
}
