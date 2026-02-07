
import React, { useMemo } from 'react';
import type { TelemetryPoint } from '../../types';

interface PerformanceChartProps {
  data: TelemetryPoint[];
  height?: number;
  showPower?: boolean;
  showHr?: boolean;
}

export const PerformanceChart: React.FC<PerformanceChartProps> = ({ 
  data, 
  height = 240, 
  showPower = true, 
  showHr = true 
}) => {
  // Simple memoized SVG path generation
  const { paths, maxPower, maxHr, duration } = useMemo(() => {
    if (!data.length) return { paths: { power: '', hr: '' }, maxPower: 0, maxHr: 0, duration: 0 };

    // Add 10% headroom to max values for breathing room
    const maxP = Math.max(...data.map(d => d.power)) * 1.1;
    const maxH = Math.max(...data.map(d => d.hr)) * 1.1;
    const maxT = data[data.length - 1].time;

    const createPath = (key: 'power' | 'hr', maxVal: number) => {
      return data.map((d, i) => {
        const x = (d.time / maxT) * 100;
        const y = 100 - (d[key] / maxVal) * 100;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
      }).join(' ');
    };

    return {
      paths: {
        power: createPath('power', maxP),
        hr: createPath('hr', maxH)
      },
      maxPower: maxP / 1.1, // Restore actual max for labels
      maxHr: maxH / 1.1,
      duration: maxT
    };
  }, [data]);

  if (!data.length) return (
    <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-dashed border-zinc-800 bg-zinc-900/20 text-zinc-600">
      <span className="text-xs font-mono">No telemetry data available</span>
    </div>
  );

  return (
    <div className="relative w-full overflow-hidden select-none" style={{ height }}>
      {/* Grid System - Minimal */}
      <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="w-full border-t border-zinc-800/40" />
        ))}
      </div>

      <svg 
        viewBox="0 0 100 100" 
        preserveAspectRatio="none" 
        className="relative z-10 h-full w-full"
      >
        <defs>
          <linearGradient id="powerGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Power Path */}
        {showPower && (
          <>
            <path 
              d={`${paths.power} L 100 100 L 0 100 Z`}
              fill="url(#powerGradient)"
              className="opacity-50"
            />
            <path 
              d={paths.power} 
              fill="none" 
              stroke="#a78bfa" // violet-400
              strokeWidth="0.8" 
              vectorEffect="non-scaling-stroke"
              className="opacity-90 drop-shadow-sm"
            />
          </>
        )}
        
        {/* HR Path */}
        {showHr && (
          <path 
            d={paths.hr} 
            fill="none" 
            stroke="#fb7185" // rose-400
            strokeWidth="0.8" 
            vectorEffect="non-scaling-stroke"
            className="opacity-80"
          />
        )}
      </svg>

      {/* Y-Axis Labels (Right side) */}
      <div className="absolute right-0 top-0 h-full flex flex-col justify-between py-1 pointer-events-none z-20">
         <span className="bg-background/80 px-1 text-[9px] font-mono text-zinc-500 rounded-sm">
           {showPower ? `${Math.round(maxPower)} W` : ''}
         </span>
         <span className="bg-background/80 px-1 text-[9px] font-mono text-zinc-500 rounded-sm">
           {showHr ? `${Math.round(maxHr)} bpm` : ''}
         </span>
      </div>

      {/* X-Axis Labels (Bottom) */}
      <div className="absolute bottom-1 left-1 text-[9px] font-mono text-zinc-600">0:00</div>
      <div className="absolute bottom-1 right-1 text-[9px] font-mono text-zinc-600">
        {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
      </div>
    </div>
  );
};
