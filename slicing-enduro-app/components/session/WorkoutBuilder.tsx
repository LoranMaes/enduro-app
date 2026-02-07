import React from 'react';
import { WorkoutStep } from '../../types';
import { cn } from '../../lib/utils';
import { GripVertical, Trash2, Plus } from 'lucide-react';

interface WorkoutBuilderProps {
  steps: WorkoutStep[];
  readOnly?: boolean;
  onUpdate?: (steps: WorkoutStep[]) => void;
}

export const WorkoutBuilder: React.FC<WorkoutBuilderProps> = ({ steps, readOnly = false, onUpdate }) => {
  
  // A mini visualization of the workout structure
  const TotalTime = steps.reduce((acc, s) => acc + s.durationSeconds, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Visualizer */}
      <div className="h-16 w-full flex items-end gap-[1px] rounded-md bg-zinc-900/50 p-2 overflow-hidden border border-zinc-800/50">
        {steps.map((step) => {
          const width = (step.durationSeconds / TotalTime) * 100;
          const height = Math.min((step.targetPower || 50) / 1.5, 100); // Scale height by power
          
          let color = 'bg-zinc-600'; // Recovery/Cooldown
          if (step.type === 'active') color = 'bg-sky-500';
          if (step.type === 'warmup') color = 'bg-zinc-500';
          if ((step.targetPower || 0) > 100) color = 'bg-amber-500'; // Hard efforts

          return (
            <div 
              key={step.id}
              style={{ width: `${width}%`, height: `${height}%` }}
              className={cn("min-w-[4px] rounded-sm transition-all hover:brightness-110", color)}
              title={`${step.type}: ${Math.floor(step.durationSeconds / 60)}m @ ${step.targetPower}%`}
            />
          );
        })}
      </div>

      {/* Step List */}
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div key={step.id} className="group flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900 p-3 hover:border-zinc-700 transition-colors">
            {!readOnly && (
               <div className="text-zinc-600 cursor-grab hover:text-zinc-400">
                <GripVertical className="w-4 h-4" />
              </div>
            )}
            
            <div className="flex-1 grid grid-cols-12 gap-4 items-center">
              {/* Type Badge */}
              <div className="col-span-3">
                 <span className={cn(
                   "text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-sm",
                   step.type === 'active' ? "bg-sky-950 text-sky-400" : "bg-zinc-800 text-zinc-400"
                 )}>
                   {step.type}
                 </span>
              </div>
              
              {/* Duration */}
              <div className="col-span-3 font-mono text-sm text-zinc-200">
                {Math.floor(step.durationSeconds / 60)}m 00s
              </div>

              {/* Intensity */}
              <div className="col-span-6 font-mono text-sm text-zinc-400 flex justify-end">
                {step.targetPower ? `${step.targetPower}% FTP` : 'Z1 Recovery'}
              </div>
            </div>

            {!readOnly && (
              <button className="text-zinc-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        
        {!readOnly && (
          <button className="w-full py-2 border border-dashed border-zinc-700 rounded-md text-xs text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 hover:bg-zinc-900/50 transition-all flex items-center justify-center gap-2">
            <Plus className="w-3 h-3" />
            Add Interval Block
          </button>
        )}
      </div>
    </div>
  );
};