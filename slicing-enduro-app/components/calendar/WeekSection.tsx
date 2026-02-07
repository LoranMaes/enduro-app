
import React from 'react';
import { cn, formatDate } from '../../lib/utils';
import type { DayData, Session } from '../../types';
import { Label } from '../ui/Typography';
import { DayCell } from './DayCell';
import type { WeekSummaryProps } from './WeekSummary';
import { WeekSummary } from './WeekSummary';

export interface WeekSectionProps {
  weekStart: Date;
  days: DayData[];
  summary: WeekSummaryProps;
  isCurrentWeek?: boolean;
  overlaySessions?: Record<string, Session[]>; // Map of date string -> sessions
  onAddSession: (date: Date) => void;
  onEditSession: (session: Session) => void;
}

export const WeekSection: React.FC<WeekSectionProps> = ({
  weekStart,
  days,
  summary,
  isCurrentWeek = false,
  overlaySessions = {},
  onAddSession,
  onEditSession
}) => {
  // Date Formatting for Header
  const endOfWeek = new Date(weekStart);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  
  const formatDateRange = (start: Date, end: Date) => {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} — ${end.toLocaleDateString('en-US', opts)}`;
  };

  return (
    <div className={cn(
      "flex flex-col border-b border-border transition-colors",
      isCurrentWeek ? "bg-zinc-900/10" : "bg-background"
    )}>
      {/* Week Header */}
      <div className={cn(
        "sticky top-0 z-10 flex w-full items-center justify-between border-b border-border bg-background/95 backdrop-blur-sm px-4 py-1.5",
        isCurrentWeek && "border-l-2 border-l-accent"
      )}>
         <div className="flex items-center gap-2">
            <Label className={cn("font-medium", isCurrentWeek ? "text-zinc-200" : "text-zinc-500")}>
                Week of {formatDateRange(weekStart, endOfWeek)}
            </Label>
         </div>
         {isCurrentWeek && (
            <span className="flex h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
         )}
      </div>

      {/* Week Grid Layout */}
      <div className="flex flex-col md:grid md:grid-cols-[repeat(7,1fr)_140px] md:divide-x md:divide-border">
        
        {/* Days Grid */}
        {days.map((day) => {
          const isToday = new Date().toDateString() === new Date(day.date).toDateString();
          const dayString = formatDate(day.date);
          const dayOverlaySessions = overlaySessions[dayString] || [];

          return (
            <div key={day.date.toISOString()} className="min-h-[100px] md:min-h-[160px] border-b border-border md:border-b-0 last:border-b-0 md:last:border-b-auto">
               <DayCell 
                 day={day} 
                 isToday={isToday} 
                 overlaySessions={dayOverlaySessions}
                 onAddSession={onAddSession} 
                 onEditSession={onEditSession}
               />
            </div>
          );
        })}

        {/* Summary Column */}
        <div className="border-t border-border md:border-t-0 bg-surface/30 md:bg-transparent">
          <WeekSummary {...summary} isCurrentWeek={isCurrentWeek} />
        </div>
      </div>
    </div>
  );
};
