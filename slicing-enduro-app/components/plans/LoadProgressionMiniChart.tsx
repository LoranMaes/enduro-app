
import React from 'react';
import { cn } from '../../lib/utils';

interface LoadProgressionMiniChartProps {
  data: number[];
  height?: number;
}

export const LoadProgressionMiniChart: React.FC<LoadProgressionMiniChartProps> = ({ data, height = 120 }) => {
  const maxLoad = Math.max(...data, 100) * 1.1;

  return (
    <div className="relative w-full select-none" style={{ height }}>
      {/* Bars */}
      <div className="flex h-full items-end gap-1">
        {data.map((val, idx) => {
          const heightPct = (val / maxLoad) * 100;
          
          // Visual grouping for phases (mock logic: every 4th week is recovery)
          const isRecovery = (idx + 1) % 4 === 0;
          
          return (
            <div key={idx} className="group relative flex-1 flex flex-col justify-end h-full">
              <div 
                className={cn(
                  "w-full rounded-sm transition-all hover:brightness-125",
                  isRecovery ? "bg-zinc-700/50" : "bg-sky-900/60"
                )}
                style={{ height: `${heightPct}%` }}
              />
              
              {/* Tooltip-ish value on hover */}
              <div className="absolute bottom-full left-1/2 mb-1 -translate-x-1/2 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="bg-zinc-900 px-1.5 py-0.5 text-[9px] font-mono text-white rounded border border-zinc-700">
                  {val}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Axis Line */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-zinc-800" />
    </div>
  );
};
