
import React from 'react';
import { cn } from '../../lib/utils';
import { Label, DataValue } from './Typography';

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
  highlight?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  label, 
  value, 
  unit, 
  subValue, 
  className,
  highlight = false
}) => {
  return (
    <div className={cn(
      "flex flex-col justify-between rounded-xl border p-4 transition-all", 
      highlight 
        ? "bg-zinc-800/50 border-zinc-700" 
        : "bg-surface border-border hover:border-zinc-700",
      className
    )}>
      <Label className="mb-2 text-zinc-500/80">{label}</Label>
      
      <div className="mt-auto">
        <div className="flex items-baseline gap-1.5">
          <DataValue size="xl" className={cn("tracking-tight", highlight ? "text-white" : "text-zinc-200")}>
            {value}
          </DataValue>
          {unit && <span className="text-xs font-mono font-medium text-zinc-600">{unit}</span>}
        </div>
        
        {subValue && (
          <div className="mt-1.5 border-t border-zinc-800/50 pt-1.5">
             <span className="text-[10px] font-mono text-zinc-500 tracking-tight">
              {subValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
