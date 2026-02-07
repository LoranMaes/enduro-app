
import { ChevronRight, Clock, Activity } from 'lucide-react';
import React from 'react';
import { SPORT_ICONS, SPORT_COLORS } from '../../constants';
import { cn } from '../../lib/utils';
import type { TrainingPlan } from '../../types';
import { Heading, Label, DataValue } from '../ui/Typography';

interface PlanCardProps {
  plan: TrainingPlan;
  onClick: () => void;
}

export const PlanCard: React.FC<PlanCardProps> = ({ plan, onClick }) => {
  const isTri = plan.sport === 'triathlon';
  const icon = SPORT_ICONS[plan.sport] || SPORT_ICONS.rest;
  const colorClass = SPORT_COLORS[plan.sport] || 'text-zinc-400';
  
  // Status Logic
  const isActive = plan.status === 'active';
  const isCompleted = plan.status === 'completed';

  return (
    <div 
      onClick={onClick}
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border p-5 transition-all duration-300",
        isActive 
          ? "border-accent/40 bg-zinc-900/40 hover:border-accent/60" 
          : "border-border bg-surface hover:border-zinc-600 hover:bg-zinc-800/60"
      )}
    >
      {/* Active Indicator */}
      {isActive && (
        <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-2.5 py-1">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent"></span>
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-accent">Active Plan</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-start gap-4">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg border border-white/5 bg-zinc-900",
          colorClass
        )}>
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })}
        </div>
        <div>
          <Label className="mb-1 text-zinc-500">{plan.sport} • {plan.level}</Label>
          <Heading level={3} className="group-hover:text-white">{plan.title}</Heading>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="mt-auto grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
        <div>
          <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
            <Clock className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Duration</span>
          </div>
          <DataValue size="md" className="text-zinc-300">{plan.durationWeeks} Weeks</DataValue>
        </div>
        <div>
           <div className="flex items-center gap-1.5 text-zinc-500 mb-1">
            <Activity className="h-3 w-3" />
            <span className="text-[10px] uppercase tracking-wider font-medium">Avg Load</span>
          </div>
          <DataValue size="md" className="text-zinc-300">{plan.avgTssPerWeek} TSS/wk</DataValue>
        </div>
      </div>
      
      {/* Hover visual cue */}
      <ChevronRight className="absolute bottom-5 right-5 h-5 w-5 text-zinc-700 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-zinc-400" />
    </div>
  );
};