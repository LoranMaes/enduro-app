import React, { useState } from 'react';
import { WeekData, Session } from '../../types';
import { WeekOverviewHeader } from '../week/WeekOverviewHeader';
import { WeeklyLoadSummary } from '../week/WeeklyLoadSummary';
import { SportDistribution } from '../week/SportDistribution';
import { WeekSessionList } from '../week/WeekSessionList';
import { SessionDetailModal } from '../session/SessionDetailModal';
import { SessionAnalysisView } from './SessionAnalysisView';

interface WeekOverviewProps {
  week: WeekData;
  onBack: () => void;
}

export const WeekOverview: React.FC<WeekOverviewProps> = ({ week, onBack }) => {
  // Local state for handling session interactions within the overview
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'analysis' | 'edit'>('overview');

  const handleSessionClick = (session: Session) => {
    setSelectedSession(session);
    if (session.status === 'completed') {
      setViewMode('analysis');
    } else {
      setViewMode('edit');
    }
  };

  const handleSaveSession = (updatedSessionData: Partial<Session>) => {
     // Note: In a real app, this would propagate up via a context or prop callback to update the global store.
     // For this UI demo, we will simply close the modal.
     console.log("Session updated:", updatedSessionData);
     setViewMode('overview');
     setSelectedSession(null);
  };

  // If drilling down into analysis, render the analysis view
  if (viewMode === 'analysis' && selectedSession) {
    return (
      <SessionAnalysisView 
        session={selectedSession} 
        onBack={() => {
          setViewMode('overview');
          setSelectedSession(null);
        }} 
      />
    );
  }

  return (
    <div className="flex h-full flex-col bg-background animate-in fade-in duration-300">
      
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm">
        <WeekOverviewHeader week={week} onBack={onBack} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-6">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            
            {/* Left Column: Context & Aggregates */}
            <div className="space-y-8 lg:col-span-4 lg:sticky lg:top-6 lg:h-fit">
               <WeeklyLoadSummary 
                 totalDuration={week.summary.totalDuration}
                 totalTss={week.summary.totalTss}
                 plannedTss={week.summary.plannedTss}
               />
               <SportDistribution days={week.days} />
            </div>

            {/* Right Column: Execution Log */}
            <div className="lg:col-span-8 lg:border-l lg:border-border lg:pl-8">
               <WeekSessionList 
                 days={week.days} 
                 onSessionClick={handleSessionClick} 
               />
            </div>

          </div>
        </div>
      </div>

      {/* Edit Modal for Planned Sessions */}
      <SessionDetailModal 
        isOpen={viewMode === 'edit'}
        onClose={() => {
          setViewMode('overview');
          setSelectedSession(null);
        }}
        session={selectedSession || undefined}
        onSave={handleSaveSession}
        onNavigateToAnalysis={() => setViewMode('analysis')}
      />
    </div>
  );
};
