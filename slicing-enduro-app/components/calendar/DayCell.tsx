
import { Plus } from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import type { DayData, Session } from '../../types';
import { SessionCard } from './SessionCard';

interface DayCellProps {
  day: DayData;
  isToday: boolean;
  overlaySessions?: Session[];
  onAddSession: (date: Date) => void;
  onEditSession: (session: Session) => void;
}

export const DayCell: React.FC<DayCellProps> = ({ day, isToday, overlaySessions = [], onAddSession, onEditSession }) => {
  const isPast = day.date < new Date() && !isToday;
  const hasRealSessions = day.sessions.length > 0;
  
  return (
    <div 
      className={cn(
        "group/day relative flex min-h-[140px] flex-col border-r border-border p-2 transition-all duration-200",
        isToday ? "bg-zinc-900/40 ring-1 ring-inset ring-white/5" : "bg-transparent",
        !hasRealSessions && isPast ? "bg-zinc-950/30" : "hover:bg-zinc-900/30"
      )}
      onClick={() => onAddSession(day.date)}
    >
      {/* Date Header */}
      <div className="mb-3 flex items-start justify-between px-1">
        <span 
          className={cn(
            "text-xs font-medium tabular-nums transition-colors",
            isToday 
              ? "flex h-6 w-6 items-center justify-center rounded-full bg-accent text-white shadow-sm" 
              : "text-zinc-500 group-hover/day:text-zinc-300",
            isPast && !isToday && "text-zinc-700"
          )}
        >
          {day.date.getDate()}
        </span>
        
        {/* Add Button - Only visible on hover */}
        <button 
          className={cn(
             "flex h-6 w-6 items-center justify-center rounded-md text-zinc-500 opacity-0 transition-all hover:bg-zinc-800 hover:text-white group-hover/day:opacity-100",
             isPast && "hover:bg-zinc-800/50"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onAddSession(day.date);
          }}
          title="Add Session"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Sessions Stack */}
      <div className="flex flex-col gap-1.5 flex-1">
        {/* Real Sessions */}
        {day.sessions.map((session) => (
          <SessionCard 
            key={session.id} 
            session={session} 
            onClick={() => onEditSession(session)}
          />
        ))}

        {/* Overlay / Ghost Sessions */}
        {overlaySessions.map((session, idx) => (
          <SessionCard 
            key={`overlay-${session.id}-${idx}`}
            session={session}
            isOverlay={true}
          />
        ))}

        {/* Empty State Hit Area (implicit) */}
        {day.sessions.length === 0 && overlaySessions.length === 0 && (
           <div className="flex-1 min-h-[40px] w-full" />
        )}
      </div>
    </div>
  );
};
