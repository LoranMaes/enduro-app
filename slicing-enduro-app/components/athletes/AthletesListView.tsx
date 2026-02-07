
import { Search, Plus, Users } from 'lucide-react';
import React, { useState } from 'react';
import type { Athlete } from '../../types';
import { Heading, Label } from '../ui/Typography';
import { AthleteCard } from './AthleteCard';
import { AthleteDetailView } from './AthleteDetailView';

// Mock Data (Empty for demo to show empty state, or use MOCK_ATHLETES from previous file to show list)
// Using data from previous context but ensuring we handle empty list.
const MOCK_ATHLETES: Athlete[] = [
  {
    id: '1',
    name: 'J. Doe',
    email: 'athlete@example.com',
    primarySport: 'triathlon',
    status: 'active',
    metrics: { avgWeeklyTss: 450, avgWeeklyHours: 9 },
    profile: { age: 32, heightCm: 180, weightKg: 75, trainingSince: '2018-03-01' },
    context: { preferredVolumeHours: 10, phase: 'Build 1', notes: 'Focus on raising FTP. Managing minor achilles tightness.' },
    integrations: { garmin: true, strava: false, trainingPeaks: false },
    currentPlanId: 'plan-1'
  },
  {
    id: '2',
    name: 'A. Smith',
    email: 'alex.smith@run.com',
    primarySport: 'run',
    status: 'active',
    metrics: { avgWeeklyTss: 280, avgWeeklyHours: 4.5 },
    profile: { age: 28, heightCm: 165, weightKg: 58, trainingSince: '2020-01-15' },
    context: { preferredVolumeHours: 5, phase: 'Base 2', notes: 'Building durability for upcoming marathon season.' },
    integrations: { garmin: true, strava: true, trainingPeaks: false },
  }
];

export const AthletesListView: React.FC = () => {
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  // Toggle this to test empty state in development if needed
  const athletes = MOCK_ATHLETES; 

  if (selectedAthlete) {
    return <AthleteDetailView athlete={selectedAthlete} onBack={() => setSelectedAthlete(null)} />;
  }

  return (
    <div className="flex h-full flex-col bg-background animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col gap-6 border-b border-border bg-background p-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
           <Label>Directory</Label>
           <Heading level={1}>Athletes</Heading>
        </div>
        
        {athletes.length > 0 && (
          <div className="flex items-center gap-4">
              <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <input 
                      type="text" 
                      placeholder="Search athletes..." 
                      className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
                      disabled
                  />
              </div>
              
              <button className="flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors">
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Athlete</span>
              </button>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-6">
          
          {athletes.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {athletes.map((athlete) => (
                <AthleteCard 
                  key={athlete.id} 
                  athlete={athlete} 
                  onClick={() => setSelectedAthlete(athlete)} 
                />
              ))}
              
              {/* Add New Placeholder Card */}
              <button className="group flex h-full min-h-[180px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-800 bg-transparent p-6 text-zinc-600 transition-all hover:border-zinc-600 hover:bg-zinc-900/30 hover:text-zinc-400">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 group-hover:bg-zinc-800 transition-colors border border-zinc-800">
                      <Plus className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium">Add New Athlete</span>
              </button>
            </div>
          ) : (
            /* Empty State for New Coaches */
            <div className="flex flex-col items-center justify-center py-20 text-center">
               <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-800">
                  <Users className="h-8 w-8 text-zinc-600" />
               </div>
               <Heading level={2} className="text-xl text-zinc-200">No athletes managed yet</Heading>
               <p className="mt-2 max-w-sm text-sm text-zinc-500">
                 Invite athletes to the platform to start planning their season and analyzing their performance.
               </p>
               <button className="mt-8 flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-zinc-200 transition-colors">
                  <Plus className="w-4 h-4" />
                  Add First Athlete
               </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
