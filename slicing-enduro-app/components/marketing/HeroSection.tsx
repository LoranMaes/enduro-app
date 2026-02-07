
import React from 'react';
import { Heading } from '../ui/Typography';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative flex min-h-[60vh] flex-col justify-center px-6 py-24 md:px-12">
      <div className="mx-auto w-full max-w-4xl">
        {/* Brand */}
        <div className="mb-8 font-mono text-xs font-medium uppercase tracking-widest text-zinc-500">
          Endure 1.0
        </div>

        {/* Headline */}
        <Heading level={1} className="max-w-3xl text-4xl font-semibold tracking-tighter text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Training clarity for athletes who care about progression.
        </Heading>

        {/* Subtext */}
        <p className="mt-8 max-w-xl text-lg leading-relaxed text-zinc-400">
          A precision tool for the discipline of endurance. Plan with intent, execute with focus, and review without the noise of social validation.
        </p>
      </div>
    </section>
  );
};
