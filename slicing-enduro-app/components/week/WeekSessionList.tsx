import React from 'react';
import { DayData, Session } from '../../types';
import { SessionCard } from '../calendar/SessionCard';
import { Heading, Label } from '../ui/Typography';
import { cn } from '../../lib/utils';

interface WeekSessionListProps {
  days: DayData[];
  onSessionClick: (session: Session) => void;
}

export const WeekSessionList: React.FC<WeekSessionListProps> = ({ days, onSessionClick }) => {
  return (
    <div className="space-y-6">
      <Heading level={3} className="text-zinc-400 px-1">Session Log</Heading>
      
      <div className="space-y-4">
        {days.map((day) => {
          const hasSessions = day.sessions.length > 0;
          if (!hasSessions) return null;

          const isToday = new Date().toDateString() === new Date(day.date).toDateString();

          return (
            <div key={day.date.toISOString()} className="flex flex-col gap-2">
               {/* Day Header */}
               <div className={cn(
                 "flex items-center gap-2 border-b border-border py-2 px-1",
                 isToday ? "border-zinc-700" : ""
               )}>
                  <Label className={cn("font-medium", isToday ? "text-white" : "text-zinc-500")}>
                    {day.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </Label>
                  {isToday && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
               </div>

               {/* Sessions */}
               <div className="grid gap-2">
                 {day.sessions.map((session) => (
                   <SessionCard 
                     key={session.id}
                     session={session}
                     onClick={() => onSessionClick(session)}
                   />
                 ))}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
