
import React from 'react';
import { Heading, Label, DataValue } from '../ui/Typography';
import { SessionCard } from '../calendar/SessionCard';
import { PerformanceChart } from '../analysis/PerformanceChart';
import { LoadTrendChart } from '../progress/LoadTrendChart';
import { MetricCard } from '../ui/MetricCard';

export const ProductPreviews: React.FC = () => {
  return (
    <section className="space-y-32 px-6 py-32 md:px-12">
      
      {/* Preview 1: The Calendar */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <Label className="text-sky-500">The Interface</Label>
          <Heading level={2} className="text-3xl">Infinite Context</Heading>
          <p className="text-zinc-400 leading-relaxed max-w-md">
            No rigid monthly grids. Time is continuous. Your training calendar flows vertically, allowing you to see past execution and future intent in a single glance.
          </p>
        </div>
        
        {/* Diagram */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-violet-500 opacity-20"></div>
          <div className="space-y-2 select-none opacity-90 grayscale-[0.2]">
            {/* Mock Calendar Rows */}
            <div className="flex items-center justify-between border-b border-border pb-2">
                <span className="text-xs font-medium text-zinc-500">Mon, Oct 14</span>
                <span className="text-[10px] text-zinc-600 font-mono">REST</span>
            </div>
             <div className="flex items-center gap-4 py-2">
                <div className="w-8 text-center text-xs text-zinc-500">15</div>
                <div className="flex-1">
                   <SessionCard title="VO2 Max Intervals" sport="bike" duration={75} tss={85} status="completed" compact />
                </div>
            </div>
            <div className="flex items-center gap-4 py-2">
                <div className="w-8 text-center text-xs text-zinc-500">16</div>
                <div className="flex-1">
                   <SessionCard title="Threshold Run" sport="run" duration={50} tss={70} status="planned" compact />
                </div>
            </div>
             <div className="flex items-center gap-4 py-2">
                <div className="w-8 text-center text-xs text-zinc-500">17</div>
                <div className="flex-1 opacity-60">
                   <SessionCard title="Recovery Swim" sport="swim" duration={45} tss={30} status="planned" compact />
                </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview 2: Analysis */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
        {/* Diagram (Left on Desktop) */}
        <div className="order-2 lg:order-1 relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-2xl">
           <div className="grid grid-cols-2 gap-4 mb-6">
              <MetricCard label="Avg Power" value={245} unit="W" className="bg-zinc-900/50" />
              <MetricCard label="Heart Rate" value={152} unit="BPM" className="bg-zinc-900/50" />
           </div>
           <div className="h-48 border border-zinc-800/50 rounded-lg bg-zinc-950/30 p-4">
              <PerformanceChart 
                 data={Array.from({length: 20}, (_, i) => ({
                    time: i, 
                    power: 200 + Math.sin(i)*50 + Math.random()*20, 
                    hr: 140 + Math.sin(i)*10, 
                    cadence: 90
                 }))} 
                 height={160} 
              />
           </div>
        </div>

        <div className="order-1 lg:order-2 space-y-6 lg:pl-12">
          <Label className="text-violet-500">The Lab</Label>
          <Heading level={2} className="text-3xl">Signal, Not Noise</Heading>
          <p className="text-zinc-400 leading-relaxed max-w-md">
            Deep dive into session telemetry without the distraction of social feeds or kudos. Analyze power duration, heart rate decoupling, and intensity distribution.
          </p>
        </div>
      </div>

      {/* Preview 3: Progress */}
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <Label className="text-emerald-500">The Big Picture</Label>
          <Heading level={2} className="text-3xl">Consistency is King</Heading>
          <p className="text-zinc-400 leading-relaxed max-w-md">
            Track your Chronic Training Load (CTL) and Form (TSB) over seasons, not just days. Visualize your build phases and ensure you peak at the right time.
          </p>
        </div>
        
        {/* Diagram */}
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface p-6 shadow-2xl">
           <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                 <Label>Load Trend</Label>
                 <DataValue size="lg">Build Phase 2</DataValue>
              </div>
              <div className="flex gap-2">
                 <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                 <span className="h-2 w-2 rounded-full bg-zinc-600"></span>
              </div>
           </div>
           <div className="h-48">
              {/* Mock Load Chart Data */}
              <LoadTrendChart 
                weeks={Array.from({length: 12}, (_, i) => ({
                   id: `w-${i}`, 
                   startDate: new Date(), 
                   days: [], 
                   summary: { totalTss: 300 + i*20 + (Math.random()*40 - 20), plannedTss: 300 + i*20, totalDuration: 0, distanceKm: 0, completedCount: 0 }
                }))}
                height={180}
              />
           </div>
        </div>
      </div>

    </section>
  );
};
