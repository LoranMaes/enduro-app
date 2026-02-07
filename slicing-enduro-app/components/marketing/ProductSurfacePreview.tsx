
import React from 'react';
import { PerformanceChart } from '../analysis/PerformanceChart';
import { SessionCard } from '../calendar/SessionCard';
import { LoadTrendChart } from '../progress/LoadTrendChart';
import { MetricCard } from '../ui/MetricCard';
import { Heading, Label, DataValue } from '../ui/Typography';

export const ProductSurfacePreview: React.FC = () => {
  return (
    <section className="space-y-48 bg-background px-6 py-32 md:px-12">
      
      {/* Surface 1: Calendar */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
        <div className="space-y-8 order-2 lg:order-1">
           {/* Abstract Calendar Visualization */}
           <div className="relative overflow-hidden rounded border border-border bg-surface/50 p-6 grayscale transition-all hover:grayscale-0">
              <div className="absolute top-0 left-0 w-1 h-full bg-sky-500/20"></div>
              <div className="space-y-1">
                 <div className="flex items-center gap-4 py-3 border-b border-border/50">
                    <span className="font-mono text-[10px] text-zinc-600">MON</span>
                    <SessionCard title="Rest Day" sport="rest" duration={0} tss={0} status="planned" compact />
                 </div>
                 <div className="flex items-center gap-4 py-3 border-b border-border/50">
                    <span className="font-mono text-[10px] text-zinc-400">TUE</span>
                    <SessionCard title="VO2 Max Intervals" sport="bike" duration={75} tss={85} status="completed" compact />
                 </div>
                 <div className="flex items-center gap-4 py-3 border-b border-border/50">
                    <span className="font-mono text-[10px] text-zinc-400">WED</span>
                    <SessionCard title="Threshold Run" sport="run" duration={50} tss={70} status="planned" compact />
                 </div>
              </div>
           </div>
        </div>
        <div className="space-y-6 order-1 lg:order-2 lg:pl-12">
          <Label className="text-sky-500">Surface 01</Label>
          <Heading level={2} className="text-4xl font-light">Daily execution with weekly structure.</Heading>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-sm">
            Time is continuous. The calendar reflects this reality, stripping away month boundaries to focus on the flow of training blocks.
          </p>
        </div>
      </div>

      {/* Surface 2: Analysis */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6 lg:pr-12">
          <Label className="text-violet-500">Surface 02</Label>
          <Heading level={2} className="text-4xl font-light">Effort, not ego.</Heading>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-sm">
            Detailed telemetry analysis designed to find signal in the noise. Visualize decoupling, intensity distribution, and efficiency.
          </p>
        </div>
        <div className="relative overflow-hidden rounded border border-border bg-surface/50 p-6 grayscale transition-all hover:grayscale-0">
           <div className="absolute top-0 right-0 w-1 h-full bg-violet-500/20"></div>
           <div className="mb-6 flex gap-8">
              <div>
                 <Label className="mb-1">Power</Label>
                 <DataValue size="lg">245W</DataValue>
              </div>
              <div>
                 <Label className="mb-1">HR</Label>
                 <DataValue size="lg">152bpm</DataValue>
              </div>
           </div>
           <div className="h-40 border border-zinc-800/50 bg-zinc-950/30 p-2">
               <PerformanceChart 
                 data={Array.from({length: 20}, (_, i) => ({
                    time: i, 
                    power: 200 + Math.sin(i)*50 + Math.random()*20, 
                    hr: 140 + Math.sin(i)*10, 
                    cadence: 90
                 }))} 
                 height={140} 
                 showPower={true}
                 showHr={true}
              />
           </div>
        </div>
      </div>

      {/* Surface 3: Progress */}
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
        <div className="order-2 lg:order-1 relative overflow-hidden rounded border border-border bg-surface/50 p-6 grayscale transition-all hover:grayscale-0">
           <div className="absolute bottom-0 left-0 w-full h-1 bg-emerald-500/20"></div>
           <div className="flex items-end justify-between mb-8">
              <div className="space-y-1">
                 <Label>Load Accumulation</Label>
                 <DataValue size="xl">Build 2</DataValue>
              </div>
              <DataValue size="sm" className="text-emerald-500 mb-1">+42 TSS</DataValue>
           </div>
           <div className="h-40">
              <LoadTrendChart 
                weeks={Array.from({length: 12}, (_, i) => ({
                   id: `w-${i}`, 
                   startDate: new Date(), 
                   days: [], 
                   summary: { totalTss: 300 + i*15 + (Math.random()*20), plannedTss: 300 + i*15, totalDuration: 0, distanceKm: 0, completedCount: 0 }
                }))}
                height={160}
              />
           </div>
        </div>

        <div className="order-1 lg:order-2 space-y-6 lg:pl-12">
          <Label className="text-emerald-500">Surface 03</Label>
          <Heading level={2} className="text-4xl font-light">Consistency over intensity.</Heading>
          <p className="text-sm text-zinc-500 leading-relaxed max-w-sm">
            Long-term progression requires managing load and fatigue. Visualize your ramp rate and ensure you are building, not breaking.
          </p>
        </div>
      </div>

    </section>
  );
};
