
import { BarChart2 } from 'lucide-react';
import React from 'react';
import type { Session, TelemetryPoint } from '../../types';
import type { MetricCardProps } from '../ui/MetricCard';
import { Heading, Label } from '../ui/Typography';
import { PerformanceChart } from './PerformanceChart';
import { SessionAnalysisHeader } from './SessionAnalysisHeader';
import { SessionMetricsGrid } from './SessionMetricsGrid';
import { SessionNotes } from './SessionNotes';

interface SessionAnalysisViewProps {
  session: Session;
  onBack: () => void;
}

// Mock Data Generator (kept for visualization)
const generateMockTelemetry = (durationMin: number): TelemetryPoint[] => {
  const points: TelemetryPoint[] = [];
  const steps = durationMin * 60; 
  let power = 150;
  
  for (let i = 0; i < steps; i += 60) {
    if (i % 600 === 0) {
        power = Math.random() > 0.5 ? 250 : 140; 
    }
    const noise = Math.random() * 20 - 10;
    const hrLag = (power - 100) * 0.5;
    
    points.push({
      time: i,
      power: Math.max(0, power + noise),
      hr: 60 + hrLag + (Math.random() * 5),
      cadence: 85 + (Math.random() * 5),
    });
  }
  return points;
};

export const SessionAnalysisView: React.FC<SessionAnalysisViewProps> = ({ session, onBack }) => {
  const telemetry = generateMockTelemetry(session.durationMinutes);

  // Hardened Metric Logic: Clear distinction between Primary and Context
  const metrics: MetricCardProps[] = [
    { label: 'Avg Power', value: 215, unit: 'W', subValue: 'Norm: 228 W', highlight: true },
    { label: 'Avg Heart Rate', value: 142, unit: 'bpm', subValue: 'Max: 178 bpm' },
    { label: 'Avg Cadence', value: 88, unit: 'rpm', subValue: 'Max: 112 rpm' },
    { label: 'Total Work', value: 1250, unit: 'kJ', subValue: `~${Math.round(1250 * 1.1)} kcal` },
  ];

  if (session.sport === 'run') {
      metrics[0] = { label: 'Avg Pace', value: '4:55', unit: '/km', subValue: 'GAP: 4:52 /km', highlight: true };
      metrics[2] = { label: 'Avg Cadence', value: 172, unit: 'spm', subValue: 'Max: 185 spm' };
      metrics[3] = { label: 'Elevation Gain', value: 240, unit: 'm', subValue: 'Loss: 235 m' };
  }

  if (session.sport === 'swim') {
      metrics[0] = { label: 'Avg Pace', value: '1:45', unit: '/100m', subValue: 'CSS: 1:40', highlight: true };
      metrics[2] = { label: 'Stroke Rate', value: 28, unit: 'spm', subValue: 'SWOLF: 36' };
      metrics[3] = { label: 'Total Distance', value: 2500, unit: 'm', subValue: '50 laps' };
  }

  return (
    <div className="flex h-full flex-col bg-background animate-in fade-in duration-300">
      
      <SessionAnalysisHeader session={session} onBack={onBack} />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8 pb-24">
          
          {/* Section 1: Primary Metrics */}
          <section>
             <SessionMetricsGrid metrics={metrics} />
          </section>

          {/* Section 2: Performance Chart */}
          <section className="rounded-xl border border-border bg-surface overflow-hidden shadow-sm">
             <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
                <Heading level={3} className="text-zinc-200">Analysis</Heading>
                
                {/* Minimal Legend */}
                <div className="flex gap-6">
                  {(session.sport === 'bike' || session.sport === 'gym' || session.sport === 'run') && (
                     <div className="flex items-center gap-2">
                       <div className="h-0.5 w-3 bg-violet-400" />
                       <span className="text-[10px] uppercase tracking-wider text-zinc-500">Power</span>
                     </div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="h-0.5 w-3 bg-rose-400" />
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500">HR</span>
                  </div>
                </div>
             </div>
             
             {/* Chart Container */}
             <div className="relative w-full bg-zinc-900/30 p-4 md:p-6">
                <PerformanceChart 
                  data={telemetry} 
                  height={280} 
                  showPower={session.sport === 'bike' || session.sport === 'gym' || session.sport === 'run'}
                  showHr={true}
                />
             </div>
          </section>

          {/* Section 3: Notes & Intervals */}
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <div className="lg:col-span-1">
                <SessionNotes notes={session.description} rpe={session.rpe} />
             </div>
             
             {/* Interval Table / Splits Placeholder - Hardened */}
             <div className="lg:col-span-2 flex flex-col rounded-xl border border-border bg-surface h-full min-h-[250px]">
                <div className="border-b border-border/50 px-6 py-4">
                   <Heading level={3} className="text-zinc-200">Intervals</Heading>
                </div>
                <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
                   <div className="rounded-full bg-zinc-900 p-3 text-zinc-600 border border-zinc-800">
                      <BarChart2 className="h-5 w-5" />
                   </div>
                   <div className="max-w-xs space-y-1">
                      <p className="text-sm font-medium text-zinc-300">Detailed Lap Data Coming Soon</p>
                      <p className="text-xs text-zinc-500">
                        We are building a precision interval detection engine to automatically identify your work and rest periods.
                      </p>
                   </div>
                </div>
             </div>
          </section>

        </div>
      </div>
    </div>
  );
};
