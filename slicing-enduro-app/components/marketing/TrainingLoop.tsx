
import React from 'react';
import { Heading, Label, DataValue } from '../ui/Typography';

export const TrainingLoop: React.FC = () => {
  return (
    <section className="border-b border-border bg-background px-6 py-32 md:px-12">
      <div className="mx-auto max-w-5xl">
        <Label className="mb-16">The Loop</Label>
        
        <div className="grid grid-cols-1 gap-16 md:grid-cols-4">
          {/* Plan */}
          <div className="flex flex-col gap-6 group">
            <div className="h-[1px] w-8 bg-sky-500/50 group-hover:w-full transition-all duration-500" />
            <div className="space-y-2">
               <Heading level={2} className="text-white">Plan</Heading>
               <p className="text-xs text-zinc-500 leading-relaxed">Structure macrocycles with precise load targets.</p>
            </div>
            <DataValue size="sm" className="text-sky-400">CTL: 85</DataValue>
          </div>

          {/* Execute */}
          <div className="flex flex-col gap-6 group">
            <div className="h-[1px] w-8 bg-emerald-500/50 group-hover:w-full transition-all duration-500" />
            <div className="space-y-2">
               <Heading level={2} className="text-white">Execute</Heading>
               <p className="text-xs text-zinc-500 leading-relaxed">Daily work, distractions removed.</p>
            </div>
            <DataValue size="sm" className="text-emerald-400">IF: 0.85</DataValue>
          </div>

          {/* Review */}
          <div className="flex flex-col gap-6 group">
            <div className="h-[1px] w-8 bg-violet-500/50 group-hover:w-full transition-all duration-500" />
            <div className="space-y-2">
               <Heading level={2} className="text-white">Review</Heading>
               <p className="text-xs text-zinc-500 leading-relaxed">Analyze response, not just output.</p>
            </div>
            <DataValue size="sm" className="text-violet-400">TSB: -12</DataValue>
          </div>

          {/* Adapt */}
          <div className="flex flex-col gap-6 group">
            <div className="h-[1px] w-8 bg-amber-500/50 group-hover:w-full transition-all duration-500" />
            <div className="space-y-2">
               <Heading level={2} className="text-white">Adapt</Heading>
               <p className="text-xs text-zinc-500 leading-relaxed">Adjust trajectory based on reality.</p>
            </div>
            <DataValue size="sm" className="text-amber-400">RAMP: +2</DataValue>
          </div>
        </div>
      </div>
    </section>
  );
};
