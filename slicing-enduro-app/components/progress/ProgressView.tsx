import React, { useState, useMemo } from 'react';
import { addDays, getStartOfWeek } from '../../lib/utils';
import type { WeekData, DayData } from '../../types';
import { Heading, Label } from '../ui/Typography';
import { ConsistencySummary } from './ConsistencySummary';
import { LoadTrendChart } from './LoadTrendChart';
import { ProgressHeader } from './ProgressHeader';
import { WeeklyListItem } from './WeeklyListItem';

interface ProgressViewProps {
  onNavigateToWeek: (week: WeekData) => void;
}

// Helper to generate historical data (Mocking a backend)
const generateHistory = (weeksBack: number): WeekData[] => {
  const history: WeekData[] = [];
  const today = new Date();
  const startOfCurrentWeek = getStartOfWeek(today);

  for (let i = weeksBack; i >= 0; i--) {
    const weekStart = addDays(startOfCurrentWeek, -i * 7);
    
    // Simulate trend: Linear progression with some noise
    const baseTss = 300 + (Math.sin(i * 0.5) * 50) + (weeksBack - i) * 10;
    const noise = (Math.random() - 0.5) * 40;
    
    const plannedTss = Math.round(baseTss);
    const actualTss = Math.round(Math.max(0, baseTss + noise));
    const duration = Math.round((actualTss / 60) * 60 + (Math.random() * 30));

    // Mock minimal DayData just to satisfy type (not used in this view)
    const days: DayData[] = Array(7).fill({ date: weekStart, sessions: [] });

    history.push({
      id: `week-${i}`,
      startDate: weekStart,
      days,
      summary: {
        totalDuration: duration,
        totalTss: actualTss,
        plannedTss: plannedTss,
        distanceKm: 0,
        completedCount: 5
      }
    });
  }
  return history;
};

export const ProgressView: React.FC<ProgressViewProps> = ({ onNavigateToWeek }) => {
  const [range, setRange] = useState(12);
  
  // Memoize data generation so it doesn't flicker on re-renders unless range changes significantly
  // In a real app, we'd fetch based on range. Here we generate enough for max range.
  const fullHistory = useMemo(() => generateHistory(24), []);
  
  const visibleWeeks = useMemo(() => {
    // Slice the last 'range' weeks
    return fullHistory.slice(-range);
  }, [fullHistory, range]);

  // Calculate Averages
  const avgTss = visibleWeeks.reduce((acc, w) => acc + w.summary.totalTss, 0) / range;
  const avgDur = visibleWeeks.reduce((acc, w) => acc + w.summary.totalDuration, 0) / range;

  return (
    <div className="flex h-full flex-col bg-background animate-in fade-in duration-300">
      
      <ProgressHeader 
        range={range} 
        setRange={setRange} 
        avgTss={avgTss} 
        avgDurationMinutes={avgDur} 
      />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-6 space-y-8">
          
          {/* Chart Section */}
          <section className="rounded-xl border border-border bg-surface p-6">
            <div className="mb-6 flex items-center justify-between">
              <Heading level={3} className="text-zinc-400">Load Trend</Heading>
              {/* Legend */}
              <div className="flex items-center gap-4 text-[10px] text-zinc-500 uppercase tracking-wider">
                <div className="flex items-center gap-2">
                   <span className="block h-0.5 w-4 bg-emerald-500"></span>
                   Actual
                </div>
                <div className="flex items-center gap-2">
                   <span className="block h-2 w-4 bg-sky-900/30 border border-sky-900/50"></span>
                   Target Range
                </div>
              </div>
            </div>
            
            <LoadTrendChart weeks={visibleWeeks} height={280} />
          </section>

          {/* Lower Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            
            {/* Left: Consistency Metrics */}
            <div className="lg:col-span-4 space-y-6">
              <Heading level={3} className="text-zinc-400 px-1">Consistency</Heading>
              <ConsistencySummary weeks={visibleWeeks} />
              
              <div className="rounded-lg border border-border bg-surface/30 p-4">
                 <Label className="mb-2">Coach's Note</Label>
                 <p className="text-sm text-zinc-400 italic leading-relaxed">
                   "Your load accumulation is steady. The slight dip 3 weeks ago was a necessary deload. Keep the green streak alive."
                 </p>
              </div>
            </div>

            {/* Right: Weekly Breakdown List */}
            <div className="lg:col-span-8 space-y-4">
              <Heading level={3} className="text-zinc-400 px-1">Weekly Logs</Heading>
              <div className="flex flex-col gap-2">
                {[...visibleWeeks].reverse().map((week) => (
                  <WeeklyListItem 
                    key={week.id} 
                    week={week} 
                    onClick={() => onNavigateToWeek(week)} 
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
