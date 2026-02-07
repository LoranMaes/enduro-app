
import React from 'react';
import { Label } from '../ui/Typography';

export const PhilosophyBlock: React.FC = () => {
  return (
    <section className="px-6 py-32 md:px-12 bg-background">
      <div className="mx-auto max-w-2xl text-center space-y-12">
        <Label className="mb-8">Philosophy</Label>
        
        <div className="space-y-8">
          <p className="text-lg md:text-xl text-zinc-300 font-light">
            Training is cumulative.
          </p>
          <p className="text-lg md:text-xl text-zinc-300 font-light">
             Tools should reduce noise, not add to it.
          </p>
          <p className="text-lg md:text-xl text-zinc-300 font-light">
             Data is only useful in context.
          </p>
          <p className="text-lg md:text-xl text-zinc-300 font-light">
             Consistency beats intensity.
          </p>
        </div>
      </div>
    </section>
  );
};
