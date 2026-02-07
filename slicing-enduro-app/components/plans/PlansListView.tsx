
import { Search, Plus, Filter } from 'lucide-react';
import React, { useState } from 'react';
import type { TrainingPlan, UserRole } from '../../types';
import { Heading, Label } from '../ui/Typography';
import { PlanCard } from './PlanCard';
import { PlanDetailView } from './PlanDetailView';

// Mock Data for Plans (kept same for demo)
const MOCK_PLANS: TrainingPlan[] = [
  {
    id: 'plan-1',
    title: 'Olympic Triathlon Build',
    sport: 'triathlon',
    level: 'Intermediate',
    durationWeeks: 12,
    avgHoursPerWeek: 9.5,
    avgTssPerWeek: 520,
    status: 'active',
    description: 'A focused build block designed to increase threshold power on the bike and sustain pace on the run.',
    tags: ['Build', 'Threshold', 'Race Prep'],
    weeklyStructure: [],
    loadProgression: [450, 480, 520, 350, 500, 540, 580, 380, 600, 620, 650, 400],
  },
  {
    id: 'plan-2',
    title: 'Gran Fondo Base',
    sport: 'bike',
    level: 'Advanced',
    durationWeeks: 16,
    avgHoursPerWeek: 12,
    avgTssPerWeek: 650,
    status: 'not-started',
    description: 'High-volume base training for long-distance cycling events. Focuses on Zone 2 durability and fat adaptation.',
    tags: ['Base', 'Endurance', 'High Volume'],
    weeklyStructure: [],
    loadProgression: [500, 550, 600, 400, 620, 660, 700, 450, 720, 750, 780, 480, 800, 820, 850, 500],
  },
  {
    id: 'plan-3',
    title: 'Couch to 5K',
    sport: 'run',
    level: 'Beginner',
    durationWeeks: 8,
    avgHoursPerWeek: 3,
    avgTssPerWeek: 180,
    status: 'completed',
    description: 'The classic introductory running plan. Progresses from walk-run intervals to continuous 30-minute running.',
    tags: ['Base', 'Beginner', 'Low Impact'],
    weeklyStructure: [],
    loadProgression: [120, 140, 160, 100, 180, 200, 220, 110],
  }
];

interface PlansListViewProps {
  userRole: UserRole;
}

export const PlansListView: React.FC<PlansListViewProps> = ({ userRole }) => {
  const [selectedPlan, setSelectedPlan] = useState<TrainingPlan | null>(null);
  const isCoach = userRole === 'coach';

  if (selectedPlan) {
    return <PlanDetailView plan={selectedPlan} onBack={() => setSelectedPlan(null)} />;
  }

  return (
    <div className="flex h-full flex-col bg-background animate-in fade-in duration-300">
      {/* Header */}
      <header className="flex flex-col gap-6 border-b border-border bg-background p-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
           <Label>{isCoach ? 'Management' : 'Library'}</Label>
           <Heading level={1}>{isCoach ? 'Plan Library' : 'My Plans'}</Heading>
        </div>
        
        <div className="flex items-center gap-4">
            {/* Search */}
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                <input 
                    type="text" 
                    placeholder="Filter plans..." 
                    className="w-full rounded-lg border border-border bg-surface py-2 pl-9 pr-4 text-sm text-white placeholder-zinc-600 focus:border-zinc-700 focus:outline-none"
                    disabled
                />
            </div>

            {/* Coach Only: Create Plan */}
            {isCoach && (
                <button className="flex items-center gap-2 rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-200 transition-colors shadow-sm">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create Plan</span>
                </button>
            )}

            {/* Athlete Only: Browse Store (Placeholder) */}
            {!isCoach && (
                 <button className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
                    <Filter className="w-4 h-4" />
                    <span className="hidden sm:inline">Browse Store</span>
                </button>
            )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Plan Cards */}
            {MOCK_PLANS.map((plan) => (
              <PlanCard 
                key={plan.id} 
                plan={plan} 
                onClick={() => setSelectedPlan(plan)} 
              />
            ))}
            
            {/* Coach Only: New Plan Ghost Card */}
            {isCoach && (
              <button 
                className="group flex h-full min-h-[220px] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-800 bg-transparent p-6 text-zinc-600 transition-all hover:border-zinc-600 hover:bg-zinc-900/30 hover:text-zinc-400"
              >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 group-hover:bg-zinc-800 transition-colors border border-zinc-800">
                      <Plus className="w-5 h-5" />
                  </div>
                  <div className="text-center">
                    <span className="block text-sm font-medium">Create New Plan</span>
                    <span className="text-xs text-zinc-600 mt-1">Start from scratch or template</span>
                  </div>
              </button>
            )}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-sm text-zinc-600">
              {isCoach 
                ? "Plans can be assigned to multiple athletes." 
                : "Active plans automatically sync to your calendar."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
