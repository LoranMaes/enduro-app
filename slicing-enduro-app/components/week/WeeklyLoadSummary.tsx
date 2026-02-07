import React from 'react';
import { MetricCard } from '../ui/MetricCard';
import { formatDuration } from '../../lib/utils';
import { Heading } from '../ui/Typography';

interface WeeklyLoadSummaryProps {
  totalDuration: number;
  totalTss: number;
  plannedTss: number;
}

export const WeeklyLoadSummary: React.FC<WeeklyLoadSummaryProps> = ({ 
  totalDuration, 
  totalTss, 
  plannedTss 
}) => {
  return (
    <div className="space-y-4">
      <Heading level={3} className="text-zinc-400">Load Profile</Heading>
      <div className="grid grid-cols-2 gap-4">
        <MetricCard 
          label="Total Volume"
          value={formatDuration(totalDuration)}
          subValue="Hours"
          className="bg-surface/50"
        />
        <MetricCard 
          label="Training Stress"
          value={totalTss}
          unit="TSS"
          subValue={`Planned: ${plannedTss}`}
          className="bg-surface/50"
        />
      </div>
    </div>
  );
};
