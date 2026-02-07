
import React from 'react';
import { Heading, Label, DataValue } from '../ui/Typography';
import { cn } from '../../lib/utils';

interface ProgressHeaderProps {
  range: number; // number of weeks
  setRange: (range: number) => void;
  avgTss: number;
  avgDurationMinutes: number;
}

export const ProgressHeader: React.FC<ProgressHeaderProps> = ({ 
  range, 
  setRange, 
  avgTss, 
  avgDurationMinutes 
}) => {
  const formatTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    return `${h}h ${mins % 60}m`;
  };

  return (
    <header className="flex flex-col gap-6 border-b border-border bg-background p-6 md:flex-row md:items-end md:justify-between sticky top-0 z-10">
      <div className="space-y-2">
        <Label>Long Term Analysis</Label>
        <Heading level={1}>Training Progress</Heading>
      </div>

      <div className="flex flex-col gap-6 md:flex-row md:items-center">
        {/* Averages */}
        <div className="flex gap-8 md:border-r md:border-zinc-800 md:pr-8">
          <div>
            <Label className="mb-1 text-zinc-500">Avg Load</Label>
            <div className="flex items-baseline gap-1">
              <DataValue size="lg" className="text-zinc-200">{Math.round(avgTss)}</DataValue>
              <span className="text-xs text-zinc-600 font-mono">TSS/wk</span>
            </div>
          </div>
          <div>
            <Label className="mb-1 text-zinc-500">Avg Vol</Label>
            <div className="flex items-baseline gap-1">
              <DataValue size="lg" className="text-zinc-200">{formatTime(Math.round(avgDurationMinutes))}</DataValue>
              <span className="text-xs text-zinc-600 font-mono">/wk</span>
            </div>
          </div>
        </div>

        {/* Range Selector - Segmented Control Style */}
        <div className="flex items-center rounded-lg border border-border bg-surface/50 p-1">
          {[4, 8, 12, 24].map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "min-w-[3rem] rounded-md py-1.5 text-xs font-medium transition-all",
                range === r 
                  ? "bg-zinc-800 text-white shadow-sm ring-1 ring-white/5" 
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
              )}
            >
              {r}w
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
