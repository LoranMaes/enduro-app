
import { Calendar, Activity, BarChart3 } from 'lucide-react';
import React from 'react';
import { Heading, Label } from '../ui/Typography';

export const CorePillars: React.FC = () => {
  const pillars = [
    {
      icon: <Calendar className="h-5 w-5 text-sky-400" />,
      title: "Plan with Intent",
      description: "Structure your season with drag-and-drop precision. Build blocks, set TSS targets, and visualize your load ramp before you start."
    },
    {
      icon: <Activity className="h-5 w-5 text-emerald-400" />,
      title: "Execute Daily",
      description: "An infinite vertical calendar designed for the daily grind. Clear distinction between planned work and completed reality."
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-violet-400" />,
      title: "Review Intelligently",
      description: "Data without the fluff. Analyze power curves, heart rate drift, and consistency trends to make informed adjustments."
    }
  ];

  return (
    <section className="border-y border-border bg-surface/30 px-6 py-24 md:px-12">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-3">
        {pillars.map((pillar, index) => (
          <div key={index} className="group flex flex-col items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-surface shadow-sm transition-colors group-hover:border-zinc-700">
              {pillar.icon}
            </div>
            <div className="space-y-2">
              <Heading level={3} className="text-zinc-200">{pillar.title}</Heading>
              <p className="text-sm leading-relaxed text-zinc-500">{pillar.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
