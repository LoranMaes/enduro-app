import { Layers } from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import { Label } from '../ui/Typography';

interface PlanOverlayToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
  planName?: string;
  className?: string;
}

export const PlanOverlayToggle: React.FC<PlanOverlayToggleProps> = ({ 
  isEnabled, 
  onToggle, 
  planName = "Olympic Build",
  className 
}) => {
  return (
    <div className={cn(
      "group flex max-w-full items-center gap-2 rounded-lg border px-2 py-1.5 transition-all min-w-0",
      isEnabled ? "border-zinc-700 bg-surface" : "border-border bg-surface/50",
      className
    )}>
      <button 
        onClick={onToggle}
        type="button"
        className={cn(
          "flex shrink-0 items-center gap-2 rounded-md px-2 py-1 transition-all outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 select-none",
          isEnabled ? "bg-zinc-700 text-white shadow-sm" : "hover:bg-zinc-800 text-zinc-400"
        )}
        aria-pressed={isEnabled}
        aria-label={isEnabled ? "Hide plan overlay" : "Show plan overlay"}
      >
        <Layers className="w-3.5 h-3.5" />
        <span className="text-xs font-medium whitespace-nowrap">Overlay Plan</span>
      </button>

      {isEnabled && (
        <div className="hidden sm:flex min-w-0 flex-1 items-center gap-2 border-l border-zinc-700 pl-2 overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200">
           <Label className="hidden xl:block shrink-0 text-zinc-500 mb-0">Viewing</Label>
           <span className="truncate text-xs text-zinc-300 font-medium leading-none" title={planName}>
             {planName}
           </span>
        </div>
      )}
    </div>
  );
};