
import React from 'react';
import { Heading, Label, DataValue } from '../ui/Typography';
import { cn } from '../../lib/utils';

const CapabilityList: React.FC<{ items: string[]; className?: string }> = ({ items, className }) => (
  <ul className={cn("space-y-3 font-mono text-xs text-zinc-400", className)}>
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-3">
        <span className="mt-1.5 h-0.5 w-0.5 rounded-full bg-zinc-600 shrink-0" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

const PriceDisclosure: React.FC = () => (
  <div className="mt-8 border-t border-zinc-800 pt-6">
    <div className="flex items-baseline gap-2">
      <DataValue size="xl" className="text-white">€12</DataValue>
      <span className="font-mono text-xs text-zinc-500">/ month</span>
    </div>
    <p className="mt-2 text-xs leading-relaxed text-zinc-500">
      Designed for athletes training with structure year-round.
    </p>
  </div>
);

export const AccessSection: React.FC = () => {
  return (
    <section className="border-y border-border bg-background px-6 py-32 md:px-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-16 max-w-2xl">
          <Heading level={2} className="text-xl font-medium text-zinc-200">Access & Availability</Heading>
          <p className="mt-4 text-sm text-zinc-500">
            Endure is free to explore. Some capabilities require a paid plan.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-16">
          
          {/* Core (Included) */}
          <div className="flex flex-col rounded-xl border border-zinc-800 bg-transparent p-6 opacity-70 transition-opacity hover:opacity-100 md:p-8">
            <Label className="mb-6 text-zinc-600">Core Access</Label>
            <CapabilityList 
              items={[
                "Training calendar",
                "Manual session creation",
                "Weekly summaries",
                "Session analysis (basic)",
                "Progress over time (4 weeks)"
              ]} 
            />
            <div className="mt-auto pt-8">
               <span className="font-mono text-xs text-zinc-600">Included</span>
            </div>
          </div>

          {/* Advanced (Paid) */}
          <div className="flex flex-col rounded-xl border border-zinc-700 bg-surface p-6 shadow-sm md:p-8">
            <Label className="mb-6 text-zinc-400">Advanced Tools</Label>
             <CapabilityList 
              className="text-zinc-300"
              items={[
                "Unlimited progress history",
                "Training plan overlays",
                "Detailed session analytics",
                "Long-term trend analysis",
                "Coach-grade exports (future)"
              ]} 
            />
            <PriceDisclosure />
          </div>

        </div>

        {/* Disclaimer */}
        <div className="mt-16 border-l border-zinc-800 pl-6">
          <p className="text-xs text-zinc-500 max-w-md leading-relaxed">
            No lock-in. Cancel anytime. Core features remain fully usable without payment.
          </p>
        </div>

      </div>
    </section>
  );
};
