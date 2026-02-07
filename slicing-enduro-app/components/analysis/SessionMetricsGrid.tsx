import React from 'react';
import { MetricCard, MetricCardProps } from '../ui/MetricCard';

interface SessionMetricsGridProps {
  metrics: MetricCardProps[];
}

export const SessionMetricsGrid: React.FC<SessionMetricsGridProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {metrics.map((metric) => (
        <MetricCard 
          key={metric.label}
          {...metric}
        />
      ))}
    </div>
  );
};
