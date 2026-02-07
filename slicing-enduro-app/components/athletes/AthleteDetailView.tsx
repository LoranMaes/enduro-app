
import React from 'react';
import { Athlete } from '../../types';
import { Heading, Label, DataValue } from '../ui/Typography';
import { SPORT_ICONS, SPORT_COLORS } from '../../constants';
import { StatusBadge } from '../ui/StatusBadge';
import { ArrowLeft, User, Activity, FileText, Link2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface AthleteDetailViewProps {
  athlete: Athlete;
  onBack: () => void;
}

export const AthleteDetailView: React.FC<AthleteDetailViewProps> = ({ athlete, onBack }) => {
  return (
    <div className="flex h-full flex-col bg-background animate-in fade-in slide-in-from-right-4 duration-300">
      
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm px-6 py-4">
        <button 
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-xs font-medium text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to Athletes
        </button>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
             <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl border border-white/5 bg-zinc-900",
                SPORT_COLORS[athlete.primarySport]
              )}>
                {React.cloneElement(SPORT_ICONS[athlete.primarySport] as React.ReactElement<{ className?: string }>, { className: "w-6 h-6" })}
              </div>
              <div>
                <Heading level={1}>{athlete.name}</Heading>
                <div className="flex items-center gap-2 mt-1">
                    <Label className="text-zinc-400">{athlete.primarySport}</Label>
                    <span className="text-zinc-600">•</span>
                    <Label className="text-zinc-400">{athlete.email}</Label>
                </div>
              </div>
          </div>

          <div className="flex items-center gap-4">
            {athlete.status === 'active' ? (
              <div className="flex items-center gap-2 rounded-full border border-emerald-900/50 bg-emerald-950/20 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-emerald-500">Active Status</span>
              </div>
            ) : (
               <StatusBadge status="skipped" className="bg-zinc-800 text-zinc-400 border-zinc-700" />
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl space-y-8 p-8 pb-20">
          
          {/* Profile Overview */}
          <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
             
             {/* Bio Panel */}
             <div className="rounded-xl border border-border bg-surface p-6 space-y-6">
                <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    <User className="w-4 h-4" />
                    <Heading level={3} className="text-zinc-200">Profile</Heading>
                </div>
                
                <div className="grid grid-cols-2 gap-y-6">
                    <div>
                        <Label className="mb-1">Age</Label>
                        <DataValue size="md" className="text-zinc-300">{athlete.profile.age}</DataValue>
                    </div>
                    <div>
                        <Label className="mb-1">Training Age</Label>
                        <DataValue size="md" className="text-zinc-300">
                            {new Date().getFullYear() - new Date(athlete.profile.trainingSince).getFullYear()} Years
                        </DataValue>
                    </div>
                    <div>
                        <Label className="mb-1">Height</Label>
                        <DataValue size="md" className="text-zinc-300">{athlete.profile.heightCm} cm</DataValue>
                    </div>
                    <div>
                        <Label className="mb-1">Weight</Label>
                        <DataValue size="md" className="text-zinc-300">{athlete.profile.weightKg} kg</DataValue>
                    </div>
                </div>
             </div>

             {/* Context Panel */}
             <div className="md:col-span-2 rounded-xl border border-border bg-surface p-6 space-y-6">
                 <div className="flex items-center gap-2 text-zinc-400 mb-2">
                    <Activity className="w-4 h-4" />
                    <Heading level={3} className="text-zinc-200">Training Context</Heading>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-6">
                        <div>
                            <Label className="mb-1">Current Focus</Label>
                            <div className="inline-flex items-center px-2.5 py-0.5 rounded border border-sky-900/50 bg-sky-950/20 text-sky-400 text-xs font-mono">
                                {athlete.context.phase}
                            </div>
                        </div>
                        <div>
                            <Label className="mb-1">Preferred Volume</Label>
                            <DataValue size="md" className="text-zinc-300">
                                {athlete.context.preferredVolumeHours} hours / week
                            </DataValue>
                        </div>
                     </div>
                     
                     <div className="rounded border border-zinc-800 bg-zinc-900/50 p-4">
                        <Label className="mb-2 block text-zinc-500">Coach Notes</Label>
                        <p className="text-sm text-zinc-400 italic leading-relaxed">
                            "{athlete.context.notes}"
                        </p>
                     </div>
                </div>
             </div>
          </section>

          {/* Connected Data */}
          <section className="space-y-4">
             <Heading level={3} className="text-zinc-400 px-1">Integrations & Systems</Heading>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Device Connections */}
                <div className="rounded-xl border border-border bg-surface p-6">
                    <div className="flex items-center gap-2 text-zinc-400 mb-6">
                        <Link2 className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Device Connections</span>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
                            <span className="text-sm font-medium text-zinc-300">Garmin Connect</span>
                            {athlete.integrations.garmin ? (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                    <AlertCircle className="w-3.5 h-3.5" /> Not Connected
                                </div>
                            )}
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-800 bg-zinc-900/30">
                            <span className="text-sm font-medium text-zinc-300">Strava</span>
                            {athlete.integrations.strava ? (
                                <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                                </div>
                            ) : (
                                <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                                    <AlertCircle className="w-3.5 h-3.5" /> Not Connected
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Active Plan */}
                <div className="rounded-xl border border-border bg-surface p-6">
                    <div className="flex items-center gap-2 text-zinc-400 mb-6">
                        <FileText className="w-4 h-4" />
                        <span className="text-xs font-medium uppercase tracking-wider">Active Plan</span>
                    </div>

                    {athlete.currentPlanId ? (
                        <div className="rounded-lg border border-sky-900/30 bg-sky-950/10 p-4">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-sky-200">Olympic Triathlon Build</span>
                                <span className="text-[10px] uppercase bg-sky-900/50 text-sky-400 px-1.5 py-0.5 rounded">Active</span>
                            </div>
                            <div className="flex items-center gap-4 mt-4">
                                <div>
                                    <Label className="mb-0.5">Progress</Label>
                                    <DataValue size="sm">Week 4 of 12</DataValue>
                                </div>
                                <div>
                                    <Label className="mb-0.5">Compliance</Label>
                                    <DataValue size="sm" className="text-emerald-400">92%</DataValue>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-24 flex items-center justify-center rounded-lg border border-dashed border-zinc-800 text-xs text-zinc-600">
                            No active training plan assigned.
                        </div>
                    )}
                </div>

             </div>
          </section>

        </div>
      </div>
    </div>
  );
};
