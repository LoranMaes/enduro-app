
import React from 'react';
import { cn, formatDuration } from '../../lib/utils';
import { DataValue, Label } from '../ui/Typography';

export interface WeekSummaryProps {
  totalDuration: number;
  totalTss: number;
  plannedTss?: number;
  completedSessions: number;
  plannedSessions: number;
  isCurrentWeek?: boolean;
}

export const WeekSummary: React.FC<WeekSummaryProps> = ({
  totalDuration,
  totalTss,
  plannedTss = 0,
  completedSessions,
  plannedSessions,
  isCurrentWeek = false
}) => {
  const compliance = plannedTss > 0 ? Math.round((totalTss / plannedTss) * 100) : 0;
  const hasData = totalDuration > 0 || totalTss > 0 || plannedTss > 0;
  
  // Design System Status Logic
  let statusColor = 'text-zinc-500';
  let barColor = 'bg-zinc-700';
  
  if (plannedTss > 0) {
    if (compliance > 115) {
      statusColor = 'text-status-warning';
      barColor = 'bg-status-warning';
    } else if (compliance < 80) {
      statusColor = 'text-zinc-400';
      barColor = 'bg-zinc-600';
    } else {
      statusColor = 'text-status-completed';
      barColor = 'bg-status-completed';
    }
  }

  return (
    <div className={cn(
      "flex flex-col gap-5 p-4 h-full min-h-[140px] justify-center transition-colors",
      isCurrentWeek ? "bg-zinc-900/30" : "bg-transparent hover:bg-zinc-900/10"
    )}>
      
      {/* Metric 1: Duration */}
      <div className="flex flex-col">
        <Label className="mb-1 text-zinc-600">Volume</Label>
        <DataValue size="md" className={cn(hasData ? "text-zinc-200" : "text-zinc-700")}>
          {hasData ? formatDuration(totalDuration) : "—"}
        </DataValue>
      </div>

      {/* Metric 2: TSS / Load */}
      <div className="flex flex-col">
        <Label className="mb-1 text-zinc-600">Load</Label>
        <div className="flex items-baseline gap-1.5">
          <DataValue size="md" className={cn("transition-colors font-medium", hasData ? statusColor : "text-zinc-700")}>
            {hasData ? totalTss : "—"}
          </DataValue>
          {plannedTss > 0 && (
            <span className="font-mono text-[10px] text-zinc-600">
              / {plannedTss}
            </span>
          )}
        </div>
      </div>

      {/* Metric 3: Compliance & Progress */}
      <div className="flex flex-col mt-auto pt-3 border-t border-border">
        <div className="flex justify-between items-center mb-2">
           <Label className="text-zinc-600">Compliance</Label>
           <span className={cn("font-mono text-[9px]", hasData ? "text-zinc-500" : "text-zinc-800")}>
             {completedSessions}/{plannedSessions}
           </span>
        </div>
        
        {/* Compliance Bar */}
        <div className="h-1.5 w-full rounded-full bg-zinc-800/50 overflow-hidden">
          {plannedTss > 0 && (
             <div 
               className={cn("h-full transition-all duration-500 rounded-full", barColor)}
               style={{ width: `${Math.min(compliance, 100)}%` }}
             />
          )}
        </div>
      </div>
    </div>
  );
};
