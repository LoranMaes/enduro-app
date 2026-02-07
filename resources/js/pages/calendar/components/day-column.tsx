import { Badge } from '@/components/ui/badge';
import type { TrainingSessionView } from '@/types/training-plans';
import { SessionRow } from './session-row';

type DayColumnProps = {
    label: string;
    dayNumber: string;
    isToday: boolean;
    sessions: TrainingSessionView[];
};

export function DayColumn({ label, dayNumber, isToday, sessions }: DayColumnProps) {
    return (
        <div className="flex min-h-[220px] flex-col gap-2 px-2 py-2">
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground text-[10px] font-medium uppercase tracking-wide">
                        {label}
                    </p>
                    <p
                        className={`text-xs font-medium ${isToday ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                        {dayNumber}
                    </p>
                </div>
                {isToday ? (
                    <Badge variant="outline" className="text-[10px]">
                        Today
                    </Badge>
                ) : null}
            </header>

            {sessions.length > 0 ? (
                <div className="space-y-2">
                    {sessions.map((session) => (
                        <SessionRow key={session.id} session={session} showDate={false} />
                    ))}
                </div>
            ) : (
                <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border/70 px-2 py-3">
                    <p className="text-muted-foreground text-[11px]">No session</p>
                </div>
            )}
        </div>
    );
}
