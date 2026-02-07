
import React from 'react';
import { SPORT_COLORS, SPORT_ICONS } from '../../constants';
import { cn } from '../../lib/utils';
import type { PlanWeekStructure } from '../../types';
import { Heading, Label, DataValue } from '../ui/Typography';

interface WeeklyStructureTableProps {
  structure: PlanWeekStructure[];
}

export const WeeklyStructureTable: React.FC<WeeklyStructureTableProps> = ({ structure }) => {
  return (
    <div className="space-y-4">
      <Heading level={3} className="text-zinc-400">Typical Week</Heading>
      
      <div className="grid grid-cols-1 gap-2 md:grid-cols-7">
        {structure.map((day, idx) => {
          const isRest = day.sport === 'rest';
          const colorClass = SPORT_COLORS[day.sport];

          return (
            <div 
              key={idx} 
              className={cn(
                "flex flex-col gap-2 rounded-lg border p-3 transition-colors",
                isRest 
                  ? "border-dashed border-zinc-800 bg-transparent opacity-60" 
                  : "border-border bg-surface hover:border-zinc-700"
              )}
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-1">
                <span className="text-xs font-medium text-zinc-500">{day.day}</span>
                {!isRest && (
                  <div className={cn(colorClass)}>
                    {React.cloneElement(SPORT_ICONS[day.sport] as React.ReactElement<{ className?: string }>, { className: "w-3 h-3" })}
                  </div>
                )}
              </div>
              
              <div className="flex flex-col gap-1">
                <span className={cn(
                  "text-xs font-medium truncate",
                  isRest ? "text-zinc-600" : "text-zinc-300"
                )}>
                  {day.focus}
                </span>
                
                {!isRest && (
                  <DataValue size="sm" className="text-zinc-500">
                    {Math.floor(day.durationMin / 60)}h {day.durationMin % 60 > 0 ? `${day.durationMin % 60}m` : ''}
                  </DataValue>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};