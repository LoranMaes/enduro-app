
import { ArrowLeft } from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import type { WeekData } from '../../types';
import { Heading, Label, DataValue } from '../ui/Typography';

interface WeekOverviewHeaderProps {
  week: WeekData;
  onBack: () => void;
}

export const WeekOverviewHeader: React.FC<WeekOverviewHeaderProps> = ({ week, onBack }) => {
  const startDate = new Date(week.startDate);
  const endDate = new Date(week.startDate);
  endDate.setDate(endDate.getDate() + 6);

  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const dateRange = `${formatDate(startDate)} — ${formatDate(endDate)}`;

  // Compliance Calculation
  const plannedTss = week.summary.plannedTss || 1;
  const compliance = Math.round((week.summary.totalTss / plannedTss) * 100);
  
  // Completed count vs Planned count
  const plannedSessions = week.days.reduce((acc, day) => acc + day.sessions.length, 0);
  
  let statusColor = 'text-zinc-500';
  if (plannedTss > 0) {
    if (compliance > 115) statusColor = 'text-status-warning';
    else if (compliance < 80) statusColor = 'text-zinc-400';
    else statusColor = 'text-status-completed';
  }

  return (
    <header className="flex flex-col gap-6 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 p-6 md:flex-row md:items-center md:justify-between transition-all z-20 sticky top-0">
      <div className="flex items-start gap-4">
        <button 
          onClick={onBack}
          className="group flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-zinc-400 transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-white active:scale-95"
          aria-label="Back to calendar"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        
        <div>
          <Label className="mb-1 text-zinc-500">Weekly Check-in</Label>
          <Heading level={1} className="text-xl md:text-2xl text-zinc-100">{dateRange}</Heading>
          <p className="mt-1 text-sm text-zinc-500 font-medium">
             {week.summary.completedCount} of {plannedSessions} sessions completed
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 rounded-xl border border-border bg-surface px-6 py-3 shadow-sm">
        <div className="flex flex-col">
           <Label className="text-zinc-500">Compliance</Label>
           <div className="flex items-baseline gap-1">
             <DataValue size="xl" className={statusColor}>{compliance}%</DataValue>
             <span className="text-xs text-zinc-600">Load</span>
           </div>
        </div>
        
        {/* Visual Indicator */}
        <div className="h-8 w-[1px] bg-border" />
        
        <div className="flex flex-col items-end">
           <Label className="text-zinc-500">Delta</Label>
           <div className="flex items-baseline gap-1">
              <DataValue size="lg" className="text-zinc-300">
                {week.summary.totalTss - week.summary.plannedTss > 0 ? '+' : ''}
                {week.summary.totalTss - week.summary.plannedTss}
              </DataValue>
              <span className="text-xs text-zinc-600">TSS</span>
           </div>
        </div>
      </div>
    </header>
  );
};
