import React from 'react';
import { WeekData } from '../../types';
import { MetricCard } from '../ui/MetricCard';

interface ConsistencySummaryProps {
  weeks: WeekData[];
}

export const ConsistencySummary: React.FC<ConsistencySummaryProps> = ({ weeks }) => {
  // Calculate Compliance
  // On Target = 80% to 115% of Planned TSS
  
  let onTargetCount = 0;
  let currentStreak = 0;
  let streakBroken = false;

  // Process from newest to oldest for streak
  const sortedWeeksDesc = [...weeks].sort((a, b) => b.startDate.getTime() - a.startDate.getTime());

  sortedWeeksDesc.forEach((week) => {
    const planned = week.summary.plannedTss || 1;
    const actual = week.summary.totalTss;
    const ratio = actual / planned;
    
    const isOnTarget = ratio >= 0.8 && ratio <= 1.15;
    
    if (isOnTarget) {
      onTargetCount++;
      if (!streakBroken) currentStreak++;
    } else {
      // Don't break streak for future weeks (0 TSS), only past/completed
      if (week.summary.totalTss > 0 || new Date(week.startDate) < new Date()) {
         streakBroken = true;
      }
    }
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <MetricCard 
          label="Consistency"
          value={onTargetCount}
          subValue={`of ${weeks.length} weeks`}
          unit="wks"
          className="bg-surface/50"
        />
        <MetricCard 
          label="Current Streak"
          value={currentStreak}
          unit="wks"
          subValue={currentStreak > 3 ? "Solid base building." : "Keep showing up."}
          className={currentStreak > 3 ? "border-emerald-900/30 bg-emerald-950/10" : "bg-surface/50"}
        />
      </div>
    </div>
  );
};
