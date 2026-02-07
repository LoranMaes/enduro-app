
import { ArrowLeft, MoreHorizontal, Share2 } from 'lucide-react';
import React from 'react';
import { SPORT_ICONS, SPORT_COLORS } from '../../constants';
import { cn, formatDuration, formatDate } from '../../lib/utils';
import type { Session } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { Heading, Label, DataValue } from '../ui/Typography';

interface SessionAnalysisHeaderProps {
  session: Session;
  onBack: () => void;
}

export const SessionAnalysisHeader: React.FC<SessionAnalysisHeaderProps> = ({ session, onBack }) => {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 transition-all">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
        
        {/* Left: Navigation & Context */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="group flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface text-zinc-400 transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-white active:scale-95"
            aria-label="Return to calendar"
            title="Return to Calendar"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="h-8 w-[1px] bg-border mx-1 hidden md:block" />

          <div className="flex items-center gap-3">
             <div className={cn(
               "flex h-8 w-8 items-center justify-center rounded-md border border-white/5 bg-zinc-900 shadow-sm", 
               SPORT_COLORS[session.sport]
             )}>
               {React.cloneElement(SPORT_ICONS[session.sport] as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
             </div>
             
             <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <Heading level={3} className="text-sm font-semibold text-zinc-100 leading-tight">
                    {session.title}
                  </Heading>
                  <StatusBadge status={session.status} className="scale-75 origin-left opacity-80" />
                </div>
                <span className="text-xs text-zinc-500 font-mono tracking-tight">
                  {formatDate(new Date(session.date))}
                </span>
             </div>
          </div>
        </div>

        {/* Right: Quick Metrics & Actions */}
        <div className="flex items-center gap-6">
           {/* Desktop Context Metrics - Subtle */}
           <div className="hidden items-center gap-6 md:flex">
              <div className="flex flex-col items-end">
                 <Label className="text-[9px] text-zinc-600 mb-0.5">Time</Label>
                 <DataValue size="md" className="text-zinc-300">{formatDuration(session.durationMinutes)}</DataValue>
              </div>
              <div className="h-6 w-[1px] bg-zinc-800" />
              <div className="flex flex-col items-end">
                 <Label className="text-[9px] text-zinc-600 mb-0.5">Load</Label>
                 <DataValue size="md" className="text-zinc-300">{session.tss}</DataValue>
              </div>
           </div>

           {/* Action Group */}
           <div className="flex items-center gap-1 pl-2 md:pl-6 md:border-l md:border-zinc-800">
             <button 
               className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
               title="Share Session"
             >
                <Share2 className="h-3.5 w-3.5" />
             </button>
             <button 
               className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors"
               title="More Options"
             >
                <MoreHorizontal className="h-3.5 w-3.5" />
             </button>
           </div>
        </div>
      </div>
    </header>
  );
};
