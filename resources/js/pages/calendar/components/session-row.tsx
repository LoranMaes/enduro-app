import { Badge } from '@/components/ui/badge';
import type { TrainingSessionView } from '@/types/training-plans';

const statusTone: Record<string, string> = {
    completed: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    planned: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
    skipped: 'bg-red-500/15 text-red-300 border-red-500/30',
    partial: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
};

const sportAccent: Record<string, string> = {
    swim: 'bg-sky-400',
    bike: 'bg-violet-400',
    run: 'bg-rose-400',
    gym: 'bg-amber-400',
    strength: 'bg-amber-400',
};

type SessionRowProps = {
    session: TrainingSessionView;
    showDate?: boolean;
};

export function SessionRow({ session, showDate = true }: SessionRowProps) {
    const tone = statusTone[session.status] ?? statusTone.planned;
    const accent = sportAccent[session.sport] ?? 'bg-zinc-400';

    return (
        <div className="bg-surface/60 hover:bg-surface/90 flex items-center justify-between gap-2 rounded-md border border-border px-2 py-2 transition-colors">
            <div className="flex min-w-0 items-center gap-2">
                <span
                    className={`h-2 w-2 shrink-0 rounded-full ${accent}`}
                    aria-hidden="true"
                />
                <div className="min-w-0">
                    <p className="truncate text-xs font-medium capitalize">
                        {session.sport}
                    </p>
                    {showDate ? (
                        <p className="text-muted-foreground text-[11px]">
                            {session.scheduledDate}
                        </p>
                    ) : null}
                </div>
            </div>
            <div className="text-right">
                <Badge variant="outline" className={`text-[10px] ${tone}`}>
                    {session.status}
                </Badge>
                <p className="text-muted-foreground mt-1 text-[11px] font-mono">
                    {session.durationMinutes}m
                </p>
            </div>
        </div>
    );
}
