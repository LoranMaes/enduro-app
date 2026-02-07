import React from 'react';
import { WeekData } from '../../types';
import { cn } from '../../lib/utils';
import { DataValue } from '../ui/Typography';
import { ChevronRight } from 'lucide-react';

interface WeeklyListItemProps {
  week: WeekData;
  onClick: () => void;
}

export const WeeklyListItem: React.FC<WeeklyListItemProps> = ({ week, onClick }) => {
  const planned = week.summary.plannedTss || 1;
  const actual = week.summary.totalTss;
  const compliance = Math.round((actual / planned) * 100);

  const endDate = new Date(week.startDate);
  endDate.setDate(endDate.getDate() + 6);
  
  const formatDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Color Logic (Same as WeekSummary)
  let statusColor = 'bg-zinc-700';
  let textColor = 'text-zinc-500';
  
  if (planned > 0) {
    if (compliance > 115) {
      statusColor = 'bg-amber-500';
      textColor = 'text-amber-500';
    } else if (compliance < 80) {
      statusColor = 'bg-zinc-600';
      textColor = 'text-zinc-400';
    } else {
      statusColor = 'bg-emerald-500';
      textColor = 'text-emerald-500';
    }
  }

  return (
    <div 
      onClick={onClick}
      className="group flex cursor-pointer items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 transition-colors hover:border-zinc-600 hover:bg-zinc-800/50"
    >
      {/* Date */}
      <div className="flex flex-col">
        <span className="text-xs font-medium text-zinc-300">
           {formatDate(week.startDate)} — {formatDate(endDate)}
        </span>
        <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
           Week {week.id.replace('week-', '')}
        </span>
      </div>

      {/* Load Bar & Value */}
      <div className="flex items-center gap-4">
         <div className="hidden flex-col items-end gap-1 sm:flex">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-800">
               <div 
                 className={cn("h-full", statusColor)} 
                 style={{ width: `${Math.min(compliance, 100)}%` }}
               />
            </div>
         </div>
         
         <div className="flex w-20 flex-col items-end">
            <DataValue size="sm" className="text-zinc-200">{actual} TSS</DataValue>
            <span className={cn("text-[10px] font-mono", textColor)}>{compliance}%</span>
         </div>

         <ChevronRight className="h-4 w-4 text-zinc-600 group-hover:text-zinc-400" />
      </div>
    </div>
  );
};
