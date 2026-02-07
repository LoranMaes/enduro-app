
import { Activity, Droplets, Bike, Footprints, Dumbbell, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import React from 'react';
import { cn, formatDuration } from '../../lib/utils';
import type { Session, SportType, SessionStatus } from '../../types';
import { Heading, DataValue, Label } from '../ui/Typography';

export interface SessionCardProps {
  sport?: SportType;
  title?: string;
  duration?: string | number;
  tss?: number;
  status?: SessionStatus;
  intensity?: 'easy' | 'steady' | 'tempo' | 'threshold' | 'vo2';
  compact?: boolean;
  isToday?: boolean;
  isOverlay?: boolean;
  onClick?: () => void;
  session?: Session;
}

const SPORT_CONFIG: Record<string, { icon: any, color: string, border: string }> = {
  swim: { icon: Droplets, color: 'text-sky-400', border: 'bg-sky-400' },
  bike: { icon: Bike, color: 'text-violet-400', border: 'bg-violet-400' },
  run: { icon: Footprints, color: 'text-rose-400', border: 'bg-rose-400' },
  gym: { icon: Dumbbell, color: 'text-amber-400', border: 'bg-amber-400' },
  rest: { icon: Activity, color: 'text-zinc-500', border: 'bg-zinc-500' },
};

const INTENSITY_CONFIG: Record<string, string> = {
  easy: 'bg-emerald-500',
  steady: 'bg-sky-500',
  tempo: 'bg-amber-500',
  threshold: 'bg-orange-500',
  vo2: 'bg-red-500',
};

export const SessionCard: React.FC<SessionCardProps> = ({
  sport,
  title,
  duration,
  tss,
  status,
  intensity,
  compact = false,
  isToday = false,
  isOverlay = false,
  onClick,
  session,
}) => {
  const displaySport = session?.sport || sport || 'run';
  const displayTitle = session?.title || title || '';
  const displayDuration = session?.durationMinutes !== undefined ? session.durationMinutes : duration;
  const displayTss = session?.tss !== undefined ? session.tss : tss;
  const displayStatus = session?.status || status || 'planned';

  const SportIcon = SPORT_CONFIG[displaySport]?.icon || Activity;
  const sportColors = SPORT_CONFIG[displaySport] || { color: 'text-zinc-500', border: 'bg-zinc-500' };

  // UX Hardening: Distinct visual states
  const statusStyles: Record<string, string> = {
    // Planned: Clean, outlined, feels like a blueprint
    planned: "bg-surface border-border hover:border-zinc-600 text-zinc-400 hover:text-zinc-300",
    
    // Completed: Solid, elevated, feels finished
    completed: "bg-zinc-800 border-zinc-700 hover:border-zinc-600 hover:bg-zinc-700/80 text-zinc-100 shadow-sm",
    
    // Skipped: De-emphasized, error-state
    skipped: "bg-red-950/5 border-red-900/10 hover:border-red-900/30 text-zinc-600 opacity-80",
    
    // Partial: Warning state
    partial: "bg-amber-950/10 border-amber-900/20 hover:border-amber-900/40 text-zinc-300",
  };

  let currentStatusStyle = statusStyles[displayStatus] || statusStyles.planned;

  // Overlay / Ghost Style Override
  if (isOverlay) {
    currentStatusStyle = "bg-transparent border-dashed border-zinc-700/50 opacity-50 hover:opacity-80 hover:border-zinc-500 hover:bg-zinc-900/20";
  }

  const formattedDuration = typeof displayDuration === 'number' ? formatDuration(displayDuration) : displayDuration;
  const isSkipped = displayStatus === 'skipped';

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        if (!isOverlay) onClick?.();
      }}
      className={cn(
        "group relative flex w-full cursor-pointer flex-col overflow-hidden rounded-md border py-2 pl-3 pr-2 transition-all duration-200",
        currentStatusStyle,
        compact ? "min-h-[56px] gap-0.5" : "min-h-[72px] gap-1",
        isOverlay && "cursor-default"
      )}
    >
      {/* Sport Accent Strip (Left) */}
      <div className={cn(
        "absolute left-0 top-0 bottom-0 w-1", 
        isOverlay ? "bg-zinc-700" : (isSkipped ? "bg-red-900/30" : sportColors.border)
      )} />

      {/* Header Row */}
      <div className="flex items-start justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <SportIcon className={cn(
            "w-3.5 h-3.5 flex-shrink-0", 
            isOverlay || isSkipped ? "text-zinc-500" : sportColors.color
          )} />
          <span className={cn(
            "truncate font-sans font-medium tracking-tight",
            compact ? "text-xs" : "text-sm",
            isSkipped && "line-through decoration-zinc-700 text-zinc-600",
            displayStatus === 'completed' ? "text-zinc-100" : "text-zinc-400"
          )}>
            {displayTitle}
          </span>
        </div>
        
        {/* Status Indicators (Icon Only) */}
        {!isOverlay && !compact && (
          <div className="flex-shrink-0 pt-0.5">
             {displayStatus === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
             {displayStatus === 'skipped' && <XCircle className="w-3.5 h-3.5 text-red-500/50" />}
             {displayStatus === 'partial' && <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="flex items-baseline gap-3 mt-auto">
        <DataValue size={compact ? 'sm' : 'md'} className={cn(
          isSkipped ? "text-zinc-600" : (displayStatus === 'completed' ? "text-white" : "text-zinc-400")
        )}>
          {formattedDuration}
        </DataValue>
        
        {displayTss !== undefined && displayTss > 0 && (
          <DataValue size={compact ? 'sm' : 'md'} className={cn(
             isSkipped ? "text-zinc-700" : "text-zinc-500"
          )}>
            {displayTss} TSS
          </DataValue>
        )}
      </div>

      {/* Intensity Dot (Bottom Right) */}
      {!compact && !isOverlay && !isSkipped && intensity && INTENSITY_CONFIG[intensity] && (
        <div 
          className={cn("absolute bottom-2 right-2 h-1.5 w-1.5 rounded-full opacity-60", INTENSITY_CONFIG[intensity])} 
          title={`Intensity: ${intensity}`}
        />
      )}
    </div>
  );
};
