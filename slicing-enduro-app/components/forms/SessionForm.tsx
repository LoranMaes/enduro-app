import { Check, Clock, Activity, FileText } from 'lucide-react';
import React, { useState } from 'react';
import { SPORT_ICONS } from '../../constants';
import { cn } from '../../lib/utils';
import type { Session, SportType } from '../../types';

interface SessionFormProps {
  initialDate?: Date;
  initialSession?: Session; // If editing
  onSave: (session: Partial<Session>) => void;
  onCancel: () => void;
}

export const SessionForm: React.FC<SessionFormProps> = ({ initialDate, initialSession, onSave, onCancel }) => {
  const [sport, setSport] = useState<SportType>(initialSession?.sport || 'run');
  const [title, setTitle] = useState(initialSession?.title || '');
  const [duration, setDuration] = useState(initialSession?.durationMinutes || 60);
  const [tss, setTss] = useState(initialSession?.tss || 0);
  const [description, setDescription] = useState(initialSession?.description || '');

  const sports: SportType[] = ['swim', 'bike', 'run', 'gym'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialSession?.id,
      date: initialDate ? initialDate.toISOString() : initialSession?.date,
      sport,
      title: title || `${sport.charAt(0).toUpperCase() + sport.slice(1)} Workout`,
      durationMinutes: Number(duration),
      tss: Number(tss),
      status: initialSession?.status || 'planned',
      description,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      
      {/* Custom Segmented Control for Sport */}
      <div className="grid grid-cols-4 gap-2 rounded-lg bg-zinc-900/50 p-1">
        {sports.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSport(s)}
            className={cn(
              "flex items-center justify-center gap-2 rounded-md py-2 text-sm font-medium transition-all",
              sport === s 
                ? "bg-zinc-800 text-white shadow-sm ring-1 ring-white/10" 
                : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
            )}
          >
            {SPORT_ICONS[s]}
            <span className="capitalize">{s}</span>
          </button>
        ))}
      </div>

      {/* Main Inputs */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">Workout Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Zone 2 Endurance"
            className="w-full rounded-md border border-border bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Clock className="h-3 w-3" /> Duration (min)
            </label>
            <input 
              type="number" 
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-zinc-900 px-3 py-2 text-sm font-mono text-white focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            />
          </div>
          <div>
             <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <Activity className="h-3 w-3" /> Planned TSS
            </label>
            <input 
              type="number" 
              value={tss}
              onChange={(e) => setTss(Number(e.target.value))}
              className="w-full rounded-md border border-border bg-zinc-900 px-3 py-2 text-sm font-mono text-white focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700"
            />
          </div>
        </div>

        <div>
           <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-zinc-400">
              <FileText className="h-3 w-3" /> Coach Notes
            </label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-md border border-border bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-zinc-700 resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button 
          type="button" 
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
        >
          <Check className="h-4 w-4" />
          Save Session
        </button>
      </div>
    </form>
  );
};
