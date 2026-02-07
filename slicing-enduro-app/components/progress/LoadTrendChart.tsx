import React, { useMemo } from 'react';
import { WeekData } from '../../types';
import { cn } from '../../lib/utils';

interface LoadTrendChartProps {
  weeks: WeekData[];
  height?: number;
}

export const LoadTrendChart: React.FC<LoadTrendChartProps> = ({ weeks, height = 300 }) => {
  const { paths, points, maxTss } = useMemo(() => {
    if (!weeks.length) return { 
        paths: { actual: '', target: '', targetDash: '' }, 
        points: [], 
        maxTss: 100 
    };

    const sortedWeeks = [...weeks].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    
    // Determine Y-axis scale
    const maxActual = Math.max(...sortedWeeks.map(w => w.summary.totalTss));
    const maxPlanned = Math.max(...sortedWeeks.map(w => w.summary.plannedTss));
    const ceiling = Math.max(maxActual, maxPlanned, 100) * 1.2; // 20% headroom, min 100

    const step = 100 / (sortedWeeks.length - 1 || 1);

    // Generate Path Points (0-100 coordinate space)
    const pointsActual = sortedWeeks.map((w, i) => {
      const x = i * step;
      const y = 100 - (w.summary.totalTss / ceiling) * 100;
      return `${x},${y}`;
    });

    // Generate Target Band (Tunnel)
    const upperPoints: string[] = [];
    const lowerPoints: string[] = [];
    const targetDashPoints: string[] = [];

    // Generate Data Points for HTML Overlay
    const overlayPoints = sortedWeeks.map((w, i) => {
        const x = i * step;
        const actual = w.summary.totalTss;
        const planned = w.summary.plannedTss || 1; // avoid div/0
        const y = 100 - (actual / ceiling) * 100;
        
        // Color Logic
        const ratio = actual / planned;
        let statusColor = 'bg-zinc-500'; // Under / Neutral (Gray)
        
        if (ratio >= 0.8 && ratio <= 1.15) {
            statusColor = 'bg-emerald-500'; // Healthy (Green)
        } else if (ratio > 1.15) {
            statusColor = 'bg-rose-500'; // Overreaching (Red)
        }

        return { x, y, color: statusColor, value: actual, label: w.id };
    });

    sortedWeeks.forEach((w, i) => {
      const x = i * step;
      const tss = w.summary.plannedTss || 0;
      
      const yHigh = 100 - ((tss * 1.15) / ceiling) * 100;
      const yLow = 100 - ((tss * 0.8) / ceiling) * 100;
      const yCenter = 100 - (tss / ceiling) * 100;
      
      upperPoints.push(`${x},${yHigh}`);
      lowerPoints.unshift(`${x},${yLow}`);
      targetDashPoints.push(`${i===0?'M':'L'} ${x},${yCenter}`);
    });

    return {
      paths: {
        actual: pointsActual.length > 1 ? `M ${pointsActual.join(' L ')}` : '',
        target: `${upperPoints.join(' ')} ${lowerPoints.join(' ')}`,
        targetDash: targetDashPoints.join(' ')
      },
      points: overlayPoints,
      maxTss: ceiling,
    };
  }, [weeks]);

  if (!weeks.length) return null;

  return (
    <div className="relative w-full select-none" style={{ height }}>
      {/* Background Grid */}
      <div className="absolute inset-0 flex flex-col justify-between border-l border-zinc-800/50 py-4">
        {[...Array(5)].map((_, i) => (
             <div key={i} className="border-t border-zinc-800/30 w-full" />
        ))}
      </div>

      {/* SVG Layer: Paths */}
      <svg 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none" 
        className="absolute inset-0 h-full w-full"
      >
        {/* Target Range Band (Tunnel) - BLUE */}
        <polygon 
          points={paths.target}
          className="fill-sky-500/10"
        />
        
        {/* Target Center Line (Dashed) - BLUE */}
        <path 
          d={paths.targetDash}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="text-sky-500/30"
          vectorEffect="non-scaling-stroke"
        />

        {/* Actual TSS Line - GREEN */}
        <path 
          d={paths.actual} 
          fill="none" 
          stroke="#10b981" // emerald-500
          strokeWidth="2" 
          vectorEffect="non-scaling-stroke"
          className="drop-shadow-sm opacity-90"
        />
      </svg>

      {/* HTML Layer: Data Points (Preserves Aspect Ratio) */}
      {points.map((p, i) => (
        <div 
          key={i}
          className={cn(
              "absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-950 transition-transform hover:scale-150",
              p.color
          )}
          style={{ left: `${p.x}%`, top: `${p.y}%` }}
          title={`${p.value} TSS`}
        />
      ))}

      {/* Axis Labels */}
      <div className="absolute top-0 left-2 text-[10px] font-mono text-zinc-500">
        {Math.round(maxTss)} TSS
      </div>
    </div>
  );
};
