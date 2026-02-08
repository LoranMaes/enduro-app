import React from 'react';

import { Heading } from '../ui/typography';

export function MarketingClosing() {
    return (
        <section
            data-landing-section
            className="border-t border-border bg-background px-6 py-32 text-center"
        >
            <Heading
                data-motion-item
                level={2}
                className="text-2xl font-light text-zinc-400"
            >
                Endure is a tool. The work is yours.
            </Heading>
        </section>
    );
}
