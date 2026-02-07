
import { FileText, Activity } from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import { Heading, Label } from '../ui/Typography';

interface SessionNotesProps {
  notes?: string;
  rpe?: number;
}

export const SessionNotes: React.FC<SessionNotesProps> = ({ notes, rpe = 5 }) => {
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2 border-b border-border/50 pb-4">
         <FileText className="h-4 w-4 text-zinc-500" />
         <Heading level={4} className="text-zinc-300">Session Notes</Heading>
      </div>

      <div className="flex-1 mb-8">
        {notes ? (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-zinc-300 font-normal">
            {notes}
          </p>
        ) : (
          <div className="flex flex-col gap-2 py-4">
            <span className="text-sm italic text-zinc-600">No subjective notes recorded.</span>
          </div>
        )}
      </div>

      {/* RPE Visualization - Hardened */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
           <Label className="text-zinc-500">Perceived Exertion</Label>
           <span className="font-mono text-sm text-zinc-300">
             <span className={cn(
               "font-bold",
               rpe <= 4 ? "text-emerald-400" : (rpe <= 7 ? "text-amber-400" : "text-rose-400")
             )}>{rpe}</span>
             <span className="text-zinc-600">/10</span>
           </span>
        </div>
        
        <div className="flex h-3 w-full gap-1">
          {Array.from({ length: 10 }).map((_, i) => {
            const val = i + 1;
            const isActive = val <= rpe;
            
            // Subtle color logic - avoiding neon
            let activeColor = 'bg-emerald-600/80';
            if (val > 4) activeColor = 'bg-amber-600/80';
            if (val > 7) activeColor = 'bg-rose-600/80';

            return (
              <div 
                key={val}
                className={cn(
                  "flex-1 rounded-sm transition-all",
                  isActive ? activeColor : "bg-zinc-800/40"
                )}
                title={`RPE ${val}`}
              />
            );
          })}
        </div>
        
        <div className="flex justify-between px-0.5">
           <span className="text-[10px] font-medium uppercase text-zinc-600">Easy</span>
           <span className="text-[10px] font-medium uppercase text-zinc-600">Max</span>
        </div>
      </div>
    </div>
  );
};
