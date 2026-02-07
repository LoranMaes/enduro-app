
import { Loader2 } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import { getStartOfWeek, addDays, formatDate } from '../../lib/utils';
import type { WeekData, Session, DayData } from '../../types';
import { SessionDetailModal } from '../session/SessionDetailModal';
import { Label } from '../ui/Typography';
import { PlanOverlayToggle } from './PlanOverlayToggle';
import { WeekSection } from './WeekSection';

// Initial dummy data generator
const generateMockData = (startWeek: Date, numWeeks: number): WeekData[] => {
  const weeks: WeekData[] = [];
  
  for (let w = 0; w < numWeeks; w++) {
    const weekStart = addDays(startWeek, w * 7);
    const days: DayData[] = [];
    let weekTotalTss = 0;
    let weekDuration = 0;
    let plannedTss = 0;
    let completedCount = 0;
    let plannedCount = 0;

    for (let d = 0; d < 7; d++) {
      const currentDate = addDays(weekStart, d);
      const sessions: Session[] = [];

      // Add random sessions for demo
      if (Math.random() > 0.4) {
        const type = Math.random() > 0.5 ? 'bike' : (Math.random() > 0.5 ? 'run' : 'swim');
        const duration = type === 'bike' ? 90 : 45;
        const tss = type === 'bike' ? 80 : 50;
        
        // Mark past sessions as completed occasionally
        const isPast = currentDate < new Date();
        const status = isPast ? (Math.random() > 0.2 ? 'completed' : 'skipped') : 'planned';
        
        sessions.push({
          id: Math.random().toString(36).substr(2, 9),
          date: currentDate.toISOString(),
          sport: type as any,
          title: `${type === 'bike' ? 'Zone 2' : 'Intervals'}`,
          durationMinutes: duration,
          tss: tss,
          status: status,
        });

        if (status === 'completed') {
            weekTotalTss += tss;
            weekDuration += duration;
            completedCount++;
        }
        plannedTss += tss;
        plannedCount++;
      }

      days.push({ date: currentDate, sessions });
    }

    weeks.push({
      id: `week-${w}`,
      startDate: weekStart,
      days,
      summary: {
        totalDuration: weekDuration,
        totalTss: weekTotalTss,
        plannedTss: plannedTss,
        completedCount,
        distanceKm: 0 // unused for now
      }
    });
  }
  return weeks;
};

// Generate Mock Overlay Data
const generateMockOverlaySessions = (weeks: WeekData[]): Record<string, Session[]> => {
    const overlayMap: Record<string, Session[]> = {};
    
    weeks.forEach(week => {
        week.days.forEach((day, idx) => {
            const dateStr = formatDate(day.date);
            // Simple pattern: Tue/Thu/Sat/Sun have plan sessions
            const dayOfWeek = day.date.getDay(); // 0=Sun, 1=Mon...
            
            if ([0, 2, 4, 6].includes(dayOfWeek)) {
                const type = dayOfWeek === 0 ? 'run' : (dayOfWeek === 6 ? 'bike' : 'swim');
                overlayMap[dateStr] = [{
                    id: `plan-${dateStr}`,
                    date: day.date.toISOString(),
                    sport: type as any,
                    title: `Plan: ${type.charAt(0).toUpperCase() + type.slice(1)} Block`,
                    durationMinutes: type === 'bike' ? 120 : 60,
                    tss: type === 'bike' ? 100 : 60,
                    status: 'planned',
                    description: 'This is a planned session from the overlay.'
                }];
            }
        });
    });
    return overlayMap;
};

interface TrainingCalendarProps {
  onNavigateToAnalysis: (session: Session) => void;
  onNavigateToWeek: (week: WeekData) => void;
}

export const TrainingCalendar: React.FC<TrainingCalendarProps> = ({ onNavigateToAnalysis, onNavigateToWeek }) => {
  const [weeks, setWeeks] = useState<WeekData[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  
  // Overlay State
  const [showPlanOverlay, setShowPlanOverlay] = useState(false);

  // Initialize with current week - 1 week to + 4 weeks
  useEffect(() => {
    const today = new Date();
    const startOfCurrentWeek = getStartOfWeek(today);
    const startOfView = addDays(startOfCurrentWeek, -7);
    setWeeks(generateMockData(startOfView, 6));
  }, []);

  // Memoize overlay data to prevent re-generation on every render
  const overlaySessions = useMemo(() => {
      if (!showPlanOverlay) return {};
      return generateMockOverlaySessions(weeks);
  }, [showPlanOverlay, weeks]);

  const handleAddSession = (date: Date) => {
    setSelectedDate(date);
    setSelectedSession(undefined);
    setIsModalOpen(true);
  };

  const handleEditSession = (session: Session) => {
    if (session.status === 'completed') {
      onNavigateToAnalysis(session);
    } else {
      setSelectedDate(undefined);
      setSelectedSession(session);
      setIsModalOpen(true);
    }
  };

  const handleSaveSession = (sessionData: Partial<Session>) => {
    setWeeks(prevWeeks => prevWeeks.map(week => {
      const sessionDate = new Date(sessionData.date!);
      const weekEnd = addDays(week.startDate, 7);
      
      if (sessionDate >= week.startDate && sessionDate < weekEnd) {
        const newDays = week.days.map(day => {
          if (formatDate(day.date) === formatDate(sessionDate)) {
             if (sessionData.id) {
               return {
                 ...day,
                 sessions: day.sessions.map(s => s.id === sessionData.id ? { ...s, ...sessionData } as Session : s)
               };
             }
             return {
               ...day,
               sessions: [...day.sessions, { ...sessionData, id: Math.random().toString(36) } as Session]
             };
          }
          return day;
        });
        
        // Recalculate summary metrics (Simplified)
        let tTss = 0; let pTss = 0; let cCount = 0; let tDur = 0;
        newDays.forEach(d => d.sessions.forEach(s => {
          if (s.status === 'completed') { tTss += s.tss; tDur += s.durationMinutes; cCount++; }
          pTss += s.tss;
        }));

        return { 
          ...week, 
          days: newDays, 
          summary: { ...week.summary, totalTss: tTss, plannedTss: pTss, totalDuration: tDur, completedCount: cCount } 
        };
      }
      return week;
    }));
    
    setIsModalOpen(false);
  };

  const handleLoadMore = () => {
    setIsLoading(true);
    setTimeout(() => {
       setIsLoading(false);
       // Mock loading data (no op for visual demo)
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Calendar Grid Header - Desktop Only */}
      <div className="hidden md:grid grid-cols-[repeat(7,1fr)_140px] border-b border-border bg-background/95 backdrop-blur-md items-center z-20 sticky top-0">
        <div className="py-3 px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 border-r border-border/30 text-center">Mon</div>
        <div className="py-3 px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 border-r border-border/30 text-center">Tue</div>
        <div className="py-3 px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 border-r border-border/30 text-center">Wed</div>
        <div className="py-3 px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 border-r border-border/30 text-center">Thu</div>
        <div className="py-3 px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 border-r border-border/30 text-center">Fri</div>
        <div className="py-3 px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 border-r border-border/30 text-center">Sat</div>
        <div className="py-3 px-2 text-[10px] font-medium uppercase tracking-wider text-zinc-500 border-r border-border/30 text-center">Sun</div>
        <div className="py-1 px-3 border-l border-border flex justify-center">
           <PlanOverlayToggle 
             isEnabled={showPlanOverlay} 
             onToggle={() => setShowPlanOverlay(!showPlanOverlay)} 
           />
        </div>
      </div>
      
      {/* Mobile Toggle */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-surface">
         <Label>Calendar View</Label>
         <PlanOverlayToggle 
             isEnabled={showPlanOverlay} 
             onToggle={() => setShowPlanOverlay(!showPlanOverlay)} 
         />
      </div>

      {/* Infinite Scroll Container */}
      <div className="flex-1 overflow-y-auto">
        {weeks.map((week) => {
          const today = new Date();
          const isCurrentWeek = week.startDate <= today && addDays(week.startDate, 7) > today;
          const plannedSessions = week.days.reduce((acc, day) => acc + day.sessions.length, 0);

          return (
            <div key={week.id} className="relative group/week">
               <WeekSection 
                  weekStart={week.startDate}
                  days={week.days}
                  summary={{
                    totalDuration: week.summary.totalDuration,
                    totalTss: week.summary.totalTss,
                    plannedTss: week.summary.plannedTss,
                    completedSessions: week.summary.completedCount,
                    plannedSessions: plannedSessions,
                    isCurrentWeek: isCurrentWeek
                  }}
                  isCurrentWeek={isCurrentWeek}
                  overlaySessions={overlaySessions}
                  onAddSession={handleAddSession}
                  onEditSession={handleEditSession}
                />
            </div>
          );
        })}
        
        {/* Load More Trigger */}
        <div className="py-16 flex justify-center border-t border-border/50 bg-gradient-to-b from-transparent to-zinc-900/20">
            <button 
                onClick={handleLoadMore}
                disabled={isLoading}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border bg-surface text-xs font-medium text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
            >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {isLoading ? "Loading..." : "Load Future Weeks"}
            </button>
        </div>
        
        {/* Spacer for scroll */}
        <div className="h-24" /> 
      </div>
      
      {/* Legend Overlay */}
      {showPlanOverlay && (
        <div className="absolute bottom-6 left-6 z-30 rounded-lg border border-border bg-surface/90 px-4 py-3 backdrop-blur-md shadow-2xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex flex-col gap-3">
                <Label className="text-zinc-400">Layer Legend</Label>
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm border border-zinc-700 bg-zinc-800"></div>
                    <span className="text-[10px] text-zinc-300">Your Sessions</span>
                </div>
                 <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-sm border border-dashed border-zinc-500 bg-transparent"></div>
                    <span className="text-[10px] text-zinc-300">Plan Overlay</span>
                </div>
            </div>
        </div>
      )}

      <SessionDetailModal
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        session={selectedSession}
        date={selectedDate}
        onSave={handleSaveSession}
        onNavigateToAnalysis={(s) => {
          setIsModalOpen(false);
          onNavigateToAnalysis(s);
        }}
      />
    </div>
  );
};
