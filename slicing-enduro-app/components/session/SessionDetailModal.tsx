import React, { useState, useEffect } from 'react';
import { Session, SportType, WorkoutStep } from '../../types';
import { SPORT_ICONS, SPORT_COLORS } from '../../constants';
import { cn } from '../../lib/utils';
import { Modal } from '../ui/Modal';
import { WorkoutBuilder } from './WorkoutBuilder';
import { StatusBadge } from '../ui/StatusBadge';
import { Check, Clock, Activity, FileText, BarChart3, ChevronRight } from 'lucide-react';

interface SessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: Session;
  date?: Date;
  onSave: (session: Partial<Session>) => void;
  onNavigateToAnalysis: (session: Session) => void;
}

export const SessionDetailModal: React.FC<SessionDetailModalProps> = ({ 
  isOpen, 
  onClose, 
  session, 
  date, 
  onSave,
  onNavigateToAnalysis
}) => {
  const isEditing = !!session;
  const isCompleted = session?.status === 'completed';

  const [activeTab, setActiveTab] = useState<'details' | 'structure'>('details');
  const [sport, setSport] = useState<SportType>('run');
  const [formData, setFormData] = useState({
    title: '',
    duration: 60,
    tss: 0,
    description: '',
  });

  const [steps, setSteps] = useState<WorkoutStep[]>([
    { id: '1', type: 'warmup', durationSeconds: 600, targetPower: 50 },
    { id: '2', type: 'active', durationSeconds: 1200, targetPower: 90 },
    { id: '3', type: 'recovery', durationSeconds: 300, targetPower: 50 },
    { id: '4', type: 'active', durationSeconds: 1200, targetPower: 90 },
    { id: '5', type: 'cooldown', durationSeconds: 600, targetPower: 45 },
  ]);

  // Update local state when session changes
  useEffect(() => {
    if (isOpen) {
      if (session) {
        setSport(session.sport);
        setFormData({
          title: session.title,
          duration: session.durationMinutes,
          tss: session.tss,
          description: session.description || '',
        });
        if (session.structure) {
          setSteps(session.structure);
        }
      } else {
        // Reset for new session
        setSport('run');
        setFormData({
          title: '',
          duration: 60,
          tss: 0,
          description: '',
        });
        // Reset steps or keep default
      }
    }
  }, [isOpen, session]);

  const handleSave = () => {
    onSave({
      id: session?.id,
      date: date?.toISOString() || session?.date,
      sport,
      title: formData.title || `${sport} Session`,
      durationMinutes: Number(formData.duration),
      tss: Number(formData.tss),
      description: formData.description,
      status: session?.status || 'planned',
      structure: steps,
    });
    onClose();
  };

  if (!isOpen) return null;

  // Safe date display calculation
  const displayDate = date 
    ? date.toDateString() 
    : session 
      ? new Date(session.date).toDateString() 
      : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Session Details' : 'Plan Session'}>
      <div className="flex flex-col h-full">
        {/* Header Section */}
        <div className="mb-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
             <div className={cn("p-2 rounded-md bg-zinc-900", SPORT_COLORS[sport])}>
               {React.cloneElement(SPORT_ICONS[sport] as React.ReactElement<{ className?: string }>, { className: "w-5 h-5" })}
             </div>
             <div>
               <h3 className="text-lg font-medium text-white">{formData.title || 'Untitled Session'}</h3>
               <div className="flex items-center gap-2 text-xs text-zinc-500 mt-1">
                 {isEditing && session && <StatusBadge status={session.status} />}
                 <span>{displayDate}</span>
               </div>
             </div>
          </div>
          
          {/* Analyze Button for Completed Sessions */}
          {isCompleted && session && (
            <button 
              onClick={() => onNavigateToAnalysis(session)}
              className="flex items-center gap-1.5 rounded-full bg-zinc-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analyze
              <ChevronRight className="w-3 h-3 text-zinc-500" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          <button 
            onClick={() => setActiveTab('details')}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2",
              activeTab === 'details' ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            Details
          </button>
          <button 
             onClick={() => setActiveTab('structure')}
             className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2",
              activeTab === 'structure' ? "border-white text-white" : "border-transparent text-zinc-500 hover:text-zinc-300"
            )}
          >
            Structure
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1">
          {activeTab === 'details' ? (
            <div className="space-y-5">
              {!isCompleted && (
                 <div className="grid grid-cols-4 gap-2 rounded-lg bg-zinc-900/50 p-1">
                    {(['swim', 'bike', 'run', 'gym'] as SportType[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSport(s)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all",
                          sport === s 
                            ? "bg-zinc-800 text-white shadow-sm ring-1 ring-white/10" 
                            : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                        )}
                      >
                        {SPORT_ICONS[s]}
                      </button>
                    ))}
                  </div>
              )}

              <div className="space-y-4">
                <div>
                   <label className="text-xs font-medium text-zinc-500 mb-1 block">Title</label>
                   <input 
                      type="text" 
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700"
                      disabled={isCompleted}
                   />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="text-xs font-medium text-zinc-500 mb-1 block">Duration (min)</label>
                      <input 
                          type="number" 
                          value={formData.duration}
                          onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
                          disabled={isCompleted}
                      />
                   </div>
                   <div>
                      <label className="text-xs font-medium text-zinc-500 mb-1 block">Planned TSS</label>
                      <input 
                          type="number" 
                          value={formData.tss}
                          onChange={(e) => setFormData({...formData, tss: Number(e.target.value)})}
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700 font-mono"
                          disabled={isCompleted}
                      />
                   </div>
                </div>

                <div>
                   <label className="text-xs font-medium text-zinc-500 mb-1 block">Notes</label>
                   <textarea 
                      rows={4}
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700 resize-none"
                   />
                </div>
              </div>
            </div>
          ) : (
            <WorkoutBuilder 
              steps={steps} 
              readOnly={isCompleted} 
              onUpdate={setSteps} 
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2 text-sm text-zinc-400 hover:text-white transition-colors">
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
          >
            <Check className="w-4 h-4" />
            {isEditing ? 'Update Session' : 'Add to Calendar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};