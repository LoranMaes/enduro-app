
import { ChevronRight, Activity, Clock } from 'lucide-react';
import React from 'react';
import { SPORT_ICONS, SPORT_COLORS } from '../../constants';
import { cn } from '../../lib/utils';
import type { Athlete } from '../../types';
import { Heading, Label, DataValue } from '../ui/Typography';

interface AthleteCardProps {
  athlete: Athlete;
  onClick: () => void;
}

export const AthleteCard: React.FC<AthleteCardProps> = ({ athlete, onClick }) => {
  const icon = SPORT_ICONS[athlete.primarySport] || SPORT_ICONS.run;
  const colorClass = SPORT_COLORS[athlete.primarySport] || 'text-zinc-400';
  
  // Status Logic
  const isActive = athlete.status === 'active';

  return (
    <div 
      onClick={onClick}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-surface p-5 transition-all duration-300 hover:border-zinc-600 hover:bg-zinc-800/60"
    >
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg border border-white/5 bg-zinc-900",
            colorClass
          )}>
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })}
          </div>
          <div>
            <Heading level={3} className="group-hover:text-white">{athlete.name}</Heading>
            <div className="mt-1 flex items-center gap-2">
               <span className={cn(
                  "inline-block h-1.5 w-1.5 rounded-full",
                  isActive ? "bg-emerald-500" : "bg-zinc-600"
               )} />
               <Label className="text-zinc-500">{athlete.status}</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="mt-auto grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
        <div>
          <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
            <Activity className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Avg Load</span>
          </div>
          <DataValue size="md" className="text-zinc-300">{athlete.metrics.avgWeeklyTss} TSS</DataValue>
        </div>
        <div>
           <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
            <Clock className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Volume</span>
          </div>
          <DataValue size="md" className="text-zinc-300">{athlete.metrics.avgWeeklyHours}h/wk</DataValue>
        </div>
      </div>
      
      {/* Hover visual cue */}
      <ChevronRight className="absolute bottom-5 right-5 h-5 w-5 text-zinc-700 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-zinc-400" />
    </div>
  );
};
