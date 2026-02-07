import React from 'react';
import { SPORT_ICONS, SPORT_COLORS } from '../../constants';
import { cn, formatDuration } from '../../lib/utils';
import type { DayData, SportType } from '../../types';
import { Heading, Label, DataValue } from '../ui/Typography';

interface SportDistributionProps {
  days: DayData[];
}

export const SportDistribution: React.FC<SportDistributionProps> = ({ days }) => {
  // Aggregate duration by sport
  const distribution = days.flatMap(d => d.sessions).reduce((acc, session) => {
    const sport = session.sport;
    if (session.status === 'completed' || session.status === 'planned') {
       acc[sport] = (acc[sport] || 0) + session.durationMinutes;
       acc.total = (acc.total || 0) + session.durationMinutes;
    }
    return acc;
  }, { total: 0 } as Record<string, number>);

  const sports: SportType[] = ['swim', 'bike', 'run', 'gym'];

  return (
    <div className="space-y-4">
      <Heading level={3} className="text-zinc-400">Distribution</Heading>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
        {sports.map(sport => {
          const duration = distribution[sport] || 0;
          const percentage = distribution.total > 0 ? Math.round((duration / distribution.total) * 100) : 0;
          
          if (percentage === 0) return null;

          return (
            <div key={sport} className="flex items-center gap-4">
              {/* Icon */}
              <div className={cn("flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900", SPORT_COLORS[sport])}>
                {React.cloneElement(SPORT_ICONS[sport] as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
              </div>

              {/* Bar & Label */}
              <div className="flex flex-1 flex-col gap-1">
                 <div className="flex justify-between">
                    <span className="text-xs font-medium capitalize text-zinc-300">{sport}</span>
                    <DataValue size="sm" className="text-zinc-400">{percentage}%</DataValue>
                 </div>
                 <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div 
                      className={cn("absolute left-0 top-0 h-full opacity-60", SPORT_COLORS[sport].replace('text-', 'bg-'))}
                      style={{ width: `${percentage}%` }}
                    />
                 </div>
              </div>

              {/* Value */}
              <div className="w-16 text-right">
                <DataValue size="sm" className="text-zinc-400">{formatDuration(duration)}</DataValue>
              </div>
            </div>
          );
        })}
        {distribution.total === 0 && (
            <div className="py-4 text-center text-xs text-zinc-600 italic">
                No active volume recorded.
            </div>
        )}
      </div>
    </div>
  );
};
