
import { ArrowLeft, Clock, BarChart3, Tag, Activity } from 'lucide-react';
import React from 'react';
import { cn } from '../../lib/utils';
import type { TrainingPlan } from '../../types';
import { StatusBadge } from '../ui/StatusBadge';
import { Heading, Label, DataValue } from '../ui/Typography';
import { LoadProgressionMiniChart } from './LoadProgressionMiniChart';
import { WeeklyStructureTable } from './WeeklyStructureTable';

interface PlanDetailViewProps {
  plan: TrainingPlan;
  onBack: () => void;
}

export const PlanDetailView: React.FC<PlanDetailViewProps> = ({ plan, onBack }) => {
  return (
    <div className="flex h-full flex-col bg-background animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm px-6 py-4">
        <button 
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Plans
        </button>

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
               <Label className="text-zinc-400 border border-zinc-800 px-1.5 py-0.5 rounded">{plan.sport}</Label>
               <Label className="text-zinc-400 border border-zinc-800 px-1.5 py-0.5 rounded">{plan.level}</Label>
            </div>
            <Heading level={1}>{plan.title}</Heading>
          </div>

          <div className="flex items-center gap-4">
            {plan.status === 'active' && (
              <div className="flex items-center gap-2 rounded-full border border-emerald-900/50 bg-emerald-950/20 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-emerald-500">Active Plan</span>
              </div>
            )}
            {plan.status !== 'active' && (
               <StatusBadge status="planned" className="bg-zinc-800 text-zinc-400 border-zinc-700" />
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl space-y-12 p-8 pb-20">
          
          {/* Overview Section */}
          <section className="grid grid-cols-1 gap-8 md:grid-cols-3">
             <div className="md:col-span-2 space-y-4">
                <Heading level={3} className="text-zinc-400">Plan Overview</Heading>
                <p className="text-sm leading-relaxed text-zinc-300 max-w-2xl">
                  {plan.description}
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  {plan.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 text-[10px] text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </span>
                  ))}
                </div>
             </div>

             <div className="space-y-4 rounded-xl border border-border bg-surface/50 p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Duration</span>
                  </div>
                  <DataValue size="md">{plan.durationWeeks} Weeks</DataValue>
                </div>
                <div className="h-[1px] w-full bg-zinc-800" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-zinc-400">
                    <BarChart3 className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Avg Volume</span>
                  </div>
                  <DataValue size="md">{plan.avgHoursPerWeek} hrs/wk</DataValue>
                </div>
                <div className="h-[1px] w-full bg-zinc-800" />
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-2 text-zinc-400">
                    <Activity className="w-4 h-4" />
                    <span className="text-xs font-medium uppercase tracking-wider">Avg Load</span>
                  </div>
                  <DataValue size="md">{plan.avgTssPerWeek} TSS</DataValue>
                </div>
             </div>
          </section>

          {/* Load Progression */}
          <section className="rounded-xl border border-border bg-surface p-6">
             <div className="flex items-center justify-between mb-6">
                <Heading level={3} className="text-zinc-400">Load Progression</Heading>
                <Label>Weekly TSS Target</Label>
             </div>
             <div className="h-40 w-full">
                <LoadProgressionMiniChart data={plan.loadProgression} height={160} />
             </div>
          </section>

          {/* Weekly Structure */}
          <section>
            <WeeklyStructureTable structure={plan.weeklyStructure} />
          </section>

          {/* Notes */}
          <section className="rounded-lg border border-dashed border-zinc-800 bg-zinc-900/30 p-6">
             <Label className="mb-2">Coach Notes</Label>
             <p className="text-sm italic text-zinc-500">
               "This plan assumes a solid 4-week base period has been completed. Do not attempt the high-intensity intervals in Week 3 without adequate rest."
             </p>
          </section>

        </div>
      </div>
    </div>
  );
};